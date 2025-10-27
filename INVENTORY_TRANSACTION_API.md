# 입고/출고 트랜잭션 API 문서

## 개요

입고, 출고, 공장 간 이동을 관리하는 API입니다.

**기본 URL**: `/api/inventory-transactions`

## 주요 기능

✅ **입고 처리** - 사용자 정보 자동 기록  
✅ **출고 처리** - FIFO 방식, 배송 정보 연동  
✅ **공장 간 이동** - 전처리 → 제조 공정 이동  
✅ **일괄 출고** - 배송 관리 연동  
✅ **트랜잭션 이력** - 상세 조회 및 통계  
✅ **월별 현황** - 창고 이용률 분석

---

## 🔐 인증

모든 API는 **세션 인증**이 필요합니다.
- 로그인 후 자동으로 세션 쿠키 발급
- 요청 시 쿠키 자동 전송

---

## 📋 API 엔드포인트

### 1. 트랜잭션 목록 조회

```http
GET /api/inventory-transactions?type=ALL&page=1&limit=20
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| type | string | 아니오 | RECEIVE, ISSUE, TRANSFER, ALL (기본: ALL) |
| itemId | number | 아니오 | 품목 ID |
| factoryId | number | 아니오 | 공장 ID |
| startDate | string | 아니오 | 시작일 (ISO 8601) |
| endDate | string | 아니오 | 종료일 (ISO 8601) |
| userId | number | 아니오 | 사용자 ID |
| page | number | 아니오 | 페이지 번호 (기본: 1) |
| limit | number | 아니오 | 페이지당 항목 수 (기본: 20, 최대: 100) |

**응답 예시:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "time": "2024-10-27 10:30:00",
      "type": "입고",
      "typeRaw": "RECEIVE",
      "item": {
        "id": 1,
        "code": "ITEM-001",
        "name": "닭가슴살",
        "category": "RawMaterial"
      },
      "lotNumber": "LOT-20241027-001",
      "quantity": 100,
      "unit": "kg",
      "fromFactory": null,
      "toFactory": {
        "id": 1,
        "name": "제1공장"
      },
      "actorName": "홍길동",
      "note": "신선 상태 양호",
      "createdAt": "2024-10-27T10:30:00Z"
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

### 2. 입고 처리

```http
POST /api/inventory-transactions/receive
```

**Request Body:**
```json
{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "lotNumber": "LOT-20241027-001",
  "wholesalePrice": 50000,
  "quantity": 100,
  "unit": "kg",
  "receivedAt": "2024-10-27T10:00:00Z",
  "firstReceivedAt": "2024-10-27T10:00:00Z",
  "note": "신선 상태 양호"
}
```

**필수 필드:**
- `itemId` (number): 품목 ID
- `factoryId` (number): 공장 ID
- `storageConditionId` (number): 보관 조건 ID
- `lotNumber` (string): LOT 번호
- `wholesalePrice` (number): 도매가
- `quantity` (number): 수량
- `unit` (string): 단위
- `receivedAt` (date): 입고 일시

**선택 필드:**
- `firstReceivedAt` (date): 최초 입고일 (없으면 receivedAt 사용)
- `note` (string): 비고

**응답 예시:**
```json
{
  "ok": true,
  "message": "홍길동님이 닭가슴살을(를) 100kg 입고 처리했습니다",
  "data": {
    "inventory": {
      "id": 123,
      "lot_number": "LOT-20241027-001",
      "quantity": 100,
      "expiration_date": "2025-10-27",
      "status": "Normal"
    },
    "receivedBy": {
      "userId": 5,
      "userName": "홍길동",
      "position": "창고 담당"
    }
  }
}
```

---

### 3. 출고 처리

```http
POST /api/inventory-transactions/issue
```

**Request Body:**
```json
{
  "itemId": 1,
  "factoryId": 1,
  "quantity": 50,
  "unit": "kg",
  "issueType": "SHIPPING",
  "shippingInfo": {
    "recipientName": "김철수",
    "recipientPhone": "010-1234-5678",
    "recipientAddress": "서울시 강남구...",
    "shippingCompany": "CJ대한통운",
    "trackingNumber": "123456789012"
  },
  "note": "당일 배송"
}
```

**필수 필드:**
- `itemId` (number): 품목 ID
- `factoryId` (number): 공장 ID
- `quantity` (number): 출고 수량
- `unit` (string): 단위

**선택 필드:**
- `issueType` (string): PRODUCTION, SHIPPING, DAMAGE, OTHER (기본: OTHER)
- `shippingInfo` (object): 배송 정보
  - `recipientName`: 수령인
  - `recipientPhone`: 연락처
  - `recipientAddress`: 주소
  - `shippingCompany`: 택배사
  - `trackingNumber`: 송장 번호
- `note` (string): 비고

**응답 예시:**
```json
{
  "ok": true,
  "message": "홍길동님이 닭가슴살을(를) 50kg 출고 처리했습니다",
  "data": {
    "issued": 50,
    "traces": [
      {
        "lotNumber": "LOT-20241027-001",
        "lotId": 123,
        "take": 30,
        "expirationDate": "2025-10-27"
      },
      {
        "lotNumber": "LOT-20241026-005",
        "lotId": 118,
        "take": 20,
        "expirationDate": "2025-10-26"
      }
    ],
    "issuedBy": {
      "userId": 5,
      "userName": "홍길동",
      "position": "창고 담당"
    },
    "shippingInfo": {
      "recipientName": "김철수",
      "trackingNumber": "123456789012"
    }
  }
}
```

**특징:**
- 🔹 **FIFO 방식**: 유통기한이 빠른 순서대로 자동 출고
- 🔹 **자동 추적**: 어떤 LOT에서 얼마나 출고되었는지 추적
- 🔹 **배송 연동**: 배송 정보 자동 기록

---

### 4. 공장 간 이동

```http
POST /api/inventory-transactions/transfer
```

**Request Body:**
```json
{
  "itemId": 1,
  "sourceFactoryId": 1,
  "destFactoryId": 2,
  "storageConditionId": 2,
  "quantity": 30,
  "unit": "kg",
  "transferType": "PRODUCTION",
  "note": "전처리 완료 후 제조 공정 이동"
}
```

**필수 필드:**
- `itemId` (number): 품목 ID
- `sourceFactoryId` (number): 출발 공장 ID
- `destFactoryId` (number): 도착 공장 ID
- `storageConditionId` (number): 보관 조건 ID
- `quantity` (number): 이동 수량
- `unit` (string): 단위

**선택 필드:**
- `transferType` (string): PRODUCTION, RESTOCK, OTHER (기본: OTHER)
- `note` (string): 비고

**응답 예시:**
```json
{
  "ok": true,
  "message": "홍길동님이 닭가슴살을(를) 제1공장에서 제2공장(으)로 30kg 이동했습니다",
  "data": {
    "moved": 30,
    "newLotId": 456,
    "traces": [
      {
        "lotNumber": "LOT-20241027-001",
        "lotId": 123,
        "take": 30,
        "expirationDate": "2025-10-27"
      }
    ],
    "transferredBy": {
      "userId": 5,
      "userName": "홍길동",
      "position": "생산 관리"
    }
  }
}
```

---

### 5. 일괄 출고 (배송 관리용)

```http
POST /api/inventory-transactions/batch-issue
```

**Request Body:**
```json
{
  "transactions": [
    {
      "itemId": 1,
      "factoryId": 1,
      "quantity": 10,
      "unit": "EA",
      "recipientName": "김철수",
      "recipientPhone": "010-1111-2222",
      "recipientAddress": "서울시 강남구...",
      "shippingCompany": "CJ대한통운",
      "trackingNumber": "123456789012",
      "note": "당일배송"
    },
    {
      "itemId": 2,
      "factoryId": 1,
      "quantity": 5,
      "unit": "BOX",
      "recipientName": "이영희",
      "recipientPhone": "010-3333-4444",
      "recipientAddress": "부산시 해운대구...",
      "shippingCompany": "로젠택배",
      "trackingNumber": "987654321098"
    }
  ]
}
```

**응답 예시:**
```json
{
  "ok": true,
  "message": "총 2건 중 2건 성공, 0건 실패",
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "success": true,
        "data": {
          "issued": 10,
          "traces": [...]
        }
      },
      {
        "index": 1,
        "success": true,
        "data": {
          "issued": 5,
          "traces": [...]
        }
      }
    ],
    "errors": []
  }
}
```

---

### 6. 트랜잭션 상세 조회

```http
GET /api/inventory-transactions/:id
```

**응답 예시:**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "type": "입고",
    "typeRaw": "RECEIVE",
    "item": {
      "id": 1,
      "code": "ITEM-001",
      "name": "닭가슴살",
      "category": "RawMaterial"
    },
    "lotNumber": "LOT-20241027-001",
    "quantity": 100,
    "unit": "kg",
    "fromFactory": null,
    "toFactory": {
      "id": 1,
      "name": "제1공장"
    },
    "actorName": "홍길동",
    "note": "신선 상태 양호",
    "occurredAt": "2024-10-27T10:30:00Z",
    "createdAt": "2024-10-27T10:30:00Z",
    "updatedAt": "2024-10-27T10:30:00Z"
  }
}
```

---

### 7. 트랜잭션 통계

```http
GET /api/inventory-transactions/stats?startDate=2024-10-01T00:00:00Z&endDate=2024-10-31T23:59:59Z
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| factoryId | number | 아니오 | 공장 ID |
| startDate | string | 아니오 | 시작일 (ISO 8601) |
| endDate | string | 아니오 | 종료일 (ISO 8601) |
| groupBy | string | 아니오 | day, week, month (기본: day) |

**응답 예시:**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalTransactions": 245,
      "byType": [
        {
          "type": "RECEIVE",
          "count": 120,
          "totalQuantity": 5000
        },
        {
          "type": "ISSUE",
          "count": 100,
          "totalQuantity": 4200
        },
        {
          "type": "TRANSFER_OUT",
          "count": 15,
          "totalQuantity": 600
        },
        {
          "type": "TRANSFER_IN",
          "count": 10,
          "totalQuantity": 400
        }
      ]
    },
    "topItems": [
      {
        "itemId": 1,
        "itemCode": "ITEM-001",
        "itemName": "닭가슴살",
        "transactionCount": 45,
        "totalQuantity": 1800
      }
    ]
  }
}
```

---

### 8. 월별 입출고 현황 (창고 이용률용)

```http
GET /api/inventory-transactions/monthly-utilization?year=2024&month=10&factoryId=1
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| year | number | **필수** | 년도 |
| month | number | **필수** | 월 (1-12) |
| factoryId | number | 아니오 | 공장 ID |

**응답 예시:**
```json
{
  "ok": true,
  "data": {
    "period": "2024년 10월",
    "outbound": {
      "title": "출고 및 이동 발생 품목",
      "items": [
        {
          "itemId": 1,
          "itemCode": "ITEM-001",
          "itemName": "닭가슴살",
          "transactionCount": 25,
          "totalQuantity": 1200
        }
      ],
      "totalCount": 15
    },
    "inbound": {
      "title": "입고 및 제조된 품목",
      "items": [
        {
          "itemId": 2,
          "itemCode": "ITEM-002",
          "itemName": "쌀",
          "transactionCount": 30,
          "totalQuantity": 1500
        }
      ],
      "totalCount": 18
    },
    "utilizationRate": {
      "inbound": 5800,
      "outbound": 4200
    }
  }
}
```

---

## 📊 사용 시나리오

### 시나리오 1: 원재료 입고

```javascript
// 1. 입고 처리
POST /api/inventory-transactions/receive
{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "lotNumber": "LOT-20241027-001",
  "wholesalePrice": 50000,
  "quantity": 100,
  "unit": "kg",
  "receivedAt": "2024-10-27T10:00:00Z",
  "note": "신선 상태 양호"
}

// 응답: 홍길동님이 입고 처리 (자동 기록)
```

### 시나리오 2: 공장 간 이동 (전처리 → 제조)

```javascript
// 1. 1공장(전처리)에서 2공장(제조)으로 이동
POST /api/inventory-transactions/transfer
{
  "itemId": 1,
  "sourceFactoryId": 1,
  "destFactoryId": 2,
  "storageConditionId": 2,
  "quantity": 50,
  "unit": "kg",
  "transferType": "PRODUCTION",
  "note": "전처리 완료"
}
```

### 시나리오 3: 배송을 위한 일괄 출고

```javascript
// 1. 엑셀 파일에서 주문 정보 읽기
// 2. 일괄 출고 처리
POST /api/inventory-transactions/batch-issue
{
  "transactions": [
    {
      "itemId": 1,
      "factoryId": 2,
      "quantity": 10,
      "unit": "EA",
      "recipientName": "김철수",
      "recipientAddress": "서울시...",
      "trackingNumber": "123456789"
    },
    // ... 최대 100건
  ]
}

// 응답: 성공/실패 건수 및 상세 결과
```

---

## ⚠️ 에러 코드

| 상태 코드 | 메시지 | 설명 |
|-----------|--------|------|
| 400 | 입력값 검증 실패 | 필수 필드 누락 또는 형식 오류 |
| 401 | 인증 필요 | 로그인 필요 |
| 404 | 트랜잭션을 찾을 수 없습니다 | 존재하지 않는 ID |
| 500 | 재고가 부족합니다 | 출고 불가능 |
| 500 | 품목을 찾을 수 없습니다 | 존재하지 않는 품목 |

---

## 💡 주요 특징

### 1. 사용자 정보 자동 기록
- 로그인한 사용자의 이름과 직급이 자동으로 기록됩니다
- 누가 입고/출고를 처리했는지 추적 가능

### 2. FIFO (선입선출) 방식
- 유통기한이 빠른 것부터 자동 출고
- 여러 LOT에 걸쳐 출고 시 자동 분산

### 3. 배송 정보 연동
- 출고 시 배송 정보 함께 기록
- 택배 송장 번호 추적 가능

### 4. 월별 통계
- 창고 이용률 분석
- 입고/출고 품목 현황 파악

---

## 🔗 관련 API

- [재고 관리 API](/api/inventories) - 재고 현황 조회
- [품목 관리 API](/api/items) - 품목 정보
- [공장 관리 API](/api/factories) - 공장 정보

---

**문의사항이 있으시면 개발팀에 연락주세요!** 📧

