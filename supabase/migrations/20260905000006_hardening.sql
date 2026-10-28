-- Hardening on top of README §8–§12.
--
-- README's SQL is applied verbatim by the earlier migrations. Implementing it
-- surfaced gaps where the spec's *intent* (auto-hide at 3 reports, admin-only
-- moderation, author-only versions, notice = admin-only) was not actually
-- enforced at the DB layer. Each block below names the gap it closes. Nothing
-- here removes or loosens a README policy; it only adds checks or makes a
-- README function able to do what README says it does.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- True when the current statement runs with an end-user API role. Inside a
-- `security definer` function current_user is the function owner, so internal
-- system writes (auto-hide trigger, view counter) are not treated as user writes.
create or replace function public.is_end_user_context()
returns boolean
language sql
stable
as $$
  select current_user in ('anon', 'authenticated');
$$;

-- ---------------------------------------------------------------------------
-- 1. Report threshold trigger must bypass RLS (README §10).
--    As written it runs with the reporter's privileges: `reports_select_own_or_admin`
--    makes the count see only the reporter's own report (never 3), and
--    `*_update_own_or_admin` blocks the reporter from hiding someone else's
--    content. Same body, now `security definer`.
-- ---------------------------------------------------------------------------

create or replace function check_report_threshold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  report_count int;
begin
  select count(*) into report_count
  from reports
  where target_type = new.target_type and target_id = new.target_id and status = 'pending';

  if report_count >= 3 then
    case new.target_type
      when 'paper' then
        update papers set status = 'hidden' where id = new.target_id;
      when 'post' then
        update posts set status = 'hidden' where id = new.target_id;
      when 'comment' then
        update comments set status = 'hidden' where id = new.target_id;
      when 'paper_comment' then
        update paper_comments set status = 'hidden' where id = new.target_id;
    end case;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Reports: one pending report per (reporter, target), so a single account
--    can't trip the 3-report threshold alone. Reasons are the four codes from
--    README §3.5 (표절 의심 / 부적절한 내용 / 스팸 / 기타).
-- ---------------------------------------------------------------------------

create unique index reports_one_pending_per_reporter
  on reports (target_type, target_id, reporter_id)
  where status = 'pending';
create index reports_target_status_idx on reports (target_type, target_id, status);

alter table reports
  add constraint reports_reason_check check (reason in ('plagiarism', 'inappropriate', 'spam', 'other')),
  add constraint reports_detail_length check (detail is null or char_length(detail) <= 1000);

create or replace function reports_force_pending()
returns trigger
language plpgsql
as $$
begin
  if is_end_user_context() then
    new.status := 'pending';
  end if;
  return new;
end;
$$;

create trigger trg_reports_force_pending
before insert on reports
for each row execute function reports_force_pending();

-- ---------------------------------------------------------------------------
-- 3. Admin moderation of comments (README §11). README defines no UPDATE
--    policy on comments/paper_comments, so the admin "복구" action could never
--    flip a hidden comment back to public.
-- ---------------------------------------------------------------------------

create policy "paper_comments_update_admin" on paper_comments for update using (is_admin());
create policy "comments_update_admin" on comments for update using (is_admin());

-- ---------------------------------------------------------------------------
-- 4. Column protection. README's update policies are row-level only, which
--    would let a user promote themselves (`profiles.role = 'admin'`), un-hide
--    their own reported content (`status`), inflate `view_count`, or move a
--    post into the admin-only `notice` category. Non-admin end users may only
--    edit descriptive fields.
-- ---------------------------------------------------------------------------

create or replace function protect_profiles_columns()
returns trigger
language plpgsql
as $$
begin
  if is_end_user_context() and not is_admin() then
    if new.role is distinct from old.role
       or new.id is distinct from old.id
       or new.created_at is distinct from old.created_at then
      raise exception 'role은 운영진만 변경할 수 있습니다.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_protect_profiles_columns
before update on profiles
for each row execute function protect_profiles_columns();

create or replace function protect_papers_columns()
returns trigger
language plpgsql
as $$
begin
  if is_end_user_context() and not is_admin() then
    if new.status is distinct from old.status
       or new.view_count is distinct from old.view_count
       or new.concept_id is distinct from old.concept_id
       or new.version_no is distinct from old.version_no
       or new.author_id is distinct from old.author_id
       or new.file_path is distinct from old.file_path
       or new.created_at is distinct from old.created_at then
      raise exception '이 항목은 운영진만 변경할 수 있습니다.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_protect_papers_columns
before update on papers
for each row execute function protect_papers_columns();

create or replace function protect_posts_columns()
returns trigger
language plpgsql
as $$
begin
  if is_end_user_context() and not is_admin() then
    if new.status is distinct from old.status
       or new.category is distinct from old.category
       or new.author_id is distinct from old.author_id
       or new.created_at is distinct from old.created_at then
      raise exception '이 항목은 운영진만 변경할 수 있습니다.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_protect_posts_columns
before update on posts
for each row execute function protect_posts_columns();

-- New rows from end users always start public with zero views.
create or replace function reset_moderation_fields_on_insert()
returns trigger
language plpgsql
as $$
begin
  if is_end_user_context() then
    new.status := 'public';
    if tg_table_name = 'papers' then
      new.view_count := 0;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_papers_insert_defaults before insert on papers
for each row execute function reset_moderation_fields_on_insert();
create trigger trg_posts_insert_defaults before insert on posts
for each row execute function reset_moderation_fields_on_insert();
create trigger trg_comments_insert_defaults before insert on comments
for each row execute function reset_moderation_fields_on_insert();
create trigger trg_paper_comments_insert_defaults before insert on paper_comments
for each row execute function reset_moderation_fields_on_insert();

-- ---------------------------------------------------------------------------
-- 5. Paper versioning integrity (README §3.2). `papers_insert` only checks
--    author_id = auth.uid(), so anyone could append a "v3" to someone else's
--    concept_id or invent a concept_id that generate_concept_id() never issued.
--    version_no is assigned here, server-side, under a per-concept lock.
-- ---------------------------------------------------------------------------

create unique index papers_concept_version_key on papers (concept_id, version_no);

create or replace function enforce_paper_versioning()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  max_ver int;
  issued int;
begin
  perform pg_advisory_xact_lock(hashtext('papers:' || new.concept_id));

  select max(version_no) into max_ver from papers where concept_id = new.concept_id;

  if max_ver is null then
    if new.concept_id !~ '^KSCA-[0-9]{4}-[0-9]{6}$' then
      raise exception 'concept_id 형식이 올바르지 않습니다: %', new.concept_id using errcode = '22023';
    end if;
    select last_seq into issued
    from paper_counters
    where year = split_part(new.concept_id, '-', 2)::int;
    if issued is null or split_part(new.concept_id, '-', 3)::int > issued then
      raise exception 'generate_concept_id()로 발급되지 않은 concept_id입니다: %', new.concept_id using errcode = '22023';
    end if;
    new.version_no := 1;
  else
    if exists (select 1 from papers where concept_id = new.concept_id and author_id <> new.author_id) then
      raise exception '원저자만 새 버전을 업로드할 수 있습니다.' using errcode = '42501';
    end if;
    new.version_no := max_ver + 1;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_paper_versioning
before insert on papers
for each row execute function enforce_paper_versioning();

-- ---------------------------------------------------------------------------
-- 6. Comments: the "v_N에 작성됨" badge (README §3.4) is derived from the paper
--    row, not trusted from the client, and nobody but the author/admin can
--    comment on content they can't see (hidden).
-- ---------------------------------------------------------------------------

create or replace function paper_comments_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
begin
  select version_no, status, author_id into p from papers where id = new.paper_id;
  if not found then
    raise exception '논문을 찾을 수 없습니다.' using errcode = '23503';
  end if;
  if p.status = 'hidden' and p.author_id <> new.author_id and not is_admin() then
    raise exception '숨김 처리된 논문에는 댓글을 달 수 없습니다.' using errcode = '42501';
  end if;
  new.written_at_version := p.version_no;
  return new;
end;
$$;

create trigger trg_paper_comments_before_insert
before insert on paper_comments
for each row execute function paper_comments_before_insert();

create or replace function comments_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
begin
  select status, author_id into p from posts where id = new.post_id;
  if not found then
    raise exception '게시글을 찾을 수 없습니다.' using errcode = '23503';
  end if;
  if p.status = 'hidden' and p.author_id <> new.author_id and not is_admin() then
    raise exception '숨김 처리된 게시글에는 댓글을 달 수 없습니다.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger trg_comments_before_insert
before insert on comments
for each row execute function comments_before_insert();

-- ---------------------------------------------------------------------------
-- 7. View counter (README §3.3 조회수순). Anonymous viewers can't UPDATE papers
--    under `papers_update_own_or_admin`, so counting goes through a narrow
--    security-definer function instead.
-- ---------------------------------------------------------------------------

create or replace function increment_paper_view(p_paper_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update papers set view_count = view_count + 1 where id = p_paper_id and status = 'public';
$$;

revoke execute on function increment_paper_view(uuid) from public;
grant execute on function increment_paper_view(uuid) to anon, authenticated, service_role;

-- Only signed-in users can mint concept ids (anonymous callers could otherwise
-- burn through the yearly counter).
revoke execute on function generate_concept_id() from public, anon;
grant execute on function generate_concept_id() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. Board post tags (README §4: 게시글 = 제목 + 본문(마크다운) + 태그).
--    Like papers.authors, the §8 schema omitted a column §4 describes.
-- ---------------------------------------------------------------------------

alter table posts add column tags text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- 9. Input bounds. The app validates these too; the DB is the backstop.
-- ---------------------------------------------------------------------------

alter table profiles
  add constraint profiles_nickname_length check (char_length(trim(nickname)) between 1 and 30),
  add constraint profiles_school_length check (school is null or char_length(school) <= 100);
alter table papers
  add constraint papers_title_length check (char_length(trim(title)) between 1 and 300),
  add constraint papers_abstract_length check (char_length(trim(abstract)) between 1 and 5000),
  add constraint papers_authors_length check (char_length(authors) <= 500),
  add constraint papers_tags_count check (cardinality(tags) <= 10);
alter table posts
  add constraint posts_title_length check (char_length(trim(title)) between 1 and 200),
  add constraint posts_content_length check (char_length(trim(content)) between 1 and 20000),
  add constraint posts_tags_count check (cardinality(tags) <= 10);
alter table comments
  add constraint comments_content_length check (char_length(trim(content)) between 1 and 2000);
alter table paper_comments
  add constraint paper_comments_content_length check (char_length(trim(content)) between 1 and 2000);

-- ---------------------------------------------------------------------------
-- 10. Read paths: latest version per concept for list/landing pages, and
--     indexes for the queries the app runs.
--     security_invoker keeps `papers_select` RLS in force through the view.
-- ---------------------------------------------------------------------------

create view latest_papers with (security_invoker = true) as
select distinct on (concept_id) *
from papers
order by concept_id, version_no desc;

grant select on latest_papers to anon, authenticated, service_role;

create index papers_created_at_idx on papers (created_at desc);
create index papers_author_idx on papers (author_id);
create index papers_tags_idx on papers using gin (tags);
create index paper_comments_paper_idx on paper_comments (paper_id);
create index posts_category_created_idx on posts (category, created_at desc);
create index posts_author_idx on posts (author_id);
create index comments_post_idx on comments (post_id);

-- ---------------------------------------------------------------------------
-- 11. Private PDF bucket (README §7). PDF only, 20MB max — enforced by Storage
--     itself on the signed upload, not just by the app. No storage.objects
--     policies: only the server (service role) issues signed URLs.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('papers', 'papers', false, 20971520, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
