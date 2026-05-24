"use client";

// 후보 중복 등록 알림 토스트 (F-04, Story #7 / Task #19).
// candidateModule.addToPool가 `{ ok: false, reason: "duplicate" }`를 반환했을 때 부모가 띄운다.
// 일시적(transient) 알림이라 store 상태가 아니라 props(open)로 제어하고 durationMs 후 자동 닫힘.
//
// 디자인 기준: docs/03-design/DESIGN.md(getdesign `clickhouse`)의 warning 토큰(#f59e0b, amber).
// 접근성: 오류(alert)보다 덜 긴급하므로 role="status" + aria-live="polite"로 통지.

import { useEffect } from "react";
import { duplicateToastVariants } from "@/components/candidate/DuplicateToast.variants";

// DuplicateToast의 외부 인터페이스. 컨벤션: 모든 `interface`는 `I` 접두사.
interface IDuplicateToastProps {
  // 표시 여부 — 부모가 중복 등록을 감지하면 true로 올린다.
  open: boolean;
  // 표시 문구. 기본은 중복 안내 문구.
  message?: string;
  // 자동/수동 닫힘 시 호출 — 부모가 open을 false로 내린다.
  onClose: () => void;
  // 자동 닫힘까지의 시간(ms). 기본 3초.
  durationMs?: number;
}

/**
 * 중복 등록 토스트.
 * - open=false면 렌더하지 않음
 * - open=true가 되면 durationMs 후 onClose 자동 호출(자동 닫힘)
 */
export function DuplicateToast({
  open,
  message = "이미 후보에 등록된 게임입니다.",
  onClose,
  durationMs = 3000,
}: IDuplicateToastProps) {
  // open이 true인 동안 durationMs 타이머를 걸어 자동 닫힘. open/duration 변경 시 재설정, 언마운트 시 정리.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [open, durationMs, onClose]);

  // 닫힌 상태면 DOM에 흔적을 남기지 않는다
  if (!open) return null;

  // variants에서 slot 클래스 추출 (스타일 단일 소스)
  const { container, icon, text } = duplicateToastVariants();

  // 비-긴급 통지 — role="status" + polite. aria-atomic으로 메시지 전체를 한 번에 읽게 함.
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={container()}>
      <span aria-hidden="true" className={icon()}>
        ⚠
      </span>
      <p className={text()}>{message}</p>
    </div>
  );
}
