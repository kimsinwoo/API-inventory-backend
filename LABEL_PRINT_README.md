# 라벨 프린트 시스템 사용 가이드

## 개요

EJS 템플릿을 사용한 라벨 프린트 시스템입니다. 
- 4가지 템플릿 타입 지원 (large, medium, small, verysmall)
- 15자리 바코드 자동 생성 (아이템 ID + 제조일자 + 유통기한)
- 바코드 이미지 자동 생성
- 환경별 프린트 처리 (로컬/클라우드)
- 템플릿 데이터 저장 기능

## API 엔드포인트

### Base URL
```
http://localhost:4000/api/label
```

## 1. 프린터 목록 조회

### 요청
```http
GET /api/label/printers
```

### 응답 예시
```json
{
  "ok": true,
  "message": "프린터 목록 조회 성공 (2개)",
  "data": [
    {
      "name": "HP LaserJet",
      "status": "Ready",
      "driver": "HP LaserJet Driver",
      "isDefault": true
    }
  ]
}
```

## 2. 라벨 프린트

### 요청
```http
POST /api/label/print
Content-Type: application/json
```

### 요청 Body (필수 파라미터)
```json
{
  "templateType": "large",
  "itemId": 1,
  "manufactureDate": "2024-01-01",
  "expiryDate": "2025-01-01"
}
```

### 요청 Body (전체 파라미터)
```json
{
  "templateType": "large",
  "itemId": 1,
  "manufactureDate": "2024-01-01",
  "expiryDate": "2025-01-01",
  "printerName": "HP LaserJet",
  "printCount": 1,
  "saveTemplate": false,
  "productName": "강아지 사료",
  "storageCondition": "냉동",
  "registrationNumber": "123-45-67890",
  "categoryAndForm": "건조사료",
  "ingredients": "닭고기, 쌀, 옥수수",
  "rawMaterials": "닭고기 30%, 쌀 40%, 옥수수 30%",
  "actualWeight": "1kg",
  "pdfOptions": {
    "width": "100mm",
    "height": "100mm",
    "margin": "0mm"
  }
}
```

### 필수 파라미터
- `templateType`: `"large"` | `"medium"` | `"small"` | `"verysmall"`
- `itemId`: 숫자 (1-999)
- `manufactureDate`: 문자열 (YYYY-MM-DD 형식)
- `expiryDate`: 문자열 (YYYY-MM-DD 형식)

### 선택 파라미터
- `printerName`: 문자열 (로컬 환경에서만 필요)
- `printCount`: 숫자 (기본값: 1)
- `saveTemplate`: 불린 (기본값: false)
- `productName`: 문자열
- `storageCondition`: 문자열 (기본값: "냉동")
- `registrationNumber`: 문자열
- `categoryAndForm`: 문자열
- `ingredients`: 문자열
- `rawMaterials`: 문자열
- `actualWeight`: 문자열
- `pdfOptions`: 객체
  - `width`: 문자열
  - `height`: 문자열
  - `margin`: 문자열

### 응답 (성공)
```json
{
  "ok": true,
  "message": "HP LaserJet로 1개의 라벨이 프린트되었습니다",
  "data": {
    "templateId": null,
    "barcode": "001240101250101",
    "printCount": 1,
    "printerName": "HP LaserJet",
    "filePath": null,
    "mode": "local",
    "printedAt": "2024-01-01T00:00:00.000Z",
    "error": null
  }
}
```

### 응답 (클라우드 환경)
```json
{
  "ok": true,
  "message": "PDF 파일이 저장되었습니다 (1개 라벨)",
  "data": {
    "templateId": null,
    "barcode": "001240101250101",
    "printCount": 1,
    "printerName": null,
    "filePath": "./uploads/label-pdfs/label-1234567890-abc123.pdf",
    "mode": "cloud",
    "printedAt": "2024-01-01T00:00:00.000Z",
    "error": null
  }
}
```

## 3. 템플릿 저장 (데이터만)

### 요청
```http
POST /api/label/template
Content-Type: application/json
```

### 요청 Body
```json
{
  "labelType": "large",
  "itemId": 1,
  "itemName": "강아지 사료",
  "storageCondition": "냉동",
  "registrationNumber": "123-45-67890",
  "categoryAndForm": "건조사료",
  "ingredients": "닭고기, 쌀, 옥수수",
  "rawMaterials": "닭고기 30%, 쌀 40%, 옥수수 30%",
  "actualWeight": "1kg"
}
```

### 필수 파라미터
- `labelType`: `"large"` | `"medium"` | `"small"` | `"verysmall"`

### 응답
```json
{
  "ok": true,
  "message": "템플릿이 성공적으로 저장되었습니다",
  "data": {
    "id": 1,
    "labelType": "large",
    "itemId": 1,
    "itemName": "강아지 사료",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 4. 템플릿 목록 조회

### 요청
```http
GET /api/label/templates?page=1&limit=50
```

### 응답
```json
{
  "ok": true,
  "message": "템플릿 목록 조회 성공",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "totalPages": 1
  }
}
```

## 5. 템플릿 조회

### 요청
```http
GET /api/label/template/:templateId
```

### 응답
```json
{
  "ok": true,
  "message": "템플릿 조회 성공",
  "data": {
    "id": 1,
    "label_type": "large",
    "item_id": 1,
    "item_name": "강아지 사료",
    ...
  }
}
```

## 바코드 형식

### 15자리 바코드 구조
```
[아이템 ID(3자리)] + [제조일자 YYMMDD(6자리)] + [유통기한 YYMMDD(6자리)]
```

### 예시
```
아이템 ID: 1
제조일자: 2024-01-01
유통기한: 2025-01-01

바코드: 001240101250101
        └─┬─┘└──┬───┘└──┬───┘
        아이템  제조일자 유통기한
         ID=1   240101   250101
```

### 규칙
- 아이템 ID: 1-999 (3자리, 앞에 0 패딩)
- 제조일자: YYMMDD 형식 (6자리)
- 유통기한: YYMMDD 형식 (6자리)
- 총 15자리 숫자

## 템플릿 타입별 정보

### large (100mm x 100mm)
- 제품명
- 등록번호
- 종류 및 형태
- 성분량
- 원료의 명칭
- 실제중량
- 바코드
- 제조일자
- 유통기한
- 보관 조건

### medium (80mm x 60mm)
- 제품명
- 등록번호
- 종류 및 형태
- 성분량
- 제조일자
- 유통기한

### small (50mm x 30mm)
- 제조일자
- 유통기한

### verysmall (26mm x 18mm)
- 제품명
- 바코드

## 프론트엔드 사용 예제

### JavaScript (Fetch API)
```javascript
// 라벨 프린트
const printLabel = async () => {
  const response = await fetch('http://localhost:4000/api/label/print', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      templateType: 'large',
      itemId: 1,
      manufactureDate: '2024-01-01',
      expiryDate: '2025-01-01',
      printerName: 'HP LaserJet',
      printCount: 1,
      productName: '강아지 사료',
      storageCondition: '냉동',
      registrationNumber: '123-45-67890',
      categoryAndForm: '건조사료',
      ingredients: '닭고기, 쌀, 옥수수',
      rawMaterials: '닭고기 30%, 쌀 40%, 옥수수 30%',
      actualWeight: '1kg',
    }),
  });
  
  const result = await response.json();
  if (result.ok) {
    console.log('프린트 성공:', result.data);
  } else {
    console.error('프린트 실패:', result.message);
  }
};
```

### Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api/label',
  withCredentials: true,
});

const result = await api.post('/print', {
  templateType: 'large',
  itemId: 1,
  manufactureDate: '2024-01-01',
  expiryDate: '2025-01-01',
  printerName: 'HP LaserJet',
  printCount: 1,
});
```

### React Hook
```javascript
import { useLabelPrint } from './hooks/useLabelPrint';

function LabelPrintComponent() {
  const { printLabel, loading, error } = useLabelPrint();

  const handlePrint = async () => {
    const result = await printLabel({
      templateType: 'large',
      itemId: 1,
      manufactureDate: '2024-01-01',
      expiryDate: '2025-01-01',
      printerName: 'HP LaserJet',
      printCount: 1,
    });
    
    if (result) {
      console.log('프린트 성공:', result);
    }
  };

  return (
    <button onClick={handlePrint} disabled={loading}>
      {loading ? '프린트 중...' : '프린트'}
    </button>
  );
}
```

## 에러 처리

### 일반적인 에러
- `400 Bad Request`: 잘못된 요청 파라미터
- `404 Not Found`: 아이템을 찾을 수 없음
- `500 Internal Server Error`: 서버 내부 오류

### 에러 응답 형식
```json
{
  "ok": false,
  "message": "에러 메시지",
  "error": "상세 에러 메시지"
}
```

## 주의사항

1. **아이템 ID**: 1-999 사이의 숫자여야 합니다.
2. **날짜 형식**: 제조일자와 유통기한은 반드시 `YYYY-MM-DD` 형식이어야 합니다.
3. **유통기한**: 제조일자보다 이후여야 합니다.
4. **프린터 이름**: 로컬 환경에서는 필수, 클라우드 환경에서는 선택사항입니다.
5. **바코드**: 자동으로 생성되며, 15자리 숫자입니다.

## 환경별 동작

### 로컬 환경
- 프린터 이름 필수
- 지정한 프린터로 직접 출력
- PDF 파일 저장 안 함

### 클라우드 환경
- 프린터 이름 선택사항
- PDF 파일로 저장
- `filePath`에 저장된 경로 반환

## 파일 구조

```
src/
├── controller/
│   └── labelController.js      # 라벨 컨트롤러
├── routes/
│   └── labelRoute.js           # 라벨 라우트
├── services/
│   ├── labelPrintService.js    # 라벨 프린트 서비스
│   └── labelTemplateService.js # 템플릿 저장 서비스
├── utils/
│   └── labelBarcodeGenerator.js # 바코드 생성 유틸리티
└── views/
    ├── label-large.ejs         # Large 템플릿
    ├── label-medium.ejs        # Medium 템플릿
    ├── label-small.ejs         # Small 템플릿
    └── label-verysmall.ejs     # Very Small 템플릿
```

