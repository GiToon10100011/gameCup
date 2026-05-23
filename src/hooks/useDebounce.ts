// 입력값 변화를 일정 시간 지연시켜 반환하는 디바운싱 훅.
// 검색창에서 빠른 타이핑마다 외부 API를 호출하지 않도록 NF-01·NF-05 충족용으로 사용한다.

import { useEffect, useState } from "react";

/**
 * value가 마지막으로 변경된 시점에서 delayMs(ms)가 지나야 갱신되는 값.
 * 중간에 value가 또 바뀌면 타이머가 리셋되어 마지막 값만 살아남는다.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  // 1) 디바운싱된 값 상태. 초기에는 입력값과 동일
  const [debounced, setDebounced] = useState(value);

  // 2) value 변경 시마다 새 타이머 시작.
  //    이전 타이머는 cleanup으로 취소되어 중간 값은 무시됨.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
