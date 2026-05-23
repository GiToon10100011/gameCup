# Linear Cycle(Sprint) Cadence 초기화 가이드

> **운영 정책 가이드:** 본 문서는 코드·PR 흐름과 분리된 운영 정책 가이드다. 개발 환경 세팅이나 코드 변경 없이 Linear 웹 UI에서 직접 수행하는 절차를 다룬다.
>
> **트래커 이중 구조 안내:** GameCup 프로젝트의 주 이슈 트래커는 **GitHub Issues**다. Linear는 이터레이션 단위 운영 시각화를 보조하는 **별도 워크스페이스**로 운용된다. PRD·이슈 원본은 GitHub에 유지되며, Linear는 스프린트(Cycle) 진행 상황을 한눈에 파악하기 위한 보조 도구다.
>
> **본 가이드 참조처:** [`docs/06-setup/README.md`](./README.md) 인덱스와 [`docs/04-plan/changelog.md`](../04-plan/changelog.md)에서 참조한다. 향후 마스터 플랜에 트래커 운영 섹션이 추가되면 그 위치도 본 가이드를 가리키도록 갱신한다.

---

## 1. 개요

Linear는 소프트웨어 팀을 위한 프로젝트 관리 도구로, 이슈 트래킹·Cycle(스프린트) 관리·로드맵 시각화를 제공한다. GameCup에서는 GitHub Issues를 원본 트래커로 유지하면서, Linear의 **Cycle 기능**을 활용해 이터레이션 단위 진행 현황을 시각적으로 관리하는 보조 용도로 도입한다.

본 가이드는 Linear의 전체 기능 설정이 아닌, **GameCup 팀의 Cycle cadence(주기·시작 요일·미리 생성 개수) 초기화**에 한정한다. 목표 정책은 다음과 같다.

| 항목 | 설정값 |
| --- | --- |
| Cycle 단위 | 4주 (PRD Iteration 단위와 일치) |
| 시작 요일 | 일요일 (Sunday) |
| 첫 사이클 시작 | 2026-05-24 (일) KST |
| 첫 사이클 종료 | 2026-06-21 (일) KST |
| 미리 생성 사이클 수 | 1개 |
| Cooldown | 0주 |

> **중요 제약 — MCP로 cadence 변경 불가:**
> Linear MCP(`linear-server`)는 `list_cycles`로 사이클 목록 조회만 가능하며, cadence(주기·시작 요일·미리 생성 개수) 변경 API는 노출되지 않는다. 아래 단계별 절차는 반드시 **Linear 웹 UI에서 직접** 수행해야 한다.

---

## 2. 도입 시점

- **도입 시점:** Phase 0 직후 / 2026-05-21 (정책 작성), **첫 사이클 적용은 2026-05-24(일)**
- **도입 이유:** 이터레이션 단위 운영 시각화 보조. GitHub Issues만으로는 스프린트 진행률·번다운 추이를 한눈에 파악하기 어렵기 때문에 Linear Cycle을 보조 도구로 도입한다.
- **기술 선택 근거:** [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) — 해당 섹션 추후 추가 예정.

---

## 3. 사전 요구사항

아래 조건이 모두 충족된 상태에서 진행한다.

1. **Linear 워크스페이스 admin 권한** — Cycle cadence 설정은 팀 Settings 접근이 필요하며, admin 또는 팀 관리자 권한이 있어야 한다.
2. **`GameCup` 팀 존재 확인** — 워크스페이스 내에 `GameCup` 팀(`team id: eee1389e-3647-44fa-b1b1-64d123c102dc`)이 이미 생성되어 있어야 한다.
3. **Claude Code의 Linear MCP 인증 완료** — 검증 단계(§6)에서 `mcp__linear-server__list_cycles`를 호출하기 위해 Claude Code 내 Linear MCP OAuth 인증이 완료되어 있어야 한다.
4. **Linear 플랜 확인** — `Start day(시작 요일)` 변경은 플랜에 따라 제한될 수 있다. Free plan에서 불가할 경우 Standard 이상 업그레이드가 필요하다 (§7 트러블슈팅 참조).

---

## 4. 단계별 설치/설정

### 4.1 Linear 웹 로그인

[https://linear.app](https://linear.app)에 접속해 GameCup 워크스페이스가 연결된 계정으로 로그인한다. 좌측 상단에 워크스페이스 이름이 표시되어야 한다. 다른 워크스페이스가 보일 경우 워크스페이스 전환 후 진행한다.

### 4.2 팀 Settings 진입

1. 화면 좌하단 워크스페이스 아이콘(워크스페이스 이니셜 또는 로고)을 클릭한다.
2. 드롭다운에서 **Settings**를 선택한다.
3. 좌측 사이드바에서 **Workspace → Teams**로 이동한다.
4. 팀 목록에서 **GameCup**을 클릭한다.

### 4.3 Cycles 탭 진입

팀 설정 페이지 상단 탭에서 **Cycles**를 선택한다. Cycles 탭이 보이지 않을 경우 팀 설정 페이지 내 일반(General) 탭 하단에서 Cycles 기능 활성화 토글을 먼저 켜야 한다.

### 4.4 Cycles 활성화 확인

`Enable cycles` 토글이 **켜진(활성화)** 상태인지 확인한다. 비활성화 상태라면 토글을 눌러 활성화한다. 활성화 직후 자동으로 기본 cadence(2주)가 적용된 사이클이 생성될 수 있다.

### 4.5 Cadence 설정 변경

아래 항목을 순서대로 변경한다. 각 항목의 드롭다운 또는 날짜 선택기를 사용한다.

| 설정 항목 | 변경 전 (기본값) | 변경 후 (목표값) |
| --- | --- | --- |
| `Cycle duration` | 2 weeks | **4 weeks** |
| `Cooldown` | 1 week (기본값 상이할 수 있음) | **0 weeks** |
| `Start day` | Sunday (기본값) | **Sunday** (그대로 유지) |
| `First cycle starts` | (자동 설정값) | **2026-05-24** |
| `Upcoming cycles created in advance` | 2 (기본값 상이할 수 있음) | **1** |

### 4.6 저장

모든 항목 변경 후 우측 하단 또는 상단의 **Save** 버튼을 클릭한다.

> **저장 후 동작 안내:**
> 저장 시 기존에 자동 생성된 2주 cadence 사이클(Cycle 1: 2026-05-25 ~ 2026-06-08, Cycle 2: 2026-06-08 ~ 2026-06-22)은 새 cadence에 맞춰 재구성된다. 이미 시작된(진행 중인) 사이클이 있을 경우 해당 사이클은 그대로 유지되며 이후 사이클부터 새 cadence가 적용된다. 현재(2026-05-23 기준) 활성 사이클이 없으므로 전체 재구성이 이루어진다.

### 4.7 결과 확인 (웹 UI)

저장 완료 후 Cycles 탭 또는 팀 보드에서 아래 상태를 눈으로 확인한다.

- 현재 활성 사이클: **Cycle 1 — 2026-05-24(일) ~ 2026-06-22(월), KST 자정 경계**
  - ⚠️ 첫 사이클은 Linear가 주 경계에 cadence를 정렬하면서 **29일**이 된다(5/24~6/22). 이후 사이클(Cycle 2~)은 정확히 28일. 정상 동작이며 운영 영향은 미미하다.
- 미래 사이클: **Cycle 2 — 2026-06-22 ~ 2026-07-20**, **Cycle 3 — 2026-07-20 ~ 2026-08-17** (Linear가 기본적으로 미래 사이클을 2개까지 선생성. "미리 생성 1개" 설정과 무관하게 최소 1~2개가 자동 생성될 수 있음)

---

## 5. 환경 변수

본 가이드에서 추가되는 `.env.local` 환경 변수는 없다. Linear MCP 인증 토큰은 Claude Code 설정 내부에서 OAuth로 관리되며 `.env.local`에 노출되지 않는다.

| 키 이름 | 값 형식 | 노출 범위 | 비고 |
| --- | --- | --- | --- |
| (해당 없음) | — | — | Linear MCP 인증은 Claude Code OAuth 내부 관리 |

---

## 6. 검증

Linear 웹 UI에서 설정 완료 후, Claude Code에서 아래 MCP 호출로 사이클 정보를 프로그래매틱하게 검증한다.

### 6.1 MCP 호출 방법

Claude Code 대화창에서 다음과 같이 요청한다.

```text
mcp__linear-server__list_cycles 호출:
  teamId: "eee1389e-3647-44fa-b1b1-64d123c102dc"
```

또는 Claude Code가 자동으로 MCP 도구를 선택하도록 아래와 같이 요청한다.

```text
Linear GameCup 팀(eee1389e-3647-44fa-b1b1-64d123c102dc)의 현재 사이클 목록을 조회해줘.
```

### 6.2 정상 응답 확인 체크리스트

응답 JSON에서 아래 항목을 순서대로 확인한다.

- [x] 첫 번째 사이클의 `startsAt`이 `2026-05-23T15:00:00.000Z` (= KST 2026-05-24 00:00, UTC+9 오프셋)인지 확인 — **실측 일치 (2026-05-24 적용 확정)**
- [x] 첫 번째 사이클의 `endsAt`이 `2026-06-21T15:00:00.000Z` (= KST 2026-06-22 00:00)인지 확인 — **첫 사이클은 cadence 주 정렬로 29일**(당초 28일 기대값에서 +1일). 의도된 Linear 동작.
- [x] 두 번째 사이클 이후는 정확히 **28일(4주 = 2,419,200초)** — Cycle 2 `2026-06-21T15:00Z`~`2026-07-19T15:00Z` 실측 28일
- [x] `isCurrent: true`인 사이클이 **정확히 1개**(Cycle 1) 존재 — 확인됨
- [x] 미래 사이클은 Linear가 **2개**(Cycle 2·3) 자동 선생성 — "미리 1개" 요청과 무관한 기본 동작. 필요 시 Cycle 3을 Linear UI에서 archive 가능

### 6.3 KST/UTC 변환 참고

Linear는 모든 날짜를 UTC로 저장한다. KST(UTC+9)로 변환 시 UTC 시각에서 9시간을 더한다.

| Linear UTC 값 | KST 해석 |
| --- | --- |
| `2026-05-23T15:00:00.000Z` | 2026-05-24 00:00 KST (Cycle 1 시작) |
| `2026-06-21T15:00:00.000Z` | 2026-06-22 00:00 KST (Cycle 1 종료 = Cycle 2 시작, 첫 사이클 29일) |
| `2026-07-19T15:00:00.000Z` | 2026-07-20 00:00 KST (Cycle 2 종료 = Cycle 3 시작) |
| `2026-08-16T15:00:00.000Z` | 2026-08-17 00:00 KST (Cycle 3 종료) |

---

## 7. 트러블슈팅

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| Save를 눌러도 기존 2주 사이클(Cycle 1: 05-25~06-08 등)이 남아 있음 | 현재 진행 중인 사이클은 cadence 변경 후에도 자동 삭제되지 않음. 미래 사이클부터 재구성됨 | 기존 2주 사이클을 Linear UI에서 수동으로 archive 처리(사이클 우클릭 → Archive 또는 설정에서 삭제)한 뒤 4주 사이클을 새로 생성 |
| Start day 변경 드롭다운이 비활성화되거나 설정이 반영되지 않음 | Linear Free plan 제약. 시작 요일 커스터마이징은 유료 플랜 기능일 수 있음 | [https://linear.app/pricing](https://linear.app/pricing)에서 플랜 확인 후 Standard 이상으로 업그레이드 |
| MCP `list_cycles` 호출 시 빈 배열(`[]`) 반환 | Linear MCP OAuth 인증 만료 또는 팀 권한 부족 | Claude Code 설정에서 Linear MCP 연결을 재인증(OAuth 재시도). 또는 `claude mcp` 명령으로 MCP 서버 재시작 |
| Linear에서 GameCup 팀이 보이지 않음 | 다른 Linear 워크스페이스에 로그인된 상태 | 좌상단 워크스페이스 이름 클릭 → 워크스페이스 전환 → GameCup 워크스페이스 선택 후 재확인 |
| Cycle duration에 4 weeks 옵션이 없음 | Linear UI 버전에 따라 드롭다운 옵션이 다를 수 있음 | `Custom` 옵션 선택 후 28일 직접 입력. 없을 경우 Linear 고객지원 문의 |
| `first cycle starts` 날짜 설정 후 과거 날짜로 돌아옴 | 저장 전 다른 필드를 변경하면 날짜가 초기화되는 UI 버그 | 날짜를 마지막에 설정하고 즉시 Save 클릭 |
| 첫 사이클 길이가 28일이 아니라 29일로 나옴 | Linear가 cadence를 주(week) 경계에 정렬하며 첫 구간만 보정. 2번째 사이클부터는 정확히 28일 | 정상 동작. 별도 조치 불필요. 정확한 28일 첫 사이클이 필요하면 `first cycle starts`를 주 경계(일요일 자정)와 정확히 맞춰 재설정 |
| "미리 생성 1개"로 설정했는데 미래 사이클이 2개 생성됨 | Linear는 현재 + 다가오는 사이클을 최소 1~2개 미리 만든다. 설정값은 상한이 아니라 참고치에 가깝다 | 무해. 불필요한 미래 사이클은 Cycles 탭에서 우클릭 → Archive |

---

## 8. 참고 자료

- [Linear 공식 문서 — Cycles](https://linear.app/docs/cycles)
- [Linear 공식 문서 — GitHub Integration](https://linear.app/docs/github)
- [Linear MCP 서버 (Anthropic)](https://linear.app/docs/mcp)
- [Linear 플랜 및 가격](https://linear.app/pricing)
- [GameCup 마스터 플랜](../04-plan/master-plan.md)
- [GameCup 이터레이션 업데이트 가이드](../05-process/iteration-update-guide.md)
