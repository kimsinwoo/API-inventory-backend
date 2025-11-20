# 공장-공정 연결 API 가이드

## 개요

이 문서는 공장(Factory)과 공정(Process)을 연결하는 API 사용법을 설명합니다. 공정 이름을 입력하면 자동으로 공정이 생성되고 해당 공장에 추가됩니다.

---

## 목차

1. [공정(Process) 생성](#1-공정process-생성)
2. [공장에 공정 연결](#2-공장에-공정-연결)
3. [공장의 공정 조회](#3-공장의-공정-조회)
4. [공장에서 공정 제거](#4-공장에서-공정-제거)
5. [전체 공정 목록 조회](#5-전체-공정-목록-조회)
6. [전체 워크플로우 예시](#6-전체-워크플로우-예시)
7. [주의사항](#주의사항)

---

## 1. 공정(Process) 생성

### 엔드포인트
```
POST /api/processes
```

### 요청 Body
```json
{
  "name": "공정 이름"
}
```

### 예시 요청
```bash
curl -X POST http://localhost:3000/api/processes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "전처리"
  }'
```

### 응답 (201 Created)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "전처리",
    "created_at": "2025-11-20T02:13:00.000Z",
    "updated_at": "2025-11-20T02:13:00.000Z"
  }
}
```

---

## 2. 공장에 공정 연결

공정 이름을 입력하면 자동으로 공정이 생성되고 공장에 추가됩니다.

### 2.1 공장 생성 시 공정 포함

#### 엔드포인트
```
POST /api/factories
```

#### 요청 Body
```json
{
  "type": "1PreProcessing",
  "name": "1공장",
  "address": "경상북도 의성군 안계면 용기5길 12",
  "processNames": ["전처리", "혼합", "포장"]
}
```

#### 필수 필드
- `type`: `"1PreProcessing"`, `"2Manufacturing"`, `"Warehouse"` 중 하나
- `name`: 공장 이름
- `address`: 주소 (선택)
- `processNames`: 공정 이름 배열 (선택, 공정을 연결할 경우)

#### 예시 요청
```bash
curl -X POST http://localhost:3000/api/factories \
  -H "Content-Type: application/json" \
  -d '{
    "type": "1PreProcessing",
    "name": "1공장",
    "address": "경상북도 의성군 안계면 용기5길 12",
    "processNames": ["전처리", "혼합", "포장"]
  }'
```

#### 응답 (201 Created)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "type": "1PreProcessing",
    "name": "1공장",
    "address": "경상북도 의성군 안계면 용기5길 12",
    "processes": [
      { "id": 1, "name": "전처리" },
      { "id": 2, "name": "혼합" },
      { "id": 3, "name": "포장" }
    ],
    "created_at": "2025-11-20T02:13:00.000Z",
    "updated_at": "2025-11-20T02:13:00.000Z"
  }
}
```

#### 동작 방식
- 각 공정 이름을 확인
- 이름이 없으면 새로 생성
- 이미 있으면 기존 공정 사용
- 해당 공장에 자동 추가

---

### 2.2 기존 공장에 공정 추가

#### 엔드포인트
```
POST /api/factories/:id/processes
```

#### URL Parameters
- `id`: 공장 ID

#### 요청 Body
```json
{
  "processNames": ["전처리", "혼합", "포장"]
}
```

#### 특징
- 중복 추가 방지: 이미 연결된 공정은 제외
- 기존 공정은 유지되고 새 공정만 추가
- 공정 이름이 없으면 자동으로 생성

#### 예시 요청
```bash
curl -X POST http://localhost:3000/api/factories/1/processes \
  -H "Content-Type: application/json" \
  -d '{
    "processNames": ["전처리", "혼합", "포장"]
  }'
```

#### 응답 (200 OK)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "type": "1PreProcessing",
    "name": "1공장",
    "address": "경상북도 의성군 안계면 용기5길 12",
    "processes": [
      { "id": 1, "name": "전처리" },
      { "id": 2, "name": "혼합" },
      { "id": 3, "name": "포장" }
    ],
    "created_at": "2025-11-20T02:13:00.000Z",
    "updated_at": "2025-11-20T02:13:00.000Z"
  }
}
```

#### 에러 응답 (400 Bad Request)
```json
{
  "ok": false,
  "message": "processNames는 비어있지 않은 배열이어야 합니다."
}
```

---

### 2.3 공장 수정 시 공정 교체

#### 엔드포인트
```
PUT /api/factories/:id
```

#### URL Parameters
- `id`: 공장 ID

#### 요청 Body
```json
{
  "name": "수정된 공장명",
  "processNames": ["전처리", "혼합"]
}
```

#### 특징
- `processNames`를 제공하면 기존 공정을 모두 교체
- 빈 배열 `[]`을 보내면 모든 공정 제거
- 각 이름에 대해 공정이 없으면 생성

#### 예시 요청
```bash
curl -X PUT http://localhost:3000/api/factories/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "수정된 공장명",
    "processNames": ["전처리", "혼합"]
  }'
```

#### 응답 (200 OK)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "type": "1PreProcessing",
    "name": "수정된 공장명",
    "address": "경상북도 의성군 안계면 용기5길 12",
    "processes": [
      { "id": 1, "name": "전처리" },
      { "id": 2, "name": "혼합" }
    ],
    "created_at": "2025-11-20T02:13:00.000Z",
    "updated_at": "2025-11-20T02:13:00.000Z"
  }
}
```

---

## 3. 공장의 공정 조회

### 엔드포인트
```
GET /api/factories/:id/processes
```

### URL Parameters
- `id`: 공장 ID

### 예시 요청
```bash
curl -X GET http://localhost:3000/api/factories/1/processes
```

### 응답 (200 OK)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "type": "1PreProcessing",
    "name": "1공장",
    "address": "경상북도 의성군 안계면 용기5길 12",
    "processes": [
      { "id": 1, "name": "전처리" },
      { "id": 2, "name": "혼합" },
      { "id": 3, "name": "포장" }
    ],
    "created_at": "2025-11-20T02:13:00.000Z",
    "updated_at": "2025-11-20T02:13:00.000Z"
  }
}
```

### 에러 응답 (404 Not Found)
```json
{
  "ok": false,
  "message": "Factory not found"
}
```

---

## 4. 공장에서 공정 제거

### 엔드포인트
```
DELETE /api/factories/:id/processes/:processId
```

### URL Parameters
- `id`: 공장 ID
- `processId`: 제거할 공정 ID

### 예시 요청
```bash
curl -X DELETE http://localhost:3000/api/factories/1/processes/2
```

### 응답 (200 OK)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "type": "1PreProcessing",
    "name": "1공장",
    "address": "경상북도 의성군 안계면 용기5길 12",
    "processes": [
      { "id": 1, "name": "전처리" },
      { "id": 3, "name": "포장" }
    ],
    "created_at": "2025-11-20T02:13:00.000Z",
    "updated_at": "2025-11-20T02:13:00.000Z"
  }
}
```

### 에러 응답 (404 Not Found)
```json
{
  "ok": false,
  "message": "Factory or Process not found"
}
```

---

## 5. 전체 공정 목록 조회

### 엔드포인트
```
GET /api/processes
```

### 예시 요청
```bash
curl -X GET http://localhost:3000/api/processes
```

### 응답 (200 OK)
```json
{
  "ok": true,
  "data": [
    { 
      "id": 1, 
      "name": "전처리",
      "created_at": "2025-11-20T02:13:00.000Z",
      "updated_at": "2025-11-20T02:13:00.000Z"
    },
    { 
      "id": 2, 
      "name": "혼합",
      "created_at": "2025-11-20T02:13:00.000Z",
      "updated_at": "2025-11-20T02:13:00.000Z"
    },
    { 
      "id": 3, 
      "name": "포장",
      "created_at": "2025-11-20T02:13:00.000Z",
      "updated_at": "2025-11-20T02:13:00.000Z"
    }
  ]
}
```

---

## 6. 전체 워크플로우 예시

### JavaScript/TypeScript 예시

```javascript
// 1. 공정 이름으로 공장에 공정 추가 (자동 생성)
const addProcessesToFactory = async (factoryId, processNames) => {
  const response = await fetch(`/api/factories/${factoryId}/processes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ processNames })
  });
  
  return response.json();
};

// 사용 예시
await addProcessesToFactory(1, ["전처리", "혼합", "포장"]);
// → 공정이 자동으로 생성되고 공장에 추가됨

// 2. 공장 생성 시 공정 포함
const createFactoryWithProcesses = async (factoryData) => {
  const response = await fetch('/api/factories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: '1PreProcessing',
      name: '1공장',
      address: '경상북도 의성군 안계면 용기5길 12',
      processNames: ['전처리', '혼합', '포장']
    })
  });
  
  return response.json();
};

// 3. 공장의 공정 조회
const getFactoryProcesses = async (factoryId) => {
  const response = await fetch(`/api/factories/${factoryId}/processes`);
  return response.json();
};

// 4. 공장에서 공정 제거
const removeProcessFromFactory = async (factoryId, processId) => {
  const response = await fetch(
    `/api/factories/${factoryId}/processes/${processId}`,
    { method: 'DELETE' }
  );
  return response.json();
};
```

### React 예시

```jsx
import { useState } from 'react';

function FactoryProcessManager({ factoryId }) {
  const [processNames, setProcessNames] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddProcesses = async () => {
    setLoading(true);
    try {
      const names = processNames.split(',').map(name => name.trim()).filter(Boolean);
      
      const response = await fetch(`/api/factories/${factoryId}/processes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processNames: names })
      });

      const result = await response.json();
      
      if (result.ok) {
        alert('공정이 성공적으로 추가되었습니다!');
        setProcessNames('');
        // 공정 목록 새로고침
      } else {
        alert(`오류: ${result.message}`);
      }
    } catch (error) {
      alert('요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={processNames}
        onChange={(e) => setProcessNames(e.target.value)}
        placeholder="공정 이름을 쉼표로 구분하여 입력 (예: 전처리, 혼합, 포장)"
      />
      <button onClick={handleAddProcesses} disabled={loading}>
        {loading ? '추가 중...' : '공정 추가'}
      </button>
    </div>
  );
}
```

---

## 주의사항

### 1. 인증
- 현재 인증 미들웨어가 주석 처리되어 있어 인증 없이 요청 가능
- 프로덕션 환경에서는 인증을 활성화해야 함

### 2. 공정 이름 유효성
- 공정 이름은 빈 문자열이 아니어야 함
- 공정 이름은 자동으로 trim 처리됨
- 동일한 이름의 공정이 이미 존재하면 새로 생성하지 않고 기존 공정 사용

### 3. 중복 방지
- `POST /api/factories/:id/processes`는 중복 추가를 자동으로 방지
- 이미 연결된 공정은 다시 추가되지 않음

### 4. 공장 타입
- `type`은 다음 중 하나여야 함:
  - `"1PreProcessing"`: 1공장 전처리
  - `"2Manufacturing"`: 2공장 제조
  - `"Warehouse"`: 창고

### 5. 요청 형식
- `processNames`는 반드시 배열이어야 함
- 빈 배열은 허용되지 않음 (공장 추가 시)
- 빈 배열을 보내면 에러 발생

### 6. 트랜잭션
- 모든 작업은 트랜잭션으로 처리되어 원자성 보장
- 오류 발생 시 자동 롤백

---

## API 요약

| 메서드 | 엔드포인트 | 설명 | 주요 파라미터 |
|--------|-----------|------|-------------|
| POST | `/api/processes` | 공정 생성 | `name` |
| POST | `/api/factories` | 공장 생성 (공정 포함 가능) | `type`, `name`, `processNames` |
| POST | `/api/factories/:id/processes` | 공장에 공정 추가 | `processNames` |
| PUT | `/api/factories/:id` | 공장 수정 (공정 교체 가능) | `processNames` |
| GET | `/api/factories/:id/processes` | 공장의 공정 조회 | - |
| DELETE | `/api/factories/:id/processes/:processId` | 공장에서 공정 제거 | - |
| GET | `/api/processes` | 전체 공정 목록 조회 | - |

---

## 변경 이력

### 2025-11-20
- 공정 이름으로 자동 생성 및 추가 기능 추가
- `processIds` 대신 `processNames` 사용 가능
- 하위 호환성을 위해 `processIds`도 계속 지원

---

## 문의

추가 질문이나 문제가 있으면 개발팀에 문의하세요.

