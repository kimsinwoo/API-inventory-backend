# 재고 관리 시스템 API 문서

## 목차
1. [인증 (Authentication)](#1-인증-authentication)
2. [품목 관리 (Items)](#2-품목-관리-items)
3. [재고 관리 (Inventories)](#3-재고-관리-inventories)
4. [입출고 트랜잭션 (Inventory Transactions)](#4-입출고-트랜잭션-inventory-transactions)
5. [예정 트랜잭션 (Planned Transactions)](#5-예정-트랜잭션-planned-transactions)
6. [공장/창고 이동 (Warehouse Transfers)](#6-공장창고-이동-warehouse-transfers)
7. [작업 지시서 (Work Orders)](#7-작업-지시서-work-orders)
8. [BOM 관리](#8-bom-관리)
9. [라벨 프린트](#9-라벨-프린트)
10. [배송 관리 (Shipping)](#10-배송-관리-shipping)
11. [주문서 가져오기 (Order Import)](#11-주문서-가져오기-order-import)
12. [알림 (Notifications)](#12-알림-notifications)
13. [리포트 (Reports)](#13-리포트-reports)
14. [예측 (Predictions)](#14-예측-predictions)
15. [대시보드](#15-대시보드)
16. [결재 (Approvals)](#16-결재-approvals)
17. [권한 관리 (Roles)](#17-권한-관리-roles)
18. [기타](#18-기타)

---

## 1. 인증 (Authentication)

### 1.1 로그인
**POST** `/api/auth/login`

**요청 Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "로그인 성공",
  "data": {
    "id": "string",
    "username": "string"
  }
}
```

**에러 응답 (401):**
```json
{
  "ok": false,
  "message": "사용자를 찾을 수 없습니다" | "비밀번호가 일치하지 않습니다"
}
```

---

### 1.2 회원가입
**POST** `/api/auth/join`

**요청 Body:**
```json
{
  "full_name": "string",
  "phone_number": "string",
  "email": "string",
  "hire_date": "YYYY-MM-DD",
  "position": "string",
  "department": "string",
  "role": 1,
  "username": "string",
  "password": "string"
}
```

**설명:**
- 첫 번째 회원가입한 사용자는 자동으로 `ADMIN` Role이 할당되며 모든 권한이 활성화됩니다.
- 그 이후 회원가입한 사용자는 자동으로 `GUEST` Role이 할당되며 모든 권한이 비활성화됩니다.
- `role` 파라미터를 제공하면 해당 Role ID를 사용합니다 (선택사항).

**응답 (201):**
```json
{
  "ok": true,
  "message": "회원가입 성공",
  "user": {
    "id": "string",
    "username": "string"
  }
}
```

---

### 1.3 로그아웃
**POST** `/api/auth/logout`

**인증:** 필요

**응답 (200):**
```json
{
  "ok": true,
  "message": "로그아웃 성공"
}
```

---

### 1.4 현재 사용자 정보 조회
**GET** `/api/auth/me`

**인증:** 필요

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": "string",
    "username": "string",
    "UserProfile": {
      "full_name": "string",
      "phone_number": "string",
      "email": "string",
      "position": "string",
      "department": "string"
    }
  }
}
```

---

### 1.5 사용자 목록 조회
**GET** `/api/auth`

**인증:** 필요

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": "string",
      "UserProfile": { ... }
    }
  ]
}
```

---

### 1.6 사용자 상세 조회
**GET** `/api/auth/:id`

**인증:** 필요

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": "string",
    "UserProfile": { ... }
  }
}
```

---

### 1.7 사용자 정보 수정
**PUT** `/api/auth/:id`

**인증:** 필요

**요청 Body:**
```json
{
  "full_name": "string",
  "phone_number": "string",
  "email": "string",
  "hire_date": "YYYY-MM-DD",
  "position": "string",
  "department": "string",
  "role": number
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "사용자 정보가 수정되었습니다",
  "data": { ... }
}
```

---

### 1.8 사용자 삭제
**DELETE** `/api/auth/:id`

**인증:** 필요

**응답 (200):**
```json
{
  "ok": true,
  "message": "사용자가 삭제되었습니다"
}
```

---

## 2. 품목 관리 (Items)

### 2.1 품목 목록 조회
**GET** `/api/items`

**응답 (200):**
```json
{
  "ok": true,
  "message": "품목 목록 조회 성공",
  "data": [
    {
      "id": number,
      "code": "string",
      "name": "string",
      "category": "Raw" | "SemiFinished" | "Finished",
      "unit": "string",
      "factory_id": number,
      "shortage": number,
      "expiration_date": number,
      "wholesale_price": number,
      "Factory": {
        "id": number,
        "name": "string",
        "type": "string",
        "address": "string"
      }
    }
  ]
}
```

---

### 2.2 품목 상세 조회 (ID)
**GET** `/api/items/id/:id`

**응답 (200):**
```json
{
  "ok": true,
  "message": "품목 조회 성공",
  "data": {
    "id": number,
    "code": "string",
    "name": "string",
    "category": "string",
    "unit": "string",
    "factory_id": number,
    "shortage": number,
    "expiration_date": number,
    "wholesale_price": number,
    "Factory": { ... }
  }
}
```

---

### 2.3 품목 상세 조회 (코드)
**GET** `/api/items/code/:code`

**응답 (200):**
```json
{
  "ok": true,
  "message": "품목 조회 성공",
  "data": { ... }
}
```

---

### 2.4 품목 생성
**POST** `/api/items`

**요청 Body:**
```json
{
  "code": "string (필수, 유니크)",
  "name": "string (필수)",
  "category": "Raw" | "SemiFinished" | "Finished",
  "unit": "string",
  "factory_id": number,
  "shortage": number,
  "expiration_date": number,
  "wholesale_price": number
}
```

**응답 (201):**
```json
{
  "ok": true,
  "message": "품목이 성공적으로 생성되었습니다",
  "data": { ... }
}
```

**에러 응답 (409):**
```json
{
  "ok": false,
  "message": "품목 코드 'XXX'는 이미 사용 중입니다. 다른 코드를 사용해주세요."
}
```

---

### 2.5 품목 수정
**PATCH** `/api/items/:id`

**요청 Body:**
```json
{
  "code": "string",
  "name": "string",
  "category": "string",
  "unit": "string",
  "factoryId": number,
  "shortage": number,
  "expiration_date": number,
  "wholesalePrice": number
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "품목이 성공적으로 수정되었습니다",
  "data": { ... }
}
```

---

### 2.6 품목 삭제
**DELETE** `/api/items/:id`

**응답 (200):**
```json
{
  "ok": true,
  "message": "품목이 성공적으로 삭제되었습니다",
  "deleted": number
}
```

---

## 3. 재고 관리 (Inventories)

### 3.1 재고 목록 조회
**GET** `/api/inventories`

**Query Parameters:**
- `factoryId` (number, 선택)
- `itemId` (number, 선택)
- `status` (string, 선택): "Normal" | "Expiring" | "Expired" | "LowStock"
- `page` (number, 기본값: 1)
- `limit` (number, 기본값: 20)

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": number,
      "item_id": number,
      "factory_id": number,
      "barcode": "string",
      "quantity": number,
      "unit": "string",
      "wholesale_price": number,
      "received_at": "YYYY-MM-DD",
      "expiration_date": "YYYY-MM-DD",
      "status": "string",
      "Item": { ... },
      "Factory": { ... }
    }
  ],
  "meta": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "summary": {
      "totalItems": number,
      "totalQuantity": number,
      "totalValue": number,
      "byStatus": { ... },
      "byCategory": { ... }
    }
  }
}
```

---

### 3.2 재고 요약
**GET** `/api/inventories/summary`

**Query Parameters:**
- `factoryId` (number, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "totalItems": number,
    "totalQuantity": number,
    "totalValue": number,
    "byStatus": {
      "Normal": number,
      "Expiring": number,
      "Expired": number,
      "LowStock": number
    },
    "byCategory": {
      "Raw": number,
      "SemiFinished": number,
      "Finished": number
    }
  }
}
```

---

### 3.3 창고 이용률
**GET** `/api/inventories/utilization`

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "byFactory": [
      {
        "factoryId": number,
        "factoryName": "string",
        "utilizationRate": number,
        "totalCapacity": number,
        "usedCapacity": number
      }
    ]
  }
}
```

---

### 3.4 재고 이동 이력
**GET** `/api/inventories/movements`

**Query Parameters:**
- `itemId` (number, 선택)
- `factoryId` (number, 선택)
- `type` (string, 선택): "RECEIVE" | "ISSUE" | "TRANSFER"
- `startDate` (string, 선택)
- `endDate` (string, 선택)
- `page` (number, 기본값: 1)
- `limit` (number, 기본값: 20)

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": number,
      "type": "string",
      "item": { ... },
      "quantity": number,
      "unit": "string",
      "fromFactory": { ... },
      "toFactory": { ... },
      "actorName": "string",
      "occurredAt": "YYYY-MM-DD HH:mm:ss"
    }
  ],
  "meta": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

---

### 3.5 재고 입고
**POST** `/api/inventories/receive`

**요청 Body:**
```json
{
  "itemId": number,
  "factoryId": number,
  "storageConditionId": number,
  "wholesalePrice": number,
  "quantity": number,
  "receivedAt": "YYYY-MM-DD",
  "firstReceivedAt": "YYYY-MM-DD",
  "unit": "string",
  "note": "string",
  "printLabel": boolean,
  "labelSize": "large" | "medium" | "small" | "verysmall",
  "labelQuantity": number,
  "barcode": "string"
}
```

**응답 (201):**
```json
{
  "ok": true,
  "message": "입고 처리 완료",
  "data": {
    "inventory": {
      "id": number,
      "barcode": "string",
      "quantity": number,
      "unit": "string"
    },
    "label": {
      "generated": boolean,
      "saved": boolean,
      "labelSize": "string",
      "labelQuantity": number,
      "labels": [ ... ]
    }
  }
}
```

---

### 3.6 재고 출고
**POST** `/api/inventories/issue`

**요청 Body:**
```json
{
  "itemId": number,
  "factoryId": number,
  "quantity": number,
  "unit": "string",
  "issueType": "SHIPPING" | "OTHER",
  "shippingInfo": {
    "recipientName": "string",
    "recipientPhone": "string",
    "recipientAddress": "string",
    "shippingCompany": "string",
    "trackingNumber": "string"
  },
  "note": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "출고 처리 완료",
  "data": {
    "issued": number,
    "traces": [
      {
        "barcode": "string",
        "lotId": number,
        "take": number,
        "expirationDate": "YYYY-MM-DD"
      }
    ]
  }
}
```

---

### 3.7 재고 이동
**POST** `/api/inventories/transfer`

**요청 Body:**
```json
{
  "itemId": number,
  "sourceFactoryId": number,
  "destFactoryId": number,
  "storageConditionId": number,
  "quantity": number,
  "unit": "string",
  "transferType": "string",
  "note": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "이동 처리 완료",
  "data": {
    "moved": number,
    "newLotId": number,
    "traces": [ ... ]
  }
}
```

---

### 3.8 재고 삭제
**DELETE** `/api/inventories/:id`

**응답 (200):**
```json
{
  "ok": true,
  "deleted": number
}
```

---

## 4. 입출고 트랜잭션 (Inventory Transactions)

### 4.1 트랜잭션 목록 조회
**GET** `/api/inventory-transactions`

**Query Parameters:**
- `type` (string, 선택): "ALL" | "RECEIVE" | "ISSUE" | "TRANSFER"
- `itemId` (number, 선택)
- `factoryId` (number, 선택)
- `startDate` (string, 선택)
- `endDate` (string, 선택)
- `userId` (number, 선택)
- `page` (number, 기본값: 1)
- `limit` (number, 기본값: 20)

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": number,
      "time": "YYYY-MM-DD HH:mm:ss",
      "type": "RECEIVE" | "ISSUE" | "TRANSFER_OUT" | "TRANSFER_IN",
      "item": {
        "id": number,
        "code": "string",
        "name": "string",
        "category": "string"
      },
      "barcode": "string",
      "quantity": number,
      "unit": "string",
      "fromFactory": { "id": number, "name": "string" },
      "toFactory": { "id": number, "name": "string" },
      "actorName": "string",
      "note": "string"
    }
  ],
  "meta": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

---

### 4.2 트랜잭션 상세 조회
**GET** `/api/inventory-transactions/:id`

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": number,
    "type": "string",
    "item": { ... },
    "lotNumber": "string",
    "quantity": number,
    "unit": "string",
    "fromFactory": { ... },
    "toFactory": { ... },
    "actorName": "string",
    "note": "string",
    "occurredAt": "YYYY-MM-DD HH:mm:ss",
    "createdAt": "YYYY-MM-DD HH:mm:ss"
  }
}
```

---

### 4.3 트랜잭션 통계
**GET** `/api/inventory-transactions/stats`

**Query Parameters:**
- `factoryId` (number, 선택)
- `startDate` (string, 선택)
- `endDate` (string, 선택)
- `groupBy` (string, 선택): "day" | "week" | "month"

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalTransactions": number,
      "byType": [
        {
          "type": "string",
          "count": number,
          "totalQuantity": number
        }
      ]
    },
    "topItems": [
      {
        "itemId": number,
        "itemCode": "string",
        "itemName": "string",
        "transactionCount": number,
        "totalQuantity": number
      }
    ]
  }
}
```

---

### 4.4 월별 입출고 현황
**GET** `/api/inventory-transactions/monthly-utilization`

**Query Parameters:**
- `factoryId` (number, 선택)
- `year` (number, 필수)
- `month` (number, 필수)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "period": "YYYY년 MM월",
    "outbound": {
      "title": "출고 및 이동 발생 품목",
      "items": [ ... ],
      "totalCount": number
    },
    "inbound": {
      "title": "입고 및 제조된 품목",
      "items": [ ... ],
      "totalCount": number
    }
  }
}
```

---

### 4.5 입고 처리
**POST** `/api/inventory-transactions/receive`

**요청 Body:**
```json
{
  "itemId": number,
  "factoryId": number,
  "storageConditionId": number,
  "wholesalePrice": number,
  "quantity": number,
  "receivedAt": "YYYY-MM-DD",
  "firstReceivedAt": "YYYY-MM-DD",
  "unit": "string",
  "note": "string",
  "printLabel": boolean,
  "labelSize": "large" | "medium" | "small" | "verysmall",
  "labelQuantity": number,
  "barcode": "string"
}
```

**응답 (201):**
```json
{
  "ok": true,
  "message": "입고 처리 완료",
  "data": {
    "inventory": {
      "id": number,
      "barcode": "string",
      "quantity": number,
      "unit": "string",
      "factoryName": "string",
      "receivedAt": "YYYY-MM-DD",
      "expirationDate": "YYYY-MM-DD"
    },
    "receivedBy": {
      "userId": number,
      "userName": "string",
      "position": "string"
    },
    "label": {
      "generated": boolean,
      "saved": boolean,
      "labelSize": "string",
      "labelQuantity": number,
      "labels": [ ... ]
    }
  }
}
```

---

### 4.6 출고 처리
**POST** `/api/inventory-transactions/issue`

**요청 Body:**
```json
{
  "itemId": number,
  "factoryId": number,
  "quantity": number,
  "unit": "string",
  "issueType": "SHIPPING" | "OTHER",
  "shippingInfo": {
    "recipientName": "string",
    "recipientPhone": "string",
    "recipientAddress": "string",
    "shippingCompany": "string",
    "trackingNumber": "string"
  },
  "note": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "출고 처리 완료",
  "data": {
    "issued": number,
    "traces": [
      {
        "barcode": "string",
        "lotId": number,
        "take": number,
        "expirationDate": "YYYY-MM-DD"
      }
    ],
    "issuedBy": {
      "userId": number,
      "userName": "string",
      "position": "string"
    },
    "shippingInfo": { ... }
  }
}
```

---

### 4.7 일괄 출고 처리
**POST** `/api/inventory-transactions/batch-issue`

**요청 Body:**
```json
{
  "transactions": [
    {
      "itemId": number,
      "factoryId": number,
      "quantity": number,
      "unit": "string",
      "recipientName": "string",
      "recipientPhone": "string",
      "recipientAddress": "string",
      "shippingCompany": "string",
      "trackingNumber": "string",
      "note": "string"
    }
  ]
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "총 X건 중 Y건 성공, Z건 실패",
  "data": {
    "total": number,
    "success": number,
    "failed": number,
    "results": [
      {
        "index": number,
        "success": boolean,
        "data": { ... } | null,
        "error": "string" | null
      }
    ],
    "errors": [ ... ]
  }
}
```

---

### 4.8 공장 간 이동
**POST** `/api/inventory-transactions/transfer`

**요청 Body:**
```json
{
  "itemId": number,
  "sourceFactoryId": number,
  "destFactoryId": number,
  "storageConditionId": number,
  "quantity": number,
  "unit": "string",
  "transferType": "string",
  "note": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "이동 처리 완료",
  "data": {
    "moved": number,
    "newLotId": number,
    "traces": [ ... ],
    "transferredBy": {
      "userId": number,
      "userName": "string",
      "position": "string"
    }
  }
}
```

---

## 5. 예정 트랜잭션 (Planned Transactions)

### 5.1 예정 트랜잭션 생성
**POST** `/api/planned-transactions`

**요청 Body:**
```json
{
  "transactionType": "RECEIVE" | "ISSUE",
  "itemId": number,
  "itemCode": "string",
  "factoryId": number,
  "quantity": number,
  "unit": "string",
  "scheduledDate": "YYYY-MM-DD",
  "supplierName": "string",
  "barcode": "string",
  "wholesalePrice": number,
  "storageConditionId": number,
  "customerName": "string",
  "issueType": "string",
  "shippingAddress": "string",
  "notes": "string"
}
```

**응답 (201):**
```json
{
  "ok": true,
  "message": "입고 예정이 등록되었습니다" | "출고 예정이 등록되었습니다",
  "data": {
    "planned": {
      "id": number,
      "transaction_type": "string",
      "status": "PENDING",
      "item_id": number,
      "factory_id": number,
      "quantity": number,
      "scheduled_date": "YYYY-MM-DD"
    }
  }
}
```

---

### 5.2 예정 트랜잭션 목록 조회
**GET** `/api/planned-transactions`

**Query Parameters:**
- `transactionType` (string, 선택): "ALL" | "RECEIVE" | "ISSUE"
- `status` (string, 선택): "ALL" | "PENDING" | "APPROVED" | "COMPLETED" | "CANCELLED"
- `itemId` (number, 선택)
- `factoryId` (number, 선택)
- `startDate` (string, 선택)
- `endDate` (string, 선택)
- `page` (number, 기본값: 1)
- `limit` (number, 기본값: 20)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": number,
        "transactionType": "string",
        "transactionTypeName": "입고" | "출고",
        "status": "string",
        "statusName": "대기" | "승인됨" | "완료" | "취소",
        "item": { ... },
        "factory": { ... },
        "quantity": number,
        "unit": "string",
        "scheduledDate": "YYYY-MM-DD",
        "requestedBy": {
          "userId": number,
          "name": "string",
          "position": "string"
        },
        "approvedBy": { ... } | null,
        "approvedAt": "YYYY-MM-DD HH:mm:ss" | null,
        "completedAt": "YYYY-MM-DD HH:mm:ss" | null
      }
    ],
    "meta": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number
    }
  }
}
```

---

### 5.3 예정 트랜잭션 상세 조회
**GET** `/api/planned-transactions/:id`

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": number,
    "transactionType": "string",
    "transactionTypeName": "string",
    "status": "string",
    "statusName": "string",
    "item": { ... },
    "factory": { ... },
    "quantity": number,
    "unit": "string",
    "scheduledDate": "YYYY-MM-DD",
    "requestedBy": { ... },
    "approvedBy": { ... } | null,
    "completedBy": { ... } | null,
    "approvedAt": "YYYY-MM-DD HH:mm:ss" | null,
    "completedAt": "YYYY-MM-DD HH:mm:ss" | null,
    "supplierName": "string",
    "barcode": "string",
    "wholesalePrice": number,
    "storageCondition": { ... },
    "customerName": "string",
    "issueType": "string",
    "shippingAddress": "string",
    "notes": "string",
    "rejectionReason": "string" | null
  }
}
```

---

### 5.4 예정 트랜잭션 수정
**PUT** `/api/planned-transactions/:id`

**요청 Body:**
```json
{
  "quantity": number,
  "unit": "string",
  "scheduledDate": "YYYY-MM-DD",
  "supplierName": "string",
  "barcode": "string",
  "wholesalePrice": number,
  "storageConditionId": number,
  "customerName": "string",
  "issueType": "string",
  "shippingAddress": "string",
  "notes": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "예정 트랜잭션이 수정되었습니다",
  "data": {
    "planned": { ... }
  }
}
```

---

### 5.5 예정 트랜잭션 삭제
**DELETE** `/api/planned-transactions/:id`

**응답 (200):**
```json
{
  "ok": true,
  "message": "예정 트랜잭션이 삭제되었습니다"
}
```

---

### 5.6 예정 트랜잭션 승인
**POST** `/api/planned-transactions/:id/approve`

**요청 Body:**
```json
{
  "comment": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "예정 트랜잭션이 승인되었습니다",
  "data": {
    "planned": { ... }
  }
}
```

---

### 5.7 예정 트랜잭션 거부/취소
**POST** `/api/planned-transactions/:id/reject`

**응답 (200):**
```json
{
  "ok": true,
  "message": "예정 트랜잭션이 취소되었습니다",
  "data": {
    "planned": { ... }
  }
}
```

---

### 5.8 입고 예정 → 실제 입고 처리
**POST** `/api/planned-transactions/:id/complete-receive`

**요청 Body:**
```json
{
  "actualQuantity": number,
  "receivedAt": "YYYY-MM-DD",
  "note": "string",
  "labelSize": "large" | "medium" | "small" | "verysmall",
  "labelQuantity": number
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "입고가 완료되었습니다" | "부분 입고 처리됨",
  "data": {
    "planned": { ... },
    "completedPartial": { ... } | null,
    "inventory": {
      "id": number,
      "barcode": "string",
      "quantity": number
    },
    "barcode": "string",
    "labelPrint": {
      "generated": boolean,
      "saved": boolean,
      "labels": [ ... ]
    }
  }
}
```

---

### 5.9 출고 예정 → 실제 출고 처리
**POST** `/api/planned-transactions/:id/complete-issue`

**요청 Body:**
```json
{
  "actualQuantity": number,
  "transferType": "CUSTOMER" | "B2B" | "FACTORY_TRANSFER" | "WAREHOUSE_TRANSFER",
  "shippingInfo": {
    "recipientName": "string",
    "recipientAddress": "string"
  },
  "note": "string",
  "labelSize": "large" | "medium" | "small" | "verysmall",
  "labelQuantity": number,
  "printerName": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "출고가 완료되었습니다" | "부분 출고 처리됨",
  "data": {
    "planned": { ... },
    "completedPartial": { ... } | null,
    "issued": number,
    "traces": [ ... ],
    "labelPrint": {
      "success": boolean,
      "message": "string"
    }
  }
}
```

---

### 5.10 예정 트랜잭션 통계
**GET** `/api/planned-transactions/stats`

**Query Parameters:**
- `transactionType` (string, 선택)
- `factoryId` (number, 선택)
- `startDate` (string, 선택)
- `endDate` (string, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "byStatus": [
      {
        "status": "string",
        "count": number,
        "totalQuantity": number
      }
    ],
    "byType": [
      {
        "type": "string",
        "count": number,
        "totalQuantity": number
      }
    ]
  }
}
```

---

## 6. 공장/창고 이동 (Warehouse Transfers)

### 6.1 공장/창고 간 이동
**POST** `/api/warehouse-transfers`

**인증:** 필요

**요청 Body:**
```json
{
  "itemId": number,
  "sourceLocationId": number,
  "destLocationId": number,
  "storageConditionId": number,
  "quantity": number,
  "unit": "string",
  "transferType": "string",
  "note": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "이동 처리 완료",
  "data": {
    "moved": number,
    "newLotId": number,
    "newLotNumber": "string",
    "traces": [ ... ],
    "userInfo": {
      "userId": number,
      "userName": "string",
      "position": "string"
    },
    "movementType": "전처리 → 제조" | "제조 → 창고" | ...,
    "sourceLocation": {
      "id": number,
      "name": "string",
      "type": "1PreProcessing" | "2Manufacturing" | "Warehouse",
      "typeLabel": "string"
    },
    "destLocation": {
      "id": number,
      "name": "string",
      "type": "string",
      "typeLabel": "string"
    }
  }
}
```

---

### 6.2 이동 이력 조회
**GET** `/api/warehouse-transfers/history`

**인증:** 필요

**Query Parameters:**
- `itemId` (number, 선택)
- `locationId` (number, 선택)
- `sourceType` (string, 선택)
- `destType` (string, 선택)
- `startDate` (string, 선택)
- `endDate` (string, 선택)
- `page` (number, 기본값: 1)
- `limit` (number, 기본값: 20)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": number,
        "time": "YYYY-MM-DD HH:mm:ss",
        "type": "이동(출발)" | "이동(도착)",
        "typeRaw": "TRANSFER_OUT" | "TRANSFER_IN",
        "item": { ... },
        "lotNumber": "string",
        "quantity": number,
        "unit": "string",
        "sourceLocation": {
          "id": number,
          "name": "string",
          "type": "string",
          "typeLabel": "string"
        },
        "destLocation": { ... },
        "actorName": "string",
        "note": "string"
      }
    ],
    "meta": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number
    }
  }
}
```

---

### 6.3 이동 경로 통계
**GET** `/api/warehouse-transfers/path-stats`

**인증:** 필요

**Query Parameters:**
- `startDate` (string, 선택)
- `endDate` (string, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalPaths": number,
      "totalTransfers": number
    },
    "paths": [
      {
        "path": "string",
        "count": number,
        "totalQuantity": number,
        "sourceLocation": { ... },
        "destLocation": { ... }
      }
    ]
  }
}
```

---

## 7. 작업 지시서 (Work Orders)

### 7.1 작업 지시서 생성
**POST** `/api/work-orders`

**요청 Body:**
```json
{
  "productItemId": number,
  "bomId": number,
  "factoryId": number,
  "plannedQuantity": number,
  "scheduledStartDate": "YYYY-MM-DD",
  "scheduledEndDate": "YYYY-MM-DD",
  "notes": "string"
}
```

**응답 (201):**
```json
{
  "ok": true,
  "message": "작업 지시서가 생성되었습니다",
  "data": {
    "workOrder": {
      "id": number,
      "work_order_number": "string",
      "product_item_id": number,
      "bom_id": number,
      "factory_id": number,
      "planned_quantity": number,
      "status": "PENDING",
      "scheduled_start_date": "YYYY-MM-DD",
      "scheduled_end_date": "YYYY-MM-DD"
    }
  }
}
```

---

### 7.2 작업 지시서 목록 조회
**GET** `/api/work-orders`

**Query Parameters:**
- `status` (string, 선택): "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
- `factoryId` (number, 선택)
- `productItemId` (number, 선택)
- `startDate` (string, 선택)
- `endDate` (string, 선택)
- `page` (number, 기본값: 1)
- `limit` (number, 기본값: 20)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": number,
        "work_order_number": "string",
        "product": { ... },
        "bom": { ... },
        "factory": { ... },
        "planned_quantity": number,
        "actual_quantity": number,
        "status": "string",
        "scheduled_start_date": "YYYY-MM-DD",
        "scheduled_end_date": "YYYY-MM-DD",
        "actual_start_date": "YYYY-MM-DD" | null,
        "actual_end_date": "YYYY-MM-DD" | null
      }
    ],
    "meta": {
      "total": number,
      "page": number,
      "limit": number,
      "totalPages": number
    }
  }
}
```

---

### 7.3 작업 지시서 상세 조회
**GET** `/api/work-orders/:id`

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": number,
    "work_order_number": "string",
    "product": { ... },
    "bom": {
      "id": number,
      "name": "string",
      "components": [
        {
          "id": number,
          "item": { ... },
          "quantity": number,
          "unit": "string"
        }
      ]
    },
    "factory": { ... },
    "planned_quantity": number,
    "actual_quantity": number,
    "status": "string",
    "scheduled_start_date": "YYYY-MM-DD",
    "scheduled_end_date": "YYYY-MM-DD",
    "actual_start_date": "YYYY-MM-DD" | null,
    "actual_end_date": "YYYY-MM-DD" | null,
    "notes": "string"
  }
}
```

---

### 7.4 작업 지시서 수정
**PUT** `/api/work-orders/:id`

**요청 Body:**
```json
{
  "plannedQuantity": number,
  "scheduledStartDate": "YYYY-MM-DD",
  "scheduledEndDate": "YYYY-MM-DD",
  "notes": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "작업 지시서가 수정되었습니다",
  "data": {
    "workOrder": { ... }
  }
}
```

---

### 7.5 작업 지시서 삭제
**DELETE** `/api/work-orders/:id`

**응답 (200):**
```json
{
  "ok": true,
  "message": "작업 지시서가 삭제되었습니다"
}
```

---

### 7.6 작업 시작
**POST** `/api/work-orders/:id/start`

**응답 (200):**
```json
{
  "ok": true,
  "message": "작업이 시작되었습니다",
  "data": {
    "workOrder": { ... }
  }
}
```

---

### 7.7 생산 완료 처리
**POST** `/api/work-orders/:id/complete`

**요청 Body:**
```json
{
  "actualQuantity": number,
  "barcode": "string",
  "storageConditionId": number,
  "wholesalePrice": number,
  "notes": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "작업 지시서 생산 완료",
  "data": {
    "workOrder": { ... },
    "producedProduct": {
      "itemId": number,
      "itemName": "string",
      "itemCode": "string",
      "quantity": number,
      "unit": "string",
      "barcode": "string",
      "inventoryId": number
    }
  }
}
```

---

### 7.8 작업 취소
**POST** `/api/work-orders/:id/cancel`

**요청 Body:**
```json
{
  "reason": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "작업 지시서가 취소되었습니다",
  "data": {
    "workOrder": { ... }
  }
}
```

---

### 7.9 작업 지시서 통계
**GET** `/api/work-orders/stats`

**Query Parameters:**
- `startDate` (string, 선택)
- `endDate` (string, 선택)
- `factoryId` (number, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "total": number,
    "byStatus": {
      "PENDING": number,
      "IN_PROGRESS": number,
      "COMPLETED": number,
      "CANCELLED": number
    }
  }
}
```

---

## 8. BOM 관리

### 8.1 BOM 목록 조회
**GET** `/api/boms`

**Query Parameters:**
- `search` (string, 선택)
- `page` (number, 기본값: 1)
- `limit` (number, 기본값: 50)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "rows": [
      {
        "id": number,
        "name": "string",
        "description": "string",
        "components": [
          {
            "id": number,
            "quantity": number,
            "unit": "string",
            "sort_order": number,
            "loss_rate": number,
            "item": {
              "id": number,
              "code": "string",
              "name": "string",
              "category": "string"
            }
          }
        ]
      }
    ],
    "count": number,
    "page": number,
    "limit": number
  }
}
```

---

### 8.2 BOM 상세 조회
**GET** `/api/boms/:id`

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": number,
    "name": "string",
    "description": "string",
    "components": [ ... ]
  }
}
```

---

### 8.3 BOM 생성
**POST** `/api/boms`

**요청 Body:**
```json
{
  "name": "string",
  "code": "string",
  "description": "string",
  "lines": [
    {
      "itemId": number,
      "itemCode": "string",
      "quantity": number,
      "unit": "string",
      "lossRate": number
    }
  ]
}
```

**응답 (201):**
```json
{
  "ok": true,
  "message": "BOM이 생성되었습니다",
  "data": { ... }
}
```

---

### 8.4 BOM 수정
**PUT** `/api/boms/:id`

**요청 Body:**
```json
{
  "name": "string",
  "description": "string",
  "lines": [ ... ]
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "BOM이 수정되었습니다",
  "data": { ... }
}
```

---

### 8.5 BOM 삭제
**DELETE** `/api/boms/:id`

**응답 (200):**
```json
{
  "ok": true,
  "message": "BOM이 삭제되었습니다"
}
```

---

## 9. 라벨 프린트

### 9.1 프린터 목록 조회
**GET** `/api/label/printers`

**응답 (200):**
```json
{
  "ok": true,
  "message": "프린터 목록 조회 성공",
  "data": [
    {
      "name": "string",
      "status": "string",
      "driver": "string",
      "isDefault": boolean
    }
  ]
}
```

---

### 9.2 라벨 PDF 생성
**POST** `/api/label/pdf`

**요청 Body:**
```json
{
  "itemId": number,
  "templateType": "large" | "medium" | "small" | "verysmall",
  "manufactureDate": "YYYY-MM-DD",
  "expiryDate": "YYYY-MM-DD",
  "printCount": number
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "PDF 버퍼 생성 완료",
  "data": {
    "templateId": number,
    "barcode": "string",
    "printCount": number,
    "pdfBase64": "string"
  }
}
```

---

### 9.3 템플릿 저장
**POST** `/api/label/template`

**요청 Body:**
```json
{
  "labelType": "large" | "medium" | "small" | "verysmall",
  "itemId": number,
  "itemName": "string",
  "storageCondition": "string",
  "registrationNumber": "string",
  "categoryAndForm": "string",
  "ingredients": "string",
  "rawMaterials": "string",
  "actualWeight": "string"
}
```

**응답 (201):**
```json
{
  "ok": true,
  "message": "템플릿이 성공적으로 저장되었습니다",
  "data": {
    "id": number,
    "labelType": "string",
    "itemId": number,
    "itemName": "string",
    "createdAt": "YYYY-MM-DD HH:mm:ss"
  }
}
```

---

### 9.4 템플릿 목록 조회
**GET** `/api/label/templates`

**Query Parameters:**
- `page` (number, 기본값: 1)
- `limit` (number, 기본값: 50)

**응답 (200):**
```json
{
  "ok": true,
  "message": "템플릿 목록 조회 성공",
  "data": [ ... ],
  "meta": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

---

### 9.5 템플릿 상세 조회
**GET** `/api/label/template/:templateId`

**응답 (200):**
```json
{
  "ok": true,
  "message": "템플릿 조회 성공",
  "data": {
    "id": number,
    "label_type": "string",
    "item_id": number,
    "item_name": "string",
    "storage_condition": "string",
    "registration_number": "string",
    "category_and_form": "string",
    "ingredients": "string",
    "raw_materials": "string",
    "actual_weight": "string"
  }
}
```

---

## 10. 배송 관리 (Shipping)

### 10.1 주문서 업로드
**POST** `/api/shipping/upload-orders`

**Content-Type:** `multipart/form-data`

**요청 Body:**
- `files` (File[], 필수): 엑셀/CSV 파일들
- `batchName` (string, 선택)
- `issueType` (string, 선택): "B2C" | "B2B"

**응답 (200):**
```json
{
  "ok": true,
  "message": "주문서 업로드 완료",
  "data": {
    "batchId": number,
    "batchNumber": "string",
    "summary": {
      "totalOrders": number,
      "byPlatform": { ... },
      "byIssueType": { ... }
    },
    "orders": [ ... ],
    "errors": [ ... ]
  }
}
```

---

### 10.2 주문 목록 조회
**GET** `/api/shipping/orders`

**Query Parameters:**
- `batchId` (number, 선택)
- `platform` (string, 선택)
- `orderStatus` (string, 선택)
- `shippingStatus` (string, 선택)
- `issueType` (string, 선택)
- `startDate` (string, 선택)
- `endDate` (string, 선택)
- `search` (string, 선택)
- `page` (number, 기본값: 1)
- `limit` (number, 기본값: 20)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "rows": [ ... ],
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
```

---

### 10.3 주문 상세 조회
**GET** `/api/shipping/orders/:id`

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": number,
    "platform_order_number": "string",
    "platform": "string",
    "product_code": "string",
    "product_name": "string",
    "quantity": number,
    "recipient_name": "string",
    "recipient_phone": "string",
    "recipient_address": "string",
    "order_status": "string",
    "shipping_status": "string",
    "tracking_number": "string",
    "batch": { ... }
  }
}
```

---

### 10.4 주문 정보 수정
**PUT** `/api/shipping/orders/:id`

**요청 Body:**
```json
{
  "recipient_name": "string",
  "recipient_phone": "string",
  "recipient_address": "string",
  "tracking_number": "string",
  "shipping_company": "string",
  "order_status": "string",
  "shipping_status": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "주문 정보가 수정되었습니다",
  "data": { ... }
}
```

---

### 10.5 주문 삭제
**DELETE** `/api/shipping/orders/:id`

**응답 (200):**
```json
{
  "ok": true,
  "message": "주문이 삭제되었습니다"
}
```

---

### 10.6 CJ대한통운 양식 내보내기
**POST** `/api/shipping/export/cj-logistics`

**요청 Body:**
```json
{
  "batchId": number,
  "orderIds": [number],
  "issueType": "string",
  "templateId": number
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "CJ대한통운 양식 파일 생성 완료",
  "data": {
    "fileName": "string",
    "downloadUrl": "string",
    "orderCount": number,
    "summary": {
      "totalWeight": number,
      "totalBoxes": number
    }
  }
}
```

---

### 10.7 파일 다운로드
**GET** `/api/shipping/download/:filename`

**응답:** 파일 다운로드

---

### 10.8 출고 리스트 자동 생성
**POST** `/api/shipping/issue-list/generate`

**요청 Body:**
```json
{
  "batchId": number,
  "issueType": "string",
  "issueDate": "YYYY-MM-DD"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "issueDate": "YYYY-MM-DD",
    "orderCount": number,
    "itemCount": number,
    "items": [
      {
        "itemId": number,
        "itemCode": "string",
        "itemName": "string",
        "totalQuantity": number,
        "orders": [ ... ]
      }
    ]
  }
}
```

---

### 10.9 출고 리스트 엑셀 내보내기
**GET** `/api/shipping/issue-list/:id/export`

**응답:** 엑셀 파일 다운로드

---

### 10.10 출고 처리
**POST** `/api/shipping/issue-list/:id/process`

**요청 Body:**
```json
{
  "factoryId": number,
  "note": "string",
  "actorName": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "출고 처리 완료",
  "data": {
    "results": [
      {
        "orderId": number,
        "success": boolean,
        "error": "string" | null
      }
    ]
  }
}
```

---

### 10.11 송장 번호 일괄 등록
**POST** `/api/shipping/tracking-numbers/bulk`

**요청 Body:**
```json
{
  "orderIds": [number],
  "trackingNumbers": ["string"],
  "shippingCompany": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "송장 번호 일괄 등록 완료",
  "data": {
    "totalProcessed": number,
    "successCount": number,
    "failCount": number,
    "results": [ ... ]
  }
}
```

---

### 10.12 송장 번호 엑셀 업로드
**POST** `/api/shipping/tracking-numbers/upload`

**Content-Type:** `multipart/form-data`

**요청 Body:**
- `file` (File, 필수): 엑셀 파일

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "totalProcessed": number,
    "successCount": number,
    "failCount": number,
    "results": [ ... ]
  }
}
```

---

### 10.13 배치 목록 조회
**GET** `/api/shipping/batches`

**Query Parameters:**
- `status` (string, 선택)
- `startDate` (string, 선택)
- `endDate` (string, 선택)
- `page` (number, 기본값: 1)
- `limit` (number, 기본값: 20)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "rows": [ ... ],
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
```

---

### 10.14 배치 상세 조회
**GET** `/api/shipping/batches/:id`

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": number,
    "batch_number": "string",
    "batch_name": "string",
    "total_orders": number,
    "b2c_count": number,
    "b2b_count": number,
    "status": "string",
    "orders": [ ... ]
  }
}
```

---

### 10.15 배치 확정
**POST** `/api/shipping/batches/:id/confirm`

**요청 Body:**
```json
{
  "confirmedBy": "string"
}
```

**응답 (200):**
```json
{
  "ok": true,
  "message": "배치가 확정되었습니다",
  "data": { ... }
}
```

---

### 10.16 배치 삭제
**DELETE** `/api/shipping/batches/:id`

**응답 (200):**
```json
{
  "ok": true,
  "message": "배치가 삭제되었습니다"
}
```

---

## 11. 주문서 가져오기 (Order Import)

### 11.1 단일 파일 업로드
**POST** `/api/order-import/upload`

**Content-Type:** `multipart/form-data`

**요청 Body:**
- `file` (File, 필수): 엑셀/CSV 파일

**응답 (200):**
```json
{
  "ok": true,
  "message": "파일 업로드 및 분석 완료",
  "data": {
    "format": "string",
    "data": [ ... ],
    "recordCount": number
  }
}
```

---

### 11.2 다중 파일 업로드
**POST** `/api/order-import/upload-multiple`

**Content-Type:** `multipart/form-data`

**요청 Body:**
- `files` (File[], 필수): 엑셀/CSV 파일들

**응답 (200):**
```json
{
  "ok": true,
  "message": "다중 파일 업로드 및 통합 완료",
  "data": {
    "fileResults": [
      {
        "fileName": "string",
        "format": "string",
        "recordCount": number,
        "success": boolean,
        "error": "string" | null
      }
    ],
    "totalRecords": number,
    "outputFileName": "string",
    "outputPath": "string"
  }
}
```

---

### 11.3 CJ대한통운 형식으로 통합
**POST** `/api/order-import/upload-cj`

**Content-Type:** `multipart/form-data`

**요청 Body:**
- `files` (File[], 필수): 엑셀/CSV 파일들

**응답 (200):**
```json
{
  "ok": true,
  "message": "CJ대한통운 형식으로 통합 완료",
  "data": {
    "fileResults": [ ... ],
    "totalRecords": number,
    "standardFile": {
      "fileName": "string",
      "path": "string",
      "downloadUrl": "string"
    },
    "cjFile": {
      "fileName": "string",
      "path": "string",
      "downloadUrl": "string"
    }
  }
}
```

---

### 11.4 파일 다운로드
**GET** `/api/order-import/download/:filename`

**응답:** 파일 다운로드

---

### 11.5 업로드된 파일 목록 조회
**GET** `/api/order-import/files`

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "fileName": "string",
      "fileSize": number,
      "uploadedAt": "YYYY-MM-DD HH:mm:ss"
    }
  ]
}
```

---

### 11.6 파일 삭제
**DELETE** `/api/order-import/files/:filename`

**응답 (200):**
```json
{
  "ok": true,
  "message": "파일이 삭제되었습니다"
}
```

---

## 12. 알림 (Notifications)

### 12.1 재고 부족 알림
**GET** `/api/notifications/low-stock`

**Query Parameters:**
- `factoryId` (number, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "itemId": number,
      "itemCode": "string",
      "itemName": "string",
      "category": "string",
      "currentQuantity": number,
      "minimumQuantity": number,
      "shortfall": number,
      "unit": "string",
      "factory": {
        "id": number,
        "name": "string"
      },
      "severity": "critical" | "high" | "medium"
    }
  ]
}
```

---

### 12.2 유통기한 임박 알림
**GET** `/api/notifications/expiring`

**Query Parameters:**
- `factoryId` (number, 선택)
- `daysThreshold` (number, 기본값: 3)

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "inventoryId": number,
      "lotNumber": "string",
      "itemCode": "string",
      "itemName": "string",
      "category": "string",
      "quantity": number,
      "unit": "string",
      "expirationDate": "YYYY-MM-DD",
      "daysLeft": number,
      "factory": { ... },
      "severity": "critical" | "high" | "medium"
    }
  ]
}
```

---

### 12.3 만료된 재고
**GET** `/api/notifications/expired`

**Query Parameters:**
- `factoryId` (number, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "inventoryId": number,
      "lotNumber": "string",
      "itemCode": "string",
      "itemName": "string",
      "category": "string",
      "quantity": number,
      "unit": "string",
      "expirationDate": "YYYY-MM-DD",
      "daysExpired": number,
      "factory": { ... }
    }
  ]
}
```

---

### 12.4 전체 알림 요약
**GET** `/api/notifications/summary`

**Query Parameters:**
- `factoryId` (number, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "lowStock": {
      "count": number,
      "critical": number,
      "items": [ ... ]
    },
    "expiring": {
      "count": number,
      "critical": number,
      "items": [ ... ]
    },
    "expired": {
      "count": number,
      "items": [ ... ]
    },
    "totalAlerts": number,
    "generatedAt": "YYYY-MM-DD HH:mm:ss"
  }
}
```

---

### 12.5 공장별 알림
**GET** `/api/notifications/factory-alerts`

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "factory": {
        "id": number,
        "name": "string"
      },
      "alerts": {
        "lowStock": { ... },
        "expiring": { ... },
        "expired": { ... },
        "totalAlerts": number
      }
    }
  ]
}
```

---

### 12.6 일일 알림 리포트
**GET** `/api/notifications/daily-report`

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "date": "YYYY-MM-DD",
    "summary": {
      "totalAlerts": number,
      "lowStock": number,
      "expiring": number,
      "expired": number
    },
    "details": { ... },
    "recommendations": [
      {
        "type": "urgent" | "warning" | "critical",
        "message": "string"
      }
    ]
  }
}
```

---

## 13. 리포트 (Reports)

### 13.1 일일 리포트
**GET** `/api/reports/daily`

**Query Parameters:**
- `date` (string, 선택): "YYYY-MM-DD" (기본값: 오늘)
- `factoryId` (number, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "reportDate": "YYYY-MM-DD",
    "summary": {
      "receive": {
        "count": number,
        "quantity": number
      },
      "issue": {
        "count": number,
        "quantity": number
      },
      "transfer": {
        "count": number,
        "quantity": number
      }
    },
    "details": [
      {
        "time": "HH:mm:ss",
        "type": "string",
        "itemCode": "string",
        "itemName": "string",
        "quantity": number,
        "unit": "string",
        "from": "string",
        "to": "string",
        "actor": "string",
        "note": "string"
      }
    ],
    "generatedAt": "YYYY-MM-DD HH:mm:ss"
  }
}
```

---

### 13.2 주간 리포트
**GET** `/api/reports/weekly`

**Query Parameters:**
- `weekStart` (string, 선택): "YYYY-MM-DD" (기본값: 이번 주 시작일)
- `factoryId` (number, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "weekStart": "YYYY-MM-DD",
    "weekEnd": "YYYY-MM-DD",
    "dailyData": [
      {
        "date": "YYYY-MM-DD",
        "dayOfWeek": "string",
        "receive": number,
        "issue": number,
        "transfer": number
      }
    ],
    "topItems": [ ... ],
    "generatedAt": "YYYY-MM-DD HH:mm:ss"
  }
}
```

---

### 13.3 월간 리포트
**GET** `/api/reports/monthly`

**Query Parameters:**
- `year` (number, 선택)
- `month` (number, 선택)
- `factoryId` (number, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "year": number,
    "month": number,
    "monthLabel": "YYYY년 MM월",
    "summary": {
      "receive": { ... },
      "issue": { ... },
      "transfer": { ... }
    },
    "categoryStats": [
      {
        "category": "string",
        "totalQuantity": number,
        "transactionCount": number
      }
    ],
    "generatedAt": "YYYY-MM-DD HH:mm:ss"
  }
}
```

---

### 13.4 재고 현황 리포트
**GET** `/api/reports/inventory-status`

**Query Parameters:**
- `factoryId` (number, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalValue": number,
      "totalItems": number,
      "lowStockItems": number,
      "expiringItems": number
    },
    "items": [
      {
        "factory": "string",
        "itemCode": "string",
        "itemName": "string",
        "category": "string",
        "lotNumber": "string",
        "quantity": number,
        "unit": "string",
        "wholesalePrice": number,
        "totalValue": number,
        "expirationDate": "YYYY-MM-DD",
        "daysLeft": number,
        "status": "string",
        "shortage": number
      }
    ],
    "generatedAt": "YYYY-MM-DD HH:mm:ss"
  }
}
```

---

### 13.5 재고 회전율 분석
**GET** `/api/reports/turnover-analysis`

**Query Parameters:**
- `factoryId` (number, 선택)
- `days` (number, 기본값: 30)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "period": "string",
    "analysis": [
      {
        "itemCode": "string",
        "itemName": "string",
        "category": "string",
        "currentQuantity": number,
        "issuedQuantity": number,
        "turnoverRate": number,
        "daysOfStock": number,
        "status": "빠름" | "보통" | "느림" | "정체"
      }
    ],
    "generatedAt": "YYYY-MM-DD HH:mm:ss"
  }
}
```

---

### 13.6 생성된 리포트 목록
**GET** `/api/reports/list`

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "fileName": "string",
      "reportType": "string",
      "generatedAt": "YYYY-MM-DD HH:mm:ss",
      "size": number
    }
  ]
}
```

---

### 13.7 리포트 파일 다운로드
**GET** `/api/reports/download/:filename`

**응답:** 파일 다운로드

---

## 14. 예측 (Predictions)

### 14.1 전체 품목 재고 소진 예측
**GET** `/api/predictions/stockouts`

**Query Parameters:**
- `factoryId` (number, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "factoryId": number | null,
    "totalItems": number,
    "itemsAtRisk": number,
    "predictions": [
      {
        "itemId": number,
        "itemCode": "string",
        "itemName": "string",
        "category": "string",
        "unit": "string",
        "currentStock": number,
        "avgDailyConsumption": number,
        "daysUntilStockout": number,
        "estimatedStockoutDate": "YYYY-MM-DD",
        "status": "정상" | "경고" | "주의" | "긴급",
        "trend": "increasing" | "decreasing" | "stable",
        "minimumStock": number
      }
    ],
    "generatedAt": "YYYY-MM-DD HH:mm:ss"
  }
}
```

---

### 14.2 소비 패턴 분석
**GET** `/api/predictions/:itemId/consumption-pattern`

**Query Parameters:**
- `days` (number, 기본값: 30)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "itemId": number,
    "period": "string",
    "totalConsumption": number,
    "avgDailyConsumption": number,
    "maxDailyConsumption": number,
    "minDailyConsumption": number,
    "trend": "increasing" | "decreasing" | "stable",
    "trendDetails": {
      "recentAvg": number,
      "previousAvg": number
    }
  }
}
```

---

### 14.3 품목별 재고 소진 예측
**GET** `/api/predictions/:itemId/stockout`

**Query Parameters:**
- `factoryId` (number, 선택)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "itemId": number,
    "factoryId": number | null,
    "currentStock": number,
    "avgDailyConsumption": number,
    "daysUntilStockout": number,
    "estimatedStockoutDate": "YYYY-MM-DD",
    "status": "string",
    "trend": "string"
  }
}
```

---

### 14.4 재주문 수량 계산
**GET** `/api/predictions/:itemId/reorder-quantity`

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "itemId": number,
    "itemCode": "string",
    "itemName": "string",
    "avgDailyDemand": number,
    "leadTimeDays": number,
    "safetyStockDays": number,
    "reorderPoint": number,
    "recommendedOrderQuantity": number,
    "unit": "string",
    "estimatedCost": number
  }
}
```

---

### 14.5 계절성 분석
**GET** `/api/predictions/:itemId/seasonality`

**Query Parameters:**
- `months` (number, 기본값: 12)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "itemId": number,
    "period": "string",
    "monthlyData": [
      {
        "month": "YYYY-MM",
        "quantity": number
      }
    ],
    "avgMonthly": number,
    "maxMonth": {
      "month": "YYYY-MM",
      "quantity": number
    },
    "minMonth": {
      "month": "YYYY-MM",
      "quantity": number
    },
    "variationCoefficient": number,
    "seasonalityLevel": "낮음" | "중간" | "높음"
  }
}
```

---

### 14.6 수요 예측
**GET** `/api/predictions/:itemId/forecast`

**Query Parameters:**
- `forecastDays` (number, 기본값: 7)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "itemId": number,
    "forecastDays": number,
    "totalForecastedDemand": number,
    "avgDailyForecast": number,
    "trend": "string",
    "dailyForecasts": [
      {
        "date": "YYYY-MM-DD",
        "forecastedDemand": number,
        "confidence": "높음" | "중간"
      }
    ],
    "generatedAt": "YYYY-MM-DD HH:mm:ss"
  }
}
```

---

## 15. 대시보드

### 15.1 대시보드 요약
**GET** `/api/dashboard/summary`

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "입고 완료": {
      "today": number
    },
    "제조 완료": {
      "today": number
    },
    "출고 완료": {
      "today": number
    },
    "재고 알람": {
      "count": number
    },
    "유통기한 임박": {
      "count": number
    },
    "승인 대기": {
      "count": number
    }
  }
}
```

---

## 16. 결재 (Approvals)

### 16.1 결재 생성
**POST** `/api/approval`

**인증:** 필요

**요청 Body:**
```json
{
  "formCode": "string (필수)",
  "title": "string (선택)",
  "payload": { ... },
  "attachments": [
    {
      "kind": "source_csv" | "pdf" | "other",
      "path": "string",
      "originalName": "string",
      "meta": { ... }
    }
  ]
}
```

**설명:** 새로운 결재를 생성합니다. formCode에 해당하는 RequiredApprover 템플릿을 기반으로 결재 태스크가 자동 생성되며, 첫 번째 단계가 자동으로 시작됩니다.

**응답 (201):**
```json
{
  "ok": true,
  "message": "결재가 생성되었습니다",
  "data": {
    "id": number,
    "form_code": "string",
    "created_by_user_id": "string",
    "status": "PENDING" | "IN_PROGRESS",
    "current_order": number,
    "title": "string",
    "created_at": "YYYY-MM-DD HH:mm:ss",
    "updated_at": "YYYY-MM-DD HH:mm:ss",
    "ApprovalTasks": [ ... ],
    "ApprovalData": {
      "id": number,
      "approval_id": number,
      "payload": { ... }
    },
    "Attachments": [ ... ]
  }
}
```

**에러 응답 (400):**
```json
{
  "ok": false,
  "message": "formCode는 필수입니다."
}
```

---

### 16.2 결재 대기 목록 조회
**GET** `/api/approvals/inbox`

**인증:** 필요

**설명:** 현재 사용자가 승인해야 하는 결재 목록을 조회합니다. 사용자의 역할 코드(roleCode) 또는 사용자 ID로 할당된 결재만 반환됩니다.

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": number,
      "form_code": "string",
      "created_by_user_id": "string",
      "status": "PENDING" | "IN_PROGRESS",
      "current_order": number,
      "title": "string",
      "created_at": "YYYY-MM-DD HH:mm:ss",
      "updated_at": "YYYY-MM-DD HH:mm:ss",
      "ApprovalTasks": [
        {
          "id": number,
          "approval_id": number,
          "required_approver_id": number,
          "order": number,
          "assignee_role_code": "STAFF" | "TEAM_LEAD" | "DIRECTOR" | "CEO",
          "assignee_user_id": "string" | null,
          "status": "REQUESTED",
          "signed_at": "YYYY-MM-DD HH:mm:ss" | null,
          "signature_image_path": "string" | null,
          "comment": "string" | null,
          "created_at": "YYYY-MM-DD HH:mm:ss",
          "updated_at": "YYYY-MM-DD HH:mm:ss"
        }
      ]
    }
  ]
}
```

---

### 16.3 결재 상세 조회
**GET** `/api/approvals/:id`

**인증:** 필요

**URL Parameters:**
- `id` (number, 필수): 결재 ID

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": number,
    "form_code": "string",
    "created_by_user_id": "string",
    "status": "PENDING" | "IN_PROGRESS" | "REJECTED" | "APPROVED" | "EXPORTED",
    "current_order": number,
    "title": "string",
    "created_at": "YYYY-MM-DD HH:mm:ss",
    "updated_at": "YYYY-MM-DD HH:mm:ss",
    "ApprovalTasks": [
      {
        "id": number,
        "approval_id": number,
        "required_approver_id": number,
        "order": number,
        "assignee_role_code": "STAFF" | "TEAM_LEAD" | "DIRECTOR" | "CEO",
        "assignee_user_id": "string" | null,
        "status": "WAITING" | "REQUESTED" | "APPROVED" | "REJECTED" | "AUTO_SKIPPED",
        "signed_at": "YYYY-MM-DD HH:mm:ss" | null,
        "signature_image_path": "string" | null,
        "comment": "string" | null,
        "created_at": "YYYY-MM-DD HH:mm:ss",
        "updated_at": "YYYY-MM-DD HH:mm:ss"
      }
    ],
    "ApprovalData": {
      "id": number,
      "approval_id": number,
      "payload": { ... },
      "created_at": "YYYY-MM-DD HH:mm:ss",
      "updated_at": "YYYY-MM-DD HH:mm:ss"
    },
    "Attachments": [
      {
        "id": number,
        "approval_id": number,
        "file_path": "string",
        "file_name": "string",
        "created_at": "YYYY-MM-DD HH:mm:ss"
      }
    ]
  }
}
```

**에러 응답 (404):**
```json
{
  "ok": false,
  "message": "NOT_FOUND"
}
```

---

### 16.4 결재 승인
**POST** `/api/approvals/:id/approve`

**인증:** 필요

**URL Parameters:**
- `id` (number, 필수): 결재 ID

**요청 Body:**
```json
{
  "signatureImagePath": "string (선택)",
  "comment": "string (선택)"
}
```

**설명:** 현재 사용자가 승인해야 하는 결재를 승인합니다. 승인 후 다음 단계가 자동으로 진행되며, 모든 단계가 완료되면 결재 상태가 "APPROVED"로 변경됩니다.

**응답 (200):**
```json
{
  "ok": true
}
```

**에러 응답:**
- `APPROVAL_NOT_FOUND`: 결재를 찾을 수 없음
- `NO_PERMISSION_OR_NOT_YOUR_TURN`: 권한이 없거나 현재 차례가 아님

---

### 16.5 결재 거부
**POST** `/api/approvals/:id/reject`

**인증:** 필요

**URL Parameters:**
- `id` (number, 필수): 결재 ID

**요청 Body:**
```json
{
  "comment": "string (선택)"
}
```

**설명:** 현재 사용자가 승인해야 하는 결재를 거부합니다. 거부 시 결재 상태가 "REJECTED"로 변경됩니다.

**응답 (200):**
```json
{
  "ok": true
}
```

**에러 응답:**
- `APPROVAL_NOT_FOUND`: 결재를 찾을 수 없음
- `NO_PERMISSION_OR_NOT_YOUR_TURN`: 권한이 없거나 현재 차례가 아님

---

## 17. 권한 관리 (Roles)

### 17.1 역할 목록 조회
**GET** `/api/roles`

**인증:** 필요 (`can_user_management` 권한 필요)

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "name": "ADMIN",
      "display_name": "관리자",
      "description": "시스템 관리자",
      "is_system": true,
      "is_default": false,
      "can_basic_info": true,
      "can_receiving": true,
      "can_plant1_preprocess": true,
      "can_plant_transfer": true,
      "can_plant2_manufacture": true,
      "can_shipping": true,
      "can_label": true,
      "can_inventory": true,
      "can_quality": true,
      "can_user_management": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 17.2 역할 상세 조회
**GET** `/api/roles/:id`

**인증:** 필요 (`can_user_management` 권한 필요)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "ADMIN",
    "display_name": "관리자",
    "description": "시스템 관리자",
    "is_system": true,
    "is_default": false,
    "can_basic_info": true,
    "can_receiving": true,
    "can_plant1_preprocess": true,
    "can_plant_transfer": true,
    "can_plant2_manufacture": true,
    "can_shipping": true,
    "can_label": true,
    "can_inventory": true,
    "can_quality": true,
    "can_user_management": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**에러 응답 (404):**
```json
{
  "ok": false,
  "message": "역할을 찾을 수 없습니다"
}
```

---

### 17.3 역할 생성
**POST** `/api/roles`

**인증:** 필요 (`can_user_management` 권한 필요)

**요청 Body:**
```json
{
  "name": "STAFF",
  "display_name": "직원",
  "description": "일반 직원",
  "is_system": false,
  "is_default": false,
  "can_basic_info": false,
  "can_receiving": true,
  "can_plant1_preprocess": false,
  "can_plant_transfer": false,
  "can_plant2_manufacture": false,
  "can_shipping": false,
  "can_label": false,
  "can_inventory": true,
  "can_quality": false,
  "can_user_management": false
}
```

**응답 (201):**
```json
{
  "ok": true,
  "data": {
    "id": 2,
    "name": "STAFF",
    "display_name": "직원",
    "description": "일반 직원",
    "is_system": false,
    "is_default": false,
    "can_basic_info": false,
    "can_receiving": true,
    "can_plant1_preprocess": false,
    "can_plant_transfer": false,
    "can_plant2_manufacture": false,
    "can_shipping": false,
    "can_label": false,
    "can_inventory": true,
    "can_quality": false,
    "can_user_management": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**에러 응답 (400):**
```json
{
  "ok": false,
  "message": "이미 존재하는 역할 이름입니다"
}
```

---

### 17.4 역할 수정
**PUT** `/api/roles/:id`

**인증:** 필요 (`can_user_management` 권한 필요)

**요청 Body:**
```json
{
  "display_name": "수정된 역할명",
  "description": "수정된 설명",
  "can_basic_info": true,
  "can_receiving": false
}
```

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "ADMIN",
    "display_name": "수정된 역할명",
    "description": "수정된 설명",
    "is_system": true,
    "is_default": false,
    "can_basic_info": true,
    "can_receiving": false,
    "can_plant1_preprocess": true,
    "can_plant_transfer": true,
    "can_plant2_manufacture": true,
    "can_shipping": true,
    "can_label": true,
    "can_inventory": true,
    "can_quality": true,
    "can_user_management": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**에러 응답 (400):**
```json
{
  "ok": false,
  "message": "시스템 역할은 삭제할 수 없습니다"
}
```

---

### 17.5 역할 삭제
**DELETE** `/api/roles/:id`

**인증:** 필요 (`can_user_management` 권한 필요)

**응답 (200):**
```json
{
  "ok": true,
  "message": "역할이 삭제되었습니다"
}
```

**에러 응답 (400):**
```json
{
  "ok": false,
  "message": "시스템 역할은 삭제할 수 없습니다"
}
```

**에러 응답 (404):**
```json
{
  "ok": false,
  "message": "역할을 찾을 수 없습니다"
}
```

---

### 17.6 권한 단일 업데이트
**PUT** `/api/roles/:id/permissions/:permissionName`

**인증:** 필요 (`can_user_management` 권한 필요)

**요청 Body:**
```json
{
  "value": true
}
```

**URL 파라미터:**
- `id`: 역할 ID
- `permissionName`: 권한 이름 (`can_basic_info`, `can_receiving`, `can_plant1_preprocess`, `can_plant_transfer`, `can_plant2_manufacture`, `can_shipping`, `can_label`, `can_inventory`, `can_quality`, `can_user_management`)

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "ADMIN",
    "display_name": "관리자",
    "can_basic_info": true,
    "can_receiving": true,
    "can_plant1_preprocess": true,
    "can_plant_transfer": true,
    "can_plant2_manufacture": true,
    "can_shipping": true,
    "can_label": true,
    "can_inventory": true,
    "can_quality": true,
    "can_user_management": true,
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**에러 응답 (400):**
```json
{
  "ok": false,
  "message": "유효하지 않은 권한 이름입니다: invalid_permission"
}
```

---

### 17.7 권한 일괄 업데이트
**PUT** `/api/roles/:id/permissions`

**인증:** 필요 (`can_user_management` 권한 필요)

**요청 Body:**
```json
{
  "can_basic_info": true,
  "can_receiving": false,
  "can_plant1_preprocess": true,
  "can_plant_transfer": false,
  "can_plant2_manufacture": true,
  "can_shipping": false,
  "can_label": true,
  "can_inventory": true,
  "can_quality": false,
  "can_user_management": false
}
```

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "ADMIN",
    "display_name": "관리자",
    "can_basic_info": true,
    "can_receiving": false,
    "can_plant1_preprocess": true,
    "can_plant_transfer": false,
    "can_plant2_manufacture": true,
    "can_shipping": false,
    "can_label": true,
    "can_inventory": true,
    "can_quality": false,
    "can_user_management": false,
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 18. 기타

### 18.1 공장 목록 조회
**GET** `/api/factories`

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": number,
      "name": "string",
      "type": "1PreProcessing" | "2Manufacturing" | "Warehouse",
      "address": "string"
    }
  ]
}
```

---

### 18.2 보관 조건 목록 조회
**GET** `/api/storage-conditions`

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": number,
      "name": "string",
      "temperature_range": "string",
      "humidity_range": "string"
    }
  ]
}
```

---

### 18.3 프로세스 목록 조회
**GET** `/api/processes`

**응답 (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": number,
      "name": "string"
    }
  ]
}
```

---

### 18.4 헬스 체크
**GET** `/api/health/ping`

**응답 (200):**
```json
{
  "ok": true,
  "message": "pong",
  "timestamp": "YYYY-MM-DD HH:mm:ss"
}
```

---

## 공통 응답 형식

### 성공 응답
모든 성공 응답은 다음 형식을 따릅니다:
```json
{
  "ok": true,
  "message": "string (선택)",
  "data": { ... }
}
```

### 에러 응답
모든 에러 응답은 다음 형식을 따릅니다:
```json
{
  "ok": false,
  "message": "string",
  "error": "string (개발 환경에서만)",
  "requestId": "string (선택)"
}
```

### HTTP 상태 코드
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 리소스를 찾을 수 없음
- `409`: 충돌 (예: 중복 코드)
- `500`: 서버 내부 오류

---

## 인증

대부분의 엔드포인트는 세션 기반 인증을 사용합니다. 로그인 후 세션이 생성되며, 이후 요청에서 자동으로 인증됩니다.

인증이 필요한 엔드포인트는 `인증: 필요`로 표시되어 있습니다.

---

## 페이지네이션

목록 조회 API는 페이지네이션을 지원합니다:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)

응답에는 다음 메타 정보가 포함됩니다:
```json
{
  "meta": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

---

## 날짜 형식

모든 날짜는 다음 형식을 사용합니다:
- 날짜: `YYYY-MM-DD`
- 날짜 및 시간: `YYYY-MM-DD HH:mm:ss`
- ISO 8601 형식도 지원됩니다

---

## 파일 업로드

파일 업로드가 필요한 엔드포인트는 `Content-Type: multipart/form-data`를 사용합니다.

지원되는 파일 형식:
- Excel: `.xlsx`, `.xls`
- CSV: `.csv`

---

## 바코드 형식

시스템에서 사용하는 바코드 형식:
- 일반 바코드: 14자리 숫자 (타임스탬프 기반)
- 라벨 바코드: 15자리 숫자 (아이템 ID + 제조일자 + 유통기한)

---

## 주의사항

1. **수량 단위**: 모든 수량은 숫자로 전달되며, 단위는 별도 필드로 관리됩니다.
2. **FIFO 출고**: 출고 시 유통기한이 가까운 순서대로 자동 출고됩니다.
3. **트랜잭션**: 입출고 작업은 데이터베이스 트랜잭션으로 처리되어 원자성을 보장합니다.
4. **라벨 프린트**: Finished 카테고리 품목만 라벨을 저장할 수 있습니다.
5. **예정 트랜잭션**: 부분 입고/출고가 가능하며, 완료된 부분은 별도 레코드로 저장됩니다.

---

## 버전 정보

- API 버전: v1
- 최종 업데이트: 2024년

---

## 문의

API 사용 중 문제가 발생하면 개발팀에 문의하세요.



