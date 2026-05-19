# 🛠 로컬 개발 환경 설정 가이드

> **도입 시점:** Iteration 3 / 2026.05.19 (Phase 0 스캐폴딩 시점)
> **대상:** 새 팀원, 신규 머신 셋업

---

## 1. 개요

GameCup은 Next.js 14 (App Router) 기반의 클라이언트 중심 웹 애플리케이션이다. 로컬에서 개발·테스트·빌드를 수행하기 위한 기본 환경을 구성한다.

---

## 2. 도입 시점

- **Phase 0 (스캐폴딩)** 단계에서 모든 개발자가 동일한 도구 체인을 가져야 함
- 관련 기술 근거: [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) §Next.js, §TypeScript, §Tailwind, §Zustand, §TanStack Query

---

## 3. 사전 요구사항

| 도구 | 권장 버전 | 설치 방법 |
| --- | --- | --- |
| **Node.js** | 20.x LTS 이상 | [nodejs.org](https://nodejs.org/) 또는 `nvm install 20` |
| **npm** | Node.js 20과 동봉 (10.x+) | Node와 함께 설치 |
| **Git** | 2.40+ | macOS: `brew install git` |
| **(선택) Playwright 브라우저** | 최신 | `npx playwright install` (Phase 4부터) |

확인:

```bash
node -v   # v20.x.x
npm -v    # 10.x.x
git --version
```

---

## 4. 단계별 설치/설정

### 4.1 저장소 클론

```bash
git clone <repository-url> gameCup
cd gameCup
```

> 현재(2026.05.19) 본 프로젝트는 아직 원격 저장소가 없다. `github` 서브에이전트가 초기 푸시를 담당한다.

### 4.2 의존성 설치

```bash
npm install
```

설치되는 핵심 의존성과 그 이유는 [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) 참조.

### 4.3 환경 변수 설정

`.env.local.example`을 복사해 `.env.local`을 만든다.

```bash
cp .env.local.example .env.local
```

`.env.local` 내용:

| 키 | 용도 | 발급 가이드 |
| --- | --- | --- |
| `NEXT_PUBLIC_RAWG_KEY` | RAWG API 호출 (F-01, F-02) | [`./rawg-api-key.md`](./rawg-api-key.md) |
| `NEXT_PUBLIC_SUPABASE_URL` | (Iteration 4 예정) | `supabase-setup.md` 작성 시 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Iteration 4 예정) | `supabase-setup.md` 작성 시 |

> Iteration 3 시점에는 RAWG 키만 필수. Supabase는 placeholder로 두고 호출 코드가 추가되는 시점에 채운다.

### 4.4 개발 서버 기동

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

---

## 5. 환경 변수 상세

`NEXT_PUBLIC_*` prefix는 **브라우저에 노출됨**. RAWG 키는 클라이언트 호출에 사용되므로 의도된 노출이지만, 향후 사용량 제한이 이슈가 되면 Next.js API Route로 프록시 처리해 서버 사이드 호출로 전환한다(Iteration 4 검토 항목).

---

## 6. 검증

| 항목 | 명령 | 기대 결과 |
| --- | --- | --- |
| 타입 검사 | `npm run typecheck` | 에러 0건 |
| 린트 | `npm run lint` | 에러·경고 0건 |
| 단위 테스트 | `npm test` | shuffle/buildPairs 통과, 나머지 `it.todo` |
| 빌드 | `npm run build` | 정적 빌드 성공 |
| 메인 라우트 | `curl -sf http://localhost:3000/` | 200 |
| 토너먼트 라우트 | `curl -sf http://localhost:3000/tournament` | 200 |
| 결과 라우트 | `curl -sf http://localhost:3000/result` | 200 |

---

## 7. 트러블슈팅

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| `npm install` 중 `EBADENGINE` | Node 버전 불일치 | `nvm use 20` 후 재설치 |
| dev 서버 기동 후 RAWG 응답 없음 | `.env.local` 미설정 또는 키 만료 | [`./rawg-api-key.md`](./rawg-api-key.md) 재확인 |
| `Module not found: @/...` | tsconfig `paths` 미인식 (IDE 캐시) | TS Server 재시작 또는 `rm -rf .next` 후 재기동 |
| Tailwind 클래스가 적용되지 않음 | `tailwind.config.ts` `content` 경로 누락 | `src/**/*.{ts,tsx}` 포함 확인 |
| `Failed to compile`: jsdom 관련 | Vitest jsdom 미설치 | `npm i -D jsdom` 재설치 |

---

## 8. 참고 자료

- [Next.js App Router 공식 문서](https://nextjs.org/docs/app)
- [Tailwind CSS v3 설정](https://tailwindcss.com/docs/installation)
- [Zustand 공식 가이드](https://zustand-demo.pmnd.rs/)
- [TanStack Query v5 마이그레이션](https://tanstack.com/query/v5/docs/framework/react/overview)
- [Vitest 설정](https://vitest.dev/guide/)
