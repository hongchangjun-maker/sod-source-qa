# SOD 명현반응(호전반응) Q&A 검색 웹앱

등록된 원문 Q&A와 대화 자료 안에서만 관련 내용을 찾아 보여주는 무료 정적 웹앱입니다. 인터넷 검색, 외부 생성 서비스, 외부 API, 서버, 회원가입, 결제, 광고, 분석 도구를 사용하지 않습니다.

## 핵심 원칙

- 건강 관련 답변 본문은 `public/data/qa.json`의 `answer` 문자열만 표시합니다.
- 여러 자료가 관련되면 답변을 합치지 않고 각각 독립적으로 표시합니다.
- 관련 자료가 없으면 정해진 실패 문구만 표시합니다.
- 사용자 검색어, 최근 검색, 즐겨찾기는 외부 서버로 전송되지 않습니다. 최근 검색과 즐겨찾기는 현재 브라우저의 `localStorage`에만 저장됩니다.
- 검색과 분류는 사용자의 기기 안에서 일반 문자열 비교로 처리합니다. 생성형 기능이나 유료 호출은 없습니다.
- `npm run validate:no-ai`가 에이전트 연동, 생성 서비스 SDK 또는 외부 생성 API 흔적을 검사합니다.

## 실행 방법

Node.js 20 이상(권장 22)이 필요합니다.

```bash
npm install
npm run dev
```

프로덕션 검증과 빌드:

```bash
npm test
npm run build
npm run preview
```

`npm run build`는 빌드 전에 데이터 수, ID 중복, 빈 문답, Source Only 정책, 빠른 찾기 표와 원문 주의문구를 자동 검사합니다. 결과물은 `dist/`에 생성됩니다.

## 데이터 구조와 수정

주 데이터는 `public/data/qa.json`입니다.

```json
{
  "id": "case-001",
  "part": "1부",
  "category": "피부·가려움·발진·붓기",
  "question": "원문 질문",
  "answer": "원문 답변",
  "keywords": ["검색용", "키워드"],
  "searchText": "검색 전용 결합 문자열"
}
```

새 Q&A를 추가할 때는 고유한 `id`, `part`, `category`, `question`, 원문 그대로의 `answer`, 검색용 `keywords`를 추가하고 `metadata.totalItems`를 실제 개수와 맞춥니다. 카테고리, 전체 질문, 자동완성과 검색 대상은 JSON에서 자동 생성되므로 앱 코드는 바꿀 필요가 없습니다. 현재 편집 원본을 다시 변환하려면 다음 명령을 사용할 수 있습니다.

```bash
node scripts/build-data.mjs "원본-TXT-절대경로"
```

변환 후에는 반드시 `npm run validate:data`와 `npm test`를 실행합니다. `originalItemCount: 77`은 이번 원본이 빠지지 않았는지 지키는 기준이며, 이후 항목은 `totalItems`만 실제 개수에 맞추어 추가할 수 있습니다.

## 검색 방식

검색은 브라우저 안에서만 이루어집니다. 한국어 공백·구두점·일부 조사와 활용형을 정규화하고, 질문 직접 일치, 키워드 일치, 카테고리, 부분 일치, 제한적 유사 일치 순으로 점수를 계산합니다. 충분한 점수가 없는 자료는 보여주지 않습니다. `answer`는 점수 계산용 텍스트로만 읽으며 수정하거나 합성하지 않습니다.

## GitHub Pages 배포

1. 이 폴더를 GitHub 저장소의 `main` 브랜치에 올립니다.
2. 저장소의 **Settings → Pages → Source**에서 **GitHub Actions**를 선택합니다.
3. `main`에 push하면 `.github/workflows/deploy-pages.yml`이 테스트와 빌드를 통과한 뒤 `dist/`를 배포합니다.

Vite의 상대경로 설정이 적용되어 프로젝트 저장소 이름과 관계없이 GitHub Pages 하위 경로에서 정적 자산을 불러옵니다.

## Cloudflare Pages 배포

Cloudflare Pages에서 같은 GitHub 저장소를 연결하고 다음을 설정합니다.

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `22`

환경변수나 데이터베이스는 필요하지 않습니다. GitHub에 push하면 Cloudflare Pages가 다시 테스트 가능한 정적 결과물을 빌드합니다.

## 주요 폴더

- `public/data/`: Q&A 및 증상 빠른 찾기 JSON
- `src/components/`: 검색, 원문 답변 카드, 카테고리·빠른 찾기 UI
- `src/utils/`: 한국어 정규화와 폐쇄형 검색
- `scripts/`: 원본 변환 및 데이터 계약 검증
- `source/`: 이번 빌드에 사용한 원본 TXT 보존본
- `.github/workflows/`: GitHub Pages 자동 배포

PWA 매니페스트와 기본 서비스 워커를 포함해 배포 후 홈 화면 추가와 오프라인 재방문을 지원합니다.
