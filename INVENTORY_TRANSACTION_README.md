# 입고/출고 트랜잭션 시스템 구현 완료 ✅

## 📦 구현된 기능

### 1. 입고 관리
- ✅ **입고 처리** - 로그인한 사용자 정보 자동 기록
- ✅ **유통기한 자동 계산** - 품목 설정에 따라 자동 계산
- ✅ **품질 검수 제외** - 요구사항에 따라 제외됨
- ✅ **입고 이력 추적** - 누가, 언제, 얼마나 입고했는지 기록

### 2. 출고 관리
- ✅ **FIFO 출고** - 유통기한 빠른 순서로 자동 출고
- ✅ **배송 정보 연동** - 수령인, 송장 번호 등 기록
- ✅ **일괄 출고** - 배송 관리용 대량 처리 (최대 100건)
- ✅ **출고 추적** - 어떤 LOT에서 얼마나 출고되었는지 추적

### 3. 공장 간 이동
- ✅ **1공장 → 2공장** - 전처리 → 제조 공정 이동
- ✅ **이동 유형** - PRODUCTION, RESTOCK, OTHER
- ✅ **이동 이력** - 출발/도착 공장 모두 기록

### 4. 월별 입출고 현황 (창고 이용률)
- ✅ **출고 품목** - 해당 월의 출고 및 공장 이동 발생 품목
- ✅ **입고 품목** - 해당 월의 입고 및 제조된 품목
- ✅ **이용률 계산** - 입고량 vs 출고량

### 5. 통계 및 분석
- ✅ **트랜잭션 통계** - 타입별, 품목별 통계
- ✅ **상위 품목** - 가장 많이 처리된 품목 TOP 10
- ✅ **월별 분석** - 년/월 기준 필터링

---

## 📁 생성된 파일

### 1. 라우트
```
src/routes/inventoryTransactionRoute.js
```
- 입고/출고/이동 API 엔드포인트 정의
- 인증 미들웨어 적용
- 검증 미들웨어 연결

### 2. 컨트롤러
```
src/controller/inventoryTransactionController.js
```
- 요청 처리 및 응답
- 세션에서 사용자 ID 추출
- 에러 핸들링

### 3. 서비스
```
src/services/inventoryTransactionService.js
```
- 비즈니스 로직
- FIFO 출고 구현
- 사용자 정보 연동
- 트랜잭션 관리

### 4. 검증 미들웨어
```
src/middleware/validateinventoryTransaction.js
```
- Zod 스키마 기반 검증
- 입고/출고/이동 요청 검증
- 일괄 처리 검증

### 5. 문서
```
INVENTORY_TRANSACTION_API.md
```
- 상세한 API 문서
- 요청/응답 예시
- 사용 시나리오

---

## 🚀 사용 방법

### 1. 서버 재시작

```bash
npm start
```

### 2. API 테스트

#### 입고 처리
```bash
POST http://localhost:4000/api/inventory-transactions/receive
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
  "note": "신선 상태 양호"
}
```

#### 출고 처리
```bash
POST http://localhost:4000/api/inventory-transactions/issue
Content-Type: application/json

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
    "trackingNumber": "123456789012"
  }
}
```

#### 공장 간 이동
```bash
POST http://localhost:4000/api/inventory-transactions/transfer
Content-Type: application/json

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

#### 트랜잭션 목록 조회
```bash
GET http://localhost:4000/api/inventory-transactions?type=ALL&page=1&limit=20
```

#### 월별 입출고 현황
```bash
GET http://localhost:4000/api/inventory-transactions/monthly-utilization?year=2024&month=10&factoryId=1
```

---

## 🔑 주요 특징

### 1. 사용자 정보 자동 기록 👤

```javascript
// 로그인한 사용자 정보가 자동으로 기록됨
const userId = req.session?.userId;

// 응답에 사용자 정보 포함
{
  "receivedBy": {
    "userId": 5,
    "userName": "홍길동",
    "position": "창고 담당"
  }
}
```

### 2. FIFO (선입선출) 📦

```javascript
// 유통기한이 빠른 순서로 자동 출고
const lots = await Inventories.findAll({
  order: [
    ["expiration_date", "ASC"],  // 유통기한 빠른 순
    ["received_at", "ASC"],      // 입고일 빠른 순
  ]
});
```

### 3. 배송 정보 연동 🚚

```javascript
// 출고 시 배송 정보 함께 기록
{
  "issueType": "SHIPPING",
  "shippingInfo": {
    "recipientName": "김철수",
    "trackingNumber": "123456789012"
  }
}
```

### 4. 일괄 처리 📋

```javascript
// 최대 100건까지 일괄 출고 가능
POST /api/inventory-transactions/batch-issue
{
  "transactions": [
    // ... 여러 주문
  ]
}

// 응답: 성공/실패 건수
{
  "total": 50,
  "success": 48,
  "failed": 2
}
```

---

## 📊 데이터 흐름

### 입고 프로세스
```
1. 사용자 로그인
2. 입고 요청 (POST /receive)
3. 사용자 정보 조회 (UserProfile)
4. 재고 생성 (Inventories)
5. 유통기한 자동 계산
6. 이동 이력 생성 (InventoryMovement)
7. 응답: 입고 완료 + 사용자 정보
```

### 출고 프로세스
```
1. 사용자 로그인
2. 출고 요청 (POST /issue)
3. FIFO 로직 실행
   - 유통기한 빠른 순 정렬
   - 재고 차감
   - 여러 LOT 자동 분산
4. 이동 이력 생성 (각 LOT별)
5. 배송 정보 기록
6. 응답: 출고 완료 + 추적 정보
```

### 공장 간 이동 프로세스
```
1. 사용자 로그인
2. 이동 요청 (POST /transfer)
3. 출발 공장에서 FIFO 출고
4. TRANSFER_OUT 이력 생성
5. 도착 공장에 재고 생성
6. TRANSFER_IN 이력 생성
7. 응답: 이동 완료
```

---

## 🗄️ 데이터베이스 관계

```
InventoryMovement (이동 이력)
├── belongsTo → Items (품목)
├── belongsTo → Factory (출발 공장)
└── belongsTo → Factory (도착 공장)

Inventories (재고)
├── belongsTo → Items (품목)
├── belongsTo → Factory (공장)
└── belongsTo → StorageCondition (보관 조건)

User (사용자)
└── hasOne → UserProfile (프로필)
```

---

## ⚠️ 주의사항

### 1. 세션 인증 필수
모든 API는 로그인 후 사용 가능합니다.

### 2. 재고 부족 시 에러
출고/이동 시 재고가 부족하면 트랜잭션이 롤백됩니다.

### 3. 출발/도착 공장 동일 불가
공장 간 이동 시 출발 공장과 도착 공장이 같으면 에러 발생합니다.

### 4. 일괄 처리 제한
일괄 출고는 최대 100건까지 가능합니다.

---

## 🔄 기존 시스템과의 차이

| 구분 | 기존 (inventoryRoute) | 신규 (inventoryTransactionRoute) |
|------|----------------------|----------------------------------|
| 사용자 정보 | actorName (문자열) | userId 기반 자동 조회 |
| 배송 정보 | note에 포함 | shippingInfo 객체로 분리 |
| 일괄 처리 | 없음 | batch-issue 지원 |
| 월별 통계 | 없음 | monthly-utilization 지원 |
| 출고 유형 | 없음 | issueType, transferType 지원 |

---

## 🎯 다음 단계 (추후 구현 예정)

### 1. 권한 관리 연동
```javascript
// 권한 체크 미들웨어 추가
router.post("/receive", 
  authenticate, 
  checkPermission("inventory.receive"),  // 추가 예정
  ctrl.receive
);
```

### 2. 작업 지시서 연동
```javascript
// 제조 완료 시 작업 지시서 정보 포함
{
  "workOrderId": 123,
  "damagedQuantity": 2,
  "temperature": 25,
  "workingTime": 120,  // 분
  "note": "작업 완료"
}
```

### 3. 라벨 자동 생성
```javascript
// 입고/카테고리 변환 시 라벨 자동 생성
POST /api/labels/generate
{
  "transactionId": 456,
  "labelSize": "large"
}
```

### 4. 엑셀 파일 업로드
```javascript
// 배송 관리용 엑셀 업로드
POST /api/shipping/upload-excel
FormData: file (쿠팡, 스마트스토어 엑셀)

// 응답: 통합 엑셀 파일 생성
```

---

## 📚 관련 문서

- [API 상세 문서](./INVENTORY_TRANSACTION_API.md)
- [기존 재고 API](./src/routes/inventoryRoute.js)
- [사용자 인증](./src/utils/sessionAuth.js)

---

## ✅ 체크리스트

- [x] 입고 처리 구현
- [x] 출고 처리 구현 (FIFO)
- [x] 공장 간 이동 구현
- [x] 일괄 출고 구현
- [x] 사용자 정보 자동 기록
- [x] 배송 정보 연동
- [x] 월별 입출고 현황
- [x] 트랜잭션 통계
- [x] API 문서 작성
- [ ] 권한 관리 연동 (추후)
- [ ] 작업 지시서 연동 (추후)
- [ ] 라벨 자동 생성 (추후)
- [ ] 엑셀 업로드 (추후)

---

**구현 완료!** 🎉

이제 입고/출고 관련 모든 기능을 사용할 수 있습니다.
추가 문의사항이나 버그 발견 시 언제든지 알려주세요!

