-- public_shares 보정 (PR #135 CodeRabbit 리뷰):
--   1) INSERT 정책 강화 — 기존 'auth.uid() is not null'만으로는 인증 사용자가 '타인'의
--      tournament_id/result_id로도 공유 레코드를 만들 수 있었다(소유권 미검증). RLS 심층 방어(NF-06)로
--      본인 소유 결과·토너먼트에 대해서만 공유 생성을 허용하도록 강화한다.
--   2) share_id 중복 인덱스 제거 — UNIQUE 제약이 인덱스를 자동 생성하므로 명시적 인덱스는 중복.
--
-- 초기 마이그레이션(20260526000000)은 이미 원격에 적용·repair된 불변 이력이므로, 수정 대신
-- 본 보정 마이그레이션을 append하고 `npx supabase db push`로 원격에 반영한다(append-only 원칙).

-- 1) 약한 INSERT 정책 제거 후 소유권 검증 정책으로 교체
drop policy if exists "public_shares: 인증 사용자만 생성" on public_shares;

create policy "public_shares: 본인 결과만 공유 생성"
  on public_shares for insert
  with check (
    auth.uid() is not null
    -- 공유 대상 결과가 본인 소유인지 DB 수준에서 검증
    and exists (
      select 1 from tournament_results r
      where r.id = result_id and r.owner_id = auth.uid()
    )
    -- 공유 대상 토너먼트도 본인 소유인지 검증
    and exists (
      select 1 from tournaments t
      where t.id = tournament_id and t.owner_id = auth.uid()
    )
  );

-- 2) UNIQUE(share_id)가 자동 생성하는 인덱스와 중복되는 명시적 인덱스 제거
drop index if exists idx_public_shares_share_id;
