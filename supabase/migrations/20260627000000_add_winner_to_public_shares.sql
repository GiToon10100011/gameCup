-- public_shares 테이블에 winner JSONB 컬럼 추가 (F-20 Task #129)
--
-- WHY: getPublicResult 결과를 비로그인 방문자에게 표시하려면 우승 게임 정보가
-- public_shares에 비정규화되어야 한다.
-- tournament_results 테이블은 RLS(owner_id = auth.uid())로 보호되어 있어
-- 비인증 요청으로는 join 조회가 불가하므로, 공유 생성 시점에 winner를 함께 저장한다.
--
-- 기존 행 호환: nullable(기존 공유 레코드는 winner=NULL이 될 수 있다).
-- 신규 insert(createPublicShare)는 항상 winner를 전달한다.

alter table public_shares
  add column if not exists winner jsonb;
