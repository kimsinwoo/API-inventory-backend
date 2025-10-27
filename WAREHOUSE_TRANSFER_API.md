# 공장/창고 간 이동 API 문서

## 개요

공장과 창고 간의 재고 이동을 관리하는 API입니다.

**기본 URL**: `/api/warehouse-transfers`

## 주요 기능

✅ **공장 → 공장** - 전처리 → 제조 공정 이동  
✅ **공장 → 창고** - 제조 완료 후 창고 입고  
✅ **창고 → 공장** - 창고에서 공장으로 재출고  
✅ **창고 → 창고** - 창고 간 이동  
✅ **이동 이력** - 상세 조회 및 필터링  
✅ **경로 통계** - 이동 경로별 통계

---

## 🏭 공장/창고 타입

| 타입 | 값 | 설명 |
|------|------|------|
| 1공장(전처리) | `1PreProcessing` | 원재료 전처리 |
| 2공장(제조) | `2Manufacturing` | 제품 제조 |
| 창고 | `Warehouse` | 완제품 보관 |

---

## 🔐 인증

모든 API는 **세션 인증**이 필요합니다.

---

## 📋 API 엔드포인트

### 1. 공장/창고 간 이동

```http
POST /api/warehouse-transfers
```

**Request Body:**
```json
{
  "itemId": 1,
  "sourceLocationId": 1,
  "destLocationId": 2,
  "storageConditionId": 1,
  "quantity": 50,
  "unit": "kg",
  "transferType": "PRODUCTION",
  "note": "전처리 완료"
}
```

**필수 필드:**
- `itemId` (number): 품목 ID
- `sourceLocationId` (number): 출발지 ID (공장 또는 창고)
- `destLocationId` (number): 도착지 ID (공장 또는 창고)
- `storageConditionId` (number): 보관 조건 ID
- `quantity` (number): 이동 수량
- `unit` (string): 단위

**선택 필드:**
- `transferType` (string): 이동 유형
  - `PRODUCTION`: 생산 공정 이동
  - `WAREHOUSE_IN`: 창고 입고
  - `WAREHOUSE_OUT`: 창고 출고
  - `RESTOCK`: 재입고
  - `OTHER`: 기타
- `note` (string): 비고

**응답 예시:**
```json
{
  "ok": true,
  "message": "홍길동님이 닭가슴살을(를) 1공장(전처리)에서 2공장(제조)(으)로 50kg 이동했습니다",
  "data": {
    "moved": 50,
    "newLotId": 456,
    "newLotNumber": "TR-1-1698765432000",
    "traces": [
      {
        "lotNumber": "LOT-20241027-001",
        "lotId": 123,
        "take": 50,
        "expirationDate": "2025-10-27"
      }
    ],
    "movementType": "전처리 → 제조",
    "sourceLocation": {
      "id": 1,
      "name": "1공장",
      "type": "1PreProcessing",
      "typeLabel": "1공장(전처리)"
    },
    "destLocation": {
      "id": 2,
      "name": "2공장",
      "type": "2Manufacturing",
      "typeLabel": "2공장(제조)"
    },
    "transferredBy": {
      "userId": 5,
      "userName": "홍길동",
      "position": "생산 관리"
    }
  }
}
```

---

### 2. 이동 이력 조회

```http
GET /api/warehouse-transfers/history?page=1&limit=20
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| itemId | number | 아니오 | 품목 ID |
| locationId | number | 아니오 | 공장/창고 ID (출발 또는 도착) |
| sourceType | string | 아니오 | 출발지 타입 (1PreProcessing, 2Manufacturing, Warehouse) |
| destType | string | 아니오 | 도착지 타입 (1PreProcessing, 2Manufacturing, Warehouse) |
| startDate | string | 아니오 | 시작일 (ISO 8601) |
| endDate | string | 아니오 | 종료일 (ISO 8601) |
| page | number | 아니오 | 페이지 번호 (기본: 1) |
| limit | number | 아니오 | 페이지당 항목 수 (기본: 20, 최대: 100) |

**응답 예시:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "time": "2024-10-27 14:30:00",
      "type": "이동(출발)",
      "typeRaw": "TRANSFER_OUT",
      "item": {
        "id": 1,
        "code": "ITEM-001",
        "name": "닭가슴살",
        "category": "RawMaterial"
      },
      "lotNumber": "LOT-20241027-001",
      "quantity": 50,
      "unit": "kg",
      "sourceLocation": {
        "id": 1,
        "name": "1공장",
        "type": "1PreProcessing",
        "typeLabel": "1공장(전처리)"
      },
      "destLocation": {
        "id": 2,
        "name": "2공장",
        "type": "2Manufacturing",
        "typeLabel": "2공장(제조)"
      },
      "actorName": "홍길동",
      "note": "전처리 완료 (전처리 → 제조, PRODUCTION)",
      "occurredAt": "2024-10-27T14:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 3. 이동 경로 통계

```http
GET /api/warehouse-transfers/path-stats?startDate=2024-10-01T00:00:00Z&endDate=2024-10-31T23:59:59Z
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| startDate | string | 아니오 | 시작일 (ISO 8601) |
| endDate | string | 아니오 | 종료일 (ISO 8601) |

**응답 예시:**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalPaths": 5,
      "totalTransfers": 245
    },
    "paths": [
      {
        "path": "1공장(1공장(전처리)) → 2공장(2공장(제조))",
        "count": 120,
        "totalQuantity": 5000,
        "sourceLocation": {
          "id": 1,
          "name": "1공장",
          "type": "1PreProcessing",
          "typeLabel": "1공장(전처리)"
        },
        "destLocation": {
          "id": 2,
          "name": "2공장",
          "type": "2Manufacturing",
          "typeLabel": "2공장(제조)"
        }
      },
      {
        "path": "2공장(2공장(제조)) → 중앙창고(창고)",
        "count": 80,
        "totalQuantity": 3200,
        "sourceLocation": {
          "id": 2,
          "name": "2공장",
          "type": "2Manufacturing",
          "typeLabel": "2공장(제조)"
        },
        "destLocation": {
          "id": 3,
          "name": "중앙창고",
          "type": "Warehouse",
          "typeLabel": "창고"
        }
      }
    ]
  }
}
```

---

## 📊 사용 시나리오

### 시나리오 1: 전처리 → 제조 공정 이동

```javascript
// 1공장(전처리)에서 전처리 완료 후 2공장(제조)으로 이동
POST /api/warehouse-transfers
{
  "itemId": 1,
  "sourceLocationId": 1,    // 1공장(전처리)
  "destLocationId": 2,      // 2공장(제조)
  "storageConditionId": 2,
  "quantity": 50,
  "unit": "kg",
  "transferType": "PRODUCTION",
  "note": "전처리 완료, 제조 준비"
}
```

### 시나리오 2: 제조 완료 후 창고 입고

```javascript
// 2공장(제조)에서 제조 완료 후 창고로 입고
POST /api/warehouse-transfers
{
  "itemId": 10,
  "sourceLocationId": 2,    // 2공장(제조)
  "destLocationId": 3,      // 창고
  "storageConditionId": 1,
  "quantity": 100,
  "unit": "EA",
  "transferType": "WAREHOUSE_IN",
  "note": "제조 완료, 창고 입고"
}
```

### 시나리오 3: 창고에서 재출고

```javascript
// 창고에서 공장으로 재출고
POST /api/warehouse-transfers
{
  "itemId": 5,
  "sourceLocationId": 3,    // 창고
  "destLocationId": 2,      // 2공장(제조)
  "storageConditionId": 2,
  "quantity": 30,
  "unit": "kg",
  "transferType": "WAREHOUSE_OUT",
  "note": "추가 생산 요청"
}
```

### 시나리오 4: 이동 경로 분석

```javascript
// 1공장 → 2공장 이동만 조회
GET /api/warehouse-transfers/history?sourceType=1PreProcessing&destType=2Manufacturing

// 특정 기간 이동 경로 통계
GET /api/warehouse-transfers/path-stats?startDate=2024-10-01T00:00:00Z&endDate=2024-10-31T23:59:59Z
```

---

## 🔄 이동 경로 예시

### 일반적인 흐름

```
원재료 입고
    ↓
1공장(전처리)
    ↓ [전처리 완료]
2공장(제조)
    ↓ [제조 완료]
창고(완제품)
    ↓ [주문 발생]
출고
```

### 가능한 이동 경로

| 출발 | 도착 | 설명 |
|------|------|------|
| 1공장(전처리) | 2공장(제조) | 전처리 → 제조 |
| 2공장(제조) | 창고 | 제조 완료 → 창고 입고 |
| 창고 | 2공장(제조) | 창고 → 추가 생산 |
| 창고 | 1공장(전처리) | 창고 → 재가공 |
| 2공장(제조) | 1공장(전처리) | 제조 → 재전처리 |
| 창고 | 창고 | 창고 간 이동 |

---

## ⚠️ 에러 코드

| 상태 코드 | 메시지 | 설명 |
|-----------|--------|------|
| 400 | 입력값 검증 실패 | 필수 필드 누락 또는 형식 오류 |
| 400 | 출발지와 도착지가 동일합니다 | 같은 위치로 이동 불가 |
| 401 | 인증 필요 | 로그인 필요 |
| 404 | 출발지를 찾을 수 없습니다 | 존재하지 않는 공장/창고 |
| 404 | 도착지를 찾을 수 없습니다 | 존재하지 않는 공장/창고 |
| 500 | 재고가 부족합니다 | 이동 불가능 |

---

## 💡 주요 특징

### 1. 자동 경로 감지 🎯
```javascript
// 출발/도착 타입에 따라 자동으로 경로 설명 생성
"전처리 → 제조"
"제조 → 창고"
"창고 → 제조"
```

### 2. FIFO 출고 📦
```javascript
// 출발지에서 유통기한 빠른 순서로 자동 출고
{
  "traces": [
    { "lotNumber": "LOT-001", "take": 30 },
    { "lotNumber": "LOT-002", "take": 20 }
  ]
}
```

### 3. 사용자 정보 자동 기록 👤
```javascript
{
  "transferredBy": {
    "userId": 5,
    "userName": "홍길동",
    "position": "생산 관리"
  }
}
```

### 4. 경로 통계 📊
```javascript
// 어떤 경로가 가장 많이 사용되는지 분석
{
  "paths": [
    {
      "path": "1공장 → 2공장",
      "count": 120,
      "totalQuantity": 5000
    }
  ]
}
```

---

## 🔗 관련 API

- [입고/출고 트랜잭션 API](/api/inventory-transactions) - 입고/출고 관리
- [재고 관리 API](/api/inventories) - 재고 현황
- [공장 관리 API](/api/factories) - 공장/창고 정보

---

## 📝 마이그레이션 필요

Factory 테이블에 "Warehouse" 타입을 추가하려면 마이그레이션이 필요합니다:

```sql
ALTER TABLE Factories 
MODIFY COLUMN type ENUM('1PreProcessing', '2Manufacturing', 'Warehouse') NOT NULL;
```

또는 Sequelize CLI:
```bash
npx sequelize-cli migration:generate --name add-warehouse-type-to-factories
```

---

**공장/창고 간 이동 API 준비 완료!** 🎉

