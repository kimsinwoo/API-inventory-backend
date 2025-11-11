# 라벨 프린트 API 가이드

이 문서는 EJS 템플릿을 사용한 라벨 프린트 API 사용 가이드입니다.

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

### 응답
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

### 클라우드 환경
```json
{
  "ok": true,
  "message": "프린터가 발견되지 않았습니다.",
  "data": [],
  "warning": "프린터가 설치되어 있지 않거나 클라우드 환경일 수 있습니다."
}
```

## 2. 라벨 프린트

### 요청
```http
POST /api/label/print
Content-Type: application/json
```

### 요청 Body
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
  "actualWeight": "1kg"
}
```

### 필수 파라미터
- `templateType`: `"large"` | `"medium"` | `"small"` | `"verysmall"`
- `itemId`: 숫자 (1 이상)
- `manufactureDate`: 문자열 (YYYY-MM-DD 형식)
- `expiryDate`: 문자열 (YYYY-MM-DD 형식)

### 선택 파라미터
- `printerName`: 문자열 (로컬 환경에서만 필요, 클라우드에서는 선택사항)
- `printCount`: 숫자 (기본값: 1)
- `pdfOptions`: 객체
  - `width`: 문자열 (예: "100mm")
  - `height`: 문자열 (예: "100mm")
  - `margin`: 문자열 (예: "0mm")
- `saveTemplate`: 불린 (기본값: false) - 템플릿 데이터 저장 여부
- `productName`: 문자열 (기본값: 아이템 이름)
- `storageCondition`: 문자열 (기본값: 아이템의 storage_condition 또는 "냉동")
- `registrationNumber`: 문자열 (기본값: 아이템 코드)
- `categoryAndForm`: 문자열
- `ingredients`: 문자열
- `rawMaterials`: 문자열
- `actualWeight`: 문자열

### 응답 (로컬 환경)
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

### 에러 응답
```json
{
  "ok": false,
  "message": "라벨 프린트 처리 중 오류가 발생했습니다: [에러 메시지]",
  "error": "[에러 메시지]"
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

### 선택 파라미터
- `itemId`: 숫자
- `itemName`: 문자열
- `storageCondition`: 문자열
- `registrationNumber`: 문자열
- `categoryAndForm`: 문자열
- `ingredients`: 문자열
- `rawMaterials`: 문자열
- `actualWeight`: 문자열

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
  "data": [
    {
      "id": 1,
      "label_type": "large",
      "item_id": 1,
      "item_name": "강아지 사료",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
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
    "storage_condition": "냉동",
    "registration_number": "123-45-67890",
    "category_and_form": "건조사료",
    "ingredients": "닭고기, 쌀, 옥수수",
    "raw_materials": "닭고기 30%, 쌀 40%, 옥수수 30%",
    "actual_weight": "1kg",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## 바코드 형식

### 15자리 바코드
```
[아이템 ID(3자리)] + [제조일자 YYMMDD(6자리)] + [유통기한 YYMMDD(6자리)]
```

### 예시
```
001240101250101
└─┬─┘└──┬───┘└──┬───┘
아이템  제조일자 유통기한
 ID=1   240101   250101
       2024-01-01  2025-01-01
```

### 특징
- 아이템 ID: 1-999 (3자리, 앞에 0 패딩)
- 제조일자: YYMMDD 형식 (6자리)
- 유통기한: YYMMDD 형식 (6자리)
- 총 15자리 숫자

## 템플릿 타입별 크기

### large
- 크기: 100mm x 100mm
- 포함 정보: 제품명, 등록번호, 종류, 성분, 원료, 중량, 바코드, 제조일자, 유통기한

### medium
- 크기: 80mm x 60mm
- 포함 정보: 제품명, 등록번호, 종류, 성분, 제조일자, 유통기한

### small
- 크기: 50mm x 30mm
- 포함 정보: 제조일자, 유통기한

### verysmall
- 크기: 26mm x 18mm
- 포함 정보: 제품명, 바코드

## 프론트엔드 사용 예제

### JavaScript (Fetch API)
```javascript
// 프린터 목록 조회
const getPrinters = async () => {
  const response = await fetch('http://localhost:4000/api/label/printers');
  const data = await response.json();
  return data;
};

// 라벨 프린트
const printLabel = async (labelData) => {
  const response = await fetch('http://localhost:4000/api/label/print', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 쿠키 포함
    body: JSON.stringify(labelData),
  });
  const data = await response.json();
  return data;
};

// 사용 예제
const labelData = {
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
};

const result = await printLabel(labelData);
if (result.ok) {
  console.log('프린트 성공:', result.data);
} else {
  console.error('프린트 실패:', result.message);
}
```

### Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api/label',
  withCredentials: true,
});

// 프린터 목록 조회
const getPrinters = async () => {
  const response = await api.get('/printers');
  return response.data;
};

// 라벨 프린트
const printLabel = async (labelData) => {
  const response = await api.post('/print', labelData);
  return response.data;
};

// 사용 예제
const result = await printLabel({
  templateType: 'large',
  itemId: 1,
  manufactureDate: '2024-01-01',
  expiryDate: '2025-01-01',
  printerName: 'HP LaserJet',
  printCount: 1,
});
```

### React Hook 예제
```javascript
import { useState } from 'react';
import axios from 'axios';

const useLabelPrint = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const printLabel = async (labelData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        'http://localhost:4000/api/label/print',
        labelData,
        { withCredentials: true }
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { printLabel, loading, error };
};

// 사용
function LabelPrintComponent() {
  const { printLabel, loading, error } = useLabelPrint();

  const handlePrint = async () => {
    try {
      const result = await printLabel({
        templateType: 'large',
        itemId: 1,
        manufactureDate: '2024-01-01',
        expiryDate: '2025-01-01',
        printerName: 'HP LaserJet',
        printCount: 1,
      });
      if (result.ok) {
        alert('프린트 성공!');
      }
    } catch (err) {
      alert('프린트 실패: ' + err.message);
    }
  };

  return (
    <div>
      <button onClick={handlePrint} disabled={loading}>
        {loading ? '프린트 중...' : '프린트'}
      </button>
      {error && <div>에러: {error}</div>}
    </div>
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

1. **날짜 형식**: 제조일자와 유통기한은 반드시 `YYYY-MM-DD` 형식이어야 합니다.
2. **아이템 ID**: 1-999 사이의 숫자여야 합니다.
3. **프린터 이름**: 로컬 환경에서는 필수, 클라우드 환경에서는 선택사항입니다.
4. **바코드**: 자동으로 생성되며, 아이템 ID + 제조일자 + 유통기한으로 구성됩니다.
5. **템플릿 타입**: `large`, `medium`, `small`, `verysmall` 중 하나여야 합니다.

## 환경별 동작

### 로컬 환경
- 프린터 이름 필수
- 지정한 프린터로 직접 출력
- PDF 파일 저장 안 함

### 클라우드 환경
- 프린터 이름 선택사항
- PDF 파일로 저장
- `filePath`에 저장된 경로 반환

