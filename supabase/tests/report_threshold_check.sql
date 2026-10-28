-- Report auto-hide verification (README §3.5, §10, §11).
-- Run with: npm run test:db
--
-- Reports are filed exactly the way the app files them: as three *different*
-- authenticated users, each under their own JWT, so RLS applies to the
-- reporter. Covers all four target types, the "exactly 3" boundary, and that
-- reviewed reports no longer count. Rolled back at the end.

\set ON_ERROR_STOP 1
begin;

do $$
declare
  author uuid := gen_random_uuid();
  reporters uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  admin uuid := gen_random_uuid();
  paper_id uuid;
  post_id uuid;
  comment_id uuid;
  paper_comment_id uuid;
  t record;
  i int;
  st text;
begin
  insert into auth.users (id, email) values
    (author, 'threshold-author@example.com'),
    (reporters[1], 'threshold-r1@example.com'),
    (reporters[2], 'threshold-r2@example.com'),
    (reporters[3], 'threshold-r3@example.com'),
    (admin, 'threshold-admin@example.com');
  update profiles set role = 'admin' where id = admin;

  insert into papers (concept_id, author_id, title, abstract, file_path)
  values (generate_concept_id(), author, 't', 'a', 'x.pdf') returning id into paper_id;
  insert into posts (author_id, category, title, content)
  values (author, 'free', 't', 'c') returning id into post_id;
  insert into comments (post_id, author_id, content)
  values (post_id, author, 'c') returning id into comment_id;
  insert into paper_comments (paper_id, author_id, content, written_at_version)
  values (paper_id, author, 'c', 1) returning id into paper_comment_id;

  for t in
    select * from (values
      ('paper', paper_id, 'papers'),
      ('post', post_id, 'posts'),
      ('comment', comment_id, 'comments'),
      ('paper_comment', paper_comment_id, 'paper_comments')
    ) as v(target_type, target_id, tbl)
  loop
    for i in 1..3 loop
      set local role authenticated;
      perform set_config('request.jwt.claims',
        json_build_object('sub', reporters[i], 'role', 'authenticated')::text, true);
      insert into reports (target_type, target_id, reporter_id, reason)
      values (t.target_type, t.target_id, reporters[i], 'spam');
      reset role;

      execute format('select status from %I where id = $1', t.tbl) into st using t.target_id;
      if i < 3 then
        assert st = 'public', format('%s must stay public after %s report(s)', t.target_type, i);
      else
        assert st = 'hidden', format('%s must auto-hide at exactly 3 pending reports', t.target_type);
      end if;
    end loop;

    -- Admin restores (README §11 복구): content public, reports reviewed.
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', admin, 'role', 'authenticated')::text, true);
    execute format('update %I set status = ''public'' where id = $1', t.tbl) using t.target_id;
    update reports set status = 'reviewed' where target_type = t.target_type and target_id = t.target_id;
    reset role;

    -- Reviewed reports no longer count: one new report must not re-hide it.
    set local role authenticated;
    perform set_config('request.jwt.claims',
      json_build_object('sub', reporters[1], 'role', 'authenticated')::text, true);
    insert into reports (target_type, target_id, reporter_id, reason)
    values (t.target_type, t.target_id, reporters[1], 'other');
    reset role;
    execute format('select status from %I where id = $1', t.tbl) into st using t.target_id;
    assert st = 'public', format('%s: reviewed reports must not count toward the threshold', t.target_type);
  end loop;

  raise notice 'report_threshold_check.sql: all 4 target types passed';
end $$;

rollback;
