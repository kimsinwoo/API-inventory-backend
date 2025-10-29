# 배송 관리 시스템 상세 설계서

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [데이터 구조](#데이터-구조)
3. [API 설계](#api-설계)
4. [플랫폼별 양식](#플랫폼별-양식)
5. [프로세스 흐름](#프로세스-흐름)

---

## 🎯 시스템 개요

### 주요 기능
- ✅ 다중 플랫폼 주문서 업로드 (쿠팡, 네이버 스마트스토어, 11번가 등)
- ✅ 주문 데이터 통합 및 정규화
- ✅ CJ대한통운 양식 변환 및 내보내기
- ✅ B2C/B2B 구분 출고 리스트 자동 생성
- ✅ 출고 관리 연동
- ✅ 송장 번호 자동 매칭

---

## 🗄️ 데이터 구조

### 1. Orders (주문) 테이블

```javascript
{
  id: INTEGER (PK),
  platform: ENUM('COUPANG', 'NAVER', '11ST', 'GMARKET', 'MANUAL'),
  platform_order_number: STRING(100),  // 플랫폼 주문번호
  order_date: DATE,
  
  // 주문자 정보
  customer_name: STRING(50),
  customer_phone: STRING(20),
  customer_email: STRING(100),
  
  // 수령인 정보
  recipient_name: STRING(50),
  recipient_phone: STRING(20),
  recipient_address: STRING(200),
  recipient_address_detail: STRING(100),
  recipient_zipcode: STRING(10),
  
  // 주문 상품 정보
  product_code: STRING(50),
  product_name: STRING(100),
  quantity: INTEGER,
  unit_price: DECIMAL(10,2),
  total_price: DECIMAL(10,2),
  
  // 배송 정보
  shipping_company: STRING(50),
  tracking_number: STRING(100),
  shipping_message: STRING(200),
  
  // 상태 관리
  order_status: ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
  shipping_status: ENUM('WAITING', 'READY', 'SHIPPED', 'DELIVERED'),
  payment_status: ENUM('PENDING', 'PAID', 'REFUND'),
  
  // 출고 정보
  issue_type: ENUM('B2C', 'B2B'),
  issued_at: DATE,
  issued_by: STRING(50),
  
  // 메타 정보
  original_data: JSON,  // 원본 엑셀 데이터
  notes: TEXT,
  
  createdAt: DATE,
  updatedAt: DATE
}
```

### 2. ShippingTemplates (배송 양식) 테이블

```javascript
{
  id: INTEGER (PK),
  name: STRING(100),  // 'CJ대한통운', '한진택배' 등
  template_type: ENUM('COURIER', 'FREIGHT'),
  
  // 필드 매핑 설정
  field_mapping: JSON,  
  /* 예시:
  {
    "수령인명": "recipient_name",
    "전화번호": "recipient_phone",
    "주소": "recipient_address",
    "품목명": "product_name",
    "수량": "quantity"
  }
  */
  
  // 엑셀 템플릿 파일 경로
  template_file_path: STRING(500),
  
  is_active: BOOLEAN,
  createdAt: DATE,
  updatedAt: DATE
}
```

### 3. PlatformMappings (플랫폼 매핑) 테이블

```javascript
{
  id: INTEGER (PK),
  platform: ENUM('COUPANG', 'NAVER', '11ST', 'GMARKET'),
  
  // 플랫폼별 필드 매핑
  field_mapping: JSON,
  /* 예시 - 쿠팡:
  {
    "주문번호": "platform_order_number",
    "구매자명": "customer_name",
    "구매자전화번호": "customer_phone",
    "수취인명": "recipient_name",
    "수취인전화번호": "recipient_phone",
    "배송지": "recipient_address",
    "상품명": "product_name",
    "수량": "quantity",
    "판매가": "unit_price"
  }
  */
  
  // 필수 컬럼
  required_columns: JSON,  // ["주문번호", "수취인명", "전화번호"]
  
  // 플랫폼 식별 규칙 (헤더로 자동 감지)
  detection_rules: JSON,
  
  is_active: BOOLEAN,
  createdAt: DATE,
  updatedAt: DATE
}
```

### 4. ShippingBatches (배송 배치) 테이블

```javascript
{
  id: INTEGER (PK),
  batch_number: STRING(50),  // 자동 생성 (예: SHIP-20241029-001)
  batch_date: DATE,
  
  // 배치 정보
  total_orders: INTEGER,
  b2c_count: INTEGER,
  b2b_count: INTEGER,
  
  // 파일 정보
  original_files: JSON,  // 업로드된 원본 파일 목록
  export_file_path: STRING(500),  // 내보낸 파일 경로
  
  // 상태
  status: ENUM('DRAFT', 'CONFIRMED', 'EXPORTED', 'COMPLETED'),
  
  created_by: STRING(50),
  confirmed_by: STRING(50),
  confirmed_at: DATE,
  
  createdAt: DATE,
  updatedAt: DATE
}
```

---

## 🔌 API 설계

### 1. 주문서 업로드 및 통합

#### 1.1 다중 플랫폼 파일 업로드
```http
POST /api/shipping/upload-orders
Content-Type: multipart/form-data
```

**Request Body:**
```javascript
{
  files: [File, File, ...],  // 여러 플랫폼의 엑셀 파일
  batchName: "2024년 10월 29일 주문",  // optional
  issueType: "B2C"  // 'B2C' or 'B2B'
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "batchId": 1,
    "batchNumber": "SHIP-20241029-001",
    "summary": {
      "totalOrders": 150,
      "byPlatform": {
        "COUPANG": 80,
        "NAVER": 60,
        "11ST": 10
      },
      "byIssueType": {
        "B2C": 140,
        "B2B": 10
      }
    },
    "orders": [
      {
        "id": 1,
        "platform": "COUPANG",
        "platformOrderNumber": "C123456789",
        "recipientName": "홍길동",
        "productName": "상품명",
        "quantity": 2,
        "totalPrice": 50000
      }
    ],
    "errors": []  // 파싱 실패한 항목들
  }
}
```

---

#### 1.2 주문 목록 조회
```http
GET /api/shipping/orders
```

**Query Parameters:**
- `batchId` (number): 배치 ID
- `platform` (string): 플랫폼 필터
- `orderStatus` (string): 주문 상태
- `shippingStatus` (string): 배송 상태
- `issueType` (string): B2C/B2B
- `startDate` (string): 시작 날짜
- `endDate` (string): 종료 날짜
- `search` (string): 검색어 (주문번호, 수령인명)
- `page` (number): 페이지
- `limit` (number): 페이지당 개수

**Response:**
```json
{
  "ok": true,
  "data": {
    "rows": [],
    "total": 150,
    "page": 1,
    "totalPages": 8
  }
}
```

---

#### 1.3 주문 상세 조회
```http
GET /api/shipping/orders/:id
```

---

#### 1.4 주문 수정
```http
PUT /api/shipping/orders/:id
```

**Request Body:**
```json
{
  "recipientName": "김철수",
  "recipientPhone": "010-9876-5432",
  "recipientAddress": "서울시 강남구...",
  "shippingMessage": "부재시 경비실에 맡겨주세요",
  "quantity": 3,
  "notes": "수량 변경"
}
```

---

#### 1.5 주문 삭제
```http
DELETE /api/shipping/orders/:id
```

---

### 2. CJ대한통운 양식 변환 및 내보내기

#### 2.1 CJ대한통운 양식으로 내보내기
```http
POST /api/shipping/export/cj-logistics
```

**Request Body:**
```json
{
  "batchId": 1,
  "orderIds": [1, 2, 3],  // optional, 없으면 전체
  "issueType": "B2C",  // 'B2C', 'B2B', 'ALL'
  "templateId": 1  // 배송 템플릿 ID
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "fileName": "CJ대한통운_20241029_001.xlsx",
    "downloadUrl": "/api/shipping/download/cj-logistics-20241029-001.xlsx",
    "orderCount": 150,
    "summary": {
      "totalWeight": 500,
      "totalBoxes": 150
    }
  }
}
```

---

#### 2.2 파일 다운로드
```http
GET /api/shipping/download/:filename
```

---

### 3. 출고 리스트 관리

#### 3.1 출고 리스트 생성 (자동)
```http
POST /api/shipping/issue-list/generate
```

**Request Body:**
```json
{
  "batchId": 1,
  "issueType": "B2C",
  "issueDate": "2024-10-29"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "issueListId": 1,
    "orderCount": 150,
    "items": [
      {
        "itemId": 1,
        "itemCode": "PROD001",
        "itemName": "상품명",
        "totalQuantity": 300,
        "orders": [
          {
            "orderId": 1,
            "quantity": 2,
            "recipient": "홍길동"
          }
        ]
      }
    ]
  }
}
```

---

#### 3.2 출고 리스트 엑셀 내보내기
```http
GET /api/shipping/issue-list/:id/export
```

**Query Parameters:**
- `format` (string): 'excel' | 'pdf'

**Response:** 엑셀 파일 다운로드

---

#### 3.3 출고 처리 (재고 연동)
```http
POST /api/shipping/issue-list/:id/process
```

**Request Body:**
```json
{
  "factoryId": 1,
  "note": "B2C 출고",
  "actorName": "홍길동"
}
```

---

### 4. 송장 번호 관리

#### 4.1 송장 번호 일괄 등록
```http
POST /api/shipping/tracking-numbers/bulk
```

**Request Body:**
```json
{
  "orderIds": [1, 2, 3],
  "trackingNumbers": ["123456789", "234567890", "345678901"],
  "shippingCompany": "CJ대한통운"
}
```

---

#### 4.2 송장 번호 엑셀 업로드
```http
POST /api/shipping/tracking-numbers/upload
Content-Type: multipart/form-data
```

**Request Body:**
```javascript
{
  file: File  // 송장번호가 포함된 엑셀 파일
}
```

---

### 5. 배치 관리

#### 5.1 배치 목록 조회
```http
GET /api/shipping/batches
```

---

#### 5.2 배치 상세 조회
```http
GET /api/shipping/batches/:id
```

---

#### 5.3 배치 확정
```http
POST /api/shipping/batches/:id/confirm
```

---

#### 5.4 배치 삭제
```http
DELETE /api/shipping/batches/:id
```

---

## 📊 플랫폼별 양식

### 쿠팡 (Coupang)

**필수 컬럼:**
- 주문번호
- 구매자명
- 수취인명
- 수취인전화번호
- 배송지
- 상품명
- 수량
- 판매가

**특이사항:**
- 전화번호 형식: 010-1234-5678
- 주소: 지번/도로명 혼용

---

### 네이버 스마트스토어 (Naver)

**필수 컬럼:**
- 주문번호
- 수취인명
- 전화번호
- 배송지 주소
- 상품명
- 수량
- 상품가격

**특이사항:**
- 전화번호 형식: 01012345678 (하이픈 없음)
- 우편번호 별도 컬럼

---

### CJ대한통운 양식

**필수 컬럼:**
- 수령인명
- 전화번호1
- 전화번호2 (optional)
- 우편번호
- 주소
- 상세주소
- 품목명
- 수량
- 박스수
- 중량
- 요청사항

**특이사항:**
- 전화번호: 숫자만 (01012345678)
- 중량: kg 단위
- 박스수: 정수

---

## 🔄 프로세스 흐름

### 1. 주문 업로드 프로세스

```
1. 파일 업로드 (다중 플랫폼)
   ↓
2. 플랫폼 자동 감지
   ↓
3. 데이터 파싱 및 정규화
   ↓
4. 유효성 검증
   ↓
5. DB 저장
   ↓
6. 통합 주문 목록 생성
```

---

### 2. 출고 리스트 생성 프로세스

```
1. 주문 데이터 조회 (B2C/B2B 필터)
   ↓
2. 상품별 그룹화
   ↓
3. 재고 확인 (Inventories 테이블)
   ↓
4. 출고 가능 여부 체크
   ↓
5. 출고 리스트 생성
   ↓
6. 엑셀 파일 생성
```

---

### 3. CJ대한통운 변환 프로세스

```
1. 주문 데이터 조회
   ↓
2. 필드 매핑 (템플릿 기반)
   ↓
3. 데이터 변환
   - 전화번호 형식 변환
   - 주소 정규화
   - 중량/박스수 계산
   ↓
4. CJ 양식 엑셀 생성
   ↓
5. 파일 저장 및 다운로드 URL 반환
```

---

### 4. 출고 처리 프로세스

```
1. 출고 리스트 확인
   ↓
2. 재고 차감 (InventoryMovement 생성)
   ↓
3. 주문 상태 업데이트
   ↓
4. 송장 번호 매칭 (있는 경우)
   ↓
5. 배송 상태 변경 (SHIPPED)
```

---

## 🔧 기술 스택

### Backend
- **엑셀 파싱**: `xlsx` 또는 `exceljs`
- **엑셀 생성**: `exceljs`
- **파일 업로드**: `multer`
- **데이터 검증**: `zod` 또는 `joi`

### Database
- **주문 데이터**: MySQL (Orders 테이블)
- **템플릿**: JSON 파일 또는 DB
- **파일 저장**: 로컬 파일시스템 또는 S3

---

## 📝 구현 우선순위

### Phase 1 (핵심 기능)
1. ✅ Orders 테이블 생성
2. ✅ 다중 파일 업로드 API
3. ✅ 플랫폼별 파싱 로직
4. ✅ 데이터 통합 및 저장
5. ✅ 주문 목록 조회 API

### Phase 2 (변환 및 내보내기)
6. ✅ CJ대한통운 양식 변환
7. ✅ 엑셀 파일 생성 및 다운로드
8. ✅ 출고 리스트 자동 생성

### Phase 3 (고급 기능)
9. ✅ 송장 번호 관리
10. ✅ 재고 연동 (출고 처리)
11. ✅ 배치 관리
12. ✅ B2C/B2B 구분 처리

---

## 🎯 예상 작업 파일

### Models
- `models/order.js`
- `models/shippingBatch.js`
- `models/shippingTemplate.js`

### Controllers
- `src/controller/shippingController.js`
- `src/controller/issueListController.js`

### Services
- `src/services/shippingService.js`
- `src/services/excelParserService.js`
- `src/services/excelGeneratorService.js`
- `src/services/platformMapperService.js`

### Routes
- `src/routes/shippingRoute.js`
- `src/routes/issueListRoute.js`

### Middleware
- `src/middleware/validateShipping.js`

### Utils
- `src/utils/excelParser.js`
- `src/utils/excelGenerator.js`
- `src/utils/phoneFormatter.js`
- `src/utils/addressParser.js`

---

이 설계서를 기반으로 구현을 시작하시겠습니까?
다음 단계를 진행할지 알려주세요:
1. 모델 파일 생성
2. API 라우트 및 컨트롤러 생성
3. 엑셀 파싱 서비스 구현
4. 템플릿 매핑 설정

