# 라벨 프린트 기능 API 문서

## 개요

입고 시 라벨을 자동으로 생성할 수 있는 기능입니다.

---

## 🏷️ 라벨 크기

| 크기 | 값 | 용도 | 크기 |
|------|-----|------|------|
| 대형 | `large` | 완제품 상세 정보 | 100mm x 100mm |
| 중형 | `medium` | 반제품/중간 정보 | 80mm x 60mm |
| 소형 | `small` | 원재료 간단 정보 | 50mm x 30mm |

---

## 📋 입고 시 라벨 프린트

### 1. 라벨 프린트 없이 입고

```http
POST /api/inventory-transactions/receive
Content-Type: application/json

{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "lotNumber": "LOT-20241027-001",
  "wholesalePrice": 50000,
  "quantity": 100,
  "unit": "kg",
  "receivedAt": "2024-10-27T10:00:00Z",
  "note": "신선 상태 양호",
  "printLabel": false
}
```

**응답:**
```json
{
  "ok": true,
  "message": "홍길동님이 닭가슴살을(를) 100kg 입고 처리했습니다",
  "data": {
    "inventory": {
      "id": 123,
      "lot_number": "LOT-20241027-001",
      "quantity": 100
    },
    "receivedBy": {
      "userId": 5,
      "userName": "홍길동",
      "position": "창고 담당"
    },
    "label": {
      "generated": false,
      "message": "라벨 프린트를 선택하지 않았습니다"
    }
  }
}
```

---

### 2. 라벨 프린트와 함께 입고 (기본 1개, Large)

```http
POST /api/inventory-transactions/receive
Content-Type: application/json

{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "lotNumber": "LOT-20241027-001",
  "wholesalePrice": 50000,
  "quantity": 100,
  "unit": "kg",
  "receivedAt": "2024-10-27T10:00:00Z",
  "note": "신선 상태 양호",
  "printLabel": true,
  "labelSize": "large",
  "labelQuantity": 1
}
```

**응답:**
```json
{
  "ok": true,
  "message": "홍길동님이 닭가슴살을(를) 100kg 입고 처리했습니다",
  "data": {
    "inventory": {
      "id": 123,
      "lot_number": "LOT-20241027-001",
      "quantity": 100,
      "expiration_date": "2025-10-27"
    },
    "receivedBy": {
      "userId": 5,
      "userName": "홍길동",
      "position": "창고 담당"
    },
    "label": {
      "generated": true,
      "labelSize": "large",
      "labelQuantity": 1,
      "labels": [
        {
          "html": "<html>...</html>",
          "labelSize": "large",
          "lotNumber": "LOT-20241027-001",
          "productName": "닭가슴살"
        }
      ],
      "message": "1개의 라벨이 생성되었습니다"
    }
  }
}
```

---

### 3. 여러 개의 라벨 프린트 (Small, 10개)

```http
POST /api/inventory-transactions/receive
Content-Type: application/json

{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "lotNumber": "LOT-20241027-001",
  "wholesalePrice": 50000,
  "quantity": 100,
  "unit": "kg",
  "receivedAt": "2024-10-27T10:00:00Z",
  "printLabel": true,
  "labelSize": "small",
  "labelQuantity": 10
}
```

**응답:**
```json
{
  "ok": true,
  "message": "홍길동님이 닭가슴살을(를) 100kg 입고 처리했습니다",
  "data": {
    "label": {
      "generated": true,
      "labelSize": "small",
      "labelQuantity": 10,
      "labels": [
        {
          "html": "<html>...</html>",
          "labelSize": "small",
          "lotNumber": "LOT-20241027-001",
          "productName": "닭가슴살"
        }
        // ... 총 10개
      ],
      "message": "10개의 라벨이 생성되었습니다"
    }
  }
}
```

---

## 📄 라벨 내용

### Large 라벨 (100mm x 100mm)
- ✅ 제품명
- ✅ 등록번호
- ✅ 성분량
- ✅ 원료의 명칭
- ✅ 제조일자
- ✅ 유통기한
- ✅ 제품수량
- ✅ 바코드 (LOT 번호)
- ✅ 냉동식품 배지
- ✅ 전자레인지 시간

### Medium 라벨 (80mm x 60mm)
- ✅ 제품명
- ✅ 등록번호 (간략)
- ✅ 성분량 (간략)
- ✅ 제조일자
- ✅ 유통기한
- ✅ 제품수량

### Small 라벨 (50mm x 30mm)
- ✅ 제조날짜 (세로 간격)
- ✅ 유통기한 (세로 간격)
- ✅ 제품명 (회전)
- ✅ 바코드

---

## 🎯 사용 시나리오

### 시나리오 1: 원재료 입고 (라벨 불필요)
```javascript
// 원재료는 라벨 없이 입고
{
  "itemId": 1,
  "factoryId": 1,
  "printLabel": false
}
```

### 시나리오 2: 반제품 입고 (Medium 라벨 3개)
```javascript
// 반제품은 중형 라벨로 3개 출력
{
  "itemId": 5,
  "factoryId": 2,
  "printLabel": true,
  "labelSize": "medium",
  "labelQuantity": 3
}
```

### 시나리오 3: 완제품 입고 (Large 라벨 10개)
```javascript
// 완제품은 대형 라벨로 10개 출력
{
  "itemId": 10,
  "factoryId": 3,
  "printLabel": true,
  "labelSize": "large",
  "labelQuantity": 10
}
```

### 시나리오 4: 소량 원재료 (Small 라벨 1개)
```javascript
// 소량 원재료는 소형 라벨 1개
{
  "itemId": 2,
  "factoryId": 1,
  "printLabel": true,
  "labelSize": "small",
  "labelQuantity": 1
}
```

---

## 🔧 라벨 필드 설명

### 입고 요청 필드

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| printLabel | boolean | 아니오 | false | 라벨 프린트 여부 |
| labelSize | string | 아니오 | "large" | 라벨 크기 (large, medium, small) |
| labelQuantity | number | 아니오 | 1 | 라벨 개수 (1-100) |

### 응답 라벨 정보

| 필드 | 타입 | 설명 |
|------|------|------|
| generated | boolean | 라벨 생성 성공 여부 |
| labelSize | string | 생성된 라벨 크기 |
| labelQuantity | number | 생성된 라벨 개수 |
| labels | array | 생성된 라벨 목록 |
| message | string | 결과 메시지 |

### 각 라벨 객체

| 필드 | 타입 | 설명 |
|------|------|------|
| html | string | 라벨 HTML (프린트 가능) |
| labelSize | string | 라벨 크기 |
| lotNumber | string | LOT 번호 |
| productName | string | 제품명 |

---

## 💡 프론트엔드 구현 예시

### React 예시

```jsx
import { useState } from 'react';

function ReceiveInventory() {
  const [printLabel, setPrintLabel] = useState(false);
  const [labelSize, setLabelSize] = useState('large');
  const [labelQuantity, setLabelQuantity] = useState(1);

  const handleReceive = async () => {
    const response = await fetch('/api/inventory-transactions/receive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: 1,
        factoryId: 1,
        storageConditionId: 1,
        lotNumber: 'LOT-20241027-001',
        wholesalePrice: 50000,
        quantity: 100,
        unit: 'kg',
        receivedAt: new Date().toISOString(),
        printLabel,
        labelSize,
        labelQuantity,
      }),
    });

    const result = await response.json();

    if (result.data.label.generated) {
      // 라벨 프린트
      result.data.label.labels.forEach((label, index) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(label.html);
        printWindow.document.close();
        printWindow.print();
      });
    }
  };

  return (
    <div>
      <h2>입고 처리</h2>
      
      {/* 라벨 프린트 옵션 */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={printLabel}
            onChange={(e) => setPrintLabel(e.target.checked)}
          />
          라벨 프린트
        </label>
      </div>

      {printLabel && (
        <>
          <div>
            <label>라벨 크기:</label>
            <select value={labelSize} onChange={(e) => setLabelSize(e.target.value)}>
              <option value="large">대형 (100mm x 100mm)</option>
              <option value="medium">중형 (80mm x 60mm)</option>
              <option value="small">소형 (50mm x 30mm)</option>
            </select>
          </div>

          <div>
            <label>라벨 개수:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={labelQuantity}
              onChange={(e) => setLabelQuantity(Number(e.target.value))}
            />
          </div>
        </>
      )}

      <button onClick={handleReceive}>입고 처리</button>
    </div>
  );
}
```

---

## 🖨️ 라벨 프린트 방법

### 방법 1: 브라우저 프린트

```javascript
// 라벨 HTML을 새 창에서 프린트
function printLabel(labelHtml) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(labelHtml);
  printWindow.document.close();
  printWindow.print();
  printWindow.close();
}
```

### 방법 2: PDF 변환 후 프린트

```javascript
// html2pdf 라이브러리 사용
import html2pdf from 'html2pdf.js';

function printLabelAsPdf(labelHtml) {
  const element = document.createElement('div');
  element.innerHTML = labelHtml;
  
  html2pdf()
    .from(element)
    .set({
      margin: 0,
      filename: `label-${Date.now()}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .save();
}
```

### 방법 3: 직접 프린터로 전송

```javascript
// 프린터 API 사용 (Chrome)
async function printLabelDirect(labelHtml) {
  if (!navigator.printing) {
    console.error('프린터 API를 지원하지 않습니다');
    return;
  }
  
  const blob = new Blob([labelHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  await window.print(url);
  URL.revokeObjectURL(url);
}
```

---

## ⚠️ 주의사항

### 1. 라벨 개수 제한
- 최대 100개까지 한 번에 생성 가능
- 그 이상 필요한 경우 여러 번 요청

### 2. 라벨 생성 실패 시
```json
{
  "label": {
    "generated": false,
    "error": "라벨 생성에 실패했습니다",
    "message": "바코드 생성 실패"
  }
}
```
- 입고는 정상 처리되지만 라벨만 실패
- 나중에 재출력 가능

### 3. 브라우저 호환성
- 프린트 기능은 Chrome, Edge, Firefox 지원
- Safari는 일부 제한될 수 있음

### 4. 라벨 크기 선택 가이드
- **Large**: 완제품, 출고용
- **Medium**: 반제품, 공정 이동용
- **Small**: 원재료, 소량 품목용

---

## 🔄 기존 입고와의 차이

| 구분 | 기존 | 신규 (라벨 포함) |
|------|------|------------------|
| 라벨 프린트 | ❌ 없음 | ✅ 선택 가능 |
| 라벨 크기 | - | ✅ 3가지 선택 |
| 라벨 개수 | - | ✅ 1-100개 |
| 바코드 | - | ✅ 자동 생성 |
| 응답 데이터 | 재고 정보만 | ✅ 재고 + 라벨 |

---

## 📊 통계

라벨 프린트 사용 통계는 추후 추가 예정:
- 일별/월별 라벨 프린트 수
- 라벨 크기별 사용 통계
- 품목별 라벨 프린트 현황

---

## 🎉 완료!

입고 시 라벨 프린트 기능이 준비되었습니다!

### 사용 가능한 기능:
- ✅ 라벨 프린트 선택 (true/false)
- ✅ 라벨 크기 선택 (large/medium/small)
- ✅ 라벨 개수 선택 (1-100개)
- ✅ 바코드 자동 생성
- ✅ HTML 라벨 생성
- ✅ 입고와 동시 처리

**바로 사용 가능합니다!** 🏷️

