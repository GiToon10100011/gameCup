-- GameCup Iteration 4 초기 스키마 — tournaments · tournament_results · public_shares + RLS
-- UML v2.0 도메인 엔티티(ITournament·ITournamentResult·IPublicShare)에 1:1 대응.
-- 관련 요구사항: F-16·F-17(생성·목록) · F-19(결과 이력) · F-20(공유) · NF-06(RLS 격리).
--
-- 주의: 본 스키마는 최초에 Supabase 대시보드 SQL Editor로 수동 적용됐다(이슈 #102 setup).
-- 본 마이그레이션은 그 적용 상태를 코드로 캡처해 버전 관리·재현성을 확보하기 위함이다.
-- 향후 스키마 변경은 대시보드가 아니라 본 디렉터리에 새 마이그레이션을 추가하고
-- `npx supabase db push`(사용자 `!` 실행, 인증 필요)로 반영한다. (사용자 지시 2026.05.26)
-- 이미 원격에 적용된 환경에서는 `npx supabase migration repair --status applied <version>`로
-- 본 마이그레이션을 "적용됨"으로 표시해 중복 실행을 방지한다(자세한 절차는 supabase-setup.md §4.7).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) tournaments — 사용자가 만든 토너먼트(후보 게임 세트 + 이름) (F-16·F-17)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists tournaments (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  candidates  jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

-- owner_id 기준 목록 조회 성능 인덱스
create index if not exists idx_tournaments_owner_id on tournaments(owner_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) tournament_results — 플레이 완료 시 자동 저장되는 결과 이력 (F-19)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists tournament_results (
  id               uuid primary key default gen_random_uuid(),
  tournament_id    uuid not null references tournaments(id) on delete cascade,
  owner_id         uuid not null references auth.users(id) on delete cascade,
  winner           jsonb not null,
  bracket_summary  jsonb,
  played_at        timestamptz not null default now()
);

create index if not exists idx_tournament_results_tournament_id on tournament_results(tournament_id);
create index if not exists idx_tournament_results_owner_id on tournament_results(owner_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) public_shares — 비로그인 열람용 공개 공유 레코드 (F-20)
--    owner_id 없음: 공개 읽기 전용. share_id(32자 hex)가 예측 불가 접근 토큰.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public_shares (
  id             uuid primary key default gen_random_uuid(),
  share_id       text not null unique default encode(gen_random_bytes(16), 'hex'),
  tournament_id  uuid not null references tournaments(id) on delete cascade,
  result_id      uuid not null references tournament_results(id) on delete cascade,
  created_at     timestamptz not null default now()
);

create index if not exists idx_public_shares_share_id on public_shares(share_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) RLS(Row Level Security) — NF-06 데이터 격리. 코드 버그가 있어도 DB가 차단.
-- ─────────────────────────────────────────────────────────────────────────────
alter table tournaments enable row level security;

create policy "tournaments: 본인 행만 조회"
  on tournaments for select using (auth.uid() = owner_id);
create policy "tournaments: 본인 소유로만 생성"
  on tournaments for insert with check (auth.uid() = owner_id);
create policy "tournaments: 본인 행만 수정"
  on tournaments for update using (auth.uid() = owner_id);
create policy "tournaments: 본인 행만 삭제"
  on tournaments for delete using (auth.uid() = owner_id);

alter table tournament_results enable row level security;

create policy "tournament_results: 본인 행만 조회"
  on tournament_results for select using (auth.uid() = owner_id);
create policy "tournament_results: 본인 소유로만 생성"
  on tournament_results for insert with check (auth.uid() = owner_id);
-- UPDATE 정책 미설정 = 전원 차단(이력 불변성, ISS-05 결정)
create policy "tournament_results: 본인 행만 삭제"
  on tournament_results for delete using (auth.uid() = owner_id);

alter table public_shares enable row level security;

-- 비로그인 포함 누구나 share_id로 조회(F-20 공개 링크). share_id 토큰이 접근 제어 역할.
create policy "public_shares: 누구나 share_id로 조회"
  on public_shares for select using (true);
-- 인증 사용자만 공유 레코드 생성(result_id 본인 소유 검증은 애플리케이션 계층)
create policy "public_shares: 인증 사용자만 생성"
  on public_shares for insert with check (auth.uid() is not null);
