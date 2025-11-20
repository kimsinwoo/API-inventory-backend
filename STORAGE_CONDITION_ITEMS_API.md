# 보관 조건-적용 품목 API 가이드

## 개요

이 문서는 보관 조건(StorageCondition)에 적용 품목을 연결하는 API 사용법을 설명합니다. 품목 이름을 입력하면 `applicable_items` 필드에 쉼표로 구분된 문자열 형식으로 저장됩니다.

**저장 형식:** `"신선 육류, 신선 채소류, 반제품"`

---

## 목차

1. [보관 조건 생성 (적용 품목 포함)](#1-보관-조건-생성-적용-품목-포함)
2. [보관 조건에 적용 품목 추가](#2-보관-조건에-적용-품목-추가)
3. [보관 조건 수정 (적용 품목 교체)](#3-보관-조건-수정-적용-품목-교체)
4. [보관 조건에서 적용 품목 제거](#4-보관-조건에서-적용-품목-제거)
5. [보관 조건 조회](#5-보관-조건-조회)
6. [전체 워크플로우 예시](#6-전체-워크플로우-예시)
7. [주의사항](#주의사항)

---

## 1. 보관 조건 생성 (적용 품목 포함)

### 엔드포인트
```
POST /api/storage-conditions
```

### 요청 Body
```json
{
  "name": "냉장 보관관",
  "temperature_range": "0°C ~ 4°C",
  "humidity_range": "85-95%",
  "itemNames": ["신선 육류", "신선 채소류", "반제품"]
}
```

### 필수 필드
- `name`: 보관 조건 이름 (필수)

### 선택 필드
- `temperature_range`: 온도 범위 (예: "0°C ~ 4°C")
- `humidity_range`: 습도 범위 (예: "85-95%")
- `itemNames`: 적용 품목 이름 배열 (선택)

### 예시 요청
```bash
curl -X POST http://localhost:3000/api/storage-conditions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "냉장 보관관",
    "temperature_range": "0°C ~ 4°C",
    "humidity_range": "85-95%",
    "itemNames": ["신선 육류", "신선 채소류", "반제품"]
  }'
```

### 응답 (201 Created)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "냉장 보관관",
    "temperature_range": "0°C ~ 4°C",
    "humidity_range": "85-95%",
    "applicable_items": "신선 육류, 신선 채소류, 반제품",
    "created_at": "2025-11-20T02:13:00.000Z",
    "updated_at": "2025-11-20T02:13:00.000Z"
  }
}
```

### 동작 방식
- `itemNames` 배열의 각 항목을 쉼표와 공백으로 구분하여 `applicable_items` 필드에 저장
- 형식: `"품목1, 품목2, 품목3"`

---

## 2. 보관 조건에 적용 품목 추가

### 엔드포인트
```
POST /api/storage-conditions/:id/items
```

### URL Parameters
- `id`: 보관 조건 ID

### 요청 Body
```json
{
  "itemNames": ["신선 육류", "신선 채소류"]
}
```

### 특징
- 기존 `applicable_items`에 새 품목 추가
- 중복 자동 제거: 이미 존재하는 품목은 다시 추가되지 않음
- 기존 품목은 유지되고 새 품목만 추가

### 예시 요청
```bash
curl -X POST http://localhost:3000/api/storage-conditions/1/items \
  -H "Content-Type: application/json" \
  -d '{
    "itemNames": ["신선 육류", "신선 채소류"]
  }'
```

### 응답 (200 OK)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "냉장 보관관",
    "temperature_range": "0°C ~ 4°C",
    "humidity_range": "85-95%",
    "applicable_items": "완제품, 냉동 육류, 신선 육류, 신선 채소류",
    "created_at": "2025-11-20T02:13:00.000Z",
    "updated_at": "2025-11-20T02:13:00.000Z"
  }
}
```

### 예시 시나리오
- **기존:** `applicable_items = "완제품, 냉동 육류"`
- **추가 요청:** `itemNames = ["신선 육류", "신선 채소류"]`
- **결과:** `applicable_items = "완제품, 냉동 육류, 신선 육류, 신선 채소류"`

### 에러 응답 (400 Bad Request)
```json
{
  "ok": false,
  "message": "itemNames는 비어있지 않은 배열이어야 합니다."
}
```

### 에러 응답 (404 Not Found)
```json
{
  "ok": false,
  "message": "StorageCondition not found"
}
```

---

## 3. 보관 조건 수정 (적용 품목 교체)

### 엔드포인트
```
PUT /api/storage-conditions/:id
```

### URL Parameters
- `id`: 보관 조건 ID

### 요청 Body
```json
{
  "name": "수정된 보관 조건명",
  "temperature_range": "2°C ~ 6°C",
  "humidity_range": "80-90%",
  "itemNames": ["신선 육류", "신선 채소류"]
}
```

### 특징
- `itemNames`를 제공하면 기존 `applicable_items`를 모두 교체
- 빈 배열 `[]`을 보내면 `applicable_items`를 `null`로 설정
- 각 필드는 선택적으로 업데이트 가능

### 예시 요청
```bash
curl -X PUT http://localhost:3000/api/storage-conditions/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "수정된 보관 조건명",
    "itemNames": ["신선 육류", "신선 채소류"]
  }'
```

### 응답 (200 OK)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "수정된 보관 조건명",
    "temperature_range": "0°C ~ 4°C",
    "humidity_range": "85-95%",
    "applicable_items": "신선 육류, 신선 채소류",
    "created_at": "2025-11-20T02:13:00.000Z",
    "updated_at": "2025-11-20T02:13:00.000Z"
  }
}
```

### 예시 시나리오
- **기존:** `applicable_items = "완제품, 냉동 육류, 반제품"`
- **수정 요청:** `itemNames = ["신선 육류", "신선 채소류"]`
- **결과:** `applicable_items = "신선 육류, 신선 채소류"` (완전히 교체됨)

### 에러 응답 (404 Not Found)
```json
{
  "ok": false,
  "message": "NotFound"
}
```

---

## 4. 보관 조건에서 적용 품목 제거

### 엔드포인트
```
DELETE /api/storage-conditions/:id/items
```

### URL Parameters
- `id`: 보관 조건 ID

### 요청 Body
```json
{
  "itemName": "신선 육류"
}
```

### 특징
- `applicable_items`에서 해당 품목만 제거
- 나머지 품목은 유지
- 모든 품목이 제거되면 `applicable_items`가 `null`로 설정

### 예시 요청
```bash
curl -X DELETE http://localhost:3000/api/storage-conditions/1/items \
  -H "Content-Type: application/json" \
  -d '{
    "itemName": "신선 육류"
  }'
```

### 응답 (200 OK)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "냉장 보관관",
    "temperature_range": "0°C ~ 4°C",
    "humidity_range": "85-95%",
    "applicable_items": "신선 채소류, 반제품",
    "created_at": "2025-11-20T02:13:00.000Z",
    "updated_at": "2025-11-20T02:13:00.000Z"
  }
}
```

### 예시 시나리오
- **기존:** `applicable_items = "신선 육류, 신선 채소류, 반제품"`
- **제거 요청:** `itemName = "신선 육류"`
- **결과:** `applicable_items = "신선 채소류, 반제품"`

### 에러 응답 (400 Bad Request)
```json
{
  "ok": false,
  "message": "itemName은 필수입니다."
}
```

### 에러 응답 (404 Not Found)
```json
{
  "ok": false,
  "message": "StorageCondition not found"
}
```

---

## 5. 보관 조건 조회

### 5.1 전체 보관 조건 목록 조회

#### 엔드포인트
```
GET /api/storage-conditions
```

#### 예시 요청
```bash
curl -X GET http://localhost:3000/api/storage-conditions
```

#### 응답 (200 OK)
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "name": "상온 보관관",
      "temperature_range": "15°C ~ 25°C",
      "humidity_range": "40-60%",
      "applicable_items": "완제품, 냉동 육류",
      "created_at": "2025-11-20T02:13:00.000Z",
      "updated_at": "2025-11-20T02:13:00.000Z"
    },
    {
      "id": 2,
      "name": "냉장 보관관",
      "temperature_range": "0°C ~ 4°C",
      "humidity_range": "85-95%",
      "applicable_items": "신선 육류, 신선 채소류, 반제품",
      "created_at": "2025-11-20T02:13:00.000Z",
      "updated_at": "2025-11-20T02:13:00.000Z"
    }
  ]
}
```

---

### 5.2 보관 조건 상세 조회

#### 엔드포인트
```
GET /api/storage-conditions/:id
```

#### URL Parameters
- `id`: 보관 조건 ID

#### 예시 요청
```bash
curl -X GET http://localhost:3000/api/storage-conditions/1
```

#### 응답 (200 OK)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "냉장 보관관",
    "temperature_range": "0°C ~ 4°C",
    "humidity_range": "85-95%",
    "applicable_items": "신선 육류, 신선 채소류, 반제품",
    "created_at": "2025-11-20T02:13:00.000Z",
    "updated_at": "2025-11-20T02:13:00.000Z"
  }
}
```

#### 에러 응답 (404 Not Found)
```json
{
  "ok": false,
  "message": "NotFound"
}
```

---

## 6. 전체 워크플로우 예시

### JavaScript/TypeScript 예시

```javascript
// 1. 보관 조건 생성 시 적용 품목 포함
const createStorageCondition = async (conditionData) => {
  const response = await fetch('/api/storage-conditions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '냉장 보관관',
      temperature_range: '0°C ~ 4°C',
      humidity_range: '85-95%',
      itemNames: ['신선 육류', '신선 채소류', '반제품']
    })
  });
  
  return response.json();
};

// 2. 보관 조건에 적용 품목 추가
const addItemsToStorageCondition = async (conditionId, itemNames) => {
  const response = await fetch(`/api/storage-conditions/${conditionId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemNames })
  });
  
  return response.json();
};

// 사용 예시
await addItemsToStorageCondition(1, ['신선 육류', '신선 채소류']);
// → applicable_items에 자동으로 추가됨 (중복 제거)

// 3. 보관 조건 수정 (적용 품목 교체)
const updateStorageCondition = async (conditionId, updateData) => {
  const response = await fetch(`/api/storage-conditions/${conditionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  
  return response.json();
};

// 사용 예시
await updateStorageCondition(1, {
  name: '수정된 보관 조건명',
  itemNames: ['신선 육류', '신선 채소류']
});
// → applicable_items가 완전히 교체됨

// 4. 보관 조건에서 적용 품목 제거
const removeItemFromStorageCondition = async (conditionId, itemName) => {
  const response = await fetch(`/api/storage-conditions/${conditionId}/items`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemName })
  });
  
  return response.json();
};

// 사용 예시
await removeItemFromStorageCondition(1, '신선 육류');
// → applicable_items에서 해당 품목만 제거됨

// 5. 보관 조건 조회
const getStorageCondition = async (conditionId) => {
  const response = await fetch(`/api/storage-conditions/${conditionId}`);
  return response.json();
};
```

### React 예시

```jsx
import { useState } from 'react';

function StorageConditionItemManager({ conditionId }) {
  const [itemNames, setItemNames] = useState('');
  const [loading, setLoading] = useState(false);
  const [condition, setCondition] = useState(null);

  // 보관 조건 조회
  const fetchCondition = async () => {
    const response = await fetch(`/api/storage-conditions/${conditionId}`);
    const result = await response.json();
    if (result.ok) {
      setCondition(result.data);
    }
  };

  // 적용 품목 추가
  const handleAddItems = async () => {
    setLoading(true);
    try {
      const names = itemNames.split(',').map(name => name.trim()).filter(Boolean);
      
      const response = await fetch(`/api/storage-conditions/${conditionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemNames: names })
      });

      const result = await response.json();
      
      if (result.ok) {
        alert('적용 품목이 성공적으로 추가되었습니다!');
        setItemNames('');
        await fetchCondition(); // 목록 새로고침
      } else {
        alert(`오류: ${result.message}`);
      }
    } catch (error) {
      alert('요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 적용 품목 제거
  const handleRemoveItem = async (itemName) => {
    if (!confirm(`"${itemName}"을(를) 제거하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/storage-conditions/${conditionId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName })
      });

      const result = await response.json();
      
      if (result.ok) {
        alert('적용 품목이 제거되었습니다!');
        await fetchCondition(); // 목록 새로고침
      } else {
        alert(`오류: ${result.message}`);
      }
    } catch (error) {
      alert('요청 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 조회
  useEffect(() => {
    fetchCondition();
  }, [conditionId]);

  return (
    <div>
      <h3>적용 품목 관리</h3>
      
      {/* 현재 적용 품목 표시 */}
      {condition && (
        <div>
          <h4>현재 적용 품목:</h4>
          {condition.applicable_items ? (
            <ul>
              {condition.applicable_items.split(', ').map((item, index) => (
                <li key={index}>
                  {item}
                  <button onClick={() => handleRemoveItem(item)}>제거</button>
                </li>
              ))}
            </ul>
          ) : (
            <p>적용 품목이 없습니다.</p>
          )}
        </div>
      )}

      {/* 적용 품목 추가 */}
      <div>
        <input
          type="text"
          value={itemNames}
          onChange={(e) => setItemNames(e.target.value)}
          placeholder="품목 이름을 쉼표로 구분하여 입력 (예: 신선 육류, 신선 채소류)"
        />
        <button onClick={handleAddItems} disabled={loading}>
          {loading ? '추가 중...' : '적용 품목 추가'}
        </button>
      </div>
    </div>
  );
}
```

---

## 주의사항

### 1. 인증
- 현재 인증 미들웨어가 주석 처리되어 있어 인증 없이 요청 가능
- 프로덕션 환경에서는 인증을 활성화해야 함

### 2. 데이터 형식
- `applicable_items`는 쉼표와 공백으로 구분된 문자열 형식
- 형식: `"품목1, 품목2, 품목3"`
- 빈 값이면 `null`로 저장

### 3. 중복 처리
- `POST /api/storage-conditions/:id/items`는 중복 추가를 자동으로 방지
- 이미 존재하는 품목은 다시 추가되지 않음

### 4. 품목 제거
- 품목 제거 시 해당 품목만 제거되고 나머지는 유지
- 모든 품목이 제거되면 `applicable_items`가 `null`로 설정

### 5. 요청 형식
- `itemNames`는 반드시 배열이어야 함
- 빈 배열은 허용됨 (수정 시 모든 품목 제거)
- `itemName`은 문자열이어야 함 (제거 시)

### 6. 문자열 길이 제한
- `applicable_items` 필드는 `STRING(100)` 타입
- 최대 100자까지 저장 가능
- 긴 품목 목록은 잘릴 수 있음

---

## API 요약

| 메서드 | 엔드포인트 | 설명 | 주요 파라미터 |
|--------|-----------|------|-------------|
| POST | `/api/storage-conditions` | 보관 조건 생성 (적용 품목 포함 가능) | `name`, `itemNames` |
| POST | `/api/storage-conditions/:id/items` | 보관 조건에 적용 품목 추가 | `itemNames` |
| PUT | `/api/storage-conditions/:id` | 보관 조건 수정 (적용 품목 교체 가능) | `itemNames` |
| DELETE | `/api/storage-conditions/:id/items` | 보관 조건에서 적용 품목 제거 | `itemName` |
| GET | `/api/storage-conditions` | 전체 보관 조건 목록 조회 | - |
| GET | `/api/storage-conditions/:id` | 보관 조건 상세 조회 | - |
| DELETE | `/api/storage-conditions/:id` | 보관 조건 삭제 | - |

---

## 데이터 형식 예시

### 저장 형식
```json
{
  "applicable_items": "신선 육류, 신선 채소류, 반제품"
}
```

### 요청 형식
```json
{
  "itemNames": ["신선 육류", "신선 채소류", "반제품"]
}
```

### 변환 규칙
- **요청 → 저장:** 배열을 쉼표와 공백으로 구분된 문자열로 변환
  - `["신선 육류", "신선 채소류"]` → `"신선 육류, 신선 채소류"`
- **저장 → 표시:** 문자열을 쉼표와 공백으로 분리하여 배열로 변환
  - `"신선 육류, 신선 채소류"` → `["신선 육류", "신선 채소류"]`

---

## 변경 이력

### 2025-11-20
- 적용 품목을 텍스트 형식으로 저장하는 기능 추가
- `itemNames` 배열을 쉼표로 구분된 문자열로 변환하여 저장
- 적용 품목 추가/제거 기능 추가

---

## 문의

추가 질문이나 문제가 있으면 개발팀에 문의하세요.

