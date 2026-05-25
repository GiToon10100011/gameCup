# Supabase 설정 가이드

> **도입 시점:** Iteration 4 / 2026.05.25 (F-14 매직 링크 인증 · F-16~F-20 토너먼트·결과·공유 저장 · NF-06 RLS 격리)
> **대상:** Supabase 인증·DB를 동작시키기 위해 프로젝트를 설정해야 하는 모든 개발자

---

## 1. 개요

Supabase는 PostgreSQL 기반의 오픈소스 Backend-as-a-Service(BaaS)다. GameCup Iteration 4에서 다음 두 가지 역할을 담당한다.

| 역할 | 담당 기능 |
| --- | --- |
| **Supabase Auth (매직 링크)** | F-14 사용자 인증 · F-15 인증 가드 · NF-07 세션 자동 갱신 |
| **Supabase Database (PostgreSQL + RLS)** | F-16 토너먼트 저장 · F-17 목록·관리 · F-19 결과 이력 · F-20 공개 공유 링크 · NF-06 사용자별 데이터 격리 |

GameCup의 아키텍처에서 Supabase는 **Data 계층**에 위치한다. Presentation이 직접 접근하는 것은 금지되며, Business 계층의 `AuthModule`과 `TournamentStorageModule`을 통해서만 호출된다. (UML v2.0 §1 `SupabaseClient` 참조)

**패키지 버전:** `@supabase/supabase-js` ^2.x (2026.05 기준 최신 안정 버전)
**Node.js:** ≥ 20.x

---

## 2. 도입 시점

- **PRD Iteration 4 v4.0** — F-14·F-15·F-16·F-17·F-19·F-20·NF-06·NF-07 요구사항 전체가 Supabase에 의존한다.
- **기술 선택 근거:** [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) — Supabase 섹션 참조
- Iteration 3까지는 세션 내 메모리 상태만 사용했으나, 멀티 토너먼트·이력 보존·공개 공유 요구사항 확정으로 서버 측 영속성이 필수가 되었다.

---

## 3. 사전 요구사항

| 조건 | 상세 |
| --- | --- |
| **Supabase 계정** | [https://supabase.com](https://supabase.com) 회원가입 (GitHub·이메일 모두 가능, 무료 플랜 충분) |
| **무료 플랜 한도 확인** | 프로젝트 2개, 500 MB DB, 50,000 MAU — Iteration 4 개발 단계에서 초과 없음 |
| **이메일 발송 설정** | Supabase 무료 플랜은 시간당 3~4회 매직 링크 발송 제한. 개발 중에는 Supabase 대시보드 "Email Logs"로 확인 가능 (운영 전환 시 외부 SMTP 연동 권장) |
| **Node.js ≥ 20.x** | `node -v`로 확인 |

---

## 4. 단계별 설치·설정

### 4.1 Supabase 계정·프로젝트 생성

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) 접속 후 로그인.
2. **"New project"** 클릭.
3. 다음 값을 입력한다.

   | 항목 | 권장 값 |
   | --- | --- |
   | Name | `gamecup` (또는 `gamecup-dev`) |
   | Database Password | 안전한 랜덤 비밀번호 생성 후 별도 보관 (이후 직접 사용할 일 없음) |
   | Region | `Northeast Asia (Seoul)` — 한국 사용자 기준 지연 최소화 |
   | Pricing plan | Free |

4. "Create new project" 클릭 → 프로젝트 프로비저닝 완료까지 약 1~2분 대기.

### 4.2 `@supabase/supabase-js` · `@supabase/ssr` 설치

Supabase JavaScript 클라이언트(`@supabase/supabase-js`, Auth 세션·DB 쿼리·RLS 처리)와, Next.js App Router의 서버/클라이언트 컴포넌트·라우트 핸들러에서 쿠키 기반 세션을 다루기 위한 SSR 헬퍼(`@supabase/ssr`, PKCE 흐름 지원)를 함께 설치한다.

```bash
npm install @supabase/supabase-js @supabase/ssr
```

설치 후 `package.json` `dependencies`에 두 패키지(`"@supabase/supabase-js": "^2.x.x"`, `"@supabase/ssr": "^0.x.x"`)가 추가된 것을 확인한다. (`@supabase/supabase-js` v2는 ESM/CJS 듀얼 번들이라 Next.js 14 App Router에서 별도 설정 없이 import 가능하다.)

> 이 라이브러리는 브라우저 번들과 Node.js 서버 모두에서 동작한다. Next.js 14 App Router 환경에서는 클라이언트 컴포넌트 및 서버 컴포넌트·Route Handler 어디서든 사용 가능하나, GameCup 아키텍처 원칙상 **Presentation 계층이 직접 import해서는 안 된다.** `src/lib/supabaseClient.ts`(Data 계층)에서만 초기화하고 나머지는 Business 모듈(`AuthModule`, `TournamentStorageModule`)을 통해 접근한다.

### 4.3 매직 링크 인증 활성화

Supabase Auth는 기본적으로 Email 제공자가 활성화되어 있으며, Magic Link도 기본 활성화 상태다. 아래 절차로 리다이렉트 URL을 올바르게 설정한다.

#### 4.3.1 Auth 설정 확인

1. Supabase 대시보드 → 좌측 메뉴 **"Authentication"** 클릭.
2. **"Providers"** 탭 → **"Email"** 항목 확인.
3. 다음 두 토글이 **활성(ON)** 상태인지 확인한다.
   - `Enable Email provider` → ON
   - `Enable Magic Links` → ON (기본 ON)
4. `Confirm email` 옵션은 Magic Link 방식에서는 자동으로 처리되므로 별도 설정 불필요.

> 소셜 OAuth(Google·GitHub)와 비밀번호 기반 인증은 Iteration 4 범위 외다. 필요 시 차기 이터레이션에서 추가한다.

#### 4.3.2 Site URL · Redirect URL 설정

매직 링크를 클릭했을 때 Supabase가 인증 토큰을 포함하여 리다이렉트할 URL을 등록해야 한다. 등록되지 않은 URL로는 리다이렉트가 차단된다.

1. Supabase 대시보드 → **"Authentication"** → **"URL Configuration"** 탭.
2. **Site URL** 란에 기본 URL을 입력한다.

   | 환경 | Site URL |
   | --- | --- |
   | 로컬 개발 | `http://localhost:3000` |
   | Vercel 프리뷰 (Iteration 4 배포 시 추가) | `https://<프로젝트명>.vercel.app` |

3. **Redirect URLs** 란에 콜백 경로를 추가한다.

   ```text
   http://localhost:3000/auth/callback
   ```

   Vercel 배포 시 추가:

   ```text
   https://<프로젝트명>.vercel.app/auth/callback
   ```

   > `*` 와일드카드도 지원하나, 보안상 환경별 정확한 URL을 명시하는 것을 권장한다.

4. **"Save"** 클릭.

#### 4.3.3 왜 `/auth/callback`인가

Next.js App Router에서는 **PKCE 흐름**을 사용한다(`@supabase/ssr` 기반 권장 방식). 매직 링크를 클릭하면 Supabase가 `Redirect URL`로 **`?code=<auth_code>` 쿼리 파라미터**를 붙여 리다이렉트하고, 서버 라우트 핸들러 `app/auth/callback/route.ts`가 이 `code`를 받아 `supabase.auth.exchangeCodeForSession(code)`로 세션 쿠키를 수립한 뒤 앱으로 리다이렉트한다.

> ⚠️ **주의:** 구형 implicit 흐름은 토큰을 URL **fragment**(`#access_token=...`)로 전달하는데, fragment는 브라우저에만 머물고 **서버(route handler)로 전송되지 않는다**. 따라서 App Router의 server route에서 세션을 완성하려면 반드시 PKCE(`?code=`) 흐름이어야 한다. (Supabase 대시보드 기본값이 PKCE이며, `@supabase/ssr`의 `createServerClient`가 이를 처리한다.) 이 경로가 없으면 로그인이 완료되지 않는다.

### 4.4 DB 스키마 생성

Supabase 대시보드 → **"SQL Editor"** → **"New query"** 에서 아래 SQL을 순서대로 실행한다. 각 테이블은 UML v2.0의 도메인 엔티티와 1:1로 대응한다.

#### 4.4.1 `tournaments` 테이블

`ITournament` 엔티티를 저장한다. 사용자가 만든 토너먼트(후보 게임 세트 + 이름)의 영속 저장소다. (F-16·F-17)

```sql
create table tournaments (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  candidates  jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

-- owner_id 기준 조회 성능을 위한 인덱스
create index idx_tournaments_owner_id on tournaments(owner_id);
```

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid | 기본 키, 자동 생성 |
| `owner_id` | uuid | Supabase Auth 사용자 ID (`auth.users.id` 외래 키). 사용자 탈퇴 시 연쇄 삭제. |
| `name` | text | 토너먼트 이름 (F-16) |
| `candidates` | jsonb | `IGame[]` 직렬화 배열 (id·name·thumbnailUrl 포함) |
| `created_at` | timestamptz | 생성 일시 |

#### 4.4.2 `tournament_results` 테이블

`ITournamentResult` 엔티티를 저장한다. 플레이 완료 후 자동 저장되는 결과 이력이다. (F-19)

```sql
create table tournament_results (
  id               uuid primary key default gen_random_uuid(),
  tournament_id    uuid not null references tournaments(id) on delete cascade,
  owner_id         uuid not null references auth.users(id) on delete cascade,
  winner           jsonb not null,
  bracket_summary  jsonb,
  played_at        timestamptz not null default now()
);

-- 특정 토너먼트의 이력 목록 조회를 위한 인덱스
create index idx_tournament_results_tournament_id on tournament_results(tournament_id);
-- owner_id 기준 전체 이력 조회를 위한 인덱스
create index idx_tournament_results_owner_id on tournament_results(owner_id);
```

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid | 기본 키, 자동 생성 |
| `tournament_id` | uuid | 어떤 토너먼트의 결과인지 (`tournaments.id` 외래 키). 토너먼트 삭제 시 연쇄 삭제. |
| `owner_id` | uuid | 결과 소유자. 직접 RLS 정책에서 사용. |
| `winner` | jsonb | 우승 `IGame` 직렬화 객체 |
| `bracket_summary` | jsonb | 전체 대진 요약 (nullable — F-19 선택 필드) |
| `played_at` | timestamptz | 플레이 완료 일시 |

#### 4.4.3 `public_shares` 테이블

`IPublicShare` 엔티티를 저장한다. 비로그인 사용자도 `share_id`로 결과를 열람할 수 있게 하는 공개 공유 레코드다. (F-20)

```sql
create table public_shares (
  id             uuid primary key default gen_random_uuid(),
  share_id       text not null unique default encode(gen_random_bytes(16), 'hex'),
  tournament_id  uuid not null references tournaments(id) on delete cascade,
  result_id      uuid not null references tournament_results(id) on delete cascade,
  created_at     timestamptz not null default now()
);

-- share_id(공개 URL 토큰)로 빠른 단건 조회를 위한 인덱스
create index idx_public_shares_share_id on public_shares(share_id);
```

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid | 기본 키 |
| `share_id` | text | 공개 URL에 노출되는 고유 토큰 (32자 hex). `https://gamecup.app/share/<share_id>` 형태로 사용. |
| `tournament_id` | uuid | 공유 대상 토너먼트 |
| `result_id` | uuid | 공유 대상 결과 이력 |
| `created_at` | timestamptz | 공유 생성 일시 |

> `public_shares` 테이블은 `owner_id`를 가지지 않는다. 이 테이블은 **공개 읽기 전용** 용도이며, 쓰기는 인증된 사용자만 가능하도록 RLS로 제어한다.

### 4.5 RLS(Row Level Security) 정책 설정

RLS는 NF-06 "데이터 보안·격리" 요구사항을 충족하기 위한 핵심 설정이다. Supabase에서 RLS를 활성화하면, 정책에 명시된 조건을 충족하지 않는 행은 애플리케이션 코드와 무관하게 데이터베이스 수준에서 차단된다. 즉, 코드에 버그가 있어 타인의 `owner_id`를 전달하더라도 DB가 자동으로 거부한다.

아래 SQL을 **SQL Editor**에서 순서대로 실행한다.

#### 4.5.1 `tournaments` RLS

```sql
-- RLS 활성화 (비활성 시 모든 요청 차단)
alter table tournaments enable row level security;

-- 본인 토너먼트만 SELECT 가능
create policy "tournaments: 본인 행만 조회"
  on tournaments for select
  using (auth.uid() = owner_id);

-- 본인 소유로만 INSERT 가능 (owner_id가 auth.uid()와 일치해야 함)
create policy "tournaments: 본인 소유로만 생성"
  on tournaments for insert
  with check (auth.uid() = owner_id);

-- 본인 토너먼트만 UPDATE 가능
create policy "tournaments: 본인 행만 수정"
  on tournaments for update
  using (auth.uid() = owner_id);

-- 본인 토너먼트만 DELETE 가능
create policy "tournaments: 본인 행만 삭제"
  on tournaments for delete
  using (auth.uid() = owner_id);
```

#### 4.5.2 `tournament_results` RLS

```sql
alter table tournament_results enable row level security;

-- 본인 결과 이력만 SELECT 가능
create policy "tournament_results: 본인 행만 조회"
  on tournament_results for select
  using (auth.uid() = owner_id);

-- 본인 소유로만 INSERT 가능
create policy "tournament_results: 본인 소유로만 생성"
  on tournament_results for insert
  with check (auth.uid() = owner_id);

-- 결과 이력은 수정하지 않는다 (이력의 불변성 보장 — ISS-05 결정 반영)
-- UPDATE 정책 미설정 = 전원 차단

-- 본인 결과 이력만 DELETE 가능 (토너먼트 삭제 시 cascade 삭제 포함)
create policy "tournament_results: 본인 행만 삭제"
  on tournament_results for delete
  using (auth.uid() = owner_id);
```

#### 4.5.3 `public_shares` RLS

`public_shares`는 두 종류의 접근을 허용한다.

- **비로그인 포함 누구나**: `share_id`로 단건 조회 (F-20 공개 링크 열람)
- **인증된 본인만**: 공유 레코드 생성 (자신의 결과에 대한 공유 링크 생성)

```sql
alter table public_shares enable row level security;

-- 누구나(비로그인 포함) share_id로 단건 조회 가능 — F-20 공개 링크
create policy "public_shares: 누구나 share_id로 조회"
  on public_shares for select
  using (true);

-- 인증 사용자만 공유 레코드 생성 가능
-- (result_id가 본인 소유인지는 애플리케이션 계층에서 검증 — TournamentStorageModule)
create policy "public_shares: 인증 사용자만 생성"
  on public_shares for insert
  with check (auth.uid() is not null);
```

> `public_shares`의 SELECT 정책이 `using (true)`인 이유: 비로그인 방문자가 공유 URL(`/share/<share_id>`)에 접근할 때 Supabase 세션이 없다. 이때도 결과를 읽을 수 있어야 하므로 전체 공개를 허용한다. `share_id` 자체가 예측 불가한 32자 hex 토큰이므로, URL을 모르면 임의로 접근할 수 없다.

### 4.6 환경 변수 설정

Supabase 클라이언트 초기화에 필요한 두 값을 프로젝트 루트 `.env.local`에 추가한다.

**획득 위치:** Supabase 대시보드 → 좌측 메뉴 **"Project Settings"** → **"API"** 탭

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxx...
```

> `.env.local`은 `.gitignore`에 등록되어 커밋되지 않는다. **절대 실제 값을 코드에 하드코딩하거나 공개 저장소에 커밋하지 말 것.**

---

## 5. 환경 변수

| 키 이름 | 값 형식 | 필수/선택 | 노출 범위 | 획득 위치 |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxxxxxxxx.supabase.co` | **필수** | 클라이언트(브라우저) | 대시보드 → Project Settings → API → "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT 문자열 | **필수** | 클라이언트(브라우저) | 대시보드 → Project Settings → API → "anon public" 키 |

**`NEXT_PUBLIC_` 접두사 이유:** Next.js App Router에서 브라우저 번들에 환경 변수를 포함하려면 `NEXT_PUBLIC_` 접두사가 필요하다. Supabase `anon` 키는 클라이언트 측에서 사용하도록 설계된 공개 키이며, RLS 정책으로 데이터 접근 범위가 제한된다. 서비스 역할 키(`service_role`)는 RLS를 우회하므로 **절대 클라이언트에 노출하지 말 것** — Iteration 4 범위에서는 사용하지 않는다.

`.env.local.example` 반영 방법:

```bash
# .env.local.example 파일을 복사해 .env.local을 만든 뒤 실제 값으로 교체한다
cp .env.local.example .env.local
```

---

## 6. 검증

### 6.1 패키지 설치 확인

```bash
node -e "require('@supabase/supabase-js'); console.log('supabase-js OK')"
```

기대 출력: `supabase-js OK`

### 6.2 환경 변수 로드 확인

```bash
node -e "
  require('dotenv').config({ path: '.env.local' });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('URL:', url ? '설정됨' : '누락');
  console.log('KEY:', key ? '설정됨' : '누락');
"
```

기대 출력:

```text
URL: 설정됨
KEY: 설정됨
```

### 6.3 매직 링크 로그인 1회 검증

1. `npm run dev` 실행 후 [http://localhost:3000/auth](http://localhost:3000/auth) 접속 (AuthPage 구현 후).
2. 자신의 이메일 주소를 입력하고 "링크 전송" 클릭.
3. 수신된 이메일에서 링크 클릭 → `http://localhost:3000/auth/callback`으로 리다이렉트.
4. 브라우저 개발자 도구 → "Application" → "Cookies" → `sb-<프로젝트-id>-auth-token`이 설정되면 정상.
5. HubPage로 자동 이동되는지 확인.

> AuthPage 및 콜백 라우트 구현 전이라면, Supabase 대시보드 → **"Authentication"** → **"Users"** 탭에서 사용자가 등록되었는지로 확인할 수 있다.

### 6.4 RLS 타 사용자 데이터 접근 차단 확인

두 계정(A, B)으로 각각 로그인한 상태에서:

1. 계정 A로 토너먼트 하나를 생성한다.
2. 계정 B로 로그인 후, Supabase JavaScript 클라이언트로 아래 쿼리를 실행한다.

   ```javascript
   const { data, error } = await supabase
     .from('tournaments')
     .select('*');
   console.log(data); // 빈 배열 [] 이어야 함
   ```

   계정 B의 세션에서 계정 A의 토너먼트가 **반환되지 않으면** RLS가 올바르게 동작하는 것이다.

### 6.5 공개 share 링크 비로그인 읽기 확인

1. 인증된 사용자로 공유 레코드를 생성한 뒤 `share_id`를 얻는다.
2. 로그아웃 상태(또는 시크릿 창)에서 아래 쿼리를 실행한다.

   ```javascript
   const { data, error } = await supabase
     .from('public_shares')
     .select('*')
     .eq('share_id', '<위에서_얻은_share_id>')
     .single();
   console.log(data); // share 레코드가 반환되어야 함
   ```

   로그아웃 상태에서도 레코드가 반환되면 F-20 공개 링크 정책이 정상이다.

---

## 7. 트러블슈팅

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| 매직 링크 이메일이 수신되지 않는다 | Supabase 무료 플랜의 시간당 발송 제한(3~4회) 초과 | 대시보드 → Authentication → Email Logs 확인. 잠시 후 재시도. 반복 문제 시 외부 SMTP(Resend, SendGrid 등) 연동 고려. |
| 매직 링크 클릭 후 "Invalid redirect URL" 오류 | 대시보드의 "Redirect URLs"에 `http://localhost:3000/auth/callback`이 등록되지 않음 | 4.3.2 절차를 따라 Redirect URL 등록 후 재시도 |
| 로그인 후 세션이 유지되지 않고 새로고침 시 로그아웃된다 | `onAuthStateChange` 리스너가 설정되지 않았거나, AuthSlice에 세션이 저장되지 않음 | `AuthModule.onAuthStateChange`가 앱 초기화 시 등록되는지 확인. Next.js App Router에서는 루트 레이아웃(`app/layout.tsx`)에서 초기화 권장. |
| DB 쿼리 결과가 빈 배열 `[]`로 돌아온다 (데이터가 있는데) | RLS가 활성화되어 있고 세션이 없는 상태에서 쿼리가 실행됨 | 쿼리 실행 전 `supabase.auth.getSession()`으로 세션 유무를 확인. 세션이 없으면 먼저 로그인 플로우를 완료해야 함. |
| `PGRST116` 오류 — `JSON object requested, multiple (or no) rows returned` | `.single()` 사용 시 결과가 없거나 여러 행이 반환됨 | `share_id` 오타·누락 확인. RLS 정책상 접근 불가한 행을 `.single()`로 조회하면 동일 오류 발생. `.maybeSingle()`로 대체 후 `null` 처리 추가. |
| `env.local` 변경 후 반영 안 됨 | Next.js dev 서버 메모리 캐시 | `Ctrl+C` → `npm run dev`로 서버 재기동 |
| Supabase URL / Key 환경 변수를 잘못 설정했다 | 오타 또는 `anon` 키 대신 `service_role` 키를 복사 | 대시보드 → Project Settings → API에서 "anon public" 키 재확인. `service_role` 키는 사용하지 않는다. |
| SQL 실행 후 "permission denied for table" 오류 | RLS는 활성화되었으나 정책이 없거나 정책 조건 불일치 | 대시보드 → "Table Editor" → 해당 테이블 → "Policies" 탭에서 정책 목록 확인. 4.5절 SQL을 순서대로 재실행. |

---

## 8. 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Auth — Magic Link 가이드](https://supabase.com/docs/guides/auth/auth-magic-link)
- [Supabase Auth — Redirect URLs 설정](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Row Level Security (RLS) 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript 클라이언트 v2 레퍼런스](https://supabase.com/docs/reference/javascript/introduction)
- [Next.js 14 App Router + Supabase Auth 통합 가이드](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [GameCup PRD Iteration 4 — F-14·F-16~F-20·NF-06·NF-07](../01-prd/iteration-4.md)
- [GameCup UML v2.0 — SupabaseClient·AuthModule·TournamentStorageModule](../03-design/uml-v2.0.md)
- [GameCup 기술 선택 근거](../07-tech-rationale/README.md)
