"use client";

// MatchCard — 1:1 대결 카드 컴포넌트 (Task #31, F-07).
//
// 역할:
//   - 두 게임(gameA vs gameB)을 나란히 표시 — 썸네일 + 이름 + 선택 버튼
//   - 선택 클릭 → onSelect(game) 콜백으로 상위(TournamentPage)에 위임
//   - disabled=true 시 선택 버튼 비활성화 (NF-02 연속 클릭 방지)
//   - isBye=true 시 gameA 단독 카드 + "자동 진출" 뱃지 표시
//
// 3계층: Presentation — 선택 후 Business 로직(selectWinner)은 부모 컴포넌트가 호출

import Image from "next/image";
import type { IGame, ITournamentPair } from "@/types/game";
import { matchCardVariants } from "./MatchCard.variants";

// MatchCard 컴포넌트 props
export interface IMatchCardProps {
  // 현재 대결 페어 — gameB: null이면 부전승(isBye)
  pair: ITournamentPair;
  // 게임 선택 콜백 — 부모가 selectWinner()를 호출한다
  onSelect: (game: IGame) => void;
  // NF-02: 선택 처리 중 비활성화 플래그 — 연속 빠른 클릭 방지
  disabled?: boolean;
}

export function MatchCard({ pair, onSelect, disabled = false }: IMatchCardProps) {
  const styles = matchCardVariants();

  return (
    // role=group으로 "이 두 카드가 하나의 대결 단위"임을 스크린 리더에 알림
    <div className={styles.root()} role="group" aria-label="대결 카드">
      {/* gameA 카드 */}
      <article className={styles.card()}>
        <GameThumbnail
          game={pair.gameA}
          styles={styles}
        />
        <div className={styles.gameInfo()}>
          <p className={styles.gameName()}>{pair.gameA.name}</p>

          {/* 부전승이 아닐 때만 선택 버튼 노출 */}
          {!pair.isBye ? (
            <button
              type="button"
              className={styles.selectButton()}
              onClick={() => onSelect(pair.gameA)}
              disabled={disabled}
              aria-label={`${pair.gameA.name} 선택`}
            >
              선택
            </button>
          ) : (
            /* 부전승 — 이미 자동 진출 확정, 선택 불필요 */
            <div className={styles.byeBadge()} role="status">
              자동 진출
            </div>
          )}
        </div>
      </article>

      {/* VS 구분자 — 부전승이면 상대 카드 자체가 없으므로 VS도 미표시 */}
      {!pair.isBye && (
        <div className={styles.vs()} aria-hidden="true">
          VS
        </div>
      )}

      {/* gameB 카드 — 부전승이 아닐 때만 렌더 */}
      {!pair.isBye && pair.gameB && (
        <article className={styles.card()}>
          <GameThumbnail
            game={pair.gameB}
            styles={styles}
          />
          <div className={styles.gameInfo()}>
            <p className={styles.gameName()}>{pair.gameB.name}</p>
            <button
              type="button"
              className={styles.selectButton()}
              onClick={() => onSelect(pair.gameB!)}
              disabled={disabled}
              aria-label={`${pair.gameB.name} 선택`}
            >
              선택
            </button>
          </div>
        </article>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 내부 헬퍼 — 썸네일 or placeholder
// ─────────────────────────────────────────────────────────────────────────────
// WHY: gameA·gameB 두 카드가 동일한 썸네일 로직을 공유하므로 컴포넌트 내부로 분리.
function GameThumbnail({
  game,
  styles,
}: {
  game: IGame;
  styles: ReturnType<typeof matchCardVariants>;
}) {
  return (
    <div className={styles.thumbnailWrapper()}>
      {game.thumbnailUrl ? (
        // unoptimized: RAWG 외부 URL을 next/image 최적화 파이프라인 없이 사용
        <Image
          src={game.thumbnailUrl}
          alt={game.name}
          fill
          className={styles.thumbnailImg()}
          unoptimized
        />
      ) : (
        // 썸네일 없으면 회색 placeholder로 레이아웃 일관성 유지
        <div className={styles.thumbnailPlaceholder()} aria-hidden="true" />
      )}
    </div>
  );
}
