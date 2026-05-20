// Fisher-Yates 셔플 유틸.
// 토너먼트 첫 라운드 + 라운드 진행 시 후보를 무작위로 섞기 위해 사용한다.
// 일반 `Array.sort(() => Math.random() - 0.5)` 방식은 편향이 있어 사용하지 않는다.

/**
 * 입력 배열을 변형하지 않고(immutable) 새로 섞은 배열을 반환한다.
 * - 시간 복잡도 O(n)
 * - 모든 순열이 동일 확률
 */
export function shuffle<T>(items: readonly T[]): T[] {
  // 1) 원본을 보존하기 위해 복사본 생성
  const result = items.slice();

  // 2) 뒤에서부터 한 번씩 순회하며 0..i 범위의 임의 인덱스와 swap
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
