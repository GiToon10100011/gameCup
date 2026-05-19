# 📚 GameCup 문서 인덱스

> 본 폴더는 GameCup 프로젝트의 모든 기획·설계·운영 산출물을 보관한다.
> 단일 진실 공급원은 [`04-plan/master-plan.md`](./04-plan/master-plan.md).

---

## 폴더 구조

| 폴더 | 목적 | 현재 베이스라인 |
| --- | --- | --- |
| [`00-overview/`](./00-overview/) | 프로젝트 비전·타겟·핵심 가치 | `project-idea.md` |
| [`01-prd/`](./01-prd/) | 이터레이션별 PRD (요구사항 정의서) | `iteration-3.md` (v3.0) |
| [`02-usecase/`](./02-usecase/) | 유즈케이스 정의서 (Fully Dressed + Stepwise) | `fully-dressed.md` (v1.0) · `stepwise.md` (v1.1) |
| [`03-design/`](./03-design/) | UML 3대 다이어그램 (Class · Sequence · Activity) | `uml-v1.1.md` (코드 기준) · `uml-v1.2.md` (Draft, 2026.05.17) |
| [`04-plan/`](./04-plan/) | 마스터 플랜 + 변경 이력 | `master-plan.md` (v1.0), `changelog.md` |
| [`05-process/`](./05-process/) | 이터레이션 갱신 템플릿·가이드 | `iteration-template.md`, `iteration-update-guide.md` |
| [`06-setup/`](./06-setup/) | 환경 설정·초기화 가이드 (개발/배포/외부 서비스) | `README.md` 인덱스 |
| [`07-tech-rationale/`](./07-tech-rationale/) | 기술 스택·라이브러리 선택 근거 (롤링) | `README.md` |
| [`assets/`](./assets/) | UML 다이어그램·스크린샷 등 이미지 자산 | (Obsidian 위키링크 동기화 대상) |

---

## 빠른 진입점

- **🟢 지금 당장 할 일:** [`04-plan/next-actions.md`](./04-plan/next-actions.md)
- **프로젝트 이해 → 구현 시작:** [`04-plan/master-plan.md`](./04-plan/master-plan.md)
- **현재 베이스라인 PRD:** [`01-prd/iteration-3.md`](./01-prd/iteration-3.md)
- **모듈/클래스 구조:** [`03-design/uml-v1.1.md`](./03-design/uml-v1.1.md)
- **변경 이력 (누적):** [`04-plan/changelog.md`](./04-plan/changelog.md)
- **새 이터레이션 작성 절차:** [`05-process/iteration-update-guide.md`](./05-process/iteration-update-guide.md)
- **개발 환경 셋업:** [`06-setup/README.md`](./06-setup/README.md)
- **왜 이 스택?:** [`07-tech-rationale/README.md`](./07-tech-rationale/README.md)

---

## 운영 규칙 (요약)

1. 릴리즈된 이터레이션 문서(`01-prd/iteration-N.md`)는 **불변**. 변경은 새 파일로 분기.
2. 코드 작업 중 발생한 PRD/설계 이탈은 즉시 [`04-plan/changelog.md`](./04-plan/changelog.md)의 `[Unreleased]` 섹션에 기록.
3. 임계치 초과 시 [`05-process/iteration-template.md`](./05-process/iteration-template.md)로 새 이터레이션 분기. 상세 규칙은 [`05-process/iteration-update-guide.md`](./05-process/iteration-update-guide.md).
4. 새 외부 의존성·도구를 도입할 때마다 [`06-setup/`](./06-setup/)에 설정 가이드, [`07-tech-rationale/README.md`](./07-tech-rationale/README.md)에 도입 근거를 누적.
5. 모든 파일명은 **kebab-case 영문**. 폴더 prefix 번호는 카테고리 식별자이므로 보존.

---

## Obsidian 위키링크 처리

[`03-design/uml-v1.1.md`](./03-design/uml-v1.1.md)는 Obsidian Vault에서 작성되어 `![[Pasted image 20260512155426.png]]` 형식의 위키링크를 사용한다. 이미지 파일은 [`assets/`](./assets/)에 두는 것을 원칙으로 하되, Obsidian 측 Vault 경로와의 양방향 동기화가 필요하다. 새 이미지 첨부 시 다음을 준수한다.

- 파일명을 kebab-case로 통일 (예: `sequence-uc01.png`)
- 위키링크를 마크다운 표준 링크(`![](./assets/...)`)로 점진적 마이그레이션
- Vault 측 attachment 폴더 설정과 충돌하지 않도록 동기화 시점에 확인
