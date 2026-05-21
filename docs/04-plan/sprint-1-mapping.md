# 🗺 Sprint 1 — 이슈 ↔ 브랜치 매핑

> **작성:** 2026.05.19 · **갱신:** 2026.05.20 PR 위계 흐름 추가
> **출처:** [`./issues.md`](./issues.md) §3 Sprint 1 + GitHub Issues #1, #5~#22
> **분기 기준:** `dev` (55fb47d) · **머지 대상:** PR 위계 따름 (아래 §PR 위계 매핑)

---

## 🔗 PR 위계 매핑 (부모-자식)

`github` 에이전트가 PR 생성 시 head 이슈 번호에서 부모 브랜치를 자동 결정한다.

| 자식 이슈 (head) | 부모 이슈 (base) | PR base 브랜치 |
| ---: | ---: | --- |
| **Task** #9, #10, #11, #12, #13 | Story #5 | `feat/5-game-search-dropdown` |
| **Task** #14, #15, #16 | Story #6 | `feat/6-api-error-handling` |
| **Task** #17, #18, #19, #20 | Story #7 | `feat/7-candidate-register-duplicate` |
| **Task** #21, #22 | Story #8 | `feat/8-candidate-delete` |
| **Story** #5, #6, #7, #8 | Epic #1 | `feat/1-epic-search-and-candidate` |
| **Epic** #1 | (통합) | `dev` |

**PR 흐름:** Task PR → Story 브랜치 → Epic 브랜치 → dev. Epic/Story 브랜치는 코드 작성보다 자식 PR이 모이는 **통합 베이스** 역할.

---

## EPIC-01. 게임 검색 및 후보 관리 (#1)

| # | 이슈 제목 | 라벨 | 브랜치 |
| ---: | --- | --- | --- |
| 1 | 게임 검색 및 후보 관리 (Epic) | 🔮 Feature | [`feat/1-epic-search-and-candidate`](https://github.com/GiToon10100011/gameCup/tree/feat/1-epic-search-and-candidate) |

> Epic 브랜치는 통합용 컨테이너. 실제 머지는 각 자식 Story/Task PR이 dev로 직접 들어간다.

---

## Story — 게임 검색

| # | 이슈 제목 | 라벨 | 브랜치 |
| ---: | --- | --- | --- |
| 5 | 게임 검색 입력 및 드롭다운 결과 표시 | 🔮 Feature | [`feat/5-game-search-dropdown`](https://github.com/GiToon10100011/gameCup/tree/feat/5-game-search-dropdown) |
| 6 | API 오류 발생 시 사용자 안내 | 🔮 Feature | [`feat/6-api-error-handling`](https://github.com/GiToon10100011/gameCup/tree/feat/6-api-error-handling) |
| 7 | 후보 목록 등록 및 중복 방지 | 🔮 Feature | [`feat/7-candidate-register-duplicate`](https://github.com/GiToon10100011/gameCup/tree/feat/7-candidate-register-duplicate) |
| 8 | 후보 목록에서 게임 삭제 | 🔮 Feature | [`feat/8-candidate-delete`](https://github.com/GiToon10100011/gameCup/tree/feat/8-candidate-delete) |

---

## Task — 검색 컴포넌트·API·캐시

| # | 이슈 제목 | 라벨 | 브랜치 |
| ---: | --- | --- | --- |
| 9 | SearchInput 컴포넌트 구현 (입력, debounce, 빈 값 처리) | 🔮 Feature | [`feat/9-search-input-component`](https://github.com/GiToon10100011/gameCup/tree/feat/9-search-input-component) |
| 10 | SearchDropdown 컴포넌트 구현 (썸네일 + 이름 목록) | 🔮 Feature | [`feat/10-search-dropdown-component`](https://github.com/GiToon10100011/gameCup/tree/feat/10-search-dropdown-component) |
| 11 | 게임 검색 API 호출 함수 `searchGames()` 구현 | 🔮 Feature | [`feat/11-search-games-api`](https://github.com/GiToon10100011/gameCup/tree/feat/11-search-games-api) |
| 12 | 세션 내 검색 결과 캐싱 로직 구현 (Map 기반) | 🔮 Feature | [`feat/12-search-cache`](https://github.com/GiToon10100011/gameCup/tree/feat/12-search-cache) |
| 13 | 검색 응답 시간 로컬 측정 및 1초 이내 충족 확인 | 🔮 Feature | [`feat/13-response-time-check`](https://github.com/GiToon10100011/gameCup/tree/feat/13-response-time-check) |

---

## Task — 에러 처리

| # | 이슈 제목 | 라벨 | 브랜치 |
| ---: | --- | --- | --- |
| 14 | API 호출 에러 핸들러 구현 (try/catch + 상태 반영) | 🔮 Feature | [`feat/14-api-error-handler`](https://github.com/GiToon10100011/gameCup/tree/feat/14-api-error-handler) |
| 15 | ErrorMessage 컴포넌트 구현 (인라인 오류 메시지 표시) | 🔮 Feature | [`feat/15-error-message-component`](https://github.com/GiToon10100011/gameCup/tree/feat/15-error-message-component) |
| 16 | 오류 상태에서 서비스 정상 동작 유지 테스트 | 💡 Enhancement · 🧪 Testing | [`test/16-error-state-stability`](https://github.com/GiToon10100011/gameCup/tree/test/16-error-state-stability) |

---

## Task — 후보 등록·삭제

| # | 이슈 제목 | 라벨 | 브랜치 |
| ---: | --- | --- | --- |
| 17 | 후보 목록 상태 관리 구현 (Zustand store 또는 Context) | 🔮 Feature | [`feat/17-candidate-store`](https://github.com/GiToon10100011/gameCup/tree/feat/17-candidate-store) |
| 18 | 후보 등록 액션 구현 (중복 검사 포함) | 🔮 Feature | [`feat/18-candidate-register-action`](https://github.com/GiToon10100011/gameCup/tree/feat/18-candidate-register-action) |
| 19 | 중복 시 토스트/인라인 알림 컴포넌트 구현 | 🔮 Feature · 💄 Style | [`feat/19-duplicate-toast`](https://github.com/GiToon10100011/gameCup/tree/feat/19-duplicate-toast) |
| 20 | CandidateList 컴포넌트 구현 (썸네일 + 이름 + 삭제 버튼) | 🔮 Feature | [`feat/20-candidate-list-component`](https://github.com/GiToon10100011/gameCup/tree/feat/20-candidate-list-component) |
| 21 | 후보 삭제 액션 구현 | 🔮 Feature | [`feat/21-candidate-delete-action`](https://github.com/GiToon10100011/gameCup/tree/feat/21-candidate-delete-action) |
| 22 | 삭제 버튼 UI 및 동작 연결 | 🔮 Feature | [`feat/22-delete-button-ui`](https://github.com/GiToon10100011/gameCup/tree/feat/22-delete-button-ui) |

---

## 의존성 ([`./issues.md`](./issues.md) §5)

```text
EPIC-00 (이미 완료 — Phase 0 스캐폴딩)
  ↓
#5 (검색 UI + API)
  ↓
#6, #7 (병렬)
  ↓
#8 (#7 완료 후)
```

Task(#9~#22)는 각 Story 내부에서 병렬 가능. 단, 다음 의존성 주의:

- `#11 searchGames` → `#5`의 일부, 다른 컴포넌트보다 먼저
- `#12 캐싱` → `#11` 이후
- `#17 store` → `#18`, `#19`, `#20`, `#21`보다 먼저
- `#14 에러 핸들러` → `#15 ErrorMessage`보다 먼저
- `#13 응답 시간 측정`, `#16 오류 상태 테스트`는 다른 Task가 끝난 뒤 검증성 작업

---

## 작업 흐름 (권장)

### Task 작업 (한 번에 하나씩, 사용자 검사 후 다음)

1. **체크아웃:** `git checkout feat/<N>-...`
2. **dev 머지로 최신 인프라 반영:** `git merge origin/dev`
3. **구현:** `code` 에이전트에 위임 → 모듈/컴포넌트/테스트 작성
4. **커밋:** `github` 에이전트. `(#N)` 자동 부착
5. **푸시:** `git push -u origin feat/<N>-...`
6. **PR:** `gh pr create --base feat/<상위 Story>-<slug> --title "[#N] ..." --body "... Closes #N"`
   - **base는 dev/main이 아닌 상위 Story 브랜치**
7. **사용자 검사 보고** → 머지 (사용자 승인 시) → 다음 Task

### Story 통합 (자식 Task PR이 모두 머지된 후)

1. **체크아웃:** `git checkout feat/<M>-<story-slug>`
2. **추가 작업 (있을 시):** 페이지 조립·E2E·UX 보완 (없으면 곧장 PR)
3. **PR:** `gh pr create --base feat/<상위 Epic>-<slug> --title "[#M] ..." --body "... Closes #M"`
4. **사용자 검사 보고** → 머지

### Epic 통합 (자식 Story PR이 모두 머지된 후)

1. **체크아웃:** `git checkout feat/<K>-<epic-slug>`
2. **추가 작업 (있을 시):** 통합 라벨·릴리즈 노트·통합 테스트
3. **PR:** `gh pr create --base dev --title "[#K] ..." --body "... Closes #K"`
4. **사용자 검사 보고** → 머지

---

## 완료 추적

| 상태 | 표기 | 의미 |
| --- | --- | --- |
| 🟡 Open | issue OPEN | 작업 미시작 또는 진행 중 |
| 🟢 Merged | issue CLOSED via PR | PR 머지로 부모 브랜치(Story/Epic/dev)에 반영 |
| 🔴 Blocked | 댓글로 표시 | 외부 의존 또는 사용자 의사결정 필요 |

> 본 표는 `issue-branch` 에이전트가 주기적으로 갱신하거나, Sprint 종료 시 일괄 갱신한다.
