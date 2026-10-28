# KSCA (전국 청소년 컴퓨터 사이언스 학회) 웹 서비스 기능 명세서

버전: v1.0
문서 성격: 논문 아카이브 + 커뮤니티 웹 서비스 기능/DB/보안 명세

---

## 1. 서비스 개요

- **명칭**: KSCA (Korea Student Computer science Association) — 가칭
- **대상**: 전국 청소년 (학교 인증 없음, 자율 입력)
- **범위**: 전국 단위
- **핵심 기능**
  1. 논문/프로젝트 아카이브 (Zenodo식 업로드·인용·버전관리)
  2. 커뮤니티 게시판 (게시글 + 댓글)
  3. 신고 기반 콘텐츠 관리 (운영진 사전승인 없음)

---

## 2. 사용자 및 권한

| 구분 | 권한 |
|---|---|
| 비회원 | 아카이브/게시판 열람만 가능 |
| 일반회원 | 업로드, 글쓰기, 댓글, 신고 가능 |
| 운영진(Admin) | 신고 처리, 콘텐츠 강제 삭제/복구, 공지 작성 |

- 인증 방식: 이메일 + 비밀번호 (Supabase Auth), 이메일 인증 필수
- 학교 인증: 없음 — 자율 입력 텍스트 필드
- 소셜 로그인: v1.0 범위 제외

---

## 3. 논문 아카이브

### 3.1 업로드
- 필드: 제목, 저자명(본인 + 공동저자 텍스트 입력), 초록, 분야 태그, 학교명(자율 입력, nullable), PDF 파일, 버전(v1부터 시작)
- 운영진 사전승인 없음 → 업로드 즉시 게시
- 파일 형식: PDF만 허용, 용량 제한 20MB

### 3.2 Zenodo식 요소
- **영구 식별자(concept_id)**: `KSCA-{YYYY}-{NNNNNN}` 형식, 연도별 6자리 일련번호, 학회 전체 통합 카운터로 발급
  - 논문 하나(concept) 당 식별자 1개, 버전이 올라가도 concept_id는 유지되고 `version_no`만 증가
- **인용 포맷**: 상세 페이지에서 APA / BibTeX 둘 다 자동 생성 및 복사 제공
- **버전 관리**: 같은 논문의 새 버전 업로드 가능, 이전 버전은 "구버전"으로 표시되어 계속 열람 가능

### 3.3 열람
- 목록: 최신순 / 조회수순 / 태그 필터
- 상세 페이지 구성: 초록, PDF 뷰어/다운로드, 조회수, 인용 포맷(APA/BibTeX), 버전 히스토리, 댓글창, 신고 버튼

### 3.4 초록 댓글 (paper_comments)
- 논문 상세 페이지에 댓글 기능 존재
- 새 버전이 업로드되어도 **이전 버전 댓글은 유지**
- 댓글 조회 시 concept_id 기준으로 전체 버전의 댓글을 모아 보여주되, 각 댓글에 "v1에 작성됨" 등 **작성 시점 버전 배지** 표시

### 3.5 신고제
- 사전 승인 없음, 신고 기반 사후 관리
- 신고 사유: 표절 의심 / 부적절한 내용 / 스팸 / 기타(자유 텍스트)
- **동일 대상 신고 3건 누적** → 자동 비공개(`status = hidden`) + 운영진 검토 큐 이동
- 운영진이 최종 삭제 확정 또는 복구 결정

---

## 4. 커뮤니티 게시판

- 카테고리: 자유 / 질문 / 스터디·프로젝트 모집 / 공지(운영진 전용 작성)
- 게시글: 제목 + 본문(마크다운) + 태그
- 댓글: 1단계만 (대댓글 없음, v1.0 기준)
- 신고 로직: 아카이브와 동일 (3건 누적 시 자동 숨김)

---

## 5. 페이지 라우팅 구조

```
/                                    — 랜딩 (학회 소개 + 신규 논문 하이라이트)
/papers                              — 아카이브 목록 (태그 필터, 정렬)
/papers/[concept_id]                 — 논문 상세 (최신 버전, 버전 히스토리, 댓글, 인용, 신고)
/papers/[concept_id]/v/[n]           — 특정 버전 열람
/papers/upload                       — 신규 업로드 (로그인 필요)
/papers/[concept_id]/upload-version  — 새 버전 업로드 (원저자만)

/board                               — 게시판 카테고리 목록
/board/[category]                    — 카테고리별 글 목록
/board/post/[id]                     — 글 상세 + 댓글
/board/write                         — 글쓰기 (로그인 필요)

/login
/signup
/me                                  — 마이페이지 (내 논문, 내 글, 내 신고 내역)

/admin                               — 운영진 전용 (계정 role 기반 접근 제어)
/admin/reports                       — 신고 검토 큐 (삭제 확정 / 복구)
```

### 5.1 랜딩 페이지 구성
- 상단: 학회 소개
- 중단: 신규 논문 하이라이트 (최신 업로드 N건, 카드형)

### 5.2 Admin 접근 제어
- 라우트 미들웨어가 아닌 **계정의 role 값**으로 제어
- `/admin` 진입 시 `profiles.role === 'admin'` 확인 후 미인가 시 리다이렉트
- API/RLS 정책 단에서도 role 체크 (이중 방어)

---

## 6. 기술 스택

- Frontend: Next.js (App Router)
- Backend/DB: Supabase (Postgres + Auth + Storage)
- 파일 저장: Supabase Storage (PDF, private 버킷 + Signed URL)
- 배포: Vercel

---

## 7. 파일 업로드 — Signed URL 방식

- Storage 버킷 `papers`는 **private**로 생성
- **업로드**: 클라이언트 → 서버(Server Action/Edge Function)에 요청 → 서버가 `createSignedUploadUrl` 발급 → 클라이언트가 해당 URL로 직접 업로드
- **열람**: 요청 시마다 서버가 `createSignedUrl`(짧은 만료시간, 예: 5분) 발급 후 접근
- `papers.file_path` 컬럼에는 실제 URL이 아닌 **버킷 내 경로만 저장**, 매 요청마다 signed URL을 새로 생성

라우트 예시:
```
GET /api/papers/[id]/download  → 서버에서 signed URL 생성 후 반환/리다이렉트
```

---

## 8. DB 스키마 (최종본)

```sql
-- 사용자 프로필 (Supabase Auth의 auth.users 확장)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  school text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- 논문
create table papers (
  id uuid primary key default gen_random_uuid(),
  concept_id text not null,
  version_no int not null default 1,
  author_id uuid not null references profiles(id),
  title text not null,
  abstract text not null,
  tags text[] not null default '{}',
  school text,
  file_path text not null,
  view_count int not null default 0,
  status text not null default 'public' check (status in ('public', 'hidden')),
  created_at timestamptz not null default now()
);
create index on papers (concept_id);

-- 논문 댓글 (버전별 종속 + 작성 시점 버전 기록)
create table paper_comments (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references papers(id) on delete cascade,
  author_id uuid not null references profiles(id),
  content text not null,
  written_at_version int not null,
  status text not null default 'public' check (status in ('public', 'hidden')),
  created_at timestamptz not null default now()
);

-- 게시판 글
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  category text not null check (category in ('free', 'question', 'study', 'notice')),
  title text not null,
  content text not null,
  status text not null default 'public' check (status in ('public', 'hidden')),
  created_at timestamptz not null default now()
);

-- 게시판 댓글
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id),
  content text not null,
  status text not null default 'public' check (status in ('public', 'hidden')),
  created_at timestamptz not null default now()
);

-- 신고
create table reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('paper', 'post', 'comment', 'paper_comment')),
  target_id uuid not null,
  reporter_id uuid not null references profiles(id),
  reason text not null,
  detail text,
  status text not null default 'pending' check (status in ('pending', 'reviewed')),
  created_at timestamptz not null default now()
);

-- 연도별 concept_id 발급 카운터
create table paper_counters (
  year int primary key,
  last_seq int not null default 0
);
```

---

## 9. concept_id 발급 함수 (DB 함수, 원자적 증가)

```sql
create or replace function generate_concept_id()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year int := extract(year from now());
  next_seq int;
  new_id text;
begin
  insert into paper_counters (year, last_seq)
  values (current_year, 1)
  on conflict (year)
  do update set last_seq = paper_counters.last_seq + 1
  returning last_seq into next_seq;

  new_id := 'KSCA-' || current_year || '-' || lpad(next_seq::text, 6, '0');
  return new_id;
end;
$$;
```

- `on conflict ... do update`가 row-level lock으로 동시성 안전성 보장
- `security definer`로 정의하여 `paper_counters`에 직접 접근 권한이 없는 일반 유저도 함수를 통해서만 안전하게 발급 가능

---

## 10. 신고 3건 자동 숨김 트리거

```sql
create or replace function check_report_threshold()
returns trigger
language plpgsql
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

create trigger trg_report_threshold
after insert on reports
for each row execute function check_report_threshold();
```

---

## 11. 신고 검토(Review) 처리 로직

- **삭제 확정**: 콘텐츠 `status = hidden` 유지, 해당 `reports.status → reviewed`
- **복구**: 콘텐츠 `status → public`으로 복원, 해당 `reports.status → reviewed`
- `reports.status`(`pending`/`reviewed`)는 처리 여부만 표시
- 콘텐츠 자체의 `status`(`public`/`hidden`)가 실제 공개 여부의 source of truth
- `/admin/reports` 페이지에 "삭제 확정" / "복구" 버튼 두 개로 구성

---

## 12. RLS(Row Level Security) 정책

```sql
-- 모든 테이블 RLS 활성화
alter table profiles enable row level security;
alter table papers enable row level security;
alter table paper_comments enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table reports enable row level security;
alter table paper_counters enable row level security;

-- profiles: 전체 열람 가능, 본인만 수정
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- papers: public만 열람(작성자 본인+admin은 hidden도 열람), 로그인 유저만 작성, 작성자/admin만 수정
create policy "papers_select" on papers for select
  using (
    status = 'public'
    or author_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "papers_insert" on papers for insert
  with check (auth.uid() is not null and author_id = auth.uid());
create policy "papers_update_own_or_admin" on papers for update
  using (
    author_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- paper_comments: papers와 동일 패턴
create policy "paper_comments_select" on paper_comments for select
  using (
    status = 'public'
    or author_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "paper_comments_insert" on paper_comments for insert
  with check (auth.uid() is not null and author_id = auth.uid());

-- posts: notice 카테고리는 admin만 작성 가능
create policy "posts_select" on posts for select
  using (
    status = 'public'
    or author_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "posts_insert" on posts for insert
  with check (
    auth.uid() is not null and author_id = auth.uid()
    and (category != 'notice' or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  );
create policy "posts_update_own_or_admin" on posts for update
  using (
    author_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- comments: posts와 동일 패턴
create policy "comments_select" on comments for select
  using (
    status = 'public'
    or author_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "comments_insert" on comments for insert
  with check (auth.uid() is not null and author_id = auth.uid());

-- reports: 본인 신고만 열람(admin은 전체), 로그인 유저 누구나 작성, admin만 처리
create policy "reports_select_own_or_admin" on reports for select
  using (
    reporter_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "reports_insert" on reports for insert
  with check (auth.uid() is not null and reporter_id = auth.uid());
create policy "reports_update_admin_only" on reports for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- paper_counters: 직접 접근 차단, generate_concept_id() 함수(security definer)를 통해서만 접근
create policy "paper_counters_no_direct_access" on paper_counters for all using (false);
```

---

## 13. 확정 사항 요약

| 항목 | 결정 |
|---|---|
| 논문 식별자 | `KSCA-{YYYY}-{NNNNNN}`, DB 함수로 원자적 발급 |
| 버전 관리 | concept_id 유지 + version_no 증가, 이전 버전 열람 가능 |
| 인용 포맷 | APA + BibTeX 둘 다 지원 |
| 초록 댓글 | 버전 유지, 작성 시점 버전 배지 표시 |
| 업로드 승인 | 없음 (즉시 게시) |
| 신고 기준 | 3건 누적 시 자동 숨김 (paper/post/comment/paper_comment 전체 적용) |
| 신고 최종 처리 | 운영진이 삭제 확정 또는 복구 |
| 학교 인증 | 없음, 자율 입력 |
| 파일 저장 | Signed URL 방식, private 버킷 |
| Admin 접근 제어 | 계정 role 기반 (미들웨어 아님) + RLS 이중 방어 |
| 기술 스택 | Next.js + Supabase + Vercel |

---

## 14. 미결정 사항 (다음 논의 필요)

1. 게시판 공지(notice) 외 카테고리 확장 여부
2. 마이페이지(`/me`)에서 신고 내역/처리 결과를 어느 수준까지 노출할지
3. concept_id 접두어(`KSCA`)는 학회 정식 명칭 확정 시 변경 가능성 있음
4. 실제 DOI 등록기관(예: DataCite) 가입 여부 — 지금은 자체 식별자만 발급, 추후 전환 가능하게 설계됨

---

## 15. 다음 단계 (선택)

1. Next.js 프로젝트 초기 세팅 + Supabase 클라이언트 연결
2. 페이지별 UI 와이어프레임
3. 업로드 플로우 실제 구현 (Signed URL 발급 서버 액션부터)

---

## 16. 로컬 개발 환경 설정 (Local Dev Setup)

### 사전 요구사항
- Node.js 20 이상, npm
- Docker (Supabase CLI가 로컬 Postgres/Auth/Storage/Mailpit을 컨테이너로 실행)
- Supabase CLI는 devDependency로 포함되어 있어 `npx supabase`로 바로 쓸 수 있다

### 최초 설정

```bash
npm install
npx supabase start            # 로컬 Supabase 스택 기동 (최초 1회는 이미지 다운로드로 수 분 소요)
cp .env.local.example .env.local
# .env.local에 `npx supabase status`의 ANON_KEY / SECRET_KEY 값을 입력
npm run db:reset              # 마이그레이션 + seed.sql 적용 + 시드 PDF 업로드
npm run dev
```

- 앱: `http://localhost:3000`
- Supabase Studio(테이블/Auth 사용자 확인): `http://127.0.0.1:54323`
- Mailpit(로컬 메일함 — 회원가입 확인 메일이 여기로 온다): `http://127.0.0.1:54324`

`papers` 스토리지 버킷(private, PDF 전용, 20MB 제한)은 마이그레이션이 만들어 주므로 따로 만들 필요가 없다.

### 시드 계정 (로컬 전용, 비밀번호는 모두 `password123`)
| 이메일 | 역할 | 시드 데이터 |
|---|---|---|
| `admin@ksca.dev` | 운영진 | 공지 글 |
| `author1@ksca.dev` | 일반회원 (김민준) | v1→v2 다중 버전 논문, 스터디 모집 글 |
| `author2@ksca.dev` | 일반회원 (이서연) | 논문 2편, 질문 글 |
| `author3@ksca.dev` | 일반회원 (박지호) | 논문 1편, 신고 3건으로 자동 숨김된 스팸 글 (`/admin/reports`에서 확인) |

### 테스트

```bash
npm test          # 단위 테스트 (Vitest): 검증·인용·권한·신고 처리 로직
npm run test:db   # DB 레벨 검증: RLS 정책, 신고 3건 자동 숨김 트리거 (실제 anon/authenticated 역할로 실행, 끝나면 롤백)
npm run lint
npm run typecheck
npm run build
```

### 스키마를 바꿀 때
새 마이그레이션 파일만 추가한다 (`npx supabase migration new <name>`). 기존 마이그레이션 파일은 이미 적용된 것으로 간주하고 수정하지 않는다. `npm run db:reset`으로 전체 재적용 후 `npm run test:db`로 확인한다.

## 17. 프로젝트 구조 및 컨벤션 (Project Structure & Conventions)

```
/app                    — 페이지 (App Router). 라우팅 구조는 §5 참고
  /api/papers/[id]/download — signed URL 발급 후 리다이렉트 (§7)
  /auth/confirm         — 가입 확인 메일 링크 처리 (§2 이메일 인증)
/components             — 재사용 UI. ui/ 하위는 shadcn 생성물이므로 직접 고치지 말고 감싸서 쓴다
/lib
  /supabase             — client(브라우저) / server(쿠키 기반) / admin(secret key, Storage 전용) / proxy(세션 갱신)
  /actions              — Server Action ('use server'). 모든 쓰기는 여기를 거친다
  auth.ts, guards.ts    — requireUser / requireAdmin / requireAdminPage (role 기반, 미들웨어 아님 — §5.2)
  validation.ts         — 입력 검증 (DB 제약과 같은 기준)
  citation.ts           — APA / BibTeX 생성
  moderation.ts         — 신고 묶음 처리, 삭제 확정/복구 디스패치
  visibility.ts         — canView (RLS 미러링, 화면 표시 판단용 — 실제 보안 경계는 RLS)
  types.ts              — DB 로우 타입
/supabase
  /migrations           — 순서대로 적용되는 SQL. 기존 파일은 불변, 변경은 새 마이그레이션으로
  /tests                — psql로 실행하는 DB 검증 스크립트 (npm run test:db)
  /templates            — Auth 메일 템플릿
  seed.sql, seed-storage.mjs — 로컬 개발용 샘플 데이터
proxy.ts                — 요청마다 Supabase 세션 쿠키 갱신 (접근 제어 아님)
```

**컨벤션**
- 순수 로직(검증, 포맷팅, 권한 판단)은 `lib/`에 부수효과 없는 함수로 두고 Vitest로 테스트한다. `'use server'` 파일은 async 함수만 export할 수 있으므로 검증 함수는 `lib/validation.ts` 등에 둔다.
- 모든 로그인 필요 페이지는 `getViewer`/`requireAdminPage`로 시작하고, 미로그인 시 `/login?next=...`로 보낸다.
- 테이블 읽기/쓰기는 항상 사용자 세션 클라이언트(`lib/supabase/server.ts`)로 해서 RLS가 적용되게 한다. secret key 클라이언트(`lib/supabase/admin.ts`)는 Storage signed URL 발급에만 쓴다.
- 앱 레벨 체크(`canView`, `canPostToCategory` 등)는 UX용이고, 보안은 RLS·트리거가 담당한다는 전제로 작성한다.
- 날짜는 `lib/format.ts`로 KST 기준 표시한다 (서버는 UTC로 동작).

## 18. 기여 워크플로우 (Contribution Workflow)

- **브랜치**: `main`에서 직접 작업하지 않는다. `feature/<짧은-설명>` 또는 `fix/<짧은-설명>` 브랜치를 만든다.
- **커밋 메시지**: 명령형 현재 시제 한 줄 요약 (`Add paper detail page`, `Fix RLS policy for hidden comments`).
- **PR 전 체크리스트** (CI가 같은 항목을 자동 실행한다 — `.github/workflows/ci.yml`):
  1. `npm run lint`, `npm run typecheck`, `npm test` 통과
  2. `npm run build` 통과
  3. 스키마·RLS를 건드렸다면 `npm run test:db` 통과
  4. 새 라우트를 추가했다면 비회원/일반회원/운영진 3가지 권한으로 직접 확인
- **PR 설명**: 무엇을, 왜 바꿨는지 + 확인한 방법(테스트 커맨드 또는 수동 확인 절차).
- **리뷰**: 최소 1인 승인 후 병합. RLS 정책이나 마이그레이션을 건드리는 PR은 리뷰어가 §8·§12 및 §20과의 정합성을 직접 확인한다.

## 19. 배포 가이드 (Deployment Guide)

### Supabase 프로덕션 프로젝트
1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. 마이그레이션 적용 (`papers` 버킷도 함께 생성된다):
   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
   `seed.sql`은 로컬 전용이므로 프로덕션에 넣지 않는다.
3. **Authentication → Sign In / Providers → Email**에서 "Confirm email"을 켠다 (§2 이메일 인증 필수).
4. **Authentication → URL Configuration**에서 Site URL을 배포 도메인으로, Redirect URLs에 `https://<도메인>/**`을 추가한다.
5. **Authentication → Emails → Confirm signup** 템플릿을 `supabase/templates/confirmation.html` 내용으로 바꾼다 (링크가 `/auth/confirm`으로 가도록). 실제 메일 발송용 SMTP도 설정한다.

### Vercel
1. 저장소를 Vercel에 연결 (Framework Preset: Next.js)
2. 환경 변수 (`.env.local.example` 참고):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 프로덕션 프로젝트 값
   - `SUPABASE_SECRET_KEY` — Supabase **Settings → API Keys**의 secret key(`sb_secret_...`). **서버 전용**, 절대 `NEXT_PUBLIC_`을 붙이지 않는다 (레거시 `service_role` JWT 대신 사용)
   - `NEXT_PUBLIC_SITE_URL` — 배포 도메인 (인용 URL과 인증 메일 링크에 쓰인다)
3. 배포 후 `/signup`으로 가입하고, Supabase Studio(SQL Editor)에서 최초 운영진을 지정한다:
   ```sql
   update profiles set role = 'admin' where id = (select id from auth.users where email = '<운영진 이메일>');
   ```
   (일반 사용자는 트리거 때문에 자신의 role을 바꿀 수 없다 — §20 참고)

## 20. 구현 노트: README SQL 대비 추가된 사항

§8–§12의 SQL은 `supabase/migrations/20260905000001`–`000005`에 **그대로** 들어가 있다. 구현 중 그 SQL만으로는 명세의 의도가 실제로 지켜지지 않는 부분이 발견되어, 기존 정책을 바꾸지 않고 덧붙이는 마이그레이션으로 보완했다 (`000002`, `000003`, `000006`, `000007`). 각 항목은 `npm run test:db`로 검증된다.

| 항목 | 문제 | 보완 |
|---|---|---|
| 신고 3건 자동 숨김 (§10) | 트리거가 신고자 권한으로 실행되어, RLS 때문에 신고 수를 1건으로만 세고 남의 콘텐츠를 숨길 수도 없음 → **앱에서 신고해도 절대 숨겨지지 않음** | 같은 함수를 `security definer`로 재정의 |
| 중복 신고 | 한 사람이 같은 대상을 3번 신고해 혼자 숨길 수 있음 | 대기 중 신고는 (신고자, 대상)당 1건 (부분 unique index) |
| 권한 상승 | `profiles_update_own`이 컬럼 제한이 없어 스스로 `role = 'admin'` 설정 가능 | 운영진이 아니면 `role` 변경 불가 (트리거) |
| 숨김 해제 | 작성자가 자기 글의 `status`를 `public`으로 되돌릴 수 있음 / 일반글을 `notice`로 옮길 수 있음 / `view_count` 조작 가능 | 운영진이 아니면 `status`·`category`·`view_count` 등 변경 불가 (트리거) |
| 버전 탈취 | 남의 `concept_id`로 새 버전을 올리거나, 발급되지 않은 `concept_id`를 지어낼 수 있음 | 원저자만 새 버전 가능, `version_no`는 DB가 부여, 최초 버전의 `concept_id`는 실제 발급된 것만 허용 |
| 댓글 숨김/복구 (§11) | `comments`·`paper_comments`에 UPDATE 정책이 없어 운영진의 복구 불가 | 운영진 전용 UPDATE 정책 추가 |
| 조회수 (§3.3) | 비회원은 `papers`를 UPDATE할 수 없어 조회수가 오르지 않음 | `increment_paper_view()` 함수(security definer)로만 증가 |
| 버전 배지 (§3.4) | `written_at_version`을 클라이언트가 임의로 보낼 수 있음 | 댓글이 달린 논문 행에서 DB가 채움 |
| 저자명 (§3.1) | 업로드 필드에 있으나 §8 스키마에 컬럼 없음 | `papers.authors` 추가 |
| 게시글 태그 (§4) | 명세에 있으나 §8 스키마에 컬럼 없음 | `posts.tags` 추가 |
| 프로필 생성 | 명세에 없음 | `auth.users` INSERT 트리거로 `profiles` 자동 생성 (가입 시 닉네임/학교 반영) |
| 파일 제한 (§3.1) | 앱 검증만으로는 우회 가능 | `papers` 버킷 자체에 PDF 전용·20MB 제한 |
| 함수 노출 (Supabase 보안 어드바이저) | 트리거 함수가 `/rest/v1/rpc`로 호출 가능, 일부 함수 `search_path` 미고정 | 트리거 함수 EXECUTE 회수, `search_path` 고정 (`000007`) |

§14 미결정 사항 관련: `/me`의 신고 내역은 **대상과 처리 여부(검토 대기/검토 완료)만** 노출한다. 인용 URL과 메일 링크의 도메인은 `NEXT_PUBLIC_SITE_URL`로 바꿀 수 있어, 정식 도메인이 정해지면 코드 수정 없이 반영된다.
