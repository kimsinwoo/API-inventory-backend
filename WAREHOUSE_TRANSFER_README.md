# 공장/창고 간 이동 시스템 구현 완료 ✅

## 📦 구현 완료

공장과 창고 간의 재고 이동을 관리하는 시스템이 구현되었습니다.

### ✅ 지원되는 이동 경로

| 출발 | 도착 | 설명 | transferType |
|------|------|------|--------------|
| 🏭 1공장(전처리) | 🏭 2공장(제조) | 전처리 완료 후 제조 공정 | PRODUCTION |
| 🏭 2공장(제조) | 📦 창고 | 제조 완료 후 창고 입고 | WAREHOUSE_IN |
| 📦 창고 | 🏭 2공장(제조) | 창고에서 공장으로 재출고 | WAREHOUSE_OUT |
| 📦 창고 | 🏭 1공장(전처리) | 창고에서 재가공 | RESTOCK |
| 🏭 2공장(제조) | 🏭 1공장(전처리) | 제조 → 재전처리 | OTHER |
| 📦 창고 | 📦 창고 | 창고 간 이동 | OTHER |

---

## 📁 생성된 파일

### 1. 핵심 파일
- ✅ `src/routes/warehouseTransferRoute.js` - API 라우트
- ✅ `src/controller/warehouseTransferController.js` - 컨트롤러
- ✅ `src/services/warehouseTransferService.js` - 비즈니스 로직
- ✅ `src/middleware/validateWarehouseTransfer.js` - 검증 미들웨어

### 2. 마이그레이션
- ✅ `migrations/20241027-add-warehouse-type.js` - Warehouse 타입 추가

### 3. 문서
- ✅ `WAREHOUSE_TRANSFER_API.md` - 상세 API 문서
- ✅ `WAREHOUSE_TRANSFER_README.md` - 구현 가이드

### 4. 수정된 파일
- ✅ `models/factory.js` - type ENUM에 "Warehouse" 추가
- ✅ `src/routes/indexRoute.js` - 새 라우트 등록

---

## 🚀 사용 방법

### 1. 마이그레이션 실행

```bash
npx sequelize-cli db:migrate
```

이 명령어로 Factory 테이블에 "Warehouse" 타입이 추가됩니다.

### 2. 창고 등록 (선택사항)

```bash
POST http://localhost:4000/api/factories
Content-Type: application/json

{
  "type": "Warehouse",
  "name": "중앙창고",
  "address": "경기도 성남시..."
}
```

### 3. 공장/창고 간 이동

#### 예시 1: 전처리 → 제조
```bash
POST http://localhost:4000/api/warehouse-transfers
Content-Type: application/json

{
  "itemId": 1,
  "sourceLocationId": 1,    // 1공장(전처리)
  "destLocationId": 2,      // 2공장(제조)
  "storageConditionId": 2,
  "quantity": 50,
  "unit": "kg",
  "transferType": "PRODUCTION",
  "note": "전처리 완료"
}
```

#### 예시 2: 제조 → 창고
```bash
POST http://localhost:4000/api/warehouse-transfers

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

#### 예시 3: 창고 → 공장
```bash
POST http://localhost:4000/api/warehouse-transfers

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

---

## 📊 API 엔드포인트

### 기본 URL: `/api/warehouse-transfers`

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/` | 공장/창고 간 이동 |
| GET | `/history` | 이동 이력 조회 |
| GET | `/path-stats` | 이동 경로 통계 |

---

## 💡 주요 특징

### 1. 자동 경로 감지 🎯

시스템이 출발지와 도착지의 타입을 자동으로 확인하여 적절한 설명을 생성합니다.

```javascript
// 응답 예시
{
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
  }
}
```

### 2. FIFO (선입선출) 📦

출발지에서 유통기한이 가장 빠른 재고부터 자동으로 출고됩니다.

```javascript
{
  "traces": [
    {
      "lotNumber": "LOT-20241027-001",
      "take": 30,
      "expirationDate": "2025-01-01"
    },
    {
      "lotNumber": "LOT-20241026-005",
      "take": 20,
      "expirationDate": "2024-12-31"
    }
  ]
}
```

### 3. 사용자 정보 자동 기록 👤

로그인한 사용자의 정보가 자동으로 기록됩니다.

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

어떤 이동 경로가 가장 많이 사용되는지 분석할 수 있습니다.

```javascript
GET /api/warehouse-transfers/path-stats

// 응답
{
  "paths": [
    {
      "path": "1공장(1공장(전처리)) → 2공장(2공장(제조))",
      "count": 120,
      "totalQuantity": 5000
    }
  ]
}
```

---

## 🔄 데이터 흐름

### 일반적인 생산 흐름

```
1. 원재료 입고
   ↓
2. 1공장(전처리)에서 전처리
   ↓ [POST /warehouse-transfers]
3. 2공장(제조)으로 이동
   ↓
4. 2공장에서 제조
   ↓ [POST /warehouse-transfers]
5. 창고로 입고
   ↓
6. 주문 발생 시 창고에서 출고
   ↓ [POST /inventory-transactions/issue]
7. 배송
```

### 이동 처리 프로세스

```
1. 사용자 로그인
2. 이동 요청 (POST /warehouse-transfers)
3. 출발지/도착지 조회 및 타입 확인
4. 출발지에서 FIFO 출고
   - 유통기한 빠른 순
   - 여러 LOT 자동 분산
5. TRANSFER_OUT 이력 생성
6. 도착지에 재고 생성
7. TRANSFER_IN 이력 생성
8. 응답: 이동 완료 + 상세 정보
```

---

## 📋 이동 유형 (transferType)

| 값 | 설명 | 사용 예시 |
|-----|------|----------|
| PRODUCTION | 생산 공정 이동 | 전처리 → 제조 |
| WAREHOUSE_IN | 창고 입고 | 제조 → 창고 |
| WAREHOUSE_OUT | 창고 출고 | 창고 → 공장 |
| RESTOCK | 재입고 | 창고 → 전처리 (재가공) |
| OTHER | 기타 | 기타 모든 이동 |

---

## 🗄️ 데이터베이스 변경사항

### Factory 테이블

**이전:**
```sql
type ENUM('1PreProcessing', '2Manufacturing')
```

**변경 후:**
```sql
type ENUM('1PreProcessing', '2Manufacturing', 'Warehouse')
```

### 마이그레이션 실행

```bash
npx sequelize-cli db:migrate
```

실행 결과:
```
== 20241027-add-warehouse-type: migrating =======
== 20241027-add-warehouse-type: migrated (0.XXXs)
```

---

## 📊 이동 이력 조회

### 필터 옵션

```bash
# 1공장 → 2공장 이동만 조회
GET /api/warehouse-transfers/history?sourceType=1PreProcessing&destType=2Manufacturing

# 제조 → 창고 이동만 조회
GET /api/warehouse-transfers/history?sourceType=2Manufacturing&destType=Warehouse

# 특정 품목의 이동 이력
GET /api/warehouse-transfers/history?itemId=1

# 특정 위치가 포함된 모든 이동
GET /api/warehouse-transfers/history?locationId=2

# 기간별 조회
GET /api/warehouse-transfers/history?startDate=2024-10-01T00:00:00Z&endDate=2024-10-31T23:59:59Z
```

---

## ⚠️ 주의사항

### 1. 마이그레이션 필수
Factory 테이블에 "Warehouse" 타입을 추가해야 합니다.

### 2. 재고 부족 시 에러
출발지에 재고가 부족하면 트랜잭션이 롤백됩니다.

### 3. 출발지와 도착지 동일 불가
같은 위치로는 이동할 수 없습니다.

### 4. 세션 인증 필수
모든 API는 로그인 후 사용 가능합니다.

---

## 🔗 관련 시스템

### 1. 입고/출고 트랜잭션 API
```
POST /api/inventory-transactions/receive  // 원재료 입고
POST /api/inventory-transactions/issue    // 완제품 출고
```

### 2. 공장/창고 간 이동 API (신규)
```
POST /api/warehouse-transfers             // 공장/창고 이동
GET  /api/warehouse-transfers/history     // 이동 이력
GET  /api/warehouse-transfers/path-stats  // 경로 통계
```

### 3. 재고 관리 API
```
GET /api/inventories                      // 재고 현황
GET /api/inventories/movements            // 전체 이동 이력
```

---

## 📚 추가 문서

- [WAREHOUSE_TRANSFER_API.md](./WAREHOUSE_TRANSFER_API.md) - 상세 API 문서
- [INVENTORY_TRANSACTION_API.md](./INVENTORY_TRANSACTION_API.md) - 입고/출고 API
- [Factory 모델](./models/factory.js) - Factory 모델 정의

---

## ✅ 완료 체크리스트

- [x] Factory 모델에 Warehouse 타입 추가
- [x] 공장/창고 간 이동 서비스 구현
- [x] FIFO 출고 로직 적용
- [x] 사용자 정보 자동 기록
- [x] 경로 자동 감지 및 라벨링
- [x] 이동 이력 조회 기능
- [x] 경로 통계 기능
- [x] 마이그레이션 파일 작성
- [x] API 문서 작성
- [x] 라우트 등록

---

## 🎉 구현 완료!

공장과 창고 간의 재고 이동 시스템이 완성되었습니다!

### 사용 가능한 기능:
✅ 공장 → 공장 이동 (전처리 → 제조)  
✅ 공장 → 창고 이동 (제조 → 보관)  
✅ 창고 → 공장 이동 (재출고)  
✅ 창고 → 창고 이동  
✅ 이동 이력 추적  
✅ 경로별 통계  

**마이그레이션 실행 후 바로 사용 가능합니다!** 🚀

```bash
# 마이그레이션 실행
npx sequelize-cli db:migrate

# 서버 재시작 (이미 실행 중이라면 자동 재시작됨)
npm start
```

