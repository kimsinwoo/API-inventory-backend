# 재고 관리 시스템 - 프론트엔드 API 연동 가이드

## 📌 기본 정보

**Base URL**: `http://localhost:4000/api`

**인증 방식**: Session 기반 (쿠키)
- 로그인 후 세션 쿠키가 자동으로 설정됩니다
- `credentials: 'include'` 옵션을 fetch/axios에 포함해야 합니다

**공통 응답 형식**:
```json
{
  "ok": true,
  "message": "성공 메시지",
  "data": { ... }
}
```

**에러 응답 형식**:
```json
{
  "ok": false,
  "message": "에러 메시지",
  "detail": [ ... ],  // validation 에러의 경우
  "requestId": "uuid"
}
```

---

## 🔐 1. 인증 (Authentication)

### 1.1 로그인
```
POST /api/auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "ok": true,
  "message": "로그인 성공",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "홍길동",
      "role": "admin"
    }
  }
}
```

---

### 1.2 회원가입
```
POST /api/auth/join
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "role": "user"
}
```

**Response**:
```json
{
  "ok": true,
  "message": "회원가입 성공",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "홍길동"
    }
  }
}
```

---

### 1.3 로그아웃
```
POST /api/auth/logout
```
**인증 필요**: ✅

**Response**:
```json
{
  "ok": true,
  "message": "로그아웃 성공"
}
```

---

### 1.4 현재 사용자 정보 조회
```
GET /api/auth/me
```
**인증 필요**: ✅

**Response**:
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "admin"
  }
}
```

---

### 1.5 사용자 목록 조회
```
GET /api/auth/
```
**인증 필요**: ✅

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "홍길동",
      "role": "admin"
    }
  ]
}
```

---

### 1.6 사용자 상세 조회
```
GET /api/auth/:id
```
**인증 필요**: ✅

**Response**:
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "admin"
  }
}
```

---

### 1.7 사용자 정보 수정
```
PUT /api/auth/:id
```
**인증 필요**: ✅

**Request Body**:
```json
{
  "name": "홍길동",
  "email": "newemail@example.com"
}
```

---

### 1.8 사용자 삭제
```
DELETE /api/auth/:id
```
**인증 필요**: ✅

---

## 🏭 2. 공장 관리 (Factories)

### 2.1 공장 목록 조회
```
GET /api/factories
```

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "type": "1PreProcessing",
      "name": "전처리 공장",
      "address": "서울시 강남구"
    }
  ]
}
```

**type 값**:
- `1PreProcessing`: 전처리 공장
- `2Manufacturing`: 제조 공장
- `Warehouse`: 창고

---

### 2.2 공장 상세 조회
```
GET /api/factories/:id
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "type": "1PreProcessing",
    "name": "전처리 공장",
    "address": "서울시 강남구",
    "processes": []
  }
}
```

---

### 2.3 공장 생성
```
POST /api/factories
```

**Request Body**:
```json
{
  "type": "1PreProcessing",
  "name": "전처리 공장",
  "address": "서울시 강남구"
}
```

**필수 필드**: 
- `type` (string, required): 공장 타입
- `name` (string, required): 공장명
- `address` (string, optional): 주소

---

### 2.4 공장 수정
```
PUT /api/factories/:id
```

**Request Body** (모두 선택, 하나 이상 필요):
```json
{
  "type": "1PreProcessing",
  "name": "전처리 공장",
  "address": "서울시 강남구",
  "processIds": [1, 2, 3]
}
```

---

### 2.5 공장 삭제
```
DELETE /api/factories/:id
```

---

### 2.6 공장에 공정 추가
```
POST /api/factories/:id/processes
```

**Request Body**:
```json
{
  "processIds": [1, 2, 3]
}
```

---

### 2.7 공장에서 공정 제거
```
DELETE /api/factories/:id/processes/:processId
```

---

## 🔧 3. 공정 관리 (Processes)

### 3.1 공정 목록 조회
```
GET /api/processes
```

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "name": "세척 공정",
      "description": "원재료 세척"
    }
  ]
}
```

---

### 3.2 공정 상세 조회
```
GET /api/processes/:id
```

---

### 3.3 공정 생성
```
POST /api/processes
```

**Request Body**:
```json
{
  "name": "세척 공정",
  "description": "원재료 세척"
}
```

**필수 필드**: 
- `name` (string, required): 공정명
- `description` (string, optional): 공정 설명

---

### 3.4 공정 수정
```
PUT /api/processes/:id
```

**Request Body**:
```json
{
  "name": "세척 공정",
  "description": "원재료 세척"
}
```

---

### 3.5 공정 삭제
```
DELETE /api/processes/:id
```

---

## 📦 4. 품목 관리 (Items)

### 4.1 품목 목록 조회
```
GET /api/items
```

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "code": "RAW001",
      "name": "원재료 A",
      "category": "RawMaterial",
      "unit": "kg",
      "factory_id": 1,
      "shortage": 100,
      "expiration_date": 30,
      "wholesale_price": 5000
    }
  ]
}
```

**category 값**:
- `RawMaterial`: 원재료
- `SemiFinished`: 반제품
- `Finished`: 완제품
- `Supply`: 소모품

**unit 값**:
- `kg`, `g`, `EA`, `BOX`, `PCS`

---

### 4.2 품목 상세 조회 (ID)
```
GET /api/items/id/:id
```

---

### 4.3 품목 상세 조회 (코드)
```
GET /api/items/code/:code
```

---

### 4.4 품목 생성
```
POST /api/items
```

**Request Body**:
```json
{
  "code": "RAW001",
  "name": "원재료 A",
  "category": "RawMaterial",
  "unit": "kg",
  "factoryId": 1,
  "shortage": 100,
  "shelfLife": 30,
  "wholesalePrice": 5000
}
```

**필수 필드**:
- `code` (string, required): 품목 코드
- `name` (string, required): 품목명
- `category` (string, required): 카테고리
- `unit` (string, required): 단위
- `factoryId` (number, required): 공장 ID

**선택 필드**:
- `shortage` (number, optional, default: 0): 재고 부족 기준 수량
- `shelfLife` (number, optional, default: 0): 유통기한 (일 단위)
- `wholesalePrice` (number, optional): 도매가 (원)

**category 한글 지원**:
- `원재료` → `RawMaterial`
- `반제품` → `SemiFinished`
- `완제품` → `Finished`
- `소모품` → `Supply`

**주의**: 
- `factoryId`는 camelCase로 보내야 합니다 (내부적으로 snake_case로 변환됨)
- `shelfLife`는 camelCase로 보내야 합니다 (내부적으로 expiration_date로 변환됨)
- `wholesalePrice`는 camelCase로 보내야 합니다 (내부적으로 wholesale_price로 변환됨)

---

### 4.5 품목 수정
```
PATCH /api/items/:id
```

**Request Body**: 품목 생성과 동일 (변경할 필드만 포함)

---

### 4.6 품목 삭제
```
DELETE /api/items/:id
```

---

## 📋 5. BOM (Bill of Materials)

### 5.1 BOM 목록 조회
```
GET /api/boms
```

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "name": "제품 A BOM",
      "lines": [
        {
          "itemId": 1,
          "itemCode": "RAW001",
          "quantity": 10,
          "unit": "kg"
        }
      ]
    }
  ]
}
```

---

### 5.2 BOM 상세 조회
```
GET /api/boms/:id
```

---

### 5.3 BOM 생성
```
POST /api/boms
```

**Request Body**:
```json
{
  "name": "제품 A BOM",
  "lines": [
    {
      "itemId": 1,
      "quantity": 10,
      "unit": "kg"
    },
    {
      "itemCode": "RAW002",
      "quantity": 5,
      "unit": "EA"
    }
  ]
}
```

**필수 필드**:
- `name` (string, required): BOM 이름 (공백 불가)
- `lines` (array, required): 구성 품목 배열 (최소 1개)

**lines 배열 각 항목**:
- `itemId` (number, optional): 품목 ID
- `itemCode` (string, optional): 품목 코드
- `quantity` (number, required): 수량 (양수)
- `unit` (string, required): 단위 (공백 불가)

**주의**: 각 line은 `itemId` 또는 `itemCode` 중 하나는 반드시 포함해야 합니다.

---

### 5.4 BOM 수정
```
PUT /api/boms/:id
```

**Request Body**:
```json
{
  "name": "제품 A BOM",
  "lines": [
    {
      "itemId": 1,
      "quantity": 10,
      "unit": "kg"
    }
  ]
}
```

**선택 필드** (하나 이상 필요):
- `name` (string, optional): BOM 이름
- `lines` (array, optional): 구성 품목 배열

---

### 5.5 BOM 삭제
```
DELETE /api/boms/:id
```

---

## 📊 6. 재고 관리 (Inventories)

### 6.1 재고 목록 조회
```
GET /api/inventories
```

**Query Parameters**:
- `itemId` (number, optional): 품목 ID
- `factoryId` (number, optional): 공장 ID
- `status` (string, optional): `Normal`, `LowStock`, `Expiring`, `Expired`
- `category` (string, optional): `RawMaterial`, `SemiFinished`, `Finished`, `Supply`
- `search` (string, optional): 검색어 (1-50자)
- `page` (number, default: 1): 페이지 번호
- `limit` (number, default: 20, max: 100): 페이지당 항목 수

**예시**:
```
GET /api/inventories?factoryId=1&status=LowStock&page=1&limit=20
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "rows": [
      {
        "id": 1,
        "itemId": 1,
        "factoryId": 1,
        "quantity": 100,
        "unit": "kg",
        "lotNumber": "LOT001",
        "status": "Normal",
        "expirationDate": "2024-12-31"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### 6.2 재고 요약 조회
```
GET /api/inventories/summary
```

**Query Parameters**:
- `factoryId` (number, optional): 공장 ID

**Response**:
```json
{
  "ok": true,
  "data": {
    "totalValue": 5000000,
    "totalItems": 150,
    "lowStockCount": 10,
    "expiringCount": 5,
    "expiredCount": 2
  }
}
```

---

### 6.3 창고 이용률 조회
```
GET /api/inventories/utilization
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "factoryId": 1,
    "factoryName": "전처리 공장",
    "utilization": 75.5,
    "totalCapacity": 10000,
    "currentUsage": 7550
  }
}
```

---

### 6.4 재고 이동 이력 조회
```
GET /api/inventories/movements
```

**Query Parameters**:
- `itemId` (number, optional): 품목 ID
- `factoryId` (number, optional): 공장 ID
- `from` (string, optional): 시작 날짜 (ISO 8601 datetime 형식)
- `to` (string, optional): 종료 날짜 (ISO 8601 datetime 형식)
- `page` (number, default: 1): 페이지 번호
- `limit` (number, default: 20, max: 100): 페이지당 항목 수

**예시**:
```
GET /api/inventories/movements?itemId=1&from=2024-01-01T00:00:00Z&to=2024-12-31T23:59:59Z
```

---

### 6.5 입고 처리
```
POST /api/inventories/receive
```

**Request Body**:
```json
{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "lotNumber": "LOT001",
  "wholesalePrice": 5000,
  "quantity": 100,
  "unit": "kg",
  "receivedAt": "2024-10-29T10:00:00Z",
  "firstReceivedAt": "2024-10-29T10:00:00Z",
  "note": "정상 입고",
  "actorName": "홍길동"
}
```

**필수 필드**:
- `itemId` (number, required): 품목 ID (양수)
- `factoryId` (number, required): 공장 ID (양수)
- `storageConditionId` (number, required): 보관 조건 ID (양수)
- `lotNumber` (string, required): LOT 번호 (1-50자)
- `wholesalePrice` (number, required): 도매가 (0 이상)
- `quantity` (number, required): 수량 (양수)
- `unit` (string, required): 단위 (1-10자)
- `receivedAt` (date, required): 입고 날짜 (ISO 8601 형식)

**선택 필드**:
- `firstReceivedAt` (date, optional): 최초 입고 날짜
- `note` (string, optional): 비고 (최대 200자)
- `actorName` (string, optional): 담당자명 (최대 50자)

---

### 6.6 출고 처리
```
POST /api/inventories/issue
```

**Request Body**:
```json
{
  "itemId": 1,
  "factoryId": 1,
  "quantity": 50,
  "unit": "kg",
  "note": "정상 출고",
  "actorName": "홍길동"
}
```

**필수 필드**:
- `itemId` (number, required): 품목 ID (양수)
- `factoryId` (number, required): 공장 ID (양수)
- `quantity` (number, required): 수량 (양수)
- `unit` (string, required): 단위 (1-10자)

**선택 필드**:
- `note` (string, optional): 비고 (최대 200자)
- `actorName` (string, optional): 담당자명 (최대 50자)

---

### 6.7 공장 간 이동
```
POST /api/inventories/transfer
```

**Request Body**:
```json
{
  "itemId": 1,
  "sourceFactoryId": 1,
  "destFactoryId": 2,
  "storageConditionId": 1,
  "quantity": 50,
  "unit": "kg",
  "note": "공장 간 이동",
  "actorName": "홍길동"
}
```

**필수 필드**:
- `itemId` (number, required): 품목 ID (양수)
- `sourceFactoryId` (number, required): 출발 공장 ID (양수)
- `destFactoryId` (number, required): 도착 공장 ID (양수, sourceFactoryId와 달라야 함)
- `storageConditionId` (number, required): 보관 조건 ID (양수)
- `quantity` (number, required): 수량 (양수)
- `unit` (string, required): 단위 (1-10자)

**선택 필드**:
- `note` (string, optional): 비고 (최대 200자)
- `actorName` (string, optional): 담당자명 (최대 50자)

**주의**: `sourceFactoryId`와 `destFactoryId`는 반드시 달라야 합니다.

---

### 6.8 재고 삭제
```
DELETE /api/inventories/:id
```

---

## 🔄 7. 입출고 트랜잭션 (Inventory Transactions)

### 7.1 트랜잭션 목록 조회
```
GET /api/inventory-transactions
```
**인증 필요**: ✅

**Query Parameters**:
- `type` (string, optional, default: "ALL"): `RECEIVE`, `ISSUE`, `TRANSFER`, `ALL`
- `itemId` (number, optional): 품목 ID (양수)
- `factoryId` (number, optional): 공장 ID (양수)
- `startDate` (string, optional): 시작 날짜 (ISO 8601 datetime 형식)
- `endDate` (string, optional): 종료 날짜 (ISO 8601 datetime 형식)
- `userId` (number, optional): 사용자 ID (양수)
- `page` (number, default: 1): 페이지 번호
- `limit` (number, default: 20, max: 100): 페이지당 항목 수

**예시**:
```
GET /api/inventory-transactions?type=RECEIVE&factoryId=1&page=1&limit=20
```

---

### 7.2 트랜잭션 통계
```
GET /api/inventory-transactions/stats
```
**인증 필요**: ✅

**Query Parameters**:
- `factoryId` (number, optional): 공장 ID (양수)
- `startDate` (string, optional): 시작 날짜 (ISO 8601 datetime 형식)
- `endDate` (string, optional): 종료 날짜 (ISO 8601 datetime 형식)
- `groupBy` (string, optional, default: "day"): `day`, `week`, `month`

**Response**:
```json
{
  "ok": true,
  "data": {
    "totalReceive": 1000,
    "totalIssue": 500,
    "totalTransfer": 200,
    "timeline": [
      {
        "date": "2024-10-01",
        "receive": 100,
        "issue": 50,
        "transfer": 20
      }
    ]
  }
}
```

---

### 7.3 월별 이용률
```
GET /api/inventory-transactions/monthly-utilization
```
**인증 필요**: ✅

---

### 7.4 트랜잭션 상세 조회
```
GET /api/inventory-transactions/:id
```
**인증 필요**: ✅

**주의**: `:id`는 양수여야 합니다.

---

### 7.5 입고 트랜잭션 생성
```
POST /api/inventory-transactions/receive
```
**인증 필요**: ✅

**Request Body**:
```json
{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "lotNumber": "LOT001",
  "wholesalePrice": 5000,
  "quantity": 100,
  "unit": "kg",
  "receivedAt": "2024-10-29T10:00:00Z",
  "firstReceivedAt": "2024-10-29T10:00:00Z",
  "note": "정상 입고",
  "printLabel": false,
  "labelSize": "large",
  "labelQuantity": 1
}
```

**필수 필드**:
- `itemId` (number, required): 품목 ID (양수)
- `factoryId` (number, required): 공장 ID (양수)
- `storageConditionId` (number, required): 보관 조건 ID (양수)
- `lotNumber` (string, required): LOT 번호 (1-50자)
- `wholesalePrice` (number, required): 도매가 (0 이상)
- `quantity` (number, required): 수량 (양수)
- `unit` (string, required): 단위 (1-10자)
- `receivedAt` (date, required): 입고 날짜

**선택 필드**:
- `firstReceivedAt` (date, optional): 최초 입고 날짜
- `note` (string, optional): 비고 (최대 200자)
- `printLabel` (boolean, optional, default: false): 라벨 출력 여부
- `labelSize` (string, optional, default: "large"): 라벨 크기 (`large`, `medium`, `small`)
- `labelQuantity` (number, optional, default: 1): 라벨 출력 수량 (1-100)

---

### 7.6 출고 트랜잭션 생성
```
POST /api/inventory-transactions/issue
```
**인증 필요**: ✅

**Request Body**:
```json
{
  "itemId": 1,
  "factoryId": 1,
  "quantity": 50,
  "unit": "kg",
  "issueType": "PRODUCTION",
  "shippingInfo": {
    "recipientName": "홍길동",
    "recipientPhone": "010-1234-5678",
    "recipientAddress": "서울시 강남구",
    "shippingCompany": "CJ대한통운",
    "trackingNumber": "123456789"
  },
  "note": "정상 출고"
}
```

**필수 필드**:
- `itemId` (number, required): 품목 ID (양수)
- `factoryId` (number, required): 공장 ID (양수)
- `quantity` (number, required): 수량 (양수)
- `unit` (string, required): 단위 (1-10자)

**선택 필드**:
- `issueType` (string, optional, default: "OTHER"): 출고 유형
- `shippingInfo` (object, optional): 배송 정보
- `note` (string, optional): 비고 (최대 200자)

**issueType 값**:
- `PRODUCTION`: 생산 출고
- `SHIPPING`: 배송 출고
- `DAMAGE`: 불량/폐기
- `OTHER`: 기타

**shippingInfo 필드** (모두 선택):
- `recipientName` (string, optional): 수령인 이름 (최대 50자)
- `recipientPhone` (string, optional): 수령인 전화번호 (최대 20자)
- `recipientAddress` (string, optional): 수령인 주소 (최대 200자)
- `shippingCompany` (string, optional): 택배사 (최대 50자)
- `trackingNumber` (string, optional): 송장번호 (최대 100자)

---

### 7.7 일괄 출고
```
POST /api/inventory-transactions/batch-issue
```
**인증 필요**: ✅

**Request Body**:
```json
{
  "transactions": [
    {
      "itemId": 1,
      "factoryId": 1,
      "quantity": 50,
      "unit": "kg",
      "recipientName": "홍길동",
      "recipientAddress": "서울시 강남구",
      "recipientPhone": "010-1234-5678",
      "shippingCompany": "CJ대한통운",
      "trackingNumber": "123456789",
      "note": "배송"
    }
  ]
}
```

**필수 필드**:
- `transactions` (array, required): 트랜잭션 배열 (최소 1개, 최대 100개)

**transactions 배열 각 항목**:
- `itemId` (number, required): 품목 ID (양수)
- `factoryId` (number, required): 공장 ID (양수)
- `quantity` (number, required): 수량 (양수)
- `unit` (string, required): 단위 (1-10자)
- `recipientName` (string, required): 수령인 이름 (최대 50자)
- `recipientAddress` (string, required): 수령인 주소 (최대 200자)
- `recipientPhone` (string, optional): 수령인 전화번호 (최대 20자)
- `shippingCompany` (string, optional): 택배사 (최대 50자)
- `trackingNumber` (string, optional): 송장번호 (최대 100자)
- `note` (string, optional): 비고 (최대 200자)

---

### 7.8 공장 간 이동 트랜잭션
```
POST /api/inventory-transactions/transfer
```
**인증 필요**: ✅

**Request Body**:
```json
{
  "itemId": 1,
  "sourceFactoryId": 1,
  "destFactoryId": 2,
  "storageConditionId": 1,
  "quantity": 50,
  "unit": "kg",
  "transferType": "PRODUCTION",
  "note": "공장 간 이동"
}
```

**필수 필드**:
- `itemId` (number, required): 품목 ID (양수)
- `sourceFactoryId` (number, required): 출발 공장 ID (양수)
- `destFactoryId` (number, required): 도착 공장 ID (양수)
- `storageConditionId` (number, required): 보관 조건 ID (양수)
- `quantity` (number, required): 수량 (양수)
- `unit` (string, required): 단위 (1-10자)

**선택 필드**:
- `transferType` (string, optional, default: "OTHER"): 이동 유형
- `note` (string, optional): 비고 (최대 200자)

**transferType 값**:
- `PRODUCTION`: 생산 공정 이동
- `RESTOCK`: 재입고
- `OTHER`: 기타

---

## 🚚 8. 창고 간 이동 (Warehouse Transfers)

### 8.1 창고 간 이동
```
POST /api/warehouse-transfers
```
**인증 필요**: ✅

**Request Body**:
```json
{
  "itemId": 1,
  "sourceLocationId": 1,
  "destLocationId": 2,
  "storageConditionId": 1,
  "quantity": 50,
  "unit": "kg",
  "transferType": "WAREHOUSE_IN",
  "note": "창고 입고"
}
```

**필수 필드**:
- `itemId` (number, required): 품목 ID (양수)
- `sourceLocationId` (number, required): 출발지 ID (양수)
- `destLocationId` (number, required): 도착지 ID (양수)
- `storageConditionId` (number, required): 보관 조건 ID (양수)
- `quantity` (number, required): 수량 (양수)
- `unit` (string, required): 단위 (1-10자)

**선택 필드**:
- `transferType` (string, optional, default: "OTHER"): 이동 유형
- `note` (string, optional): 비고 (최대 200자)

**transferType 값**:
- `PRODUCTION`: 생산 공정 이동
- `WAREHOUSE_IN`: 창고 입고
- `WAREHOUSE_OUT`: 창고 출고
- `RESTOCK`: 재입고
- `OTHER`: 기타

---

### 8.2 이동 이력 조회
```
GET /api/warehouse-transfers/history
```
**인증 필요**: ✅

**Query Parameters**:
- `itemId` (number, optional): 품목 ID (양수)
- `locationId` (number, optional): 위치 ID (양수)
- `sourceType` (string, optional): 출발지 유형 (`1PreProcessing`, `2Manufacturing`, `Warehouse`)
- `destType` (string, optional): 도착지 유형 (`1PreProcessing`, `2Manufacturing`, `Warehouse`)
- `startDate` (string, optional): 시작 날짜 (ISO 8601 datetime 형식)
- `endDate` (string, optional): 종료 날짜 (ISO 8601 datetime 형식)
- `page` (number, default: 1): 페이지 번호
- `limit` (number, default: 20, max: 100): 페이지당 항목 수

---

### 8.3 이동 경로 통계
```
GET /api/warehouse-transfers/path-stats
```
**인증 필요**: ✅

**Query Parameters**:
- `startDate` (string, optional): 시작 날짜 (ISO 8601 datetime 형식)
- `endDate` (string, optional): 종료 날짜 (ISO 8601 datetime 형식)

---

## 🌡️ 9. 보관 조건 (Storage Conditions)

### 9.1 보관 조건 목록 조회
```
GET /api/storage-conditions
```

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "name": "냉장 보관",
      "temperature_range": "0-10°C",
      "humidity_range": "40-60%"
    }
  ]
}
```

---

### 9.2 보관 조건 상세 조회
```
GET /api/storage-conditions/:id
```

---

### 9.3 보관 조건 생성
```
POST /api/storage-conditions
```

**Request Body**:
```json
{
  "name": "냉장 보관",
  "temperature_range": "0-10°C",
  "humidity_range": "40-60%"
}
```

**필수 필드**:
- `name` (string, required): 보관 조건명 (1-50자)

**선택 필드**:
- `temperature_range` (string, optional): 온도 범위 (1-50자)
- `humidity_range` (string, optional): 습도 범위 (1-50자)

---

### 9.4 보관 조건 수정
```
PUT /api/storage-conditions/:id
```

**Request Body** (모두 선택, 하나 이상 필요):
```json
{
  "name": "냉장 보관",
  "temperature_range": "0-10°C",
  "humidity_range": "40-60%"
}
```

**선택 필드**:
- `name` (string, optional): 보관 조건명 (1-50자)
- `temperature_range` (string, optional): 온도 범위 (1-50자)
- `humidity_range` (string, optional): 습도 범위 (1-50자)

---

### 9.5 보관 조건 삭제
```
DELETE /api/storage-conditions/:id
```

---

## 📤 10. 주문서 가져오기 (Order Import)

### 10.1 단일 파일 업로드
```
POST /api/order-import/upload
```

**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: 업로드할 파일 (Excel 또는 CSV)

**Response**:
```json
{
  "ok": true,
  "message": "파일 업로드 성공",
  "data": {
    "filename": "order_20241029.xlsx",
    "rows": 100,
    "summary": { }
  }
}
```

---

### 10.2 다중 파일 업로드 및 통합
```
POST /api/order-import/upload-multiple
```

**Content-Type**: `multipart/form-data`

**Form Data**:
- `files`: 업로드할 파일들 (최대 10개)

---

### 10.3 파일 다운로드
```
GET /api/order-import/download/:filename
```

**Response**: 파일 다운로드

---

### 10.4 업로드된 파일 목록
```
GET /api/order-import/files
```

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "filename": "order_20241029.xlsx",
      "size": 102400,
      "uploadedAt": "2024-10-29T10:00:00Z"
    }
  ]
}
```

---

### 10.5 파일 삭제
```
DELETE /api/order-import/files/:filename
```

---

## 📊 11. 대시보드 (Dashboard)

### 11.1 메인 대시보드 (모든 데이터)
```
GET /api/dashboard
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "totalValue": 5000000,
    "categoryBreakdown": [],
    "recentMovements": [],
    "topMovingItems": [],
    "stockStatus": {},
    "monthlyTrend": [],
    "factoryComparison": [],
    "kpis": {}
  }
}
```

---

### 11.2 총 재고 가치
```
GET /api/dashboard/total-value
```

---

### 11.3 카테고리별 재고 분포
```
GET /api/dashboard/category-breakdown
```

---

### 11.4 최근 재고 이동
```
GET /api/dashboard/recent-movements
```

---

### 11.5 가장 많이 움직인 품목
```
GET /api/dashboard/top-moving-items
```

---

### 11.6 재고 상태 요약
```
GET /api/dashboard/stock-status
```

---

### 11.7 월별 트렌드
```
GET /api/dashboard/monthly-trend
```

---

### 11.8 공장별 비교
```
GET /api/dashboard/factory-comparison
```

---

### 11.9 KPI 지표
```
GET /api/dashboard/kpis
```

---

## 🔔 12. 알림 (Notifications)

### 12.1 재고 부족 알림
```
GET /api/notifications/low-stock
```

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "itemId": 1,
      "itemName": "원재료 A",
      "currentStock": 50,
      "threshold": 100,
      "severity": "warning"
    }
  ]
}
```

---

### 12.2 유통기한 임박 알림
```
GET /api/notifications/expiring
```

---

### 12.3 만료된 재고
```
GET /api/notifications/expired
```

---

### 12.4 전체 알림 요약
```
GET /api/notifications/summary
```

---

### 12.5 공장별 알림
```
GET /api/notifications/factory-alerts
```

---

### 12.6 일일 알림 리포트
```
GET /api/notifications/daily-report
```

---

## 📄 13. 리포트 (Reports)

### 13.1 일일 리포트
```
GET /api/reports/daily
```

**Query Parameters**:
- `date` (string, optional): 조회 날짜 (YYYY-MM-DD 형식)

---

### 13.2 주간 리포트
```
GET /api/reports/weekly
```

**Query Parameters**:
- `startDate` (string, optional): 시작 날짜
- `endDate` (string, optional): 종료 날짜

---

### 13.3 월간 리포트
```
GET /api/reports/monthly
```

**Query Parameters**:
- `month` (string, optional): 월 (YYYY-MM 형식)

---

### 13.4 재고 현황 리포트
```
GET /api/reports/inventory-status
```

---

### 13.5 재고 회전율 분석
```
GET /api/reports/turnover-analysis
```

---

### 13.6 생성된 리포트 목록
```
GET /api/reports/list
```

---

### 13.7 리포트 파일 다운로드
```
GET /api/reports/download/:filename
```

---

## 🔮 14. 재고 예측 (Predictions)

### 14.1 전체 품목 재고 소진 예측
```
GET /api/predictions/stockouts
```

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "itemId": 1,
      "itemName": "원재료 A",
      "currentStock": 100,
      "dailyConsumption": 10,
      "daysRemaining": 10,
      "estimatedStockoutDate": "2024-11-08"
    }
  ]
}
```

---

### 14.2 품목별 재고 소진 예측
```
GET /api/predictions/:itemId/stockout
```

---

### 14.3 소비 패턴 분석
```
GET /api/predictions/:itemId/consumption-pattern
```

---

### 14.4 재주문 수량 계산
```
GET /api/predictions/:itemId/reorder-quantity
```

---

### 14.5 계절성 분석
```
GET /api/predictions/:itemId/seasonality
```

---

### 14.6 수요 예측
```
GET /api/predictions/:itemId/forecast
```

**Query Parameters**:
- `days` (number, optional): 예측 기간 (일)

---

## 🏥 15. 헬스체크 (Health Check)

### 15.1 전체 헬스체크
```
GET /api/health
```

**Response**:
```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2024-10-29T10:00:00Z",
  "database": "connected",
  "uptime": 86400
}
```

---

### 15.2 간단한 Ping
```
GET /api/health/ping
```

**Response**:
```json
{
  "ok": true,
  "message": "pong"
}
```

---

### 15.3 Readiness Probe
```
GET /api/health/readiness
```

---

### 15.4 Liveness Probe
```
GET /api/health/liveness
```

---

### 15.5 시스템 메트릭스
```
GET /api/health/metrics
```

---

## 📝 Axios 사용 예시

### Axios 설정 (인증 포함)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true, // 쿠키 포함
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터 (에러 처리)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 시 로그인 페이지로 이동
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 사용 예시

```javascript
// 로그인
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// 재고 목록 조회
const getInventories = async (params) => {
  const response = await api.get('/inventories', { params });
  return response.data;
};

// 입고 처리
const receiveInventory = async (data) => {
  const response = await api.post('/inventories/receive', data);
  return response.data;
};

// 품목 생성 (camelCase 사용)
const createItem = async (itemData) => {
  const data = {
    code: itemData.code,
    name: itemData.name,
    category: itemData.category,
    unit: itemData.unit,
    factoryId: itemData.factoryId,  // camelCase
    shortage: itemData.shortage,
    shelfLife: itemData.shelfLife,  // camelCase
    wholesalePrice: itemData.wholesalePrice  // camelCase
  };
  
  const response = await api.post('/items', data);
  return response.data;
};

// 파일 업로드
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/order-import/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
```

---

## 🔐 인증이 필요한 엔드포인트

다음 엔드포인트들은 반드시 로그인 후 사용해야 합니다:

- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/` (사용자 목록)
- `/api/auth/:id` (사용자 상세/수정/삭제)
- `/api/inventory-transactions/*` (모든 트랜잭션 API)
- `/api/warehouse-transfers/*` (모든 창고 이동 API)

---

## 📅 날짜/시간 형식

모든 날짜/시간은 **ISO 8601** 형식을 사용합니다:
- `2024-10-29T10:00:00Z` (UTC)
- `2024-10-29T19:00:00+09:00` (한국 시간)

JavaScript에서는 다음과 같이 변환할 수 있습니다:
```javascript
// Date 객체를 ISO 문자열로
const isoString = new Date().toISOString();

// ISO 문자열을 Date 객체로
const date = new Date('2024-10-29T10:00:00Z');
```

---

## 🛠️ 에러 코드

| 상태 코드 | 의미 | 설명 |
|---------|-----|-----|
| 200 | OK | 요청 성공 |
| 201 | Created | 리소스 생성 성공 |
| 400 | Bad Request | 잘못된 요청 (validation 에러) |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스를 찾을 수 없음 |
| 500 | Internal Server Error | 서버 내부 오류 |

---

## 📌 중요 주의사항

### 1. 품목 관리 API (Items)
- **Request Body는 camelCase로 보내야 합니다**:
  - `factoryId` (O) / `factory_id` (X)
  - `shelfLife` (O) / `expiration_date` (X)
  - `wholesalePrice` (O) / `wholesale_price` (X)
- 한글 카테고리는 자동으로 영문으로 변환됩니다
- 응답 데이터는 snake_case로 반환됩니다

### 2. BOM API
- `lines` 배열의 각 항목은 `itemId` 또는 `itemCode` 중 하나는 반드시 포함해야 합니다
- `quantity`는 반드시 양수여야 합니다
- `unit`은 공백 불가

### 3. 재고 관리 API (Inventories)
- 페이지네이션: `limit`는 최대 100까지 가능
- 날짜 파라미터는 ISO 8601 datetime 형식만 허용
- `sourceFactoryId`와 `destFactoryId`는 반드시 달라야 합니다

### 4. 입출고 트랜잭션 API
- 모든 엔드포인트는 인증이 필요합니다
- 일괄 출고는 최소 1개, 최대 100개까지 가능
- `labelQuantity`는 1-100 범위만 허용

### 5. 창고 간 이동 API
- `sourceLocationId`와 `destLocationId`는 반드시 달라야 합니다
- `sourceType`과 `destType`은 정확한 값만 허용 (`1PreProcessing`, `2Manufacturing`, `Warehouse`)

### 6. 보관 조건 API
- `name`은 1-50자로 제한
- `temperature_range`와 `humidity_range`는 선택 필드

### 7. 파일 업로드
- `multipart/form-data` 형식을 사용해야 합니다
- 단일 파일: `file` 필드 사용
- 다중 파일: `files` 필드 사용 (최대 10개)

---

## 🎯 프론트엔드 구현 체크리스트

- [ ] Axios 인스턴스 생성 (withCredentials 포함)
- [ ] 응답 인터셉터 설정 (에러 처리)
- [ ] 로그인/로그아웃 기능 구현
- [ ] 세션 유지 확인 (페이지 새로고침 시)
- [ ] 재고 목록 조회 및 필터링
- [ ] 입고/출고/이동 폼 구현
- [ ] 품목 생성 시 camelCase 사용 확인
- [ ] BOM lines 배열 검증 로직 구현
- [ ] 대시보드 데이터 시각화
- [ ] 알림 기능 구현
- [ ] 리포트 다운로드 기능
- [ ] 파일 업로드 기능
- [ ] 날짜 형식 ISO 8601 변환
- [ ] 에러 메시지 표시
- [ ] 로딩 상태 표시
- [ ] Validation 에러 상세 표시

---

## 🔍 필드명 변환 가이드

프론트엔드에서 백엔드로 데이터를 보낼 때 주의해야 할 필드명:

| 프론트엔드 (전송) | 백엔드 (DB/응답) | 비고 |
|-----------------|----------------|------|
| `factoryId` | `factory_id` | 품목 생성/수정 시 |
| `shelfLife` | `expiration_date` | 품목 생성/수정 시 |
| `wholesalePrice` | `wholesale_price` | 품목 생성/수정 시 |
| `itemId` | `itemId` | 그대로 사용 |
| `storageConditionId` | `storageConditionId` | 그대로 사용 |

**중요**: 품목 API만 camelCase로 보내고, 나머지 API는 모두 그대로 사용하면 됩니다.

---

이 문서는 실제 백엔드 validation 미들웨어를 기반으로 작성되었으며, 프론트엔드 개발 시 정확한 참고 자료로 사용하실 수 있습니다.
