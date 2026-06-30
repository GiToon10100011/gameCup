# Vercel 배포 가이드 — GameCup

> **도입 시점:** Iteration 4 / Story #50  
> **상태:** 활성  
> **대상:** 프로덕션(main) + 프리뷰(dev·PR) 배포

---

## 1. 개요

GameCup은 **Vercel**에 Next.js 14 App Router 기반으로 배포된다. Vercel은 Next.js를 네이티브로 지원해 `vercel.json` 최소 설정으로 전체 기능(SSR·미들웨어·Image Optimization)이 동작한다.

### 배포 브랜치 전략

| 브랜치 | 배포 유형 | URL |
|---|---|---|
| `main` | 프로덕션 | `gamecup.vercel.app` (또는 커스텀 도메인) |
| `dev` | 프리뷰 | `gamecup-git-dev-<owner>.vercel.app` |
| PR 브랜치 | 프리뷰 | `gamecup-git-<branch>-<owner>.vercel.app` |

---

## 2. 사전 요구사항

- GitHub 저장소 push 권한
- Vercel 계정 ([vercel.com](https://vercel.com) 무료 Hobby 플랜으로 충분)
- `.env.local` 설정 완료 (RAWG API 키 + Supabase 자격증명)
  - 참조: [`rawg-api-key.md`](./rawg-api-key.md), [`supabase-setup.md`](./supabase-setup.md)

---

## 3. 환경 변수 목록

Vercel 대시보드에서 **Settings → Environment Variables**에 아래 변수를 등록한다.  
**Production / Preview / Development** 세 환경 모두 체크해 동일하게 적용한다.

| 변수명 | 예시 값 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_RAWG_KEY` | `abc123...` | RAWG API 키 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon(public) 키 |

> ℹ️ `NEXT_PUBLIC_RAWG_BASE_URL`은 `next.config.mjs`에 기본값(`https://api.rawg.io/api`)이 내장돼 있어 등록 불필요. RAWG 프록시 서버 교체 시에만 오버라이드한다.

> ⚠️ **주의:** `service_role` 키는 절대 등록하지 않는다 — 클라이언트에 노출되면 RLS를 우회할 수 있다.

---

## 4. 단계별 설치·설정

### 4.1 Vercel 프로젝트 생성 및 GitHub 연동

1. [vercel.com/new](https://vercel.com/new) 접속 → **Import Git Repository**
2. GitHub 계정으로 로그인 후 `GiToon10100011/gameCup` 저장소 선택
3. **Framework Preset**: `Next.js` (자동 감지됨)
4. **Root Directory**: `.` (기본값 유지)
5. **Build & Output Settings**: 모두 기본값 유지 (`npm run build`, `.next`)
6. **Environment Variables** 탭에서 §3의 변수 4개 모두 등록
7. **Deploy** 클릭

> Vercel이 자동으로 `main` 브랜치를 프로덕션으로, 나머지 브랜치를 프리뷰로 설정한다.

### 4.2 Supabase Redirect URL 추가 (OTP 이메일 흐름)

배포 후 Supabase 대시보드 → **Authentication → URL Configuration**에서 **Site URL**을 Vercel 도메인으로 설정한다.

```
https://gamecup.vercel.app
```

프리뷰 URL 패턴도 허용할 경우 **Redirect URLs**에 추가:

```
https://gamecup-*.vercel.app/**
```

### 4.3 자동 배포 확인

Vercel 연동 후 `main` 또는 `dev`에 push하면 자동으로 배포가 트리거된다.

Vercel 대시보드 → **Deployments** 탭에서:
- `● Ready` 상태 확인
- **Visit** 버튼으로 배포된 URL 접속

---

## 5. 환경 변수

| 변수명 | 필수 | 기본값 | 비고 |
|---|---|---|---|
| `NEXT_PUBLIC_RAWG_KEY` | ✅ | - | 없으면 게임 검색 불가 |
| `NEXT_PUBLIC_RAWG_BASE_URL` | ❌ | `next.config.mjs`에 내장 | Vercel 등록 불필요; 프록시 교체 시만 오버라이드 |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | - | 없으면 로그인·저장 불가 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | - | 없으면 Supabase 호출 실패 |

---

## 6. 검증

배포 후 아래 순서로 최종 확인한다.

```
1. 홈(/) 접속 → 게임 검색(RAWG API) 동작 확인
2. 로그인 → 이메일 OTP 6자리 코드 수신·입력 확인 (Supabase Auth)
3. 토너먼트 생성 → 게임 8개 등록 → 진행 → 결과 화면 확인
4. 결과 공유 → 공유 URL 접속 → 비로그인으로 결과 열람 확인
5. "새 토너먼트 시작" → 홈 이동 + 상태 초기화 확인
```

---

## 7. 트러블슈팅

### 빌드 실패 — 환경 변수 미등록

**증상:** `NEXT_PUBLIC_SUPABASE_URL is not defined` 또는 빌드 오류

**해결:** Vercel 대시보드 → Settings → Environment Variables에서 §3 변수 확인·등록 후 **Redeploy**

### `middleware.ts` Edge Runtime 오류

**증상:** `The Edge Function` 관련 런타임 오류

**해결:** `src/middleware.ts`는 Edge Runtime에서 실행된다. `document`·`window`·Node.js 전용 API 사용 금지.  
현재 미들웨어는 `@supabase/ssr`의 `createServerClient`만 사용하므로 정상 동작한다.

### Supabase OTP 메일 미수신

**증상:** 로그인 시 이메일이 오지 않음

**해결:**
1. Supabase 대시보드 → Authentication → Email Templates → "Magic Link" 템플릿의 `{{ .Token }}` 설정 확인 (상세: `supabase-setup.md §4.3`)
2. 스팸 폴더 확인
3. Supabase 무료 플랜의 이메일 발송 제한(3건/시간)이 초과됐는지 확인

---

## 8. 참고 자료

- [Vercel Next.js 배포 공식 문서](https://vercel.com/docs/frameworks/nextjs)
- [Supabase Vercel 통합 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [`.env.local.example`](../../.env.local.example) — 로컬 환경 변수 템플릿
- [`supabase-setup.md`](./supabase-setup.md) — Supabase 초기 설정
