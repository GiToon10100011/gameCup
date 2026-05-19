# 📐 이터레이션 문서 갱신 가이드

> 본 문서는 GameCup 프로젝트에서 PRD · 유즈케이스 · UML을 **언제 / 어떻게** 갱신하는지를 규정한다.
> 작성 자체는 [`./iteration-template.md`](./iteration-template.md)를 복사해 사용한다.

---

## 1. 핵심 원칙

1. **베이스라인은 단 하나.** 현재 베이스라인은 [`../04-plan/master-plan.md`](../04-plan/master-plan.md) §2에 명시된 버전이다.
2. **변경은 누적, 분기는 명시적.** 사소한 이탈은 [`../04-plan/changelog.md`](../04-plan/changelog.md)의 `[Unreleased]` 섹션에 누적하고, 충분히 쌓이면 새 이터레이션 문서로 명시적으로 분기한다.
3. **불변성 보존.** 이미 릴리즈된 이터레이션 문서(`iteration-1.md`, `iteration-2.md`, `iteration-3.md` 등)는 수정하지 않는다. 변경은 항상 새 파일로 만든다.

---

## 2. 트리거 조건 (언제 분기할까)

다음 중 하나라도 해당하면 새 이터레이션 분기를 검토한다.

| 트리거 | 분기 대상 산출물 |
| --- | --- |
| PRD의 기능(F-XX) 정의가 추가/변경/삭제될 때 | PRD + (필요 시) UC, UML |
| PRD의 비기능(NF-XX) 수치·메커니즘이 바뀔 때 | PRD |
| UML 클래스 다이어그램의 메서드 시그니처가 변경될 때 | UML |
| UML 계층 매핑(P/B/D) 구조가 변경될 때 | UML, PRD §아키텍처 영향 |
| 새 외부 의존성(예: Supabase, GCP, Sentry) 도입 | PRD + UML + 설정 가이드([`../06-setup/`](../06-setup/)) + 기술 근거([`../07-tech-rationale/README.md`](../07-tech-rationale/README.md)) |
| 새 액터 또는 권한 모델 추가 | PRD + UC |
| 사용자 시나리오(UC) 자체가 추가·삭제될 때 | UC + PRD |

---

## 3. 누적 vs 분기 결정 트리

```
변경 발생
  │
  ├── 변경이 사소하고 베이스라인 표 구조를 깨지 않는가?
  │      └── Yes → changelog.md [Unreleased] 섹션에 항목 추가하고 종료
  │
  ├── 표 한 행 또는 한 셀 수준의 변경인가?
  │      └── Yes → changelog.md에 누적 + 다음 이터레이션 분기 시 반영
  │
  └── PRD 표가 통째로 다시 짜이거나, UML 메서드가 다수 추가/제거되는가?
         └── Yes → 즉시 새 이터레이션 분기:
                    1) iteration-template.md 복사
                    2) docs/01-prd/iteration-N.md 생성
                    3) UC/UML도 필요 시 동일 절차
                    4) changelog.md [Unreleased] 항목을
                       [Iteration N / PRD vN.0] 섹션으로 이동
                    5) master-plan.md §2 베이스라인 갱신
```

---

## 4. 버전 번호 규칙

| 산출물 | 규칙 |
| --- | --- |
| **PRD** | 이터레이션 단위로 정수 증가: `v1.0 → v2.0 → v3.0 → v4.0` |
| **UML** | 다이어그램 추가/교체 = 마이너 (`v1.0 → v1.1`). 메서드 시그니처 다수 변경 또는 메이저 구조 변경 = 메이저 (`v1.x → v2.0`) |
| **UC** | 표 구조 변경 = 마이너. 신규 UC 다수 추가 = 메이저 |
| **마스터 플랜** | 베이스라인 표가 바뀔 때마다 마이너 증가 (`v1.0 → v1.1`) |

---

## 5. 파일명 · 폴더 규칙

- 모든 파일명: **kebab-case 영문**
- 폴더 prefix 번호는 보존: `00-overview`, `01-prd`, `02-usecase`, `03-design`, `04-plan`, `05-process`, `06-setup`, `07-tech-rationale`
- 새 카테고리 폴더가 필요하면 마지막 prefix + 1 (예: `08-deployment`)
- 산출물 파일명 예시:
  - PRD: `iteration-4.md`
  - UML: `uml-v1.2.md`, `uml-v2.0.md`
  - UC: 기존 파일에 섹션 append (Fully Dressed / Stepwise)
  - 설정 가이드: `supabase-setup.md`, `gcp-setup.md`, `sentry-setup.md`

---

## 6. AI 활용 기록 의무화

새 이터레이션 PRD 마지막 섹션에 다음 표를 누적한다.

| 활용 시점 | 활용 목적 | 사용 도구 | 결과 요약 |
| --- | --- | --- | --- |
| {{YYYY.MM.DD}} | {{목적}} | Claude (Anthropic) | {{결과}} |

---

## 7. 서브에이전트 위임 가이드

| 작업 | 위임 에이전트 |
| --- | --- |
| 새 PRD 이터레이션 생성 | `docs-prd` |
| UML v1.x → v1.(x+1) 갱신 | `docs-uml` |
| UC 추가/수정 (Fully Dressed + Stepwise 동시) | `docs-usecase` |
| `changelog.md` `Unreleased` 항목 누적 | `docs-changelog` |
| 새 외부 의존성 도입 시 설정 가이드 작성 | `docs-setup` |
| 신규 라이브러리·도구 도입 근거 기록 | `docs-tech-rationale` |
| 코드 구현 자체 | `code` |
| 커밋·브랜치·PR 처리 | `github` |

> 에이전트 정의 본문은 [`../../.claude/agents/`](../../.claude/agents/) 참조.
> 위임 트리거의 예시 트리거 문구는 프로젝트 루트 [`../../CLAUDE.md`](../../CLAUDE.md)에 통합 기재.

---

## 8. 갱신 절차 체크리스트

새 이터레이션을 분기할 때 이 순서를 따른다.

1. [ ] 변경 사항이 누적 임계치를 넘었는지 [`../04-plan/changelog.md`](../04-plan/changelog.md) `[Unreleased]` 확인
2. [ ] [`./iteration-template.md`](./iteration-template.md) Part A (PRD) 복사 → `01-prd/iteration-N.md` 생성
3. [ ] PRD에 변경 이력(CL-XX) 표를 채우되, 출처는 `ISS-XX` 또는 `EXP-XX` (코드 작업 중 발견된 이탈)로 명시
4. [ ] (필요 시) Part B 복사 → `02-usecase/fully-dressed.md` / `stepwise.md`에 신규 UC append
5. [ ] (필요 시) Part C 복사 → `03-design/uml-v{X.Y}.md` 생성
6. [ ] `[Unreleased]` 항목을 새 이터레이션 섹션으로 이동
7. [ ] [`../04-plan/master-plan.md`](../04-plan/master-plan.md) §2 베이스라인 표 갱신
8. [ ] §6 요구사항 → 구현 단위 매핑 표가 새 PRD와 정합한지 검증
9. [ ] 신규 외부 의존성이 있으면 [`../06-setup/`](../06-setup/)에 가이드, [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md)에 근거 추가
10. [ ] `github` 에이전트에게 커밋 위임 (메시지: `docs(prd): bump to iteration-N`)
