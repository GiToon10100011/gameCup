# 🗺 Iteration 4 — 이슈 ↔ 브랜치 매핑

> **작성:** 2026.05.26
> **출처:** PRD Iteration 4 (v4.0) · UML v2.0 · GitHub Issues #102~#129, 기존 #2·#3
> **분기 기준:** `dev` · **머지 대상:** PR 위계 따름 (아래 §PR 위계 매핑)
> **범위:** Iteration 4 신규 — 인증·멀티토너먼트·온보딩·결과 이력·공유. Epic #2(토너먼트 진행)는 기존 유지·재배치.

---

## 🔗 PR 위계 매핑 (부모-자식)

`github` 에이전트가 PR 생성 시 head 이슈 번호에서 부모 브랜치를 자동 결정한다.

| 자식 이슈 (head) | 부모 이슈 (base) | PR base 브랜치 |
| ---: | ---: | --- |
| **Task** #104·#105·#106 | Story #103 | `feat/103-supabase-foundation` |
| **Task** #108·#109·#110 | Story #107 | `feat/107-magic-link-login` |
| **Task** #112 | Story #111 | `feat/111-auth-guard` |
| **Story** #103·#107·#111 | Epic #102 | `feat/102-epic-auth-supabase` |
| **Task** #115·#116 | Story #114 | `feat/114-tournament-create-save` |
| **Task** #118·#119·#120 | Story #117 | `feat/117-tournament-hub` |
| **Task** #122 | Story #121 | `feat/121-onboarding` |
| **Story** #114·#117·#121 | Epic #113 | `feat/113-epic-tournament-management` |
| **Task** #124·#125 | Story #123 | `feat/123-result-history` |
| **Task** #127·#128·#129 | Story #126 | `feat/126-result-share` |
| **Story** #123·#126 | Epic #3 (기존, 확장) | `feat/3-epic-result-restart` |
| **Epic** #102·#113·#3 | (통합) | `dev` |

**PR 흐름:** Task PR → Story 브랜치 → Epic 브랜치 → dev. `dev → main`은 release/chore 시에만(CLAUDE.md §9).

> **브랜치 생성 정책 (Sprint 1과 차이):** Iteration 4는 브랜치를 **일괄 사전 분기하지 않고 Task 착수 시 온디맨드 생성**한다(브랜치 클러터 방지 + Epic A는 Supabase 프로젝트 준비 선행 의존). 아래 표의 브랜치명은 **의도 명세**이며, 착수 시 `dev`(또는 상위 Story/Epic 브랜치)에서 분기한다.

---

## EPIC A. 사용자 인증 & Supabase 기반 (#102)

| # | 이슈 제목 | 유형 | 의도 브랜치 | F-XX |
| ---: | --- | --- | --- | --- |
| 102 | 사용자 인증 & Supabase 기반 | Epic | `feat/102-epic-auth-supabase` | F-14·F-15 |
| 103 | Supabase 연동 기반 구축 (SupabaseClient·스키마·RLS) | Story | `feat/103-supabase-foundation` | NF-06 |
| 104 | supabaseClient.ts 초기화 (@supabase/supabase-js + @supabase/ssr) | Task | `feat/104-supabase-client` | — |
| 105 | DB 스키마·RLS 마이그레이션 적용 | Task | `feat/105-db-schema-rls` | NF-06 |
| 106 | AuthSlice 추가 (인증 세션 상태) | Task | `feat/106-auth-slice` | F-14 |
| 107 | 매직 링크 로그인 | Story | `feat/107-magic-link-login` | F-14 |
| 108 | authModule 구현 | Task | `feat/108-auth-module` | F-14 |
| 109 | AuthPage 컴포넌트 | Task | `feat/109-auth-page` | F-14 |
| 110 | /auth/callback route handler (exchangeCodeForSession) | Task | `feat/110-auth-callback` | F-14 |
| 111 | 인증 가드 | Story | `feat/111-auth-guard` | F-15 |
| 112 | 보호 라우트 가드 + 로그인 유도 | Task | `feat/112-route-guard` | F-15 |

> ⚠️ **선행 사용자 작업:** Epic A 코드 착수 전 `docs/06-setup/supabase-setup.md`를 따라 Supabase 프로젝트 생성(매직링크 Auth·스키마·RLS) 및 `.env.local`에 URL·anon key 설정 필요.

---

## EPIC B. 토너먼트 관리 — 허브·생성·온보딩 (#113)

| # | 이슈 제목 | 유형 | 의도 브랜치 | F-XX |
| ---: | --- | --- | --- | --- |
| 113 | 토너먼트 관리 — 허브·생성·온보딩 | Epic | `feat/113-epic-tournament-management` | F-16·F-17·F-18 |
| 114 | 토너먼트(설문) 생성·저장 | Story | `feat/114-tournament-create-save` | F-16 |
| 115 | tournamentStorageModule.createTournament 구현 | Task | `feat/115-create-tournament-action` | F-16 |
| 116 | CreatePage — 검색·후보 재사용 + 이름 입력·저장 | Task | `feat/116-create-page` | F-16 |
| 117 | 내 토너먼트 목록·관리 — 허브 | Story | `feat/117-tournament-hub` | F-17 |
| 118 | list/get/deleteTournament 구현 | Task | `feat/118-tournament-crud` | F-17 |
| 119 | TournamentLibrarySlice 추가 | Task | `feat/119-library-slice` | F-17 |
| 120 | HubPage — 메인 재설계 | Task | `feat/120-hub-page` | F-17 |
| 121 | 온보딩 시퀀스 | Story | `feat/121-onboarding` | F-18 |
| 122 | 빈 상태 온보딩 UI | Task | `feat/122-onboarding-empty-state` | F-18 |

> 기존 검색·후보 컴포넌트(Epic #1: SearchInput·SearchDropdown·CandidateList·DuplicateToast)를 CreatePage에서 재사용한다.

---

## EPIC #3 확장. 결과 화면 및 재시작 — 이력·공유 추가 (#3)

기존 Epic #3(결과 화면 #41·재시작 #42)에 Iteration 4 신규 Story 2개를 추가한다.

| # | 이슈 제목 | 유형 | 의도 브랜치 | F-XX |
| ---: | --- | --- | --- | --- |
| 123 | 결과 이력 저장·조회 | Story | `feat/123-result-history` | F-19 |
| 124 | saveResult·listResults 구현 | Task | `feat/124-save-list-results` | F-19 |
| 125 | 플레이 완료 시 자동 저장 배선 + 이력 조회 UI | Task | `feat/125-autosave-history-ui` | F-19 |
| 126 | 결과 공유 링크 | Story | `feat/126-result-share` | F-20 |
| 127 | createPublicShare·getPublicResult 구현 | Task | `feat/127-public-share-module` | F-20 |
| 128 | 공유 버튼·링크 복사 UI | Task | `feat/128-share-ui` | F-20 |
| 129 | PublicResultPage — 비로그인 공개 결과 열람 | Task | `feat/129-public-result-page` | F-20 |

> F-19 결과 이력은 **플레이 완료 시 자동 저장**(ISS-05 확정). 공유(F-20)는 사용자 선택 액션.

---

## EPIC #2. 토너먼트 진행 (기존, 재배치)

Sprint 2에서 분기한 19개 브랜치([`./sprint-2-mapping.md`](./sprint-2-mapping.md))를 그대로 유지한다. Iteration 4 재기획에 따른 조정:

- **순수 엔진 Task(병행 가능, 무의존):** #28 셔플 유틸 · #29 첫 라운드 페어 · #35 라운드 종료 감지 · #36 라운드 명칭 · #38 부전승 감지 · #39 부전승 진출. `utils/shuffle.ts`·`buildPairs.ts` 스캐폴딩 존재 → `tournamentModule` 연결·검증 중심.
- **재해석 필요한 flow Task:** #27 시작 버튼·#30 화면 전환·#37 우승자 감지·결과 전환 — 단일 플로우 전제였으나, 허브(Epic B)·인증(Epic A) 구조에 맞춰 진입점·전환 대상을 착수 시 이슈 본문에서 재해석한다.

---

## 권장 진행 순서

```text
[선행] 사용자: Supabase 프로젝트 생성 (supabase-setup.md)
  │
  ├─ (병행 가능, 무의존) Epic #2 순수 엔진: #28 → #29 → #35/#36 → #38/#39
  │
  └─ Epic A(#102) 인증·기반: #104 클라이언트 → #105 스키마 → #106 AuthSlice → #108~#110 로그인 → #112 가드
        ↓
     Epic B(#113) 허브: #115/#116 생성 → #118~#120 허브 → #122 온보딩
        ↓
     Epic #2 플레이 UI(#31~#34 등) + Epic #3 확장: #123 이력 → #126 공유
```

---

## 완료 추적

| 상태 | 표기 | 의미 |
| --- | --- | --- |
| 🟡 Open | issue OPEN | 작업 미시작 또는 진행 중 |
| 🟢 Merged | issue CLOSED via PR | PR 머지로 부모 브랜치에 반영 |
| 🔴 Blocked | 댓글로 표시 | 외부 의존(예: Supabase 프로젝트) 또는 사용자 의사결정 필요 |
