-- public_shares 보정 (PR #135 CodeRabbit 리뷰 × 2차):
--   1) INSERT 정책 강화 — 기존 'auth.uid() is not null'만으로는 인증 사용자가 '타인'의
--      tournament_id/result_id로도 공유 레코드를 만들 수 있었다(소유권 미검증). RLS 심층 방어(NF-06)로
--      본인 소유 결과·토너먼트에 대해서만 공유 생성을 허용하도록 강화한다.
--      2차 리뷰: 별개 EXISTS로는 result_id·tournament_id의 '조합 일관성'이 보장되지 않으므로
--      JOIN으로 단일 서브쿼리 내에서 r.tournament_id = tournament_id 조건까지 검증한다.
--   2) share_id 중복 인덱스 제거 — UNIQUE 제약이 인덱스를 자동 생성하므로 명시적 인덱스는 중복.
--
-- 초기 마이그레이션(20260526000000)은 이미 원격에 적용·repair된 불변 이력이므로, 수정 대신
-- 본 보정 마이그레이션을 append하고 `npx supabase db push`로 원격에 반영한다(append-only 원칙).

-- 1) 약한 INSERT 정책 제거 후 소유권 + 조합 일관성 검증 정책으로 교체
drop policy if exists "public_shares: 인증 사용자만 생성" on public_shares; -- noqa: RF05
drop policy if exists "public_shares: 본인 결과만 공유 생성" on public_shares; -- noqa: RF05

create policy "public_shares: 본인 결과만 공유 생성" -- noqa: RF05
  on public_shares for insert
  with check (
    auth.uid() is not null
    -- result_id·tournament_id의 소유권과 조합 일관성을 단일 서브쿼리로 검증(NF-06 RLS 심층 방어):
    --   · r.id = result_id         → 해당 result가 존재하는지
    --   · r.tournament_id = tournament_id → result가 실제로 이 tournament에 속하는지(조합 무결성)
    --   · r.owner_id = auth.uid()  → result 소유자가 현재 사용자인지
    --   · t.owner_id = auth.uid()  → tournament 소유자도 현재 사용자인지
    and exists (
      select 1
      from tournament_results r
      join tournaments t on t.id = r.tournament_id
      where r.id = result_id
        and r.tournament_id = tournament_id
        and r.owner_id = auth.uid()
        and t.owner_id = auth.uid()
    )
  );

-- 2) UNIQUE(share_id)가 자동 생성하는 인덱스와 중복되는 명시적 인덱스 제거
drop index if exists idx_public_shares_share_id;
