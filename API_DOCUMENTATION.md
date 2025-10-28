# 📚 API 문서

재고 관리 시스템의 전체 API 엔드포인트 문서입니다.

## 목차

1. [대시보드 API](#대시보드-api)
2. [알림 API](#알림-api)
3. [리포트 API](#리포트-api)
4. [재고 예측 API](#재고-예측-api)
5. [헬스체크 API](#헬스체크-api)
6. [재고 관리 API](#재고-관리-api)
7. [품목 관리 API](#품목-관리-api)
8. [공장 관리 API](#공장-관리-api)

---

## 대시보드 API

### 메인 대시보드
```http
GET /api/dashboard
```

**Query Parameters:**
- `factoryId` (optional): 공장 ID로 필터링

**Response:**
```json
{
  "ok": true,
  "data": {
    "overview": {
      "totalValue": {
        "totalValue": 15000000,
        "totalLots": 50,
        "totalQuantity": 1500,
        "uniqueItems": 25
      },
      "stockStatus": [...],
      "lastUpdated": "2024-10-28 14:30:00"
    },
    "categoryBreakdown": [...],
    "recentMovements": [...],
    "topMovingItems": [...],
    "monthlyTrend": [...]
  }
}
```

### 총 재고 가치
```http
GET /api/dashboard/total-value
```

### 카테고리별 분포
```http
GET /api/dashboard/category-breakdown
```

### 최근 재고 이동
```http
GET /api/dashboard/recent-movements?limit=10
```

### 월별 트렌드
```http
GET /api/dashboard/monthly-trend?months=6
```

### KPI 지표
```http
GET /api/dashboard/kpis?period=month
```

**Period Options:**
- `day`: 오늘
- `week`: 이번 주
- `month`: 이번 달

---

## 알림 API

### 전체 알림 요약
```http
GET /api/notifications/summary
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "lowStock": {
      "count": 5,
      "critical": 2,
      "items": [...]
    },
    "expiring": {
      "count": 3,
      "critical": 1,
      "items": [...]
    },
    "expired": {
      "count": 1,
      "items": [...]
    },
    "totalAlerts": 9,
    "generatedAt": "2024-10-28 14:30:00"
  }
}
```

### 재고 부족 알림
```http
GET /api/notifications/low-stock?factoryId=1
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "itemId": 1,
      "itemCode": "RM001",
      "itemName": "프리미엄 육류",
      "currentQuantity": 5,
      "minimumQuantity": 10,
      "shortfall": 5,
      "severity": "high",
      "factory": {
        "id": 1,
        "name": "서울 공장"
      }
    }
  ],
  "count": 1
}
```

### 유통기한 임박
```http
GET /api/notifications/expiring?days=3&factoryId=1
```

### 만료된 재고
```http
GET /api/notifications/expired?factoryId=1
```

### 공장별 알림
```http
GET /api/notifications/factory-alerts
```

### 일일 알림 리포트
```http
GET /api/notifications/daily-report
```

---

## 리포트 API

### 일일 리포트
```http
GET /api/reports/daily?date=2024-10-28&factoryId=1&export=true
```

**Query Parameters:**
- `date` (optional): 리포트 날짜 (기본값: 오늘)
- `factoryId` (optional): 공장 ID
- `export` (optional): `true`로 설정 시 Excel 파일 생성

**Response:**
```json
{
  "ok": true,
  "data": {
    "reportDate": "2024-10-28",
    "summary": {
      "receive": { "count": 10, "quantity": 500 },
      "issue": { "count": 8, "quantity": 300 },
      "transfer": { "count": 2, "quantity": 50 }
    },
    "details": [...]
  },
  "file": {
    "fileName": "daily_report_2024-10-28.xlsx",
    "filePath": "/path/to/file",
    "size": 15234
  }
}
```

### 주간 리포트
```http
GET /api/reports/weekly?weekStart=2024-10-21&export=true
```

### 월간 리포트
```http
GET /api/reports/monthly?year=2024&month=10&export=true
```

### 재고 현황 리포트
```http
GET /api/reports/inventory-status?factoryId=1&export=true
```

### 재고 회전율 분석
```http
GET /api/reports/turnover-analysis?factoryId=1&days=30
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "period": "30일",
    "analysis": [
      {
        "itemCode": "RM001",
        "itemName": "프리미엄 육류",
        "currentQuantity": 50,
        "issuedQuantity": 120,
        "turnoverRate": 14.6,
        "daysOfStock": 12,
        "status": "보통"
      }
    ]
  }
}
```

### 리포트 목록
```http
GET /api/reports/list
```

### 리포트 다운로드
```http
GET /api/reports/download/:filename
```

---

## 재고 예측 API

### 전체 품목 재고 소진 예측
```http
GET /api/predictions/stockouts?factoryId=1
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "factoryId": "1",
    "totalItems": 25,
    "itemsAtRisk": 8,
    "predictions": [
      {
        "itemId": 1,
        "itemCode": "RM001",
        "itemName": "프리미엄 육류",
        "currentStock": 30,
        "avgDailyConsumption": 10,
        "daysUntilStockout": 3,
        "estimatedStockoutDate": "2024-10-31",
        "status": "긴급",
        "trend": "increasing"
      }
    ]
  }
}
```

### 소비 패턴 분석
```http
GET /api/predictions/:itemId/consumption-pattern?days=30
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "itemId": 1,
    "period": "30일",
    "totalConsumption": 300,
    "avgDailyConsumption": 10,
    "maxDailyConsumption": 25,
    "minDailyConsumption": 5,
    "trend": "increasing",
    "trendDetails": {
      "recentAvg": 12,
      "previousAvg": 9
    }
  }
}
```

### 품목별 재고 소진 예측
```http
GET /api/predictions/:itemId/stockout?factoryId=1
```

### 재주문 수량 계산
```http
GET /api/predictions/:itemId/reorder-quantity
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "itemId": 1,
    "itemCode": "RM001",
    "itemName": "프리미엄 육류",
    "avgDailyDemand": 10,
    "leadTimeDays": 7,
    "safetyStockDays": 3,
    "reorderPoint": 100,
    "recommendedOrderQuantity": 300,
    "unit": "kg",
    "estimatedCost": 4500000
  }
}
```

### 계절성 분석
```http
GET /api/predictions/:itemId/seasonality?months=12
```

### 수요 예측
```http
GET /api/predictions/:itemId/forecast?days=7
```

---

## 헬스체크 API

### 전체 헬스체크
```http
GET /api/health
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-10-28 14:30:00",
    "responseTime": "25ms",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 0,
        "details": {
          "connected": true
        }
      },
      "databaseStats": {
        "status": "success",
        "stats": {
          "Inventories": 150,
          "Items": 50,
          "Factory": 3
        }
      }
    },
    "system": {
      "platform": "win32",
      "uptime": 86400,
      "uptimeFormatted": "1일 0시간 0분 0초",
      "memory": {
        "total": 16777216000,
        "free": 8388608000,
        "used": 8388608000,
        "usagePercent": 50
      }
    }
  }
}
```

### Ping
```http
GET /api/health/ping
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-10-28 14:30:00",
  "message": "pong"
}
```

### Readiness Probe
```http
GET /api/health/readiness
```

### Liveness Probe
```http
GET /api/health/liveness
```

### 시스템 메트릭스
```http
GET /api/health/metrics
```

---

## 재고 관리 API

### 재고 목록
```http
GET /api/inventories
```

**Query Parameters:**
- `itemId`: 품목 ID
- `factoryId`: 공장 ID
- `status`: 재고 상태 (Normal, LowStock, Expiring, Expired)
- `category`: 품목 카테고리
- `search`: 검색어 (품목 코드 또는 이름)
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)

### 입고
```http
POST /api/inventories/receive
```

**Body:**
```json
{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "lotNumber": "LOT001",
  "quantity": 100,
  "wholesalePrice": 15000,
  "receivedAt": "2024-10-28",
  "unit": "kg",
  "note": "신규 입고"
}
```

### 출고
```http
POST /api/inventories/issue
```

**Body:**
```json
{
  "itemId": 1,
  "factoryId": 1,
  "quantity": 50,
  "unit": "kg",
  "note": "생산 사용",
  "actorName": "홍길동"
}
```

### 이동
```http
POST /api/inventories/transfer
```

**Body:**
```json
{
  "itemId": 1,
  "sourceFactoryId": 1,
  "destFactoryId": 2,
  "storageConditionId": 1,
  "quantity": 30,
  "unit": "kg",
  "note": "공장 간 이동"
}
```

### 재고 이동 이력
```http
GET /api/inventories/movements
```

**Query Parameters:**
- `itemId`: 품목 ID
- `factoryId`: 공장 ID
- `from`: 시작 날짜
- `to`: 종료 날짜
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

---

## 품목 관리 API

### 품목 목록
```http
GET /api/items
```

### 품목 생성
```http
POST /api/items
```

**Body:**
```json
{
  "code": "RM001",
  "name": "프리미엄 육류",
  "category": "RawMaterial",
  "unit": "kg",
  "factoryId": 1,
  "storageTemp": "냉동",
  "shortage": 10,
  "expirationDate": 30,
  "wholesalePrice": 15000
}
```

### 품목 상세
```http
GET /api/items/:id
```

### 품목 수정
```http
PUT /api/items/:id
```

### 품목 삭제
```http
DELETE /api/items/:id
```

---

## 공장 관리 API

### 공장 목록
```http
GET /api/factories
```

### 공장 생성
```http
POST /api/factories
```

**Body:**
```json
{
  "name": "서울 공장",
  "type": "1PreProcessing",
  "address": "서울특별시 강남구"
}
```

### 공장 상세
```http
GET /api/factories/:id
```

### 공장 수정
```http
PUT /api/factories/:id
```

### 공장 삭제
```http
DELETE /api/factories/:id
```

---

## 에러 응답

모든 API는 다음과 같은 형식의 에러 응답을 반환합니다:

```json
{
  "ok": false,
  "message": "에러 메시지",
  "error": "상세 에러 정보 (개발 환경에서만)"
}
```

### 일반적인 HTTP 상태 코드

- `200 OK`: 성공
- `201 Created`: 리소스 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `409 Conflict`: 충돌 (예: 중복된 데이터)
- `500 Internal Server Error`: 서버 내부 오류
- `503 Service Unavailable`: 서비스 사용 불가 (헬스체크 실패 시)

---

## 인증

현재는 세션 기반 인증을 사용합니다. 로그인 후 세션 쿠키가 자동으로 설정됩니다.

```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "로그인 성공",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

---

## Postman 컬렉션

프로젝트 루트의 `Inventory_Management_Complete_API.postman_collection.json` 파일을 Postman에 import하여 모든 API를 테스트할 수 있습니다.

---

**Updated:** 2024-10-28

