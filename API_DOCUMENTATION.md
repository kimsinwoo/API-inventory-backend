# 📚 Inventory Management Backend API Documentation

**Base URL**: `http://localhost:4000/api`

---

## 📋 목차

1. [인증 (`/api/auth`)](#1-인증-apiauth)
2. [품목 (`/api/items`)](#2-품목-apitems)
3. [재고 (`/api/inventories`)](#3-재고-apiinventories)
4. [트랜잭션 (`/api/inventory-transactions`)](#4-트랜잭션-apiinventory-transactions)
5. [예정 트랜잭션 (`/api/planned-transactions`)](#5-예정-트랜잭션-apiplanned-transactions)
6. [공장 (`/api/factories`)](#6-공장-apifactories)
7. [BOM (`/api/boms`)](#7-bom-apiboms)
8. [보관 조건 (`/api/storage-conditions`)](#8-보관-조건-apistorage-conditions)
9. [창고 이동 (`/api/warehouse-transfers`)](#9-창고-이동-apiwarehouse-transfers)
10. [작업 지시서 (`/api/work-orders`)](#10-작업-지시서-apiwork-orders)
11. [전자결재 (`/api/approval`)](#11-전자결재-apiapproval)
12. [대시보드 (`/api/dashboard`)](#12-대시보드-apidashboard)
13. [배송 (`/api/shipping`)](#13-배송-apishipping)
14. [라벨 (`/api/label`)](#14-라벨-apilabel)

---

## 1) 인증 (`/api/auth`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **POST** `/auth/login` | `{ username: string; password: string }` | - | ❌ | 세션 발급 |
| **POST** `/auth/join` | `{ username: string; password: string; full_name: string; phone_number: string; email: string; hire_date?: Date; position?: string; department?: string; role?: string }` | - | ❌ | 회원가입 |
| **POST** `/auth/logout` | `{}` | - | ✅ | 로그아웃 |
| **GET** `/auth/me` | - | - | ✅ | 현재 사용자 |
| **GET** `/auth/` | - | - | ✅ | 사용자 목록 |
| **GET** `/auth/:id` | - | - | ✅ | 사용자 상세 |
| **PUT** `/auth/:id` | `{ full_name?: string; phone_number?: string; email?: string; hire_date?: Date; position?: string; department?: string; role?: string }` | - | ✅ | 업데이트 |
| **DELETE** `/auth/:id` | `{}` | - | ✅ | 삭제 |

### 응답 형식

**성공 응답:**
```json
{
  "message": "성공 메시지",
  "user": { ... }
}
```

---

## 2) 품목 (`/api/items`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **GET** `/items` | - | - | ❌ | 전체 목록 |
| **GET** `/items/id/:id` | - | - | ❌ | ID로 조회 |
| **GET** `/items/code/:code` | - | - | ❌ | 코드로 조회 |
| **POST** `/items` | `{ code: string; name: string; category: "RawMaterial" | "SemiFinished" | "Finished" | "Supply"; factoryId: number; unit: "kg" | "g" | "EA" | "BOX" | "PCS"; shortage?: number; shelfLife?: number; wholesalePrice?: number }` | - | ❌ | 생성 |
| **PATCH** `/items/:id` | `{ code?: string; name?: string; category?: string; factoryId?: number; unit?: string; shortage?: number; shelfLife?: number; wholesalePrice?: number }` | - | ❌ | 수정 |
| **DELETE** `/items/:id` | `{}` | - | ❌ | 삭제 |

### 요청 바디 상세

**POST /items**
```json
{
  "code": "RM001",
  "name": "원재료A",
  "category": "RawMaterial",
  "factoryId": 1,
  "unit": "kg",
  "shortage": 5,
  "shelfLife": 30,
  "wholesalePrice": 10000
}
```

**카테고리 값:**
- `RawMaterial` (원재료)
- `SemiFinished` (반제품)
- `Finished` (완제품)
- `Supply` (소모품)

**단위 값:**
- `kg`, `g`, `EA`, `BOX`, `PCS`

### 응답 형식

**성공 응답:**
```json
{
  "ok": true,
  "message": "품목이 성공적으로 생성되었습니다",
  "data": {
    "id": 1,
    "code": "RM001",
    "name": "원재료A",
    "category": "RawMaterial",
    "unit": "kg",
    "factory_id": 1,
    "Factory": {
      "id": 1,
      "name": "공장A",
      "type": "1PreProcessing"
    }
  }
}
```

---

## 3) 재고 (`/api/inventories`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **GET** `/inventories` | - | `itemId?: number; factoryId?: number; status?: "Normal" | "LowStock" | "Expiring" | "Expired"; category?: string; search?: string; page?: number; limit?: number` | ❌ | 현황/상태 |
| **GET** `/inventories/summary` | - | `factoryId?: number` | ❌ | 요약 |
| **GET** `/inventories/utilization` | - | - | ❌ | 이용률 |
| **GET** `/inventories/movements` | - | `itemId?: number; factoryId?: number; from?: string (ISO datetime); to?: string (ISO datetime); page?: number; limit?: number` | ❌ | 이동 이력 |
| **POST** `/inventories/receive` | `{ itemId: number; factoryId: number; storageConditionId: number; lotNumber: string; wholesalePrice: number; quantity: number; unit: string; receivedAt: Date; firstReceivedAt?: Date; note?: string; actorName?: string }` | - | ❌ | 입고 |
| **POST** `/inventories/issue` | `{ itemId: number; factoryId: number; quantity: number; unit: string; note?: string; actorName?: string }` | - | ❌ | 출고 |
| **POST** `/inventories/transfer` | `{ itemId: number; sourceFactoryId: number; destFactoryId: number; storageConditionId: number; quantity: number; unit: string; note?: string; actorName?: string }` | - | ❌ | 공장간 이동 |
| **DELETE** `/inventories/:id` | `{}` | - | ❌ | 삭제 |

### 요청 바디 상세

**POST /inventories/receive**
```json
{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "lotNumber": "LOT001",
  "wholesalePrice": 10000,
  "quantity": 100,
  "unit": "kg",
  "receivedAt": "2025-10-23T10:00:00.000Z",
  "firstReceivedAt": "2025-10-23T10:00:00.000Z",
  "note": "입고 비고",
  "actorName": "홍길동"
}
```

**POST /inventories/issue**
```json
{
  "itemId": 1,
  "factoryId": 1,
  "quantity": 50,
  "unit": "kg",
  "note": "출고 비고",
  "actorName": "홍길동"
}
```

**POST /inventories/transfer**
```json
{
  "itemId": 1,
  "sourceFactoryId": 1,
  "destFactoryId": 2,
  "storageConditionId": 1,
  "quantity": 30,
  "unit": "kg",
  "note": "이동 비고",
  "actorName": "홍길동"
}
```

### 응답 형식

**GET /inventories 응답:**
```json
{
  "ok": true,
  "data": [...],
  "meta": {
    "summary": { ... },
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

## 4) 트랜잭션 (`/api/inventory-transactions`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **GET** `/inventory-transactions` | - | `type?: "RECEIVE" | "ISSUE" | "TRANSFER" | "ALL"; itemId?: number; factoryId?: number; startDate?: string (ISO datetime); endDate?: string (ISO datetime); userId?: number; page?: number; limit?: number` | ❌ | 목록 |
| **GET** `/inventory-transactions/:id` | - | - | ❌ | 상세 |
| **GET** `/inventory-transactions/stats` | - | `factoryId?: number; startDate?: string (ISO datetime); endDate?: string (ISO datetime); groupBy?: "day" | "week" | "month"` | ❌ | 통계 |
| **GET** `/inventory-transactions/monthly-utilization` | - | `factoryId?: number; year: number; month: number` | ❌ | 월별 이용률 |
| **POST** `/inventory-transactions/receive` | `{ itemId: number; factoryId: number; storageConditionId: number; wholesalePrice: number; quantity: number; unit: string; receivedAt: Date; firstReceivedAt?: Date; note?: string; printLabel?: boolean; labelSize?: "large" | "medium" | "small"; labelQuantity?: number }` | - | ❌ | 입고 |
| **POST** `/inventory-transactions/issue` | `{ itemId: number; factoryId: number; quantity: number; unit: string; issueType?: "PRODUCTION" | "SHIPPING" | "DAMAGE" | "OTHER"; shippingInfo?: { recipientName?: string; recipientPhone?: string; recipientAddress?: string; shippingCompany?: string; trackingNumber?: string }; note?: string }` | - | ❌ | 출고 |
| **POST** `/inventory-transactions/batch-issue` | `{ transactions: Array<{ itemId: number; factoryId: number; quantity: number; unit: string; recipientName: string; recipientPhone?: string; recipientAddress: string; shippingCompany?: string; trackingNumber?: string; note?: string }> }` | - | ❌ | 일괄 출고 |
| **POST** `/inventory-transactions/transfer` | `{ itemId: number; sourceFactoryId: number; destFactoryId: number; storageConditionId: number; quantity: number; unit: string; transferType?: "PRODUCTION" | "RESTOCK" | "OTHER"; note?: string }` | - | ❌ | 공장간 이동 |

### 요청 바디 상세

**POST /inventory-transactions/receive**
```json
{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "wholesalePrice": 10000,
  "quantity": 100,
  "unit": "kg",
  "receivedAt": "2025-10-23T10:00:00.000Z",
  "firstReceivedAt": "2025-10-23T10:00:00.000Z",
  "note": "입고 비고",
  "printLabel": true,
  "labelSize": "large",
  "labelQuantity": 1
}
```

**POST /inventory-transactions/issue**
```json
{
  "itemId": 1,
  "factoryId": 1,
  "quantity": 50,
  "unit": "kg",
  "issueType": "SHIPPING",
  "shippingInfo": {
    "recipientName": "홍길동",
    "recipientPhone": "010-1234-5678",
    "recipientAddress": "서울시 강남구",
    "shippingCompany": "CJ대한통운",
    "trackingNumber": "1234567890"
  },
  "note": "출고 비고"
}
```

**POST /inventory-transactions/batch-issue**
```json
{
  "transactions": [
    {
      "itemId": 1,
      "factoryId": 1,
      "quantity": 50,
      "unit": "kg",
      "recipientName": "홍길동",
      "recipientPhone": "010-1234-5678",
      "recipientAddress": "서울시 강남구",
      "shippingCompany": "CJ대한통운",
      "trackingNumber": "1234567890",
      "note": "배송 비고"
    }
  ]
}
```

**POST /inventory-transactions/transfer**
```json
{
  "itemId": 1,
  "sourceFactoryId": 1,
  "destFactoryId": 2,
  "storageConditionId": 1,
  "quantity": 30,
  "unit": "kg",
  "transferType": "RESTOCK",
  "note": "이동 비고"
}
```

### 응답 형식

**POST /inventory-transactions/receive 응답:**
```json
{
  "ok": true,
  "message": "입고 처리 완료",
  "data": {
    "inventory": { ... },
    "receivedBy": { ... },
    "label": { ... }
  }
}
```

---

## 5) 예정 트랜잭션 (`/api/planned-transactions`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **GET** `/planned-transactions` | - | `transactionType?: "RECEIVE" | "ISSUE" | "ALL"; status?: "PENDING" | "APPROVED" | "COMPLETED" | "CANCELLED" | "ALL"; itemId?: number; factoryId?: number; startDate?: string (ISO datetime); endDate?: string (ISO datetime); page?: number; limit?: number` | ❌ | 목록 |
| **GET** `/planned-transactions/:id` | - | - | ❌ | 상세 |
| **GET** `/planned-transactions/stats` | - | `factoryId?: number; startDate?: string (ISO datetime); endDate?: string (ISO datetime)` | ❌ | 통계 |
| **POST** `/planned-transactions` | `{ transactionType: "RECEIVE" | "ISSUE"; itemId: number; factoryId: number; quantity: number; unit?: string; scheduledDate: Date; supplierName?: string; barcode?: string (14자리); wholesalePrice?: number; storageConditionId?: number; customerName?: string; issueType?: "PRODUCTION" | "SHIPPING" | "DAMAGE" | "OTHER"; shippingAddress?: string; notes?: string }` | - | ❌ | 생성 |
| **PUT** `/planned-transactions/:id` | `{ quantity?: number; unit?: string; scheduledDate?: Date; supplierName?: string; barcode?: string; wholesalePrice?: number; storageConditionId?: number; customerName?: string; issueType?: string; shippingAddress?: string; notes?: string }` | - | ❌ | 수정 |
| **DELETE** `/planned-transactions/:id` | `{}` | - | ❌ | 삭제 |
| **POST** `/planned-transactions/:id/approve` | `{ comment?: string }` | - | ❌ | 승인 |
| **POST** `/planned-transactions/:id/reject` | `{ rejectionReason: string }` | - | ❌ | 반려 |
| **POST** `/planned-transactions/:id/complete-receive` | `{ receivedAt?: Date; actualQuantity?: number; actualLotNumber?: string; note?: string }` | - | ❌ | 예정 입고 완료 |
| **POST** `/planned-transactions/:id/complete-issue` | `{ actualQuantity?: number; shippingInfo?: { recipientName?: string; recipientPhone?: string; recipientAddress?: string; shippingCompany?: string; trackingNumber?: string }; note?: string }` | - | ❌ | 예정 출고 완료 |

### 요청 바디 상세

**POST /planned-transactions (입고 예정)**
```json
{
  "transactionType": "RECEIVE",
  "itemId": 1,
  "factoryId": 1,
  "quantity": 100,
  "unit": "kg",
  "scheduledDate": "2025-10-30T10:00:00.000Z",
  "supplierName": "공급업체A",
  "barcode": "12345678901234",
  "wholesalePrice": 10000,
  "storageConditionId": 1,
  "notes": "입고 예정 비고"
}
```

**POST /planned-transactions (출고 예정)**
```json
{
  "transactionType": "ISSUE",
  "itemId": 1,
  "factoryId": 1,
  "quantity": 50,
  "unit": "kg",
  "scheduledDate": "2025-10-30T10:00:00.000Z",
  "customerName": "고객A",
  "issueType": "SHIPPING",
  "shippingAddress": "서울시 강남구",
  "notes": "출고 예정 비고"
}
```

### 응답 형식

**성공 응답:**
```json
{
  "ok": true,
  "message": "입고 예정이 등록되었습니다",
  "data": {
    "id": 1,
    "transaction_type": "RECEIVE",
    "item_id": 1,
    "factory_id": 1,
    "quantity": "100.00",
    "status": "PENDING",
    "scheduled_date": "2025-10-30T10:00:00.000Z"
  }
}
```

---

## 6) 공장 (`/api/factories`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **GET** `/factories` | - | - | ❌ | 목록 |
| **GET** `/factories/:id` | - | - | ❌ | 상세 |
| **POST** `/factories` | `{ name: string; type: "1PreProcessing" | "2Manufacturing"; address?: string }` | - | ❌ | 생성 |
| **PUT** `/factories/:id` | `{ name?: string; type?: string; address?: string }` | - | ❌ | 수정 |
| **DELETE** `/factories/:id` | `{}` | - | ❌ | 삭제 |
| **GET** `/factories/:id/processes` | - | - | ❌ | 공장의 프로세스 조회 |
| **POST** `/factories/:id/processes` | `{ processIds: number[] }` | - | ❌ | 프로세스 추가 |
| **DELETE** `/factories/:id/processes/:processId` | `{}` | - | ❌ | 프로세스 제거 |

### 요청 바디 상세

**POST /factories**
```json
{
  "name": "공장A",
  "type": "1PreProcessing",
  "address": "서울시 강남구"
}
```

**POST /factories/:id/processes**
```json
{
  "processIds": [1, 2, 3]
}
```

### 응답 형식

**성공 응답:**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "공장A",
    "type": "1PreProcessing",
    "address": "서울시 강남구"
  }
}
```

---

## 7) BOM (`/api/boms`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **GET** `/boms` | - | `search?: string; page?: number; limit?: number` | ❌ | 목록 |
| **GET** `/boms/:id` | - | - | ❌ | 상세 |
| **POST** `/boms` | `{ name: string; description?: string; lines: Array<{ itemId?: number; itemCode?: string; quantity: number; unit: string; lossRate?: number }> }` | - | ❌ | 생성 |
| **PUT** `/boms/:id` | `{ name?: string; description?: string; lines?: Array<{ itemId?: number; itemCode?: string; quantity: number; unit: string; lossRate?: number }> }` | - | ❌ | 수정 |
| **DELETE** `/boms/:id` | `{}` | - | ❌ | 삭제 |

### 요청 바디 상세

**POST /boms**
```json
{
  "name": "제품A BOM",
  "description": "완제품 A의 자재 명세서",
  "lines": [
    {
      "itemId": 5,
      "quantity": 10.5,
      "unit": "kg",
      "lossRate": 0.05
    },
    {
      "itemCode": "RM002",
      "quantity": 3,
      "unit": "EA",
      "lossRate": 0.02
    }
  ]
}
```

**참고:**
- `itemId` 또는 `itemCode` 중 하나는 필수
- `lines` 배열은 최소 1개 이상 필요
- `quantity`는 0보다 큰 숫자
- `unit`은 필수

### 응답 형식

**성공 응답:**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "제품A BOM",
    "description": "완제품 A의 자재 명세서",
    "components": [
      {
        "id": 1,
        "quantity": "10.500",
        "unit": "kg",
        "sort_order": 1,
        "loss_rate": "0.0500",
        "item": {
          "id": 5,
          "code": "RM001",
          "name": "원재료A",
          "category": "RawMaterial"
        }
      }
    ]
  }
}
```

---

## 8) 보관 조건 (`/api/storage-conditions`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **GET** `/storage-conditions` | - | - | ❌ | 목록 |
| **GET** `/storage-conditions/:id` | - | - | ❌ | 상세 |
| **POST** `/storage-conditions` | `{ name: string; temperature_range?: string; humidity_range?: string }` | - | ❌ | 생성 |
| **PUT** `/storage-conditions/:id` | `{ name?: string; temperature_range?: string; humidity_range?: string }` | - | ❌ | 수정 |
| **DELETE** `/storage-conditions/:id` | `{}` | - | ❌ | 삭제 |

### 요청 바디 상세

**POST /storage-conditions**
```json
{
  "name": "냉장",
  "temperature_range": "0~5℃",
  "humidity_range": "40~60%"
}
```

### 응답 형식

**성공 응답:**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "냉장",
    "temperature_range": "0~5℃",
    "humidity_range": "40~60%"
  }
}
```

---

## 9) 창고 이동 (`/api/warehouse-transfers`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **GET** `/warehouse-transfers/history` | - | `itemId?: number; locationId?: number; sourceType?: "1PreProcessing" | "2Manufacturing" | "Warehouse"; destType?: "1PreProcessing" | "2Manufacturing" | "Warehouse"; startDate?: string (ISO datetime); endDate?: string (ISO datetime); page?: number; limit?: number` | ✅ | 이동 이력 |
| **GET** `/warehouse-transfers/path-stats` | - | `startDate?: string (ISO datetime); endDate?: string (ISO datetime)` | ✅ | 이동 경로 통계 |
| **POST** `/warehouse-transfers` | `{ itemId: number; sourceLocationId: number; destLocationId: number; storageConditionId: number; quantity: number; unit: string; transferType?: "PRODUCTION" | "WAREHOUSE_IN" | "WAREHOUSE_OUT" | "RESTOCK" | "OTHER"; note?: string }` | - | ✅ | 창고 간 이동 |

### 요청 바디 상세

**POST /warehouse-transfers**
```json
{
  "itemId": 1,
  "sourceLocationId": 1,
  "destLocationId": 2,
  "storageConditionId": 1,
  "quantity": 30,
  "unit": "kg",
  "transferType": "RESTOCK",
  "note": "이동 비고"
}
```

---

## 10) 작업 지시서 (`/api/work-orders`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **POST** `/work-orders` | `{ productItemId: number; bomId: number; factoryId: number; plannedQuantity: number; scheduledStartDate?: string (ISO datetime); scheduledEndDate?: string (ISO datetime); notes?: string }` | - | ❌ | 생성 |
| **GET** `/work-orders` | - | `status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; factoryId?: number; productItemId?: number; startDate?: string (ISO datetime); endDate?: string (ISO datetime); page?: number; limit?: number` | ❌ | 목록 |
| **GET** `/work-orders/:id` | - | - | ❌ | 상세 |
| **PUT** `/work-orders/:id` | `{ plannedQuantity?: number; scheduledStartDate?: string (ISO datetime); scheduledEndDate?: string (ISO datetime); notes?: string }` | - | ❌ | 수정 |
| **DELETE** `/work-orders/:id` | `{}` | - | ❌ | 삭제 |
| **POST** `/work-orders/:id/start` | `{}` | - | ❌ | 작업 시작 |
| **POST** `/work-orders/:id/complete` | `{ actualQuantity?: number; barcode?: string; storageConditionId?: number; wholesalePrice?: number; notes?: string }` | - | ❌ | 생산 완료 |
| **POST** `/work-orders/:id/cancel` | `{ reason?: string }` | - | ❌ | 작업 취소 |
| **GET** `/work-orders/stats` | - | `factoryId?: number; startDate?: string (ISO datetime); endDate?: string (ISO datetime)` | ❌ | 통계 |

### 요청 바디 상세

**POST /work-orders**
```json
{
  "productItemId": 10,
  "bomId": 1,
  "factoryId": 1,
  "plannedQuantity": 100,
  "scheduledStartDate": "2025-10-30T09:00:00.000Z",
  "scheduledEndDate": "2025-10-30T18:00:00.000Z",
  "notes": "작업 지시서 비고"
}
```

**POST /work-orders/:id/complete**
```json
{
  "actualQuantity": 95,
  "barcode": "12345678901234",
  "storageConditionId": 1,
  "wholesalePrice": 50000,
  "notes": "완료 비고"
}
```

### 응답 형식

**성공 응답:**
```json
{
  "ok": true,
  "message": "작업 지시서 WO-20251030-001가 생성되었습니다",
  "data": {
    "id": 1,
    "work_order_number": "WO-20251030-001",
    "product_item_id": 10,
    "bom_id": 1,
    "factory_id": 1,
    "planned_quantity": "100.000",
    "status": "PENDING"
  }
}
```

---

## 11) 전자결재 (`/api/approval`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **GET** `/approval/approvals/inbox` | - | - | ✅ | 결재함 |
| **GET** `/approval/approvals/:id` | - | - | ✅ | 상세 |
| **POST** `/approval/approvals/:id/approve` | `{ comment?: string }` | - | ✅ | 승인 |
| **POST** `/approval/approvals/:id/reject` | `{ reason?: string }` | - | ✅ | 반려 |

---

## 12) 대시보드 (`/api/dashboard`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **GET** `/dashboard` | - | `factoryId?: number` | ❌ | 메인 대시보드 |
| **GET** `/dashboard/total-value` | - | `factoryId?: number` | ❌ | 총 재고 가치 |
| **GET** `/dashboard/category-breakdown` | - | `factoryId?: number` | ❌ | 카테고리별 분포 |
| **GET** `/dashboard/recent-movements` | - | `factoryId?: number; limit?: number` | ❌ | 최근 이동 |
| **GET** `/dashboard/top-moving-items` | - | `factoryId?: number; days?: number; limit?: number` | ❌ | 많이 움직인 품목 |
| **GET** `/dashboard/stock-status` | - | `factoryId?: number` | ❌ | 재고 상태 |
| **GET** `/dashboard/monthly-trend` | - | `factoryId?: number; months?: number` | ❌ | 월별 트렌드 |
| **GET** `/dashboard/factory-comparison` | - | - | ❌ | 공장별 비교 |
| **GET** `/dashboard/kpis` | - | `factoryId?: number; period?: "day" | "week" | "month"` | ❌ | KPI 지표 |

### 응답 형식

**GET /dashboard 응답:**
```json
{
  "ok": true,
  "data": {
    "totalValue": 1000000,
    "categoryBreakdown": [...],
    "recentMovements": [...],
    "topMovingItems": [...],
    "stockStatus": {...},
    "monthlyTrend": [...],
    "factoryComparison": [...],
    "kpis": {...}
  }
}
```

---

## 13) 배송 (`/api/shipping`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **POST** `/shipping/upload-orders` | `FormData<{ file: File; batchName?: string; issueType?: string }>` | - | ❌ | 주문서 업로드 (multipart/form-data) |
| **GET** `/shipping/orders` | - | `batchId?: number; platform?: string; orderStatus?: string; shippingStatus?: string; issueType?: string; startDate?: string; endDate?: string; search?: string; page?: number; limit?: number` | ❌ | 주문 목록 |
| **GET** `/shipping/orders/:id` | - | - | ❌ | 주문 상세 |
| **PUT** `/shipping/orders/:id` | `{ receiver?: string; address?: string; phone?: string; items?: Array<{ itemId: number; qty: number }>; memo?: string }` | - | ❌ | 주문 수정 |
| **DELETE** `/shipping/orders/:id` | `{}` | - | ❌ | 주문 삭제 |
| **POST** `/shipping/export/cj-logistics` | `{ batchId?: number; orderIds?: number[]; issueType?: string; templateId?: string }` | - | ❌ | CJ대한통운 양식 내보내기 |
| **POST** `/shipping/issue-list/generate` | `{ orderIds: number[]; groupName?: string }` | - | ❌ | 출고 리스트 생성 |
| **GET** `/shipping/issue-list/:id/export` | - | - | ❌ | 출고 리스트 엑셀 내보내기 |
| **POST** `/shipping/issue-list/:id/process` | `{ confirm?: boolean; dryRun?: boolean }` | - | ❌ | 출고 처리 실행 |
| **POST** `/shipping/tracking-numbers/bulk` | `{ items: Array<{ orderId: number; trackingNumber: string }> }` | - | ❌ | 송장 번호 일괄 입력 |
| **POST** `/shipping/tracking-numbers/upload` | `FormData<{ file: File }>` | - | ❌ | 송장 번호 파일 업로드 |
| **GET** `/shipping/batches` | - | `page?: number; limit?: number` | ❌ | 배치 목록 |
| **GET** `/shipping/batches/:id` | - | - | ❌ | 배치 상세 |
| **POST** `/shipping/batches/:id/confirm` | `{ confirmedBy?: string }` | - | ❌ | 배치 확정 |
| **DELETE** `/shipping/batches/:id` | `{}` | - | ❌ | 배치 삭제 |
| **GET** `/shipping/download/:filename` | - | - | ❌ | 파일 다운로드 |

### 요청 바디 상세

**POST /shipping/upload-orders**
- Content-Type: `multipart/form-data`
- 필드명: `file` (엑셀/CSV 파일)

**POST /shipping/export/cj-logistics**
```json
{
  "batchId": 1,
  "orderIds": [1, 2, 3],
  "issueType": "ALL",
  "templateId": "CJ001"
}
```

**POST /shipping/issue-list/generate**
```json
{
  "orderIds": [1, 2, 3],
  "groupName": "2025-10-30 출고"
}
```

**POST /shipping/tracking-numbers/bulk**
```json
{
  "items": [
    {
      "orderId": 1,
      "trackingNumber": "1234567890"
    },
    {
      "orderId": 2,
      "trackingNumber": "0987654321"
    }
  ]
}
```

---

## 14) 라벨 (`/api/label`)

| 메서드/경로 | 요청 바디 | 쿼리 | 인증 | 비고 |
| --- | --- | --- | --- | --- |
| **GET** `/label/printers` | - | - | ❌ | 프린터 목록 조회 |
| **POST** `/label/print` | `{ templateType: "large" | "medium" | "small" | "verysmall"; itemId: number (1-999); manufactureDate: string (YYYY-MM-DD); expiryDate: string (YYYY-MM-DD); printerName?: string; printCount?: number; pdfOptions?: { width?: string; height?: string; margin?: string }; productName?: string; storageCondition?: string; registrationNumber?: string; categoryAndForm?: string; ingredients?: string; rawMaterials?: string; actualWeight?: string; saveTemplate?: boolean }` | - | ❌ | 라벨 프린트 |
| **POST** `/label/template` | `{ labelType: "large" | "medium" | "small" | "verysmall"; itemId?: number; itemName?: string; storageCondition?: string; registrationNumber?: string; categoryAndForm?: string; ingredients?: string; rawMaterials?: string; actualWeight?: string }` | - | ❌ | 템플릿 저장 |
| **GET** `/label/templates` | - | `page?: number; limit?: number` | ❌ | 템플릿 목록 조회 |
| **GET** `/label/template/:templateId` | - | - | ❌ | 템플릿 조회 |

### 요청 바디 상세

**POST /label/print**
```json
{
  "templateType": "large",
  "itemId": 1,
  "manufactureDate": "2025-01-01",
  "expiryDate": "2026-01-01",
  "printerName": "HP LaserJet",
  "printCount": 1,
  "pdfOptions": {
    "width": "100mm",
    "height": "50mm",
    "margin": "5mm"
  },
  "productName": "제품명",
  "storageCondition": "냉장",
  "registrationNumber": "REG001",
  "categoryAndForm": "카테고리/형태",
  "ingredients": "원재료명",
  "rawMaterials": "원료명",
  "actualWeight": "100g",
  "saveTemplate": false
}
```

**필수 필드:**
- `templateType`: 라벨 크기 (`large`, `medium`, `small`, `verysmall`)
- `itemId`: 품목 ID (1-999 사이)
- `manufactureDate`: 제조일자 (YYYY-MM-DD 형식)
- `expiryDate`: 유통기한 (YYYY-MM-DD 형식, 제조일자보다 이후여야 함)

**선택 필드:**
- `printerName`: 프린터 이름 (없으면 기본 프린터 사용)
- `printCount`: 인쇄 개수 (기본값: 1)
- `pdfOptions`: PDF 옵션 (로컬 프린터 없을 시 PDF 파일 생성)
- `productName`: 제품명 (없으면 품목명 사용)
- `storageCondition`: 보관 조건 (기본값: "냉동")
- `registrationNumber`: 등록번호 (없으면 품목 코드 사용)
- `categoryAndForm`: 카테고리/형태
- `ingredients`: 원재료명
- `rawMaterials`: 원료명
- `actualWeight`: 실제 중량
- `saveTemplate`: 템플릿 저장 여부 (기본값: false)

**POST /label/template**
```json
{
  "labelType": "large",
  "itemId": 1,
  "itemName": "제품명",
  "storageCondition": "냉장",
  "registrationNumber": "REG001",
  "categoryAndForm": "카테고리/형태",
  "ingredients": "원재료명",
  "rawMaterials": "원료명",
  "actualWeight": "100g"
}
```

### 응답 형식

**GET /label/printers 응답:**
```json
{
  "ok": true,
  "message": "프린터 목록 조회 성공 (2개)",
  "data": [
    {
      "name": "HP LaserJet",
      "status": "Ready",
      "driver": "HP",
      "isDefault": true
    }
  ]
}
```

**POST /label/print 응답:**
```json
{
  "ok": true,
  "message": "라벨이 성공적으로 인쇄되었습니다",
  "data": {
    "templateId": 1,
    "barcode": "123456789012345",
    "printCount": 1,
    "printerName": "HP LaserJet",
    "filePath": "/path/to/label.pdf",
    "mode": "local",
    "printedAt": "2025-10-23T10:00:00.000Z",
    "error": null
  }
}
```

**GET /label/templates 응답:**
```json
{
  "ok": true,
  "message": "템플릿 목록 조회 성공",
  "data": [
    {
      "id": 1,
      "label_type": "large",
      "item_id": 1,
      "item_name": "제품명",
      "storage_condition": "냉장",
      "registration_number": "REG001",
      "category_and_form": "카테고리/형태",
      "ingredients": "원재료명",
      "raw_materials": "원료명",
      "actual_weight": "100g",
      "created_at": "2025-10-23T10:00:00.000Z",
      "updated_at": "2025-10-23T10:00:00.000Z"
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

### 참고사항

1. **바코드 생성**: `itemId`, `manufactureDate`, `expiryDate`를 기반으로 15자리 바코드 자동 생성
2. **프린터 모드**:
   - `local`: 로컬 프린터로 직접 인쇄
   - `cloud`: 클라우드 환경에서 PDF 파일 생성
   - `unknown`: 프린터를 찾을 수 없는 경우
3. **템플릿 크기**: `large`, `medium`, `small`, `verysmall` 중 선택
4. **날짜 형식**: 모든 날짜는 `YYYY-MM-DD` 형식 (예: `2025-10-23`)
5. **품목 ID 제한**: 1-999 사이의 숫자만 허용
6. **PDF 옵션**: 로컬 프린터가 없을 경우 PDF 파일이 생성되며, `pdfOptions`로 크기 조정 가능

---

## 🔒 인증

대부분의 API는 현재 인증이 비활성화되어 있습니다 (개발용). 인증이 필요한 엔드포인트는 `authenticate` 미들웨어가 적용되어 있으며, 세션 기반 인증을 사용합니다.

**인증 필요 시:**
1. `POST /api/auth/login`으로 로그인하여 세션 쿠키 획득
2. 이후 요청 시 쿠키 자동 전송 (브라우저 환경)
3. 또는 `Cookie` 헤더에 세션 쿠키 포함

---

## 📝 공통 응답 형식

### 성공 응답
```json
{
  "ok": true,
  "message": "성공 메시지",
  "data": { ... }
}
```

### 에러 응답
```json
{
  "ok": false,
  "message": "에러 메시지",
  "detail": "상세 에러 정보"
}
```

### 페이징 응답
```json
{
  "ok": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 📌 참고사항

1. **날짜 형식**: ISO 8601 형식 사용 (`2025-10-23T10:00:00.000Z`)
2. **숫자 형식**: 모든 ID와 수량은 숫자 타입
3. **문자열**: 모든 문자열은 UTF-8 인코딩
4. **페이징**: `page`는 1부터 시작, `limit`는 기본값 20
5. **카테고리**: `RawMaterial`, `SemiFinished`, `Finished`, `Supply`만 허용
6. **단위**: `kg`, `g`, `EA`, `BOX`, `PCS`만 허용
7. **공장 타입**: `1PreProcessing`, `2Manufacturing`만 허용

---

## 🔄 변경 이력

- **2025-10-23**: 초기 API 문서 작성
- 품목 API에서 `storageConditionId` 제거
- BOM API에서 `itemId` 또는 `itemCode` 지원
- 재고 트랜잭션 API에서 라벨 프린트 기능 추가

