# 🔑 RAWG API 키 발급 가이드

> **도입 시점:** Iteration 1 / 2026.03.31 (F-01 게임 검색 핵심 의존성)
> **대상:** GameCup 검색 기능을 동작시키기 위해 RAWG API 키가 필요한 모든 개발자

---

## 1. 개요

RAWG는 50만+ 게임 메타데이터·고화질 썸네일을 무료 등급으로 제공하는 외부 API다. GameCup의 핵심 기능 F-01(게임 검색)·F-02(검색 결과 표시)·NF-01(응답성)·NF-05(외부 호출 최소화)가 본 API에 의존한다.

---

## 2. 도입 시점

- **Iteration 1 PRD v1.0 §1.3** F-01에서 명시
- **기술 근거:** [`../07-tech-rationale/README.md#rawg-api`](../07-tech-rationale/README.md) 참조

---

## 3. 사전 요구사항

- 이메일 계정 (가입용)
- 사용 목적 간단 설명 텍스트 (가입 폼 필수)

비용: **무료 등급으로 충분**. 월 20,000 requests, 분당 30 requests. Iteration 3 MVP 트래픽 추산으로 여유 있음.

---

## 4. 단계별 설치/설정

### 4.1 RAWG 계정 가입

1. [https://rawg.io/login/sign-up](https://rawg.io/login/sign-up) 접속
2. 이메일 / 비밀번호로 가입 (소셜 로그인도 가능)
3. 이메일 인증 완료

### 4.2 API 키 발급

1. [https://rawg.io/apidocs](https://rawg.io/apidocs) 접속 (로그인 상태)
2. 상단 "Get API Key" 클릭
3. 사용 목적 폼 작성 — 예: "Personal tournament-style game preference app (educational project)"
4. 발급된 키 복사 (예: `c1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6`)

### 4.3 `.env.local` 반영

프로젝트 루트의 `.env.local`에 추가:

```
NEXT_PUBLIC_RAWG_KEY=발급받은_키_여기에
```

> `.env.local`은 `.gitignore`에 등록되어 커밋되지 않는다. **절대 키를 코드에 하드코딩하지 말 것.**

---

## 5. 환경 변수 상세

| 키 이름 | 값 형식 | 필수/선택 | 노출 범위 | 비고 |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_RAWG_KEY` | 32자 hex | **필수** | 클라이언트(브라우저) | `NEXT_PUBLIC_` prefix로 브라우저 번들에 포함됨 |
| `NEXT_PUBLIC_RAWG_BASE_URL` | URL | 선택 | 클라이언트(브라우저) | RAWG API 베이스 URL **override**. 미설정 시 기본값 `https://api.rawg.io/api` 사용(`src/lib/externalApiClient.ts`). 환경별 프록시 도입·호스트 교체·목 서버 연결 시에만 지정 |

**향후 보안 강화 검토(Iteration 4+):** 키 노출 우려가 커지면 `app/api/games/route.ts` 같은 Next.js API Route 프록시를 거치도록 변경하여 서버 사이드에서만 키를 사용한다.

---

## 6. 검증

```bash
# RAWG 호출 직접 테스트
curl "https://api.rawg.io/api/games?key=$NEXT_PUBLIC_RAWG_KEY&search=zelda&page_size=3"
```

기대: `count`, `results[]` 필드가 있는 JSON 반환.

앱 검증:

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) → 검색창에 `zelda` 입력 → 300ms 후 게임 목록 표시.

---

## 7. 트러블슈팅

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| `401 Unauthorized` | 키 누락/오타 | `.env.local` 재확인, dev 서버 재기동 |
| `429 Too Many Requests` | 분당 30회 초과 | 디바운싱 300ms 동작 확인, TanStack Query 캐시 적중률 점검 |
| 응답은 정상이나 썸네일 깨짐 | Next.js `next.config.mjs`의 `images.remotePatterns`에 `media.rawg.io` 누락 | 도메인 추가 |
| 빈 검색 결과 | 검색어가 RAWG에 없음 | 다른 키워드로 재시도 (정상 케이스) |
| `.env.local` 변경 후 반영 안 됨 | Next dev 서버 메모리 캐시 | dev 서버 재기동 (Ctrl+C → `npm run dev`) |

---

## 8. 참고 자료

- [RAWG API 공식 문서](https://rawg.io/apidocs)
- [RAWG Terms of Service](https://rawg.io/apidocs) (무료 등급 사용 시 백링크·크레딧 요구사항 확인)
- [Next.js 환경 변수 가이드](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
