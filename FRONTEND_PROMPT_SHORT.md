# 재고 관리 시스템 프론트엔드 개발 요청

React + TypeScript + Tailwind CSS + shadcn/ui로 재고 관리 시스템 프론트엔드를 개발해주세요.

## 백엔드 API (Base: http://localhost:3000/api)

### 재고 API
- `GET /inventories` - 목록 (필터: itemId, factoryId, status, category, search, page, limit)
- `GET /inventories/summary` - 요약 통계
- `GET /inventories/utilization` - 창고 이용률
- `GET /inventories/movements` - 이동 이력
- `POST /inventories/receive` - 입고 ⭐ **중요: expirationDate 보내지 말 것 (자동 계산됨)**
- `POST /inventories/issue` - 출고 (FIFO)
- `POST /inventories/transfer` - 이동
- `DELETE /inventories/:id` - 삭제

### 품목 API
- `GET /items` - 목록
- `POST /items` - 생성
- `PATCH /items/:id` - 수정
- `DELETE /items/:id` - 삭제
- `GET /items/id/:id` - ID 조회
- `GET /items/code/:code` - 코드 조회

### 기타
- `GET /factories` - 공장 목록
- `GET /storage-conditions` - 보관 조건 목록

## 입고 API 중요 사항 ⭐

**Request (expirationDate 없음):**
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
  "note": "입고",
  "actorName": "김철수"
}
```

유통기한은 **백엔드에서 자동 계산**: `입고날짜 + 품목의 유통기한(일수)`

## 필요한 페이지

1. **대시보드 (`/`)** 
   - 통계 카드 (총 품목, 재고 부족, 유통기한 임박, 만료)
   - 창고 이용률 차트
   - 최근 이동 이력

2. **재고 목록 (`/inventories`)**
   - 테이블 (Lot, 품목, 수량, 공장, 유통기한, 상태, D-day)
   - 필터 (품목, 공장, 상태, 카테고리)
   - 검색 (품목 코드/이름)
   - 상태 뱃지 (Normal: 초록, LowStock: 주황, Expiring: 노랑, Expired: 빨강)

3. **재고 입고 (`/inventories/receive`)**
   - 품목 선택 → 유통기한 일수 표시
   - 입고일 선택 → 계산된 유통기한 미리보기 표시
   - 예: "입고일: 2025-10-27 → 유통기한: 2025-11-26 (30일 후)"
   - 공장, 보관조건, Lot번호, 수량, 도매가, 담당자 입력

4. **재고 출고 (`/inventories/issue`)**
   - 품목/공장 선택
   - 현재 재고량 표시
   - FIFO 방식 안내

5. **재고 이동 (`/inventories/transfer`)**
   - 출발/도착 공장 선택 (서로 달라야 함)
   - 품목, 수량, 보관조건

6. **품목 관리 (`/items`)**
   - 품목 목록 테이블
   - CRUD (모달)

7. **이동 이력 (`/inventories/movements`)**
   - 이력 테이블 (시간, 유형, 품목, Lot, 수량, 출발/도착, 담당자)
   - 필터 (품목, 공장, 기간)

## 기술 스택

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Query (TanStack Query)
- Zustand (전역 상태)
- React Router v6
- React Hook Form + Zod
- Axios
- dayjs
- Recharts (차트)
- TanStack Table

## 디자인

- 반응형 (모바일/태블릿/데스크톱)
- 깔끔하고 현대적인 UI
- 상태별 색상 구분
- 로딩/에러 처리
- Toast 알림

## 폴더 구조

```
src/
├── api/              # API 호출
├── components/       # 컴포넌트
│   ├── ui/          # shadcn/ui
│   ├── layout/      # Header, Sidebar
│   ├── dashboard/
│   ├── inventory/
│   └── items/
├── pages/           # 페이지
├── hooks/           # Custom hooks
├── store/           # Zustand
├── types/           # TypeScript 타입
└── utils/           # 유틸리티
```

## TypeScript 타입 예시

```typescript
interface Inventory {
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
  factory: { id: number; name: string; };
  receivedAt: string;
}

interface Item {
  id: number;
  code: string;
  name: string;
  category: 'RawMaterial' | 'SemiFinished' | 'Finished' | 'Supply';
  unit: 'kg' | 'g' | 'EA' | 'BOX' | 'PCS';
  factory_id: number;
  shortage: number;
  expiration_date: number;  // 유통기한 일수
  wholesale_price: number;
}
```

## 중요 사항

1. ⭐ **입고 시 expirationDate를 보내지 말 것** (백엔드 자동 계산)
2. 입고 폼에서 품목 선택 → 유통기한 일수 표시
3. 입고일 선택 → 계산된 유통기한 미리보기
4. 상태별 색상 구분 명확히
5. 유통기한 D-day 표시
6. 모든 API 호출에 에러 처리
7. 로딩 상태 표시

이 명세로 깔끔하고 실용적인 재고 관리 시스템을 만들어주세요!

