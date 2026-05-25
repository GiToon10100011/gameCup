"use client";

// React 표준 훅: 입력 상태 + 디바운싱 부수효과를 다루기 위해 사용
import { useEffect, useState } from "react";
// 입력값 변화를 지연시켜 부모로 통보하기 위한 디바운싱 훅
import { useDebounce } from "@/hooks/useDebounce";

// SearchInput 컴포넌트의 외부 인터페이스 (props 타입).
// 컨벤션: 모든 `interface`는 `I` 접두사 필수.
interface ISearchInputProps {
  // 디바운싱이 끝난 검색어를 부모로 통보하는 콜백.
  // 공백/빈 값일 때는 trim된 빈 문자열을 전달함 (F-12).
  onDebouncedChange: (query: string) => void;
  // 비어있을 때 보여줄 안내 문구 (선택)
  placeholder?: string;
  // 디바운싱 지연 시간(ms). default 300ms (NF-01 응답성 기준)
  delayMs?: number;
}

/**
 * 검색 입력창 컴포넌트.
 * - controlled input으로 키 입력을 즉시 화면에 반영
 * - useDebounce로 마지막 입력 후 일정 시간이 지나야 부모에 통보
 * - 공백/빈 값은 trim되어 빈 문자열로 통보 (검색 API 호출을 막아 F-12 충족)
 */
export function SearchInput({
  onDebouncedChange,
  placeholder = "게임 이름을 입력하세요",
  delayMs = 300,
}: ISearchInputProps) {
  // 입력 원본 값. 사용자가 타이핑할 때마다 즉시 갱신되어 화면에 그대로 반영된다.
  const [value, setValue] = useState("");

  // 디바운싱된 값. value가 마지막으로 바뀐 시점에서 delayMs(ms)가 경과해야 갱신된다.
  // 연속 타이핑 시 중간 값은 버려지고 가장 나중 값만 살아남는다.
  const debounced = useDebounce(value, delayMs);

  // debounced 값이 새로 들어올 때마다 부모 콜백 호출.
  // - trim()으로 양 끝 공백 제거 → "   "처럼 공백만 입력하면 빈 문자열이 전달됨 (F-12)
  // - 부모(useSearchQuery)는 enabled 가드로 빈 문자열이면 API 호출을 막는다
  useEffect(() => {
    onDebouncedChange(debounced.trim());
  }, [debounced, onDebouncedChange]);

  return (
    // 검색용 input 요소.
    // - type="search"와 role="searchbox": 보조 기술이 검색창으로 인식
    // - aria-label: 시각적 label 없이도 스크린리더가 의도를 읽도록
    // - Tailwind: 다크 모드 + 포커스 상태(ring)까지 일관된 스타일
    <input
      type="search"
      role="searchbox"
      aria-label="게임 검색"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base shadow-sm transition placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
    />
  );
}
