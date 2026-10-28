-- RLS + hardening verification (README §12 and migration 0006).
-- Run with: npm run test:db   (or: psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_check.sql)
--
-- Impersonates real API roles (anon / authenticated + request.jwt.claims),
-- so policies apply exactly as they do for PostgREST requests. Everything runs
-- in one transaction that is rolled back — the database is left untouched.
-- The first failed assertion aborts with a non-zero exit code.

\set ON_ERROR_STOP 1
begin;

do $$
declare
  author uuid := gen_random_uuid();
  other uuid := gen_random_uuid();
  admin uuid := gen_random_uuid();
  hidden_paper uuid;
  public_paper uuid;
  public_cid text;
  hidden_post uuid;
  n int;
  cid text;
begin
  -- ---------------------------------------------------------------- fixtures
  insert into auth.users (id, email) values
    (author, 'rls-author@example.com'),
    (other, 'rls-other@example.com'),
    (admin, 'rls-admin@example.com');
  update profiles set role = 'admin' where id = admin;

  insert into papers (concept_id, author_id, title, abstract, file_path, status)
  values (generate_concept_id(), author, 'hidden paper', 'abstract', 'x.pdf', 'hidden')
  returning id into hidden_paper;
  insert into papers (concept_id, author_id, title, abstract, file_path)
  values (generate_concept_id(), author, 'public paper', 'abstract', 'y.pdf')
  returning id, concept_id into public_paper, public_cid;
  insert into posts (author_id, category, title, content, status)
  values (author, 'free', 'hidden post', 'body', 'hidden')
  returning id into hidden_post;

  -- ------------------------------------------------- papers_select (anon)
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  select count(*) into n from papers where id = hidden_paper;
  assert n = 0, 'anon must NOT see a hidden paper';
  select count(*) into n from papers where id = public_paper;
  assert n = 1, 'anon must see a public paper';
  select count(*) into n from posts where id = hidden_post;
  assert n = 0, 'anon must NOT see a hidden post';
  begin
    perform generate_concept_id();
    raise exception 'FAIL: anon must not be able to mint concept ids';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- --------------------------------------------- other logged-in user
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated')::text, true);
  select count(*) into n from papers where id = hidden_paper;
  assert n = 0, 'a non-author, non-admin user must NOT see a hidden paper';
  select count(*) into n from latest_papers where id = hidden_paper;
  assert n = 0, 'latest_papers view must apply papers_select RLS (security_invoker)';

  -- Version hijack: appending a version to someone else's concept_id.
  begin
    insert into papers (concept_id, author_id, title, abstract, file_path)
    values (public_cid, other, 'hijack', 'abstract', 'z.pdf');
    raise exception 'FAIL: a user must not add a version to another author''s paper';
  exception when insufficient_privilege then null;
  end;

  -- Fabricated concept_id that generate_concept_id() never issued.
  begin
    insert into papers (concept_id, author_id, title, abstract, file_path)
    values ('KSCA-2026-999999', other, 'fake', 'abstract', 'z.pdf');
    raise exception 'FAIL: a fabricated concept_id must be rejected';
  exception when invalid_parameter_value then null;
  end;

  -- Self-promotion to admin.
  begin
    update profiles set role = 'admin' where id = other;
    raise exception 'FAIL: a user must not change their own role';
  exception when insufficient_privilege then null;
  end;

  -- Updating someone else's paper: RLS filters it out (0 rows).
  update papers set title = 'defaced' where id = public_paper;
  get diagnostics n = row_count;
  assert n = 0, 'a user must not update another author''s paper';

  -- notice is admin-only (posts_insert policy).
  begin
    insert into posts (author_id, category, title, content) values (other, 'notice', 'fake notice', 'body');
    raise exception 'FAIL: a non-admin must not post a notice';
  exception when insufficient_privilege then null;
  end;

  -- Posting as someone else.
  begin
    insert into posts (author_id, category, title, content) values (author, 'free', 'spoof', 'body');
    raise exception 'FAIL: a user must not post as another user';
  exception when insufficient_privilege then null;
  end;

  -- paper_counters is never directly reachable.
  select count(*) into n from paper_counters;
  assert n = 0, 'paper_counters must not be readable by end users';
  begin
    insert into paper_counters (year, last_seq) values (1999, 1);
    raise exception 'FAIL: paper_counters insert must be blocked';
  exception when insufficient_privilege then null;
  end;

  -- Commenting on hidden content the user can't see.
  begin
    insert into paper_comments (paper_id, author_id, content, written_at_version) values (hidden_paper, other, 'hi', 1);
    raise exception 'FAIL: commenting on a hidden paper must be rejected';
  exception when insufficient_privilege then null;
  end;

  -- written_at_version comes from the paper, not the client.
  insert into paper_comments (paper_id, author_id, content, written_at_version) values (public_paper, other, 'nice', 99);
  select written_at_version into n from paper_comments where paper_id = public_paper and author_id = other;
  assert n = 1, 'written_at_version must be derived from the paper row';

  -- Reports: one pending report per reporter per target, own reports only.
  insert into reports (target_type, target_id, reporter_id, reason) values ('paper', public_paper, other, 'spam');
  begin
    insert into reports (target_type, target_id, reporter_id, reason) values ('paper', public_paper, other, 'spam');
    raise exception 'FAIL: duplicate pending report by the same user must be rejected';
  exception when unique_violation then null;
  end;
  begin
    insert into reports (target_type, target_id, reporter_id, reason) values ('paper', public_paper, other, 'bogus');
    raise exception 'FAIL: unknown report reason must be rejected';
  exception when check_violation then null;
  end;
  update reports set status = 'reviewed' where target_id = public_paper;
  get diagnostics n = row_count;
  assert n = 0, 'a non-admin must not resolve reports';

  -- view counter works for everyone via the definer function only.
  perform increment_paper_view(public_paper);
  select view_count into n from papers where id = public_paper;
  assert n = 1, 'increment_paper_view must bump the counter';
  reset role;

  -- ------------------------------------------------------------- author
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', author, 'role', 'authenticated')::text, true);
  select count(*) into n from papers where id = hidden_paper;
  assert n = 1, 'the author must see their own hidden paper';
  select count(*) into n from posts where id = hidden_post;
  assert n = 1, 'the author must see their own hidden post';

  -- Un-hiding moderated content is admin-only.
  begin
    update papers set status = 'public' where id = hidden_paper;
    raise exception 'FAIL: an author must not un-hide their own hidden paper';
  exception when insufficient_privilege then null;
  end;
  begin
    update posts set category = 'notice' where id = hidden_post;
    raise exception 'FAIL: an author must not move a post into notice';
  exception when insufficient_privilege then null;
  end;

  -- The author can add a new version; version_no is assigned server-side.
  insert into papers (concept_id, author_id, title, abstract, file_path, version_no)
  values (public_cid, author, 'public paper v2', 'abstract', 'y2.pdf', 42);
  select max(version_no) into n from papers where concept_id = public_cid;
  assert n = 2, 'a new version must get version_no = previous max + 1';

  -- Reports by others are invisible to the author.
  select count(*) into n from reports where target_id = public_paper;
  assert n = 0, 'a user must only see their own reports';

  -- Normal users can mint concept ids.
  cid := generate_concept_id();
  assert cid ~ '^KSCA-[0-9]{4}-[0-9]{6}$', 'concept_id must match KSCA-YYYY-NNNNNN';
  reset role;

  -- -------------------------------------------------------------- admin
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', admin, 'role', 'authenticated')::text, true);
  select count(*) into n from papers where id = hidden_paper;
  assert n = 1, 'an admin must see any hidden paper';
  select count(*) into n from reports where target_id = public_paper;
  assert n = 1, 'an admin must see every report';

  insert into posts (author_id, category, title, content) values (admin, 'notice', 'real notice', 'body');

  update papers set status = 'public' where id = hidden_paper;
  get diagnostics n = row_count;
  assert n = 1, 'an admin must be able to restore a hidden paper';
  update paper_comments set status = 'hidden' where paper_id = public_paper;
  get diagnostics n = row_count;
  assert n = 1, 'an admin must be able to moderate paper comments';
  update reports set status = 'reviewed' where target_id = public_paper;
  get diagnostics n = row_count;
  assert n = 1, 'an admin must be able to resolve reports';
  reset role;

  raise notice 'rls_check.sql: all assertions passed';
end $$;

rollback;
