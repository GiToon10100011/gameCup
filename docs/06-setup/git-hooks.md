# 🪝 Git Hooks (Husky + lint-staged) 설정 가이드

> **도입 시점:** 2026.05.19 (Phase 0 스캐폴딩 마무리)
> **대상:** 본 저장소에 처음 합류한 모든 개발자

---

## 1. 개요

저장소에 커밋·푸시되는 코드의 품질을 로컬에서 1차 차단하기 위해 [Husky](https://typicode.github.io/husky/)와 [lint-staged](https://github.com/lint-staged/lint-staged)를 사용한다.

- **Husky**: Git hook(예: pre-commit, pre-push)을 npm 의존성으로 관리·자동 설치
- **lint-staged**: staged 상태(즉 `git add`된)인 파일만 골라 ESLint·Prettier 같은 검사 실행

CI(GitHub Actions, [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml))가 동일 검사를 전체 코드에 대해 한 번 더 수행하므로, 우회(`--no-verify`)가 발생해도 main 브랜치 품질은 보장된다.

---

## 2. 도입 시점

- **Phase 0 (스캐폴딩)** 마무리 시점에 추가
- 관련 기술 근거: [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) §Husky, §lint-staged, §GitHub Actions

---

## 3. 사전 요구사항

| 도구 | 필요 버전 |
| --- | --- |
| Node.js | 20.x LTS |
| Git | 2.40+ (저장소가 `.git` 디렉터리 보유 — `git init` 완료 필수) |

> 본 프로젝트는 현재(2026.05.19) `git init` 미실행 상태다. `github` 서브에이전트가 초기화한 후 본 가이드의 hook이 비로소 활성화된다.

---

## 4. 단계별 설치/설정

### 4.1 의존성 설치

`npm install` 시 자동 수행되는 `prepare` 스크립트가 husky를 셋업한다.

```bash
npm install
```

`package.json`의 관련 필드:

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.1.4",
    "lint-staged": "^15.2.7"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings=0"]
  }
}
```

### 4.2 Hook 파일 (이미 저장소에 포함)

`.husky/pre-commit`:

```sh
npx lint-staged
```

> 권한이 깨졌다면 `chmod +x .husky/pre-commit`로 복구.

### 4.3 동작 확인

```bash
# TS 파일을 수정하고 staged 상태로 만든 후 커밋 시도
echo "const x: any = 1;" > /tmp/lintcheck.ts
git add /tmp/lintcheck.ts   # 실제 경로 조정
git commit -m "test"
# → ESLint가 staged 파일에 대해 자동 실행됨
```

---

## 5. 환경 변수

| 키 | 용도 |
| --- | --- |
| `HUSKY` | `0`으로 설정 시 husky가 hook 설치를 건너뛴다. CI에서 사용 (이미 [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)에 적용됨). |

---

## 6. 검증

| 항목 | 명령 | 기대 결과 |
| --- | --- | --- |
| Husky 설치 확인 | `ls -la .husky/_/` | husky 내부 스크립트(`_/`)가 생성되어 있음 |
| Pre-commit 실행 권한 | `test -x .husky/pre-commit && echo OK` | `OK` |
| lint-staged CLI | `npx lint-staged --help` | 사용법 출력 |
| Dry run | `npx lint-staged --diff="HEAD~1...HEAD"` (커밋이 있을 때) | ESLint가 diff 파일에 실행 |

---

## 7. 트러블슈팅

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| `husky - .git can't be found` | `git init` 미실행 | `github` 에이전트로 저장소 초기화 후 `npm run prepare` 재실행 |
| `Permission denied: .husky/pre-commit` | 실행 권한 누락 | `chmod +x .husky/pre-commit` |
| 커밋이 hook 없이 통과됨 | `core.hooksPath` 설정 충돌 | `git config --local --unset core.hooksPath` (전역 설정은 변경하지 말 것) |
| CI에서 husky가 npm ci를 깨뜨림 | prepare 스크립트가 git 없는 환경에서 실패 | 워크플로우 env에 `HUSKY: 0` 설정 (이미 적용됨) |
| Hook 우회 필요한 진짜 긴급 상황 | `--no-verify` 플래그 | **사용자 명시 승인 후에만**. 우회 시 사유를 커밋 메시지에 기록. |

---

## 8. 참고 자료

- [Husky 공식 문서](https://typicode.github.io/husky/)
- [lint-staged 공식 문서](https://github.com/lint-staged/lint-staged)
- [GitHub Actions 워크플로우](../../.github/workflows/ci.yml) (본 프로젝트)
