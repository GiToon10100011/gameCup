// 비동기 함수의 실행 시간을 측정하는 범용 유틸.
// Issue #13 — 검색 응답 시간 로컬 측정 (NF-01: 1초 이내 응답).
//
// 사용처:
//   - searchModule.search()에서 RAWG API 응답 시간을 측정해 NF-01 충족 여부를 로컬에서 추적
//   - 향후 후보 등록·토너먼트 진행 등 다른 비동기 흐름의 응답성 측정에도 재사용 가능
//
// 설계 의도:
//   - 성공/실패 모두 측정 (실패해도 onMeasure 콜백을 한 번은 호출)
//   - performance.now()를 사용 — Date.now()보다 정밀(소수점 ms)하고 단조 증가하므로 음수 측정 위험 없음
//   - 호출자가 측정 결과를 어떻게 다룰지는 callback에 위임 (콘솔 로그·store 저장·임계치 경고 등)

// 측정 콜백 시그니처. durationMs는 항상 0 이상.
// success는 fn이 정상 완료(true) 또는 throw(false)했는지 알린다 — 호출자가 분기 처리할 수 있도록.
export type MeasureCallback = (durationMs: number, success: boolean) => void;

/**
 * 비동기 함수 fn을 실행하면서 시작-종료 시간을 측정하고 onMeasure 콜백에 전달한다.
 *
 * - fn의 결과(또는 throw)는 그대로 반환·재throw. 호출자에게 투명하다.
 * - 측정값(ms)은 소수점 자릿수 그대로 보존 (호출자가 반올림 결정).
 * - performance.now()를 우선 사용하고 jsdom 등 일부 환경에서 미지원이면 Date.now() fallback.
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
  onMeasure: MeasureCallback,
): Promise<T> {
  // 1) 시작 시점 — performance.now가 있으면 그것을, 없으면 Date.now로 fallback
  const now = (): number =>
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();

  const start = now();

  // 측정값 헬퍼 — 음수 방지(NF-01 계약: durationMs >= 0).
  // performance.now()는 단조 증가라 음수가 안 나오지만 Date.now() fallback에서는
  // 시스템 시계 보정으로 시간이 뒤로 이동할 수 있으므로 0 하한 보정. (CodeRabbit 리뷰)
  const elapsed = (): number => Math.max(0, now() - start);

  /**
   * onMeasure 콜백을 안전하게 호출 — PR #74 리뷰 반영.
   * 측정 콜백이 throw해도 fn의 원래 성공/실패 의미가 오염되지 않도록 try/catch로 격리.
   * 콜백 자체의 예외는 호출자 흐름에 무관하므로 console.warn으로만 알리고 삼킨다.
   */
  const safeMeasure = (durationMs: number, success: boolean): void => {
    try {
      onMeasure(durationMs, success);
    } catch (callbackError) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(
          `[measureAsync] onMeasure callback threw — measurement reported but error swallowed`,
          callbackError,
        );
      }
    }
  };

  try {
    /* 2) 본 작업 실행 — fn은 async이므로 await로 종료 대기 */
    const result = await fn();
    /* 3) 정상 완료 — durationMs + success=true로 통보 */
    safeMeasure(elapsed(), true);
    return result;
  } catch (error) {
    /* 4) 실패 — 시간은 여전히 의미가 있다(타임아웃 진단 등). 콜백 실패와 무관하게 원본 에러 재throw */
    safeMeasure(elapsed(), false);
    throw error;
  }
}
