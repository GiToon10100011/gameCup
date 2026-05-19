// Vitest 전역 셋업 — 모든 테스트 파일에서 @testing-library/jest-dom 매처(toBeInTheDocument 등)를 사용 가능하게 한다.
// vitest.config.ts의 setupFiles에 의해 자동 로드됨.
import "@testing-library/jest-dom/vitest";
