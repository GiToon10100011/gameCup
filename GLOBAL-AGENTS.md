# 🌐 글로벌 서브에이전트 가이드

> **위치:** 프로젝트 루트 (참고 자료)
> **작성:** 2026.05.20 · **갱신 주기:** 새 글로벌 에이전트 추가 시
> **본 프로젝트 전용 에이전트 가이드:** [`CLAUDE.md`](./CLAUDE.md)

본 문서는 `~/.claude/agents/`에 위치한 **사용자 레벨(글로벌) 에이전트**들의 역할과 호출법을 정리한다. 글로벌 에이전트는 **모든 프로젝트에서 공통으로** 사용 가능하다.

---

## 1. 글로벌 vs 프로젝트별 에이전트

| 구분 | 위치 | 적용 범위 | 우선순위 |
| --- | --- | --- | --- |
| **프로젝트별** | `<repo>/.claude/agents/` | 해당 프로젝트만 | 글로벌보다 **우선** (동명이면 프로젝트별이 이김) |
| **글로벌(사용자 레벨)** | `~/.claude/agents/` | 모든 프로젝트 공용 | 보조 |

> 이름 충돌 시: 프로젝트별 > 글로벌. 본 프로젝트(`gameCup`)는 9종의 프로젝트별 에이전트를 별도로 가짐 — [`CLAUDE.md`](./CLAUDE.md) §2 참조.

---

## 2. 글로벌 에이전트 목록 (총 9종)

분류:
- **🛠 개발/프로젝트 운영** — 본 프로젝트(gameCup)와 직접 연관
- **📚 학습/노트** — 개인 Obsidian Vault 작업용 (gameCup 컨텍스트와 무관, 참고만)

---

## 3. 🛠 개발/프로젝트 운영 (4종)

### 3.1 `project-bootstrap` ⭐ 핵심

> 빈 GitHub 저장소 + PRD를 주면, **프로필**에 맞춰 이슈 일괄 등록·표준 docs/ 트리·에이전트 배치까지 한 번에 부트스트랩한다.

**언제 호출하나:** 신규 프로젝트 시작 시 가장 먼저.

**프로필 시스템 (default = `lite`, 매번 시작 시 확인):**

| 프로필 | 산출 파일 수 | 상황 |
| --- | :-: | --- |
| `mini` | 3~4 | 토이/1주 미만 도구. `docs/` 폴더 없음 |
| `lite` ⭐ | 7~9 | 일반 사이드 프로젝트 |
| `standard` | 15~18 | 본격 개인 프로젝트, 작은 팀 |
| `full` | 30+ | 학교 과제·포트폴리오 (GameCup 패턴) |

**트리거 예시:**
- "프로젝트 초기화해줘"
- "PRD 분해해서 GitHub 이슈 등록"
- "신규 저장소 부트스트랩"
- "이 PRD로 스프린트 만들어줘"
- "프로젝트 시작 세팅"

**입력:**
- GitHub `owner/repo` (현재 디렉터리 git remote에서 자동 추정 가능 시 생략)
- PRD 파일 경로 또는 인라인 텍스트
- (선택) 프로필·스프린트 길이·기술 스택

**산출:** GitHub Issues 일괄 등록 + 표준 `docs/` 트리 + `CLAUDE.md` + `.claude/agents/` 9종 (full 기준).

**호출 예시:**
```text
"프로젝트 초기화해줘.
 저장소: myname/new-app
 PRD: ./docs/prd-draft.md
 lite로 진행"
```

---

### 3.2 `docs-builder` ⭐ 핵심

> PRD/아이디어를 기반으로 **다양한 후속 문서를 단계적으로 확장**한다. 어떤 문서가 필요한지 추천하거나 직접 작성한다.

**언제 호출하나:** 프로젝트 진행 중 추가 문서가 필요할 때.

**3가지 모드:**

| 모드 | 트리거 예시 | 동작 |
| --- | --- | --- |
| **A. 추천** | "이 PRD로 만들 만한 문서 추천해줘" | P0/P1/P2 우선순위 표 + 담당 에이전트 명시 |
| **B. 단건 작성** | "API 명세 만들어줘" | §4.2 표준 골격으로 생성, TBD 항목 보고 |
| **C. 일괄 작성** | "P0 추천 다 만들어줘" | 순차 작성 + 위임할 것은 안내 |

**직접 작성 가능한 17종 문서 카탈로그:**

| 카테고리 | 문서 |
| --- | --- |
| 기획 | 아이디어 정의서, 페르소나, 시장 조사, 유저 스토리 맵 |
| 설계 | 모듈 설계서, 시스템 아키텍처, **DB 스키마/ERD**, **API 명세서**, 화면 설계서, 비즈니스 룰 |
| 메타 | **용어집(Glossary)**, **ADR (Architecture Decision Records)** |
| 품질 | **테스트 계획서**, 테스트 항목 정의서 |
| 운영 | 런북/장애 대응, 보안 정책 |
| 사용자 | 사용자 매뉴얼, API 사용 가이드, FAQ |
| 마이그레이션 | 버전 이전 가이드 |

**위임 안내:** PRD 이터레이션 → `docs-prd`, UC → `docs-usecase`, UML → `docs-uml`, 환경 설정 → `docs-setup`, 기술 근거 → `docs-tech-rationale`, changelog → `docs-changelog`.

**호출 예시:**
```text
"이 PRD로 만들 만한 문서 추천해줘"
"용어집 만들어줘"
"ADR-0001로 RAWG vs IGDB 선택 근거 남겨"
"DB 스키마 설계서 추가"
```

---

### 3.3 `project-planning-initializer`

> PRD를 GitHub Projects 또는 Jira 티켓 구조(Epic/Story/Task)로 분해.

**언제 호출하나:** `project-bootstrap`을 쓰지 않고 **이슈 분해만** 단독으로 하고 싶을 때. 또는 Jira를 쓰는 경우.

**`project-bootstrap`과의 차이:**

| 항목 | project-planning-initializer | project-bootstrap |
| --- | --- | --- |
| 도구 범위 | GitHub Projects + Jira (보편) | GitHub MCP 직접 호출 (이슈까지 자동 등록) |
| 산출물 | 분해 결과 (구조만) | 분해 + 이슈 등록 + 표준 docs/ 트리 + 에이전트 배치 |
| 프로필 시스템 | 없음 | mini/lite/standard/full |
| 추천 사용 | Jira 사용자, 또는 수동 등록 원할 때 | GitHub + Claude Code 통합 워크플로우 |

**트리거 예시:** "PRD를 Jira 티켓으로 쪼개줘", "Epic/Story/Task로 나눠줘", "Sprint 계획까지 잡아줘"

---

### 3.4 `git-commit`

> 현재 변경사항을 분석해 Conventional Commit 형식으로 커밋한다.

**언제 호출하나:** 변경된 파일을 빠르게 커밋하고 싶을 때.

**본 프로젝트(`gameCup`)에서는 프로젝트별 `github` 에이전트가 더 적합** — 본 프로젝트의 이슈 자동 멘션(`(#N)`), `Refs:` 본문, PR 생성까지 포함하므로. 다른 프로젝트에서 글로벌 커밋만 빠르게 쓸 때 유용.

**트리거 예시:** "깃 커밋", "커밋해줘", "변경사항 커밋", "git commit"

---

## 4. 📚 학습/노트 (5종, 참고만)

본 프로젝트와 무관. 개인 Obsidian Vault용.

| 에이전트 | 역할 | 트리거 |
| --- | --- | --- |
| `content-integrator` | Obsidian Vault에 흩어진 동일 주제 노트를 한 파일로 통합 | "통합해줘", "한 파일로 모아줘", "흩어진 내용 정리" |
| `pdf-note-organizer` | 강의 PDF를 Obsidian 마크다운 노트로 정리 | "PDF 정리", "강의 정리", "이어서 정리" |
| `quiz-creator` | Obsidian 강의 노트로부터 퀴즈 출제 (4지선다, 5.18 단답·서술형) | "퀴즈 내줘", "퀴즈 만들어줘", "주간 복습 퀴즈" |
| `quiz-grader` | 사용자 답안을 채점하고 오답노트 생성 | "채점해줘", "점수 알려줘", "오답노트 만들어줘" |
| `study-planner` | 시험 대비 단원별 세부 계획 작성·갱신 | "세부계획 작성", "공부 계획", "계획 업데이트" |

---

## 5. 호출 방법 (매칭 우선순위)

Claude Code는 사용자 발화에서 트리거 키워드를 매칭해 자동으로 에이전트를 선택한다.

**우선순위:**
1. 사용자가 명시적으로 지목한 에이전트 (`@<agent-name>`)
2. 프로젝트별 에이전트(`.claude/agents/`)의 description 매칭
3. 글로벌 에이전트(`~/.claude/agents/`)의 description 매칭
4. 어디에도 매칭되지 않으면 기본 응답

**명시 호출 예:**
```text
"@docs-builder 용어집 만들어줘"
"@project-bootstrap 새 프로젝트 시작"
```

**일반 호출 예 (트리거 키워드):**
```text
"용어집 만들어줘"           → docs-builder (글로벌)
"커밋해줘"                  → github (프로젝트별) 우선, 없으면 git-commit (글로벌)
"F-05 구현해줘"             → code (프로젝트별)
"Sprint 1 브랜치 분기"      → issue-branch (프로젝트별)
```

---

## 6. 에이전트 간 협업 흐름 (전형적)

### 새 프로젝트 시작 → MVP 완성

```
[사용자가 GitHub 저장소 + PRD 준비]
            │
            ▼
1) project-bootstrap (글로벌) — 프로필 선택, 이슈 등록, docs 부트스트랩
            │
            ▼
2) issue-branch (프로젝트별) — Sprint 1 브랜치 일괄 분기
            │
            ▼
3) code (프로젝트별) — 이슈별 구현
            │
            ▼
4) github (프로젝트별) — 커밋·PR (브랜치명에서 #N 자동 멘션)
            │
            ▼
5) 진행 중 추가 문서 필요 시 → docs-builder (글로벌) — API 명세, ADR 등
            │
            ▼
6) PRD 변경 시 → docs-prd (프로젝트별) — 새 이터레이션 분기
            │
            ▼
7) UML/UC 갱신 → docs-uml / docs-usecase (프로젝트별)
            │
            ▼
8) 변경 이력 → docs-changelog (프로젝트별)
```

---

## 7. 신규 글로벌 에이전트 추가 가이드

새 글로벌 에이전트를 만들 때:

1. **위치:** `~/.claude/agents/<name>.md`
2. **frontmatter 필수 필드:**
   ```yaml
   ---
   name: <kebab-case-name>
   description: <트리거 키워드 포함된 1~2문장 설명>
   tools: <명시적 도구 목록, 또는 미명시로 상속>
   model: sonnet  # 또는 haiku/opus
   ---
   ```
3. **본문:** 역할 / 입력 / 절차 / 산출물 / 안전 가드레일
4. **본 문서(`GLOBAL-AGENTS.md`) 갱신:**
   - §3 또는 §4에 새 에이전트 섹션 추가
   - §6 협업 흐름이 영향받으면 갱신
5. **테스트:** 새 프로젝트에서 한 번 호출해 정상 매칭되는지 확인

---

## 8. 갱신 이력

| 일자 | 변경 | 비고 |
| --- | --- | --- |
| 2026.05.19 | `project-bootstrap` 신규 추가 | GameCup 부트스트랩 경험 기반 |
| 2026.05.19 | `docs-builder` 신규 추가 | PRD/아이디어 기반 후속 문서 확장 |
| 2026.05.19 | `project-bootstrap` 프로필 시스템 도입 (mini/lite/standard/full) | default = `lite`, 매번 확인 |
| 2026.05.20 | 본 가이드 문서 신규 작성 | 글로벌 에이전트 9종 정리 |

---

## 9. 관련 문서

- [`CLAUDE.md`](./CLAUDE.md) — 본 프로젝트(gameCup) 전용 에이전트 9종 + 위임 결정 트리
- [`docs/04-plan/master-plan.md`](./docs/04-plan/master-plan.md) — gameCup 마스터 플랜
- [`docs/04-plan/sprint-1-mapping.md`](./docs/04-plan/sprint-1-mapping.md) — Sprint 1 이슈-브랜치 매핑
- [`docs/04-plan/next-actions.md`](./docs/04-plan/next-actions.md) — 즉시 처리 체크리스트
- [`~/.claude/agents/`](file:///Users/tylerjon/.claude/agents/) — 글로벌 에이전트 정의 본문 (시스템 경로)
