# 라벨 프린트 시스템 구현 완료

## 구현 내용

### 1. 바코드 생성 (15자리)
- **위치**: `src/utils/labelBarcodeGenerator.js`
- **형식**: `[아이템 ID(3자리)] + [제조일자 YYMMDD(6자리)] + [유통기한 YYMMDD(6자리)]`
- **기능**:
  - 아이템 ID (1-999) 검증
  - 제조일자/유통기한 검증
  - 바코드 이미지 생성 (Base64)
  - 바코드 파싱

### 2. 라벨 프린트 서비스
- **위치**: `src/services/labelPrintService.js`
- **기능**:
  - EJS 템플릿 렌더링
  - HTML → PDF 변환 (Puppeteer)
  - 프린터 목록 조회 (Windows/Unix)
  - 로컬 프린트 (Windows PowerShell / Unix lp)
  - 클라우드 PDF 저장

### 3. 템플릿 서비스
- **위치**: `src/services/labelTemplateService.js`
- **기능**:
  - 템플릿 데이터 저장
  - 템플릿 조회
  - 템플릿 목록 조회
  - 프린트 결과 업데이트

### 4. 라벨 컨트롤러
- **위치**: `src/controller/labelController.js`
- **기능**:
  - 프린터 목록 조회
  - 라벨 프린트 처리
  - 템플릿 저장
  - 템플릿 조회

### 5. 라벨 라우트
- **위치**: `src/routes/labelRoute.js`
- **엔드포인트**:
  - `GET /api/label/printers` - 프린터 목록 조회
  - `POST /api/label/print` - 라벨 프린트
  - `POST /api/label/template` - 템플릿 저장
  - `GET /api/label/templates` - 템플릿 목록 조회
  - `GET /api/label/template/:templateId` - 템플릿 조회

### 6. 템플릿 파일
- **위치**: `src/views/`
- **템플릿**:
  - `label-large.ejs` - 100mm x 100mm
  - `label-medium.ejs` - 80mm x 60mm
  - `label-small.ejs` - 50mm x 30mm
  - `label-verysmall.ejs` - 26mm x 18mm

## API 엔드포인트

### Base URL
```
http://localhost:4000/api/label
```

### 1. 프린터 목록 조회
```http
GET /api/label/printers
```

### 2. 라벨 프린트
```http
POST /api/label/print
Content-Type: application/json

{
  "templateType": "large",
  "itemId": 1,
  "manufactureDate": "2024-01-01",
  "expiryDate": "2025-01-01",
  "printerName": "HP LaserJet",
  "printCount": 1
}
```

### 3. 템플릿 저장
```http
POST /api/label/template
Content-Type: application/json

{
  "labelType": "large",
  "itemId": 1,
  "itemName": "강아지 사료",
  ...
}
```

### 4. 템플릿 목록 조회
```http
GET /api/label/templates?page=1&limit=50
```

### 5. 템플릿 조회
```http
GET /api/label/template/:templateId
```

## 주요 기능

### 1. 바코드 생성
- **15자리 바코드**: 아이템 ID(3) + 제조일자(6) + 유통기한(6)
- **자동 검증**: 아이템 ID 범위, 날짜 형식, 유통기한 유효성
- **이미지 생성**: Base64 인코딩된 PNG 이미지

### 2. 템플릿 렌더링
- **EJS 템플릿**: 4가지 템플릿 타입 지원
- **데이터 전달**: 템플릿별 필요한 데이터 자동 전달
- **기본값 처리**: 누락된 데이터는 기본값으로 처리

### 3. PDF 변환
- **Puppeteer**: HTML을 PDF로 변환
- **템플릿별 크기**: 템플릿 타입에 맞는 PDF 크기 자동 설정
- **여러 라벨**: printCount에 따라 여러 라벨 생성

### 4. 프린트 처리
- **로컬 환경**: 프린터로 직접 출력
  - Windows: PowerShell
  - Unix: lp 명령어
- **클라우드 환경**: PDF 파일로 저장
  - 저장 경로: `./uploads/label-pdfs/`

### 5. 템플릿 저장
- **데이터 저장**: 템플릿 데이터를 데이터베이스에 저장
- **프린트 결과**: 프린트 성공/실패 결과 업데이트
- **템플릿 조회**: 저장된 템플릿 조회 및 목록 조회

## 에러 처리

### 검증 에러
- 아이템 ID: 1-999 범위 검증
- 날짜 형식: YYYY-MM-DD 형식 검증
- 유통기한: 제조일자보다 이후인지 검증
- 템플릿 타입: large, medium, small, verysmall 중 하나인지 검증

### 런타임 에러
- 아이템 조회 실패: 404 에러
- 바코드 생성 실패: 400 에러
- 템플릿 렌더링 실패: 500 에러
- PDF 변환 실패: 500 에러
- 프린트 실패: 500 에러

## 환경별 동작

### 로컬 환경
- 프린터 목록 조회 가능
- 프린터로 직접 출력
- PDF 파일 저장 안 함

### 클라우드 환경
- 프린터 목록 조회 불가 (빈 배열 반환)
- PDF 파일로 저장
- `filePath`에 저장된 경로 반환

## 프론트엔드 사용

### 기본 사용법
```javascript
// 라벨 프린트
const response = await fetch('http://localhost:4000/api/label/print', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    templateType: 'large',
    itemId: 1,
    manufactureDate: '2024-01-01',
    expiryDate: '2025-01-01',
    printerName: 'HP LaserJet',
    printCount: 1,
  }),
});

const result = await response.json();
if (result.ok) {
  console.log('프린트 성공:', result.data);
} else {
  console.error('프린트 실패:', result.message);
}
```

### React Hook 사용
```javascript
import { useLabelPrint } from './hooks/useLabelPrint';

const { printLabel, loading, error } = useLabelPrint();

const result = await printLabel({
  templateType: 'large',
  itemId: 1,
  manufactureDate: '2024-01-01',
  expiryDate: '2025-01-01',
  printerName: 'HP LaserJet',
  printCount: 1,
});
```

## 파일 구조

```
src/
├── controller/
│   └── labelController.js          # 라벨 컨트롤러
├── routes/
│   └── labelRoute.js               # 라벨 라우트
├── services/
│   ├── labelPrintService.js       # 라벨 프린트 서비스
│   └── labelTemplateService.js    # 템플릿 서비스
├── utils/
│   └── labelBarcodeGenerator.js   # 바코드 생성 유틸리티
└── views/
    ├── label-large.ejs            # Large 템플릿
    ├── label-medium.ejs           # Medium 템플릿
    ├── label-small.ejs            # Small 템플릿
    └── label-verysmall.ejs        # Very Small 템플릿

frontend-examples/
├── LabelPrintApi.ts               # API 클라이언트
├── useLabelPrint.ts               # React Hook
└── LabelPrintComponent.tsx        # React 컴포넌트 예제

문서/
├── LABEL_API_GUIDE.md            # API 가이드
├── LABEL_PRINT_README.md         # 사용 가이드
├── LABEL_PRINT_QUICK_START.md    # 빠른 시작 가이드
└── LABEL_PRINT_SUMMARY.md        # 요약 문서
```

## 주의사항

1. **아이템 ID**: 1-999 사이의 숫자여야 합니다.
2. **날짜 형식**: 제조일자와 유통기한은 YYYY-MM-DD 형식이어야 합니다.
3. **유통기한**: 제조일자보다 이후여야 합니다.
4. **프린터 이름**: 로컬 환경에서는 필수, 클라우드 환경에서는 선택사항입니다.
5. **바코드**: 자동으로 생성되며, 15자리 숫자입니다.
6. **템플릿 타입**: large, medium, small, verysmall 중 하나여야 합니다.

## 테스트 방법

### 1. 프린터 목록 조회 테스트
```bash
curl http://localhost:4000/api/label/printers
```

### 2. 라벨 프린트 테스트
```bash
curl -X POST http://localhost:4000/api/label/print \
  -H "Content-Type: application/json" \
  -d '{
    "templateType": "large",
    "itemId": 1,
    "manufactureDate": "2024-01-01",
    "expiryDate": "2025-01-01",
    "printerName": "HP LaserJet",
    "printCount": 1
  }'
```

### 3. 템플릿 저장 테스트
```bash
curl -X POST http://localhost:4000/api/label/template \
  -H "Content-Type: application/json" \
  -d '{
    "labelType": "large",
    "itemId": 1,
    "itemName": "강아지 사료"
  }'
```

## 문제 해결

### 프린터가 나타나지 않는 경우
- 로컬 환경: 프린터가 시스템에 설치되어 있는지 확인
- 클라우드 환경: 정상 동작 (PDF 저장 모드)

### 프린트가 실패하는 경우
- 프린터 이름이 올바른지 확인
- 네트워크 연결 확인
- 서버 로그 확인

### 바코드 생성 실패
- 아이템 ID가 1-999 사이인지 확인
- 날짜 형식이 YYYY-MM-DD인지 확인
- 유통기한이 제조일자보다 이후인지 확인

## 완료된 작업

✅ 바코드 생성 (15자리)
✅ 바코드 이미지 생성
✅ EJS 템플릿 렌더링
✅ HTML → PDF 변환
✅ 프린터 목록 조회
✅ 로컬 프린트 (Windows/Unix)
✅ 클라우드 PDF 저장
✅ 템플릿 데이터 저장
✅ 템플릿 조회
✅ 에러 처리
✅ 검증 로직
✅ 프론트엔드 예제 코드
✅ API 문서

