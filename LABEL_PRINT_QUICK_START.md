# 라벨 프린트 빠른 시작 가이드

## 프론트엔드에서 사용하기

### 1. 기본 사용법 (JavaScript)

```javascript
// 프린터 목록 조회
const getPrinters = async () => {
  const response = await fetch('http://localhost:4000/api/label/printers', {
    credentials: 'include',
  });
  const data = await response.json();
  console.log('프린터 목록:', data.data);
};

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
      printerName: 'HP LaserJet', // 로컬 환경에서만 필요
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
    console.log('프린트 성공!');
    console.log('바코드:', result.data.barcode);
    if (result.data.filePath) {
      console.log('PDF 저장 경로:', result.data.filePath);
    }
  } else {
    console.error('프린트 실패:', result.message);
  }
};
```

### 2. Axios 사용법

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api/label',
  withCredentials: true,
});

// 프린터 목록 조회
const printers = await api.get('/printers');
console.log(printers.data.data);

// 라벨 프린트
const result = await api.post('/print', {
  templateType: 'large',
  itemId: 1,
  manufactureDate: '2024-01-01',
  expiryDate: '2025-01-01',
  printerName: 'HP LaserJet',
  printCount: 1,
});
console.log(result.data);
```

### 3. React 컴포넌트 예제

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LabelPrint() {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [loading, setLoading] = useState(false);

  // 프린터 목록 조회
  useEffect(() => {
    axios.get('http://localhost:4000/api/label/printers', {
      withCredentials: true,
    }).then((response) => {
      if (response.data.ok) {
        setPrinters(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedPrinter(response.data.data[0].name);
        }
      }
    });
  }, []);

  // 라벨 프린트
  const handlePrint = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:4000/api/label/print',
        {
          templateType: 'large',
          itemId: 1,
          manufactureDate: '2024-01-01',
          expiryDate: '2025-01-01',
          printerName: selectedPrinter || undefined,
          printCount: 1,
        },
        { withCredentials: true }
      );

      if (response.data.ok) {
        alert('프린트 성공!');
        console.log('바코드:', response.data.data.barcode);
      } else {
        alert('프린트 실패: ' + response.data.message);
      }
    } catch (error) {
      alert('에러: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <select
        value={selectedPrinter}
        onChange={(e) => setSelectedPrinter(e.target.value)}
      >
        <option value="">프린터 선택 (선택사항)</option>
        {printers.map((printer) => (
          <option key={printer.name} value={printer.name}>
            {printer.name}
          </option>
        ))}
      </select>
      <button onClick={handlePrint} disabled={loading}>
        {loading ? '프린트 중...' : '프린트'}
      </button>
    </div>
  );
}
```

## API 요청 예제

### 요청 URL
```
POST http://localhost:4000/api/label/print
```

### 요청 Headers
```
Content-Type: application/json
Cookie: [세션 쿠키]
```

### 요청 Body (최소)
```json
{
  "templateType": "large",
  "itemId": 1,
  "manufactureDate": "2024-01-01",
  "expiryDate": "2025-01-01"
}
```

### 요청 Body (전체)
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

### 성공 응답
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

### 에러 응답
```json
{
  "ok": false,
  "message": "에러 메시지",
  "error": "상세 에러 메시지"
}
```

## 템플릿별 최소 요청 예제

### Large 템플릿
```json
{
  "templateType": "large",
  "itemId": 1,
  "manufactureDate": "2024-01-01",
  "expiryDate": "2025-01-01",
  "productName": "강아지 사료",
  "storageCondition": "냉동",
  "registrationNumber": "123-45-67890",
  "categoryAndForm": "건조사료",
  "ingredients": "닭고기, 쌀, 옥수수",
  "rawMaterials": "닭고기 30%, 쌀 40%, 옥수수 30%",
  "actualWeight": "1kg"
}
```

### Medium 템플릿
```json
{
  "templateType": "medium",
  "itemId": 1,
  "manufactureDate": "2024-01-01",
  "expiryDate": "2025-01-01",
  "productName": "강아지 사료",
  "registrationNumber": "123-45-67890",
  "categoryAndForm": "건조사료",
  "ingredients": "닭고기, 쌀, 옥수수"
}
```

### Small 템플릿
```json
{
  "templateType": "small",
  "itemId": 1,
  "manufactureDate": "2024-01-01",
  "expiryDate": "2025-01-01"
}
```

### Very Small 템플릿
```json
{
  "templateType": "verysmall",
  "itemId": 1,
  "manufactureDate": "2024-01-01",
  "expiryDate": "2025-01-01",
  "productName": "강아지 사료"
}
```

## 바코드 생성 예제

### 입력
```javascript
itemId: 1
manufactureDate: "2024-01-01"
expiryDate: "2025-01-01"
```

### 출력
```
바코드: 001240101250101
```

### 파싱
```javascript
// 바코드 파싱 함수 사용
const { parseLabelBarcode } = require('./utils/labelBarcodeGenerator');

const barcode = "001240101250101";
const parsed = parseLabelBarcode(barcode);
// {
//   itemId: 1,
//   manufactureDate: "2024-01-01",
//   expiryDate: "2025-01-01",
//   isValid: true
// }
```

## 에러 처리 예제

```javascript
try {
  const response = await fetch('http://localhost:4000/api/label/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      templateType: 'large',
      itemId: 1,
      manufactureDate: '2024-01-01',
      expiryDate: '2025-01-01',
    }),
  });

  const result = await response.json();

  if (result.ok) {
    // 성공 처리
    console.log('프린트 성공:', result.data);
  } else {
    // 에러 처리
    console.error('프린트 실패:', result.message);
    if (result.error) {
      console.error('상세 에러:', result.error);
    }
  }
} catch (error) {
  // 네트워크 에러 등
  console.error('요청 실패:', error.message);
}
```

## 주요 기능

1. **자동 바코드 생성**: 아이템 ID + 제조일자 + 유통기한으로 15자리 바코드 자동 생성
2. **바코드 이미지 생성**: Base64 인코딩된 PNG 이미지 자동 생성
3. **템플릿 렌더링**: EJS 템플릿을 HTML로 렌더링
4. **PDF 변환**: HTML을 PDF로 변환
5. **프린트**: 로컬 환경에서는 프린터로 직접 출력, 클라우드 환경에서는 PDF 파일로 저장
6. **템플릿 저장**: 템플릿 데이터를 데이터베이스에 저장 (선택사항)

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

