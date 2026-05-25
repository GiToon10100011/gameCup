"use client";

// 후보 목록 컴포넌트 (F-05 표시·삭제 진입, Story #7 / Task #20).
// useCandidates 브릿지 훅으로 후보 목록을 구독해 [썸네일 | 이름 | 삭제버튼]으로 렌더한다.
// View는 store(Data)를 직접 구독하지 않는다(3계층 준수, PR #88 교훈). 삭제 "동작" 연결은 #22.
//
// 디자인 기준: docs/03-design/DESIGN.md(getdesign `clickhouse`). 접근성: 삭제 버튼 터치 타겟 ≥44px.

import Image from "next/image";
import { useCandidates } from "@/hooks/useCandidates";
import { candidateListVariants } from "@/components/candidate/CandidateList.variants";

// CandidateList의 외부 인터페이스. 컨벤션: 모든 `interface`는 `I` 접두사.
interface ICandidateListProps {
  // 삭제 버튼 클릭 시 호출 — 부모가 candidateModule.removeFromPool에 연결한다(#22).
  onDelete: (gameId: string) => void;
}

/**
 * 후보 목록.
 * - 후보가 없으면 빈 안내 문구만 표시
 * - 후보가 있으면 각 행에 썸네일·이름·삭제 버튼 렌더
 */
export function CandidateList({ onDelete }: ICandidateListProps) {
  // 1) Business 브릿지 훅으로 후보 목록 구독 — 컴포넌트는 store를 직접 모름
  const candidates = useCandidates();

  // 2) variants에서 slot 클래스 추출
  const { list, empty, item, thumb, name, deleteBtn } = candidateListVariants();

  // 3) 빈 목록 — 등록 전 안내. role 없이 단순 안내 문구로 둔다.
  if (candidates.length === 0) {
    return <p className={empty()}>등록된 후보가 없습니다.</p>;
  }

  // 4) 목록 렌더 — 시맨틱 <ul role="list">. 각 항목은 썸네일/placeholder + 이름 + 삭제 버튼.
  return (
    <ul role="list" className={list()}>
      {candidates.map((game) => {
        // 썸네일 유무로 image/placeholder variant 분기 (빈 URL이면 회색 박스로 레이아웃 유지)
        const hasThumb = game.thumbnailUrl.length > 0;
        const { thumb: thumbCls } = candidateListVariants({
          thumbKind: hasThumb ? "image" : "placeholder",
        });

        return (
          <li key={game.id} className={item()}>
            {/* 썸네일: URL이 있으면 이미지, 없으면 동일 크기의 placeholder div */}
            {hasThumb ? (
              <Image
                src={game.thumbnailUrl}
                alt=""
                width={48}
                height={48}
                className={thumbCls()}
              />
            ) : (
              // placeholder는 시각적 보조라 aria-hidden. 테스트가 분기를 직접 검증하도록 testid 부여.
              <div
                className={thumbCls()}
                aria-hidden="true"
                data-testid="candidate-thumb-placeholder"
              />
            )}

            {/* 게임명 */}
            <span className={name()}>{game.name}</span>

            {/* 삭제 버튼 — 접근성 라벨에 게임명 포함. 동작은 onDelete prop으로 위임(#22 연결) */}
            <button
              type="button"
              aria-label={`후보에서 삭제: ${game.name}`}
              className={deleteBtn()}
              onClick={() => onDelete(game.id)}
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
