# 재고 관리 시스템 프론트엔드 개발 프롬프트

## 프로젝트 개요
식품 제조업체를 위한 재고 관리 시스템의 프론트엔드를 개발해주세요. React + TypeScript + Tailwind CSS를 사용하여 현대적이고 직관적인 UI를 구현합니다.

---

## 기술 스택
- **프레임워크**: React 18+ with TypeScript
- **상태 관리**: React Query (TanStack Query) + Zustand
- **스타일링**: Tailwind CSS + shadcn/ui
- **라우팅**: React Router v6
- **폼 관리**: React Hook Form + Zod
- **HTTP 클라이언트**: Axios
- **날짜 처리**: date-fns 또는 dayjs
- **차트**: Recharts
- **테이블**: TanStack Table

---

## 백엔드 API 명세

### Base URL
```
http://localhost:3000/api
```

### 1. 재고 관리 API (`/inventories`)

#### 1.1 재고 목록 조회
```
GET /inventories?page=1&limit=20&itemId=1&factoryId=1&status=Normal&category=RawMaterial&search=육류
```

**Query Parameters:**
- `page` (number, optional): 페이지 번호 (기본값: 1)
- `limit` (number, optional): 페이지당 항목 수 (기본값: 20)
- `itemId` (number, optional): 품목 ID 필터
- `factoryId` (number, optional): 공장 ID 필터
- `status` (string, optional): 상태 필터 (`Normal`, `LowStock`, `Expiring`, `Expired`)
- `category` (string, optional): 카테고리 필터 (`RawMaterial`, `SemiFinished`, `Finished`, `Supply`)
- `search` (string, optional): 품목 코드/이름 검색

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "lotNumber": "LOT20251027001",
      "quantity": 500,
      "unit": "kg",
      "expirationDate": "2025-11-26",
      "daysLeft": 30,
      "status": "Normal",
      "statusLabel": "정상",
      "item": {
        "id": 1,
        "code": "RM001",
        "name": "프리미엄 육류",
        "category": "RawMaterial",
        "categoryLabel": "원재료"
      },
      "factory": {
        "id": 1,
        "name": "서울 공장"
      },
      "receivedAt": "2025-10-27T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "summary": {
      "totalItems": 5,
      "lowStock": 0,
      "expiringSoon": 2,
      "expired": 0,
      "warehouseCount": 2
    }
  }
}
```

#### 1.2 재고 요약 통계
```
GET /inventories/summary?factoryId=1
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "totalItems": 5,
    "lowStock": 0,
    "expiringSoon": 2,
    "expired": 0,
    "warehouseCount": 2
  }
}
```

#### 1.3 창고 이용률
```
GET /inventories/utilization
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "factory": {
        "id": 1,
        "name": "서울 공장"
      },
      "percentage": 60,
      "itemCount": 6,
      "note": "여유 공간 충분"
    }
  ]
}
```

#### 1.4 재고 입고 ⭐ 중요: 유통기한 자동 계산
```
POST /inventories/receive
```

**Request Body:**
```json
{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "lotNumber": "LOT20251027001",
  "wholesalePrice": 12500,
  "quantity": 500,
  "unit": "kg",
  "receivedAt": "2025-10-27T09:00:00.000Z",
  "note": "프리미엄 육류 입고",
  "actorName": "김철수"
}
```

**⚠️ 중요 사항:**
- `expirationDate` 필드는 **보내지 않습니다**
- 백엔드에서 자동으로 계산됩니다: `입고날짜 + 품목의 유통기한(일수)`
- 예: 입고일 2025-10-27 + 품목 유통기한 30일 = 2025-11-26

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "item_id": 1,
    "lot_number": "LOT20251027001",
    "quantity": 500,
    "unit": "kg",
    "expiration_date": "2025-11-26",
    "status": "Normal"
  }
}
```

#### 1.5 재고 출고 (FIFO)
```
POST /inventories/issue
```

**Request Body:**
```json
{
  "itemId": 1,
  "factoryId": 1,
  "quantity": 100,
  "unit": "kg",
  "note": "생산에 사용",
  "actorName": "이영희"
}
```

#### 1.6 재고 이동 (공장 간 이동)
```
POST /inventories/transfer
```

**Request Body:**
```json
{
  "itemId": 1,
  "sourceFactoryId": 1,
  "destFactoryId": 2,
  "storageConditionId": 1,
  "quantity": 50,
  "unit": "kg",
  "note": "공장 간 이동",
  "actorName": "박민수"
}
```

#### 1.7 재고 이동 이력
```
GET /inventories/movements?itemId=1&factoryId=1&from=2025-10-01T00:00:00Z&to=2025-10-31T23:59:59Z&page=1&limit=20
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "time": "2025-10-27 09:00",
      "type": "입고",
      "category": "프리미엄 육류",
      "code": "RM001",
      "lotNumber": "LOT20251027001",
      "quantity": "500 kg",
      "fromLocation": "",
      "toLocation": "1",
      "manager": "김철수",
      "note": "프리미엄 육류 입고"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

#### 1.8 재고 삭제
```
DELETE /inventories/:id
```

---

### 2. 품목 관리 API (`/items`)

#### 2.1 품목 목록 조회
```
GET /items
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "code": "RM001",
      "name": "프리미엄 육류",
      "category": "RawMaterial",
      "unit": "kg",
      "factory_id": 1,
      "shortage": 10,
      "expiration_date": 30,
      "wholesale_price": 15000,
      "Factory": {
        "id": 1,
        "name": "서울 공장",
        "type": "1PreProcessing",
        "address": "서울특별시 강남구"
      }
    }
  ]
}
```

#### 2.2 품목 생성
```
POST /items
```

**Request Body:**
```json
{
  "code": "RM003",
  "name": "양파",
  "category": "RawMaterial",
  "unit": "kg",
  "factory_id": 1,
  "shortage": 50,
  "expiration_date": 14,
  "wholesale_price": 3000
}
```

#### 2.3 품목 수정
```
PATCH /items/:id
```

#### 2.4 품목 삭제
```
DELETE /items/:id
```

#### 2.5 ID로 품목 조회
```
GET /items/id/:id
```

#### 2.6 코드로 품목 조회
```
GET /items/code/:code
```

---

### 3. 공장 관리 API (`/factories`)

```
GET /factories
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "name": "서울 공장",
      "type": "1PreProcessing",
      "address": "서울특별시 강남구"
    }
  ]
}
```

---

### 4. 보관 조건 API (`/storage-conditions`)

#### 4.1 목록 조회
```
GET /storage-conditions
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "name": "냉동",
      "temperature_range": "-18°C 이하",
      "humidity_range": "60-70%"
    }
  ]
}
```

#### 4.2 생성, 수정, 삭제
```
POST /storage-conditions
PUT /storage-conditions/:id
DELETE /storage-conditions/:id
```

---

## UI/UX 요구사항

### 페이지 구조

#### 1. 대시보드 (`/`)
**기능:**
- 재고 요약 통계 (총 품목 수, 재고 부족, 유통기한 임박, 만료)
- 창고 이용률 차트 (바 차트)
- 최근 입고/출고 이력 (테이블)
- 유통기한 임박 품목 알림 (카드 리스트)

**디자인:**
- 4개의 통계 카드 (그리드 레이아웃)
- 차트는 Recharts 사용
- 반응형 디자인 (모바일, 태블릿, 데스크톱)

#### 2. 재고 목록 (`/inventories`)
**기능:**
- 재고 목록 테이블 (페이지네이션)
- 필터: 품목, 공장, 상태, 카테고리
- 검색: 품목 코드/이름
- 상태별 뱃지 표시 (Normal: 초록, LowStock: 주황, Expiring: 노랑, Expired: 빨강)
- 유통기한 D-day 표시
- 액션: 입고, 출고, 이동, 삭제

**테이블 컬럼:**
- Lot 번호
- 품목 코드 / 이름
- 카테고리
- 수량
- 공장
- 입고일
- 유통기한 (D-day)
- 상태
- 액션

#### 3. 재고 입고 폼 (`/inventories/receive`)
**기능:**
- 품목 선택 (Select 또는 Autocomplete)
- 공장 선택
- 보관 조건 선택
- Lot 번호 입력 (자동 생성 옵션)
- 수량 입력
- 단위 표시 (품목 선택 시 자동)
- 도매가 입력
- 입고일시 선택 (DateTimePicker)
- 비고 입력 (Textarea)
- 담당자 입력

**⭐ 중요 UI:**
- 품목 선택 시 유통기한 일수를 표시
- 입고일 선택 시 자동 계산된 유통기한을 미리보기로 표시
- 예: "입고일: 2025-10-27 → 유통기한: 2025-11-26 (30일 후)"

**폼 검증:**
- 모든 필수 필드 검증
- 수량은 양수
- 입고일은 과거~현재 날짜
- React Hook Form + Zod 사용

#### 4. 재고 출고 폼 (`/inventories/issue`)
**기능:**
- 품목 선택
- 공장 선택
- 수량 입력 (현재 재고량 표시)
- 출고 사유 입력
- 담당자 입력

**주의사항:**
- 현재 재고량보다 많이 출고할 수 없음
- FIFO 방식으로 자동 출고됨을 안내

#### 5. 재고 이동 폼 (`/inventories/transfer`)
**기능:**
- 품목 선택
- 출발 공장 선택
- 도착 공장 선택 (출발 공장과 다르게)
- 도착지 보관 조건 선택
- 수량 입력
- 담당자 입력

#### 6. 품목 관리 (`/items`)
**기능:**
- 품목 목록 테이블
- CRUD 기능 (생성, 수정, 삭제)
- 품목 등록 폼 (모달)
- 품목 수정 폼 (모달)

**테이블 컬럼:**
- 품목 코드
- 품목명
- 카테고리
- 단위
- 공장
- 재고 부족 기준
- 유통기한(일)
- 도매가
- 액션

#### 7. 재고 이동 이력 (`/inventories/movements`)
**기능:**
- 이동 이력 테이블 (페이지네이션)
- 필터: 품목, 공장, 기간
- 타임라인 뷰 옵션
- 엑셀 다운로드

**테이블 컬럼:**
- 시간
- 유형 (입고, 출고, 이동)
- 품목
- Lot 번호
- 수량
- 출발지
- 도착지
- 담당자
- 비고

---

## 디자인 가이드라인

### 색상 팔레트
```css
/* 상태별 색상 */
--status-normal: #10b981 (green-500)
--status-low-stock: #f59e0b (amber-500)
--status-expiring: #eab308 (yellow-500)
--status-expired: #ef4444 (red-500)

/* 카테고리별 색상 */
--category-raw: #3b82f6 (blue-500)
--category-semi: #8b5cf6 (purple-500)
--category-finished: #06b6d4 (cyan-500)
--category-supply: #6b7280 (gray-500)

/* 기본 색상 */
--primary: #2563eb (blue-600)
--secondary: #64748b (slate-500)
--success: #10b981 (green-500)
--warning: #f59e0b (amber-500)
--error: #ef4444 (red-500)
```

### 컴포넌트
- **버튼**: shadcn/ui Button 사용
- **인풋**: shadcn/ui Input, Select 사용
- **테이블**: TanStack Table + shadcn/ui Table
- **모달**: shadcn/ui Dialog
- **알림**: shadcn/ui Toast
- **배지**: shadcn/ui Badge (상태별 색상)
- **카드**: shadcn/ui Card

### 반응형 디자인
- **모바일**: 320px ~ 768px (1컬럼)
- **태블릿**: 768px ~ 1024px (2컬럼)
- **데스크톱**: 1024px+ (3~4컬럼)

---

## 상태 관리

### React Query
```typescript
// 재고 목록 조회
const { data, isLoading, error } = useQuery({
  queryKey: ['inventories', filters],
  queryFn: () => fetchInventories(filters),
});

// 재고 입고
const mutation = useMutation({
  mutationFn: receiveInventory,
  onSuccess: () => {
    queryClient.invalidateQueries(['inventories']);
    toast.success('입고가 완료되었습니다');
  },
});
```

### Zustand (전역 상태)
```typescript
interface AppStore {
  selectedFactory: number | null;
  setSelectedFactory: (id: number) => void;
  user: User | null;
  setUser: (user: User) => void;
}
```

---

## 폴더 구조
```
src/
├── api/
│   ├── client.ts           # Axios 클라이언트
│   ├── inventories.ts      # 재고 API
│   ├── items.ts            # 품목 API
│   └── factories.ts        # 공장 API
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── UtilizationChart.tsx
│   │   └── RecentMovements.tsx
│   ├── inventory/
│   │   ├── InventoryTable.tsx
│   │   ├── InventoryFilters.tsx
│   │   ├── ReceiveForm.tsx
│   │   ├── IssueForm.tsx
│   │   └── TransferForm.tsx
│   └── items/
│       ├── ItemTable.tsx
│       ├── ItemForm.tsx
│       └── ItemModal.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Inventories.tsx
│   ├── InventoryReceive.tsx
│   ├── InventoryIssue.tsx
│   ├── InventoryTransfer.tsx
│   ├── Items.tsx
│   └── Movements.tsx
├── hooks/
│   ├── useInventories.ts
│   ├── useItems.ts
│   └── useFactories.ts
├── store/
│   └── appStore.ts
├── types/
│   ├── inventory.ts
│   ├── item.ts
│   └── api.ts
├── utils/
│   ├── format.ts           # 날짜, 숫자 포맷팅
│   └── constants.ts        # 상수
├── App.tsx
└── main.tsx
```

---

## 타입 정의

```typescript
// types/inventory.ts
export interface Inventory {
  id: number;
  lotNumber: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  daysLeft: number;
  status: 'Normal' | 'LowStock' | 'Expiring' | 'Expired';
  statusLabel: string;
  item: {
    id: number;
    code: string;
    name: string;
    category: string;
    categoryLabel: string;
  };
  factory: {
    id: number;
    name: string;
  };
  receivedAt: string;
}

export interface ReceiveInventoryRequest {
  itemId: number;
  factoryId: number;
  storageConditionId: number;
  lotNumber: string;
  wholesalePrice: number;
  quantity: number;
  unit: string;
  receivedAt: string;
  note?: string;
  actorName?: string;
}

// types/item.ts
export interface Item {
  id: number;
  code: string;
  name: string;
  category: 'RawMaterial' | 'SemiFinished' | 'Finished' | 'Supply';
  unit: 'kg' | 'g' | 'EA' | 'BOX' | 'PCS';
  factory_id: number;
  shortage: number;
  expiration_date: number;
  wholesale_price: number;
  Factory?: {
    id: number;
    name: string;
    type: string;
    address: string;
  };
}
```

---

## 추가 기능 (선택사항)

1. **엑셀 다운로드**: 재고 목록, 이동 이력 엑셀 다운로드
2. **QR 코드**: Lot 번호 QR 코드 생성/스캔
3. **알림**: 유통기한 임박, 재고 부족 푸시 알림
4. **다크 모드**: 다크 모드 지원
5. **다국어**: i18n 지원 (한국어, 영어)
6. **권한 관리**: 사용자별 권한 (관리자, 일반 사용자)

---

## 개발 시 주의사항

1. **유통기한 자동 계산**: 입고 폼에서 `expirationDate`를 보내지 말 것
2. **FIFO 출고**: 출고 시 가장 먼저 입고된 재고부터 자동으로 출고됨
3. **에러 처리**: 모든 API 호출에 에러 처리 및 사용자 피드백 제공
4. **로딩 상태**: 모든 비동기 작업에 로딩 스피너 표시
5. **폼 검증**: 모든 입력값 검증 및 에러 메시지 표시
6. **접근성**: 키보드 네비게이션, ARIA 라벨 추가
7. **성능**: React.memo, useMemo, useCallback 적절히 사용

---

## 시작하기

1. Vite로 React + TypeScript 프로젝트 생성
2. Tailwind CSS 및 shadcn/ui 설정
3. React Query, Zustand, React Router 설치
4. API 클라이언트 설정 (Axios)
5. 레이아웃 및 라우팅 구조 설정
6. 대시보드 페이지부터 순차적으로 개발

이 명세를 기반으로 현대적이고 사용하기 쉬운 재고 관리 시스템 프론트엔드를 개발해주세요!

