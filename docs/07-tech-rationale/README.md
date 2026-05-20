# 🧭 기술 스택·라이브러리 선택 근거 (Rationale)

> 본 문서는 GameCup이 채택한 **모든 기술·라이브러리·도구**의 **도입 이유와 도입 시점**을 누적 기록한다.
> 새 라이브러리·서비스가 추가될 때마다 본 파일에 섹션을 추가한다 (롤링 문서).
> 작성 위임: `docs-tech-rationale` 서브에이전트.

---

## 작성 원칙

1. **WHY를 기록한다.** "이걸 썼다"가 아니라 "왜 이걸 골랐는지 + 어떤 대안을 비교했는지"가 핵심.
2. **도입 시점 명시.** 어떤 이터레이션/Phase에서 추가됐는지 추적 가능해야 한다.
3. **대안과의 트레이드오프** 기재. 미래에 교체 결정을 내릴 때 근거가 된다.
4. **의존성 격리.** 다른 도구로 교체할 때 영향 범위가 어디까지인지 한 줄로 적어둔다.

각 섹션 구조:

```
### {{기술명}}
- **도입 시점:** {{Iteration / Phase / YYYY.MM.DD}}
- **분류:** Framework / Language / Styling / State / Test / 외부 서비스 / ...
- **선택 이유:** {{핵심 근거 1~3개}}
- **고려한 대안:** {{대안 + 탈락 이유}}
- **트레이드오프:** {{알면서도 감수하는 단점}}
- **교체 비용:** {{교체 시 영향 범위}}
- **관련 요구사항:** {{F-XX / NF-XX / UC-XX}}
- **관련 가이드:** {{docs/06-setup/ 링크}}
```

---

## 1. Frontend Framework

### Next.js 14 (App Router)
- **도입 시점:** Iteration 1 (2026.03.31)
- **분류:** Framework
- **선택 이유:**
  - 파일 기반 라우팅으로 `app/page.tsx`(검색·후보), `app/tournament/page.tsx`, `app/result/page.tsx` 3개 화면을 추가 라우터 설정 없이 구성 가능
  - 향후 RAWG API 키 보안 강화 시 API Route(`app/api/*`)로 프록시 전환 용이
  - Vercel과 1급 호환 (Phase 5 배포 시점)
  - 서버 컴포넌트 + 클라이언트 컴포넌트 모델이 3계층 아키텍처와 자연스럽게 매칭
- **고려한 대안:**
  - Vite + React Router: 더 가벼우나 API Route 부재로 향후 키 프록시 작업 시 별도 서버 필요
  - Remix: 좋지만 학습 곡선 + Vercel 통합 우위 부족
- **트레이드오프:** App Router는 안정화 단계지만 캐싱·서버 컴포넌트 학습 필요
- **교체 비용:** 라우팅 + 빌드 도구 + 배포까지 영향 (높음)
- **관련 요구사항:** 모든 F/NF
- **관련 가이드:** [`../06-setup/initial-setup.md`](../06-setup/initial-setup.md)

---

## 2. Language

### TypeScript (strict)
- **도입 시점:** Iteration 1 (2026.03.31)
- **분류:** Language
- **선택 이유:**
  - RAWG API 응답 필드(`id`, `name`, `background_image`, `released`)의 nullable·optional 케이스를 컴파일 타임에 잡아냄
  - UML v1.1 클래스 다이어그램의 모든 필드를 `types/game.ts`에 1:1 매핑 — 설계서와 코드 일관성 보증
- **고려한 대안:** Plain JS + JSDoc — 협업 시 IDE 지원과 리팩토링 안전성 한계
- **트레이드오프:** 빌드 단계 추가, 초기 타입 설계 비용
- **교체 비용:** 매우 높음 (사실상 비현실적)
- **관련 요구사항:** NF-04
- **관련 가이드:** [`../06-setup/initial-setup.md`](../06-setup/initial-setup.md)

---

## 3. Styling

### Tailwind CSS
- **도입 시점:** Iteration 1 (2026.03.31)
- **분류:** Styling
- **선택 이유:**
  - 토너먼트 1:1 카드 레이아웃을 반응형으로 빠르게 구성 (`grid grid-cols-2 gap-4`)
  - 디자인 시스템 토큰을 `tailwind.config.ts`에 집중시켜 추후 다크 모드·테마 분기 용이
  - JIT 모드로 사용한 클래스만 번들에 포함 → 성능 우위
- **고려한 대안:**
  - CSS Modules: 클래스 명명 규칙 부담
  - styled-components: 런타임 비용 + RSC 호환성 이슈
- **트레이드오프:** 클래스 이름이 길어 가독성 저하 (clsx로 완화)
- **교체 비용:** 중간 (className 일괄 치환 필요)
- **관련 요구사항:** NF-03 (브라우저 호환성)

---

## 4. State Management

### Zustand
- **도입 시점:** Iteration 1 (2026.03.31)
- **분류:** State (Memory)
- **선택 이유:**
  - UML v1.1 `StateStore` 클래스의 9개 필드 + 12개 메서드를 단일 store로 1:1 매핑 가능
  - Provider 래핑 불필요 → 3계층 중 Data layer 격리에 자연스러움
  - Selector 기반 구독으로 토너먼트 진행 중 불필요한 리렌더 최소화 (NF-02 안정성)
- **고려한 대안:**
  - Redux Toolkit: 보일러플레이트 과도 (Pool/Bracket 수준 상태에 비해 과한 추상화)
  - Jotai/Recoil: atom 분산 모델이 UML 단일 StateStore 설계와 불일치
- **트레이드오프:** 큰 앱에서 store 분할 규칙을 직접 결정해야 함 (현 규모에서는 단일 store로 충분)
- **교체 비용:** 중간 (store 인터페이스 격리되어 있어 어댑터 패턴 가능)
- **관련 요구사항:** UML §StateStore, NF-02, NF-04

---

## 5. Server Cache

### TanStack Query v5
- **도입 시점:** Iteration 1 (2026.03.31)
- **분류:** Server Cache
- **선택 이유:**
  - NF-05 "동일 검색어 API 응답 세션 내 재활용"을 `staleTime`/`queryKey`로 선언적으로 달성
  - 디바운싱 + 캐시 적중 조합으로 NF-01 응답성 1초 이내 충족 용이
  - Suspense 통합으로 로딩 UI 최소 코드
- **고려한 대안:**
  - SWR: 충분히 좋지만 v5의 mutation·invalidation 모델이 향후 Supabase 도입 시 유리
  - 직접 fetch + useEffect: 캐싱 직접 구현 비용 큼
- **트레이드오프:** 번들 크기 (~13KB gzip) 추가
- **교체 비용:** 중간 (모듈 `searchModule` 내부에서만 사용 시 격리됨)
- **관련 요구사항:** NF-01, NF-05, F-01

---

## 6. External API

### RAWG API
- **도입 시점:** Iteration 1 (2026.03.31)
- **분류:** 외부 데이터 게이트웨이
- **선택 이유:**
  - 50만+ 게임 메타데이터 + 고화질 썸네일 무료 제공
  - 검색 쿼리 API가 직관적 (`/games?search=...`)
- **고려한 대안:**
  - IGDB: 데이터 풍부하지만 OAuth 토큰 갱신 부담
  - Steam Web API: 검색 UX 미비
- **트레이드오프:** 무료 등급 분당 30회 제한 → 디바운싱·캐시로 완화
- **교체 비용:** 낮음 (게이트웨이 `lib/externalApiClient.ts`만 교체)
- **관련 요구사항:** F-01, F-02, F-11, F-12, NF-01, NF-05
- **관련 가이드:** [`../06-setup/rawg-api-key.md`](../06-setup/rawg-api-key.md)

---

## 7. Unit Test

### Vitest
- **도입 시점:** Iteration 1 (2026.03.31)
- **분류:** Test (Unit)
- **선택 이유:**
  - ESM + TS 네이티브 지원, Vite와 동일 변환 파이프라인 → 별도 설정 최소화
  - Jest와 호환 API → 학습 비용 0에 가까움
  - `--coverage` 기본 통합
- **고려한 대안:** Jest (TS 변환 설정 부담)
- **트레이드오프:** 일부 Jest-only 플러그인은 호환 안 됨
- **교체 비용:** 낮음 (`describe`/`it` 표준 API)
- **관련 요구사항:** 테스트 항목 정의서 UT/IT/ET 전체

---

## 8. E2E Test

### Playwright
- **도입 시점:** Phase 4 예정 (Iteration 3 후반)
- **분류:** Test (E2E)
- **선택 이유:**
  - Chromium·Firefox·WebKit 멀티 엔진 → NF-03 브라우저 호환성 자동 검증
  - 트레이스·스크린샷·비디오 기본 제공으로 회귀 디버깅 강력
- **고려한 대안:** Cypress (멀티 엔진 한계)
- **트레이드오프:** 브라우저 바이너리 다운로드 비용 (~300MB)
- **교체 비용:** 낮음 (시나리오 셀렉터 위주)
- **관련 요구사항:** IT-01~05

---

## 9. Backend / Database (예정)

### Supabase
- **도입 시점:** Iteration 4 예정
- **분류:** 외부 서비스 (DB · Auth · Storage)
- **선택 이유:**
  - 결과 저장/공유/랭킹 기능 도입 시 DB + 인증 + 이미지 스토리지를 단일 제공자로 해결
  - Postgres 기반으로 향후 직접 호스팅 이주 시 데이터 이동 비용 낮음
- **고려한 대안:** Firebase (NoSQL 잠금-in 우려), 자체 Postgres + Next.js API (운영 비용)
- **트레이드오프:** 무료 등급 일/월 제한 + Vendor 의존
- **교체 비용:** 중간 (Postgres 표준 SQL로 격리 시 낮춰짐)
- **관련 요구사항:** (Iteration 4 신규 F-XX 후보군)
- **관련 가이드:** `supabase-setup.md` (작성 예정)

---

## 10. Deployment

### Vercel
- **도입 시점:** Phase 5 예정
- **분류:** 배포 / Hosting
- **선택 이유:**
  - Next.js 1급 호환, 프리뷰 URL 자동 생성
  - 환경 변수·도메인·CI 통합 GUI
- **고려한 대안:** Cloudflare Pages (Next.js 일부 기능 제약), 직접 EC2 (운영 부담)
- **트레이드오프:** Vendor 의존, 무료 등급 대역폭 제한
- **교체 비용:** 낮음 (Next.js 표준 빌드 산출물 이동 가능)
- **관련 가이드:** `vercel-deploy.md` (작성 예정)

---

## 11. Error Tracking

### Sentry
- **도입 시점:** Iteration 4 예정
- **분류:** 운영 / 모니터링
- **선택 이유:**
  - 토너먼트 진행 중 발생하는 런타임 예외와 RAWG API 실패를 실시간 집계
  - Source Map 업로드로 프로덕션 빌드에서도 스택 추적 가능
- **고려한 대안:** Datadog (오버스펙), Console + 사용자 신고 (비효율)
- **트레이드오프:** 무료 등급 이벤트 한도
- **교체 비용:** 낮음 (init 한 파일만 교체)
- **관련 가이드:** `sentry-setup.md` (작성 예정)

---

## 12. Git Hooks · CI

### Husky
- **도입 시점:** Iteration 3 / 2026.05.19 (Phase 0 마무리)
- **분류:** 개발 도구 (Git hook 매니저)
- **선택 이유:**
  - `package.json` 의존성으로 hook을 관리해 팀원 머신 간 hook 누락을 방지
  - `prepare` 스크립트 자동 실행으로 `npm install`만으로 hook 설치 완료
  - v9에서 매우 가벼움 (~3KB), 별도 셸 스크립트 보일러플레이트 제거
- **고려한 대안:**
  - 수동 `.git/hooks/*` 셸 스크립트: 팀원마다 별도 설치 필요, 버전 관리 안 됨 → 탈락
  - simple-git-hooks: 충분히 좋지만 설정 syntax가 husky만큼 표준화되어 있지 않음 → 탈락
  - lefthook: 강력하지만 Node 외 바이너리 의존, 본 프로젝트엔 과함 → 탈락
- **트레이드오프:** 또 하나의 devDependency, `.git` 없는 환경에서 prepare 스크립트 경고 발생 (CI에서 `HUSKY=0`으로 회피)
- **교체 비용:** 낮음 (hook 셸 파일만 다른 도구로 이주)
- **관련 요구사항:** NF-04 (확장성 — 품질 게이트 표준화)
- **관련 가이드:** [`../06-setup/git-hooks.md`](../06-setup/git-hooks.md)

### lint-staged
- **도입 시점:** Iteration 3 / 2026.05.19
- **분류:** 개발 도구 (staged 파일 단위 검사 러너)
- **선택 이유:**
  - pre-commit 단계에서 **변경된 파일만** ESLint를 돌려 커밋 속도 저하 최소화
  - glob 기반 매칭으로 향후 `*.md` Prettier 등 확장 용이
  - Husky와 사실상 표준 조합
- **고려한 대안:**
  - 전체 `npm run lint`를 pre-commit에 직접 실행: 큰 프로젝트에서 수십 초 ~ 분 단위로 느려져 개발 흐름 끊김 → 탈락
  - pre-commit framework (Python 기반): Python 의존 추가 → 탈락
- **트레이드오프:** glob 패턴 누락 시 신규 확장자 자동 검사 안 됨 (수동 추가 필요)
- **교체 비용:** 매우 낮음
- **관련 요구사항:** NF-04
- **관련 가이드:** [`../06-setup/git-hooks.md`](../06-setup/git-hooks.md)

### GitHub Actions
- **도입 시점:** Iteration 3 / 2026.05.19
- **분류:** CI/CD
- **선택 이유:**
  - GitHub 저장소에 별도 비용 없이 통합 (퍼블릭/소규모 프라이빗 무료 한도 충분)
  - YAML 워크플로우가 코드와 함께 버전 관리 → 변경 이력·리뷰 가능
  - `actions/setup-node` + npm 캐시로 빠른 의존성 복원
- **고려한 대안:**
  - CircleCI / GitLab CI: 별도 계정·연동 필요, GitHub 표준 통합 우위 부족 → 탈락
  - Vercel 빌드만으로 대체: lint·typecheck·test 모두 수행하지 않음 → 탈락 (배포만 담당)
- **트레이드오프:** GitHub 외부로 저장소 이전 시 워크플로우 재작성 필요
- **교체 비용:** 중간 (CI 명령 자체는 `npm` 스크립트로 추상화되어 있어 재작성 최소화)
- **관련 요구사항:** NF-04
- **관련 가이드:** [`../06-setup/github-actions.md`](../06-setup/github-actions.md)

---

### tailwind-variants
- **도입 시점:** Iteration 3 / 2026.05.20 (Sprint 1, Task #10 PR 리뷰 피드백)
- **분류:** Styling (Variant-based utility)
- **선택 이유:**
  - Tailwind 클래스 조합을 **slots / variants / compoundVariants**로 선언적으로 관리 → 동일한 외곽 컨테이너 스타일을 4가지 상태(닫힘·로딩·빈 결과·결과 있음)에서 중복 작성하지 않고 재사용
  - props → 클래스 매핑이 명확해져 컴포넌트 테스트 시 시각 회귀 영역과 동작 영역 분리 용이
  - TypeScript 자동 추론 — variant 이름 오타가 컴파일 타임에 잡힘 (NF-04)
  - PR #64 리뷰에서 명시적으로 권장됨 (themes 정의 + 동적 스타일 모듈화)
- **고려한 대안:**
  - 인라인 `clsx` + 상수 변수: 빠르지만 variant 조합이 늘어나면 if/ternary 폭증 → 리뷰 피드백의 "themes 정의" 의도와 멀어짐 → 탈락
  - CVA(class-variance-authority): 사실상 동급이지만 `tailwind-merge` 통합과 slots API에서 tailwind-variants가 우위 → 탈락
  - styled-components: 런타임 비용 + Server Component 호환성 → 탈락
- **트레이드오프:** 추가 의존성(~3KB gzip) + variant 정의 자체에 학습 곡선
- **교체 비용:** 낮음 (각 컴포넌트 파일 내 `tv()` 호출만 일반 string으로 환원 가능)
- **부속 의존성:** `tailwind-merge` (peer) — 동일 카테고리 Tailwind 클래스 충돌 시 후자가 우선되도록 머지. tailwind-variants가 내부적으로 호출하므로 함께 설치.
- **관련 요구사항:** F-02 (검색 결과 표시 — 4상태 분기), NF-04 (확장성 — 디자인 시스템 토큰화 기반)
- **관련 가이드:** (별도 setup 가이드 없음 — 의존성 추가만으로 즉시 사용 가능)

---

## 13. 유틸리티

### clsx
- **도입 시점:** Iteration 1 (2026.03.31)
- **분류:** Utility
- **선택 이유:** Tailwind 클래스 조건부 결합을 짧은 API로 처리
- **고려한 대안:** `classnames` (구문 동일하나 번들 크기 약간 큼)
- **트레이드오프:** 없음 수준
- **교체 비용:** 매우 낮음

---

---

## 부록 A. 라이브러리 추가 시 절차

1. `docs-tech-rationale` 에이전트에게 본 파일 갱신 위임
2. 위 섹션 구조에 따라 새 섹션 append
3. [`../06-setup/`](../06-setup/)에 설정 가이드가 필요한지 판단 → 필요 시 `docs-setup` 에이전트에 위임
4. [`../04-plan/changelog.md`](../04-plan/changelog.md) `[Unreleased]` 섹션에 의존성 추가 항목 기록
