-- Local development seed data. Applied by `npx supabase db reset`.
-- Fixed UUIDs keep this idempotent across resets.
-- Every seeded account's password is 'password123' (LOCAL DEV ONLY).
--
-- After a reset, run `npm run db:seed-storage` to upload placeholder PDFs to
-- every seeded paper's file_path so the signed download flow works.

-- ---------------------------------------------------------------------------
-- Accounts (auth.users + auth.identities; profiles rows come from the
-- on_auth_user_created trigger)
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  crypt('password123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', u.meta::jsonb,
  now(), now(), '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'admin@ksca.dev',   '{"nickname":"KSCA 운영진"}'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'author1@ksca.dev', '{"nickname":"김민준","school":"한빛고등학교"}'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'author2@ksca.dev', '{"nickname":"이서연"}'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'author3@ksca.dev', '{"nickname":"박지호","school":"새솔중학교"}')
) as u(id, email, meta);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.email like '%@ksca.dev';

update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111';

-- ---------------------------------------------------------------------------
-- Papers. version_no is assigned by the enforce_paper_versioning trigger, so
-- versions of one concept are inserted in order.
-- ---------------------------------------------------------------------------

do $$
declare
  rl_cid text := generate_concept_id();
  rl_v1 uuid := 'a0000000-0000-0000-0000-000000000001';
  rl_v2 uuid := 'a0000000-0000-0000-0000-000000000002';
  nutrition uuid := 'a0000000-0000-0000-0000-000000000003';
  nlp uuid := 'a0000000-0000-0000-0000-000000000004';
  co2 uuid := 'a0000000-0000-0000-0000-000000000005';
  graph uuid := 'a0000000-0000-0000-0000-000000000006';
begin
  -- A multi-version paper (v1 → v2 share one concept_id)
  insert into papers (id, concept_id, author_id, authors, title, abstract, tags, school, file_path, view_count, created_at)
  values (
    rl_v1, rl_cid, '22222222-2222-2222-2222-222222222222', '김민준',
    '청소년을 위한 강화학습 입문 실험',
    E'간단한 그리드월드 환경에서 Q-learning 에이전트의 수렴 과정을 관찰한다.\n\n학습률과 할인율을 바꿔 가며 50회 반복 실험을 수행했고, 탐험 비율(ε)을 점진적으로 줄이는 전략이 고정 ε 대비 평균 31% 빠르게 수렴함을 확인했다.',
    array['AI', '강화학습'], '한빛고등학교', 'seed/rl-intro-v1.pdf', 87, '2026-03-14 10:00:00+09'
  );
  insert into papers (id, concept_id, author_id, authors, title, abstract, tags, school, file_path, view_count, created_at)
  values (
    rl_v2, rl_cid, '22222222-2222-2222-2222-222222222222', '김민준',
    '청소년을 위한 강화학습 입문 실험 (개정판)',
    E'v1의 피드백을 반영해 보상 함수를 재설계하고 실험 표본 수를 50회에서 200회로 늘려 재검증했다.\n\n개정된 보상 함수에서는 ε 감쇠 전략의 이점이 평균 24%로 다소 줄었지만, 분산이 크게 감소해 결과의 재현성이 높아졌다.',
    array['AI', '강화학습'], '한빛고등학교', 'seed/rl-intro-v2.pdf', 142, '2026-04-02 15:30:00+09'
  );

  insert into papers (id, concept_id, author_id, authors, title, abstract, tags, school, file_path, view_count, created_at)
  values (
    nutrition, generate_concept_id(), '33333333-3333-3333-3333-333333333333', '이서연',
    '학교 급식 데이터로 보는 영양 불균형 분석',
    E'공공데이터포털에서 전국 20개교의 1년치 급식 식단 데이터를 수집해 끼니별 영양소 편차를 분석했다.\n\n나트륨은 권장량 대비 평균 128%로 초과한 반면, 칼슘은 71% 수준에 머물렀다. 지역별 편차도 함께 보고한다.',
    array['데이터분석', '공공데이터'], null, 'seed/nutrition-analysis-v1.pdf', 64, '2026-05-20 09:00:00+09'
  );

  insert into papers (id, concept_id, author_id, authors, title, abstract, tags, school, file_path, view_count, created_at)
  values (
    nlp, generate_concept_id(), '44444444-4444-4444-4444-444444444444', '박지호, 최유나',
    '한국어 맞춤법 교정을 위한 경량 트랜스포머 모델',
    E'노트북 CPU에서도 실시간으로 동작하는 한국어 맞춤법 교정 모델을 설계했다.\n\n파라미터 수를 12M으로 제한하고 띄어쓰기·맞춤법 오류 30만 문장으로 학습해, 공개 평가셋에서 F1 0.83을 달성했다.',
    array['AI', 'NLP'], '새솔중학교', 'seed/korean-spellcheck-v1.pdf', 203, '2026-06-11 20:15:00+09'
  );

  insert into papers (id, concept_id, author_id, authors, title, abstract, tags, school, file_path, view_count, created_at)
  values (
    co2, generate_concept_id(), '22222222-2222-2222-2222-222222222222', '김민준, 정하은',
    '아두이노 기반 교실 이산화탄소 농도 모니터링 시스템',
    E'저가형 NDIR CO2 센서와 아두이노로 교실 공기질을 측정하고, 환기 알림을 보내는 시스템을 제작했다.\n\n4주간 측정 결과 점심시간 직후 CO2 농도가 평균 1,850ppm까지 올라갔으며, 알림 도입 후 1,000ppm 초과 시간이 46% 감소했다.',
    array['IoT', '하드웨어'], '한빛고등학교', 'seed/co2-monitor-v1.pdf', 51, '2026-07-01 13:00:00+09'
  );

  insert into papers (id, concept_id, author_id, authors, title, abstract, tags, school, file_path, view_count, created_at)
  values (
    graph, generate_concept_id(), '33333333-3333-3333-3333-333333333333', '이서연',
    '그래프 탐색 알고리즘 학습을 위한 웹 기반 시각화 도구',
    E'BFS, DFS, 다익스트라 알고리즘의 동작을 단계별로 보여주는 웹 시각화 도구를 개발했다.\n\n중학생 32명을 대상으로 사전·사후 테스트를 진행한 결과, 시각화 도구를 사용한 집단의 정답률이 22%p 더 높았다.',
    array['알고리즘', '교육'], null, 'seed/graph-visualizer-v1.pdf', 38, '2026-08-15 18:45:00+09'
  );

  -- Paper comments across versions (README §3.4: kept across versions, badge
  -- shows the version they were written on — derived by trigger from paper_id)
  insert into paper_comments (paper_id, author_id, content, created_at) values
    (rl_v1, '33333333-3333-3333-3333-333333333333', '흥미로운 접근이네요! 보상 함수는 어떻게 설계하셨나요?', '2026-03-15 11:00:00+09'),
    (rl_v1, '22222222-2222-2222-2222-222222222222', '목표 지점 +1, 벽 충돌 -0.1로 단순하게 두었어요. 다음 버전에서 개선해 보겠습니다.', '2026-03-15 19:20:00+09'),
    (rl_v2, '11111111-1111-1111-1111-111111111111', '개정판에서 재현성이 크게 좋아졌습니다. 좋은 연구네요.', '2026-04-03 09:10:00+09'),
    (nlp, '22222222-2222-2222-2222-222222222222', '학습 데이터는 어디서 구하셨나요? 공개 계획이 있는지 궁금합니다.', '2026-06-12 08:30:00+09');
end $$;

-- ---------------------------------------------------------------------------
-- Board posts (all four categories) and comments
-- ---------------------------------------------------------------------------

insert into posts (id, author_id, category, title, content, tags, created_at) values
  ('b0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'notice',
   'KSCA 서비스 오픈 안내',
   E'안녕하세요, KSCA 운영진입니다.\n\n**논문 아카이브**와 **커뮤니티 게시판**이 정식 오픈되었습니다.\n\n- 업로드한 논문에는 `KSCA-연도-일련번호` 형식의 영구 식별자가 발급됩니다.\n- 새 버전을 올려도 식별자는 유지되고, 이전 버전도 계속 열람할 수 있습니다.\n- 부적절한 콘텐츠는 **신고** 버튼으로 알려주세요. 신고 3건이 누적되면 자동으로 비공개 처리됩니다.',
   array['공지'], '2026-03-01 09:00:00+09'),
  ('b0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'free',
   '첫 논문 업로드했습니다',
   E'강화학습 입문 실험을 정리해서 올렸어요. 피드백 환영합니다!\n\n> 특히 실험 설계 부분에 대한 의견이 궁금합니다.',
   array['후기'], '2026-03-14 10:30:00+09'),
  ('b0000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'question',
   'RLS 정책 질문 있습니다',
   E'Supabase에서 select 정책을 쓸 때 `author_id = auth.uid()` 체크는 어떻게 동작하나요?\n\n```sql\ncreate policy "own" on posts for select using (author_id = auth.uid());\n```\n\n로그인하지 않은 경우에는 `auth.uid()`가 어떤 값이 되는지 궁금합니다.',
   array['Supabase', '보안'], '2026-04-10 21:00:00+09'),
  ('b0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'study',
   '알고리즘 스터디원 모집 (주 1회, 온라인)',
   E'백준 골드 문제를 같이 풀 스터디원을 모집합니다.\n\n- 일정: 매주 토요일 오후 8시\n- 방식: 디스코드 화면 공유\n- 인원: 4명 (현재 2명)\n\n관심 있으신 분은 댓글 남겨주세요!',
   array['알고리즘', '스터디'], '2026-05-02 17:00:00+09'),
  ('b0000000-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 'free',
   '중학생도 논문 올려도 되나요?',
   '학교 인증이 없다고 해서 올려봤는데, 중학생이 올려도 괜찮은 건지 궁금해요.',
   array[]::text[], '2026-06-11 20:30:00+09'),
  ('b0000000-0000-0000-0000-000000000006', '44444444-4444-4444-4444-444444444444', 'free',
   '[광고] 코딩 과외 저렴하게 해드립니다',
   '연락주세요 010-0000-0000',
   array[]::text[], '2026-09-01 03:00:00+09');

insert into comments (post_id, author_id, content, created_at) values
  ('b0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '좋은 시작이네요, 축하합니다!', '2026-03-14 12:00:00+09'),
  ('b0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '로그인하지 않으면 auth.uid()는 null이라서 비교 결과도 null(거짓)이 돼요.', '2026-04-10 22:15:00+09'),
  ('b0000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '참여하고 싶어요!', '2026-05-03 08:00:00+09'),
  ('b0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '물론입니다. KSCA는 전국 청소년 누구나 참여할 수 있어요.', '2026-06-12 09:00:00+09');

-- ---------------------------------------------------------------------------
-- Reports: the spam post gets 3 pending reports from 3 different accounts,
-- which trips the auto-hide trigger and puts it in /admin/reports.
-- ---------------------------------------------------------------------------

insert into reports (target_type, target_id, reporter_id, reason, detail, created_at) values
  ('post', 'b0000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'spam', '광고성 게시글입니다.', '2026-09-01 08:00:00+09'),
  ('post', 'b0000000-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 'spam', null, '2026-09-01 09:30:00+09'),
  ('post', 'b0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'inappropriate', '개인 연락처 노출', '2026-09-01 10:00:00+09');
