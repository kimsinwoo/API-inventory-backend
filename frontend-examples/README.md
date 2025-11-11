# 프론트엔드 예제 코드

이 폴더에는 백엔드 API를 사용하는 프론트엔드 예제 코드가 포함되어 있습니다.

## 파일 구조

```
frontend-examples/
├── barcodeApi.ts              # API 클라이언트 (TypeScript)
├── useBarcodeApi.ts           # React Hook
├── LabelPrintExample.tsx      # 라벨 프린트 컴포넌트 예제
├── PrintSavedLabelExample.tsx # 저장된 라벨 프린트 컴포넌트 예제
└── README.md                  # 이 파일
```

## 설치 방법

### 1. 필요한 패키지 설치

```bash
npm install axios
# 또는
yarn add axios
```

### 2. 파일 복사

프론트엔드 프로젝트에 다음 파일들을 복사하세요:

- `barcodeApi.ts` → `src/services/barcodeApi.ts`
- `useBarcodeApi.ts` → `src/hooks/useBarcodeApi.ts`
- `LabelPrintExample.tsx` → `src/components/LabelPrintExample.tsx`
- `PrintSavedLabelExample.tsx` → `src/components/PrintSavedLabelExample.tsx`

### 3. 환경 변수 설정

프론트엔드 프로젝트의 `.env` 파일에 다음을 추가하세요:

```env
REACT_APP_API_URL=http://localhost:4000/api
```

프로덕션 환경에서는:

```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

## 사용 방법

### 1. 기본 사용법

```tsx
import { barcodeApi } from './services/barcodeApi';

// 프린터 목록 조회
const printers = await barcodeApi.getPrinters();
console.log(printers.data);

// 라벨 프린트
const result = await barcodeApi.printLabel({
  htmlContent: '<div>라벨 내용</div>',
  printerName: 'HP LaserJet',
  printCount: 1,
});
```

### 2. React Hook 사용

```tsx
import { useBarcodeApi } from './hooks/useBarcodeApi';

function MyComponent() {
  const { loading, error, getPrinters, printLabel } = useBarcodeApi();

  useEffect(() => {
    const loadPrinters = async () => {
      const printers = await getPrinters();
      console.log(printers);
    };
    loadPrinters();
  }, []);

  return <div>...</div>;
}
```

### 3. 컴포넌트 사용

```tsx
import LabelPrintExample from './components/LabelPrintExample';

function App() {
  return <LabelPrintExample />;
}
```

## API 엔드포인트

### 프린터 관련

- `GET /api/barcode/printers` - 프린터 목록 조회
- `POST /api/barcode/print-label` - 라벨 프린트 (HTML 컨텐츠)
- `POST /api/barcode/print-saved-label` - 저장된 라벨 프린트

### 라벨 관련

- `GET /api/barcode/items/finished` - Finished 품목 목록 조회
- `POST /api/barcode/labels` - 라벨 생성
- `GET /api/barcode/labels` - 라벨 목록 조회
- `GET /api/barcode/labels/:labelId` - 라벨 ID로 조회
- `GET /api/barcode/labels/barcode/:barcode` - 바코드로 라벨 조회
- `GET /api/barcode/labels/inventory/:inventoryId` - 재고 ID로 라벨 조회

### 바코드 관련

- `GET /api/barcode/scan/:barcode` - 바코드 스캔
- `POST /api/barcode/generate-label` - 바코드 생성
- `GET /api/barcode/history/:barcode` - 바코드 이력 조회

## 주요 기능

### 1. 프린터 목록 조회

```typescript
const printers = await barcodeApi.getPrinters();
// 로컬 환경: 프린터 목록 반환
// 클라우드 환경: 빈 배열 반환 (경고 메시지 포함)
```

### 2. 라벨 프린트 (HTML 컨텐츠)

```typescript
const result = await barcodeApi.printLabel({
  htmlContent: '<div>라벨 내용</div>',
  printerName: 'HP LaserJet', // 로컬 환경에서만 필요
  printCount: 1,
  pdfOptions: {
    width: '50mm',
    height: '30mm',
    margin: '0mm',
  },
});

// 로컬 환경: 프린터로 직접 출력
// 클라우드 환경: PDF 파일로 저장 (filePath 반환)
```

### 3. 저장된 라벨 프린트

```typescript
const result = await barcodeApi.printSavedLabel({
  labelId: 123,
  printerName: 'HP LaserJet', // 로컬 환경에서만 필요
  manufactureDate: '2024-01-01',
  expiryDate: '2025-01-01',
  printCount: 1,
});
```

## 환경별 동작

### 로컬 환경

- 프린터 목록 조회 가능
- 프린터 이름 지정 필요
- 지정한 프린터로 직접 출력

### 클라우드 환경

- 프린터 목록 빈 배열 반환 (정상 동작)
- 프린터 이름 선택사항
- PDF 파일로 저장 (filePath 반환)
- PDF 파일 다운로드 링크 제공 가능

## 에러 처리

모든 API 호출은 에러 처리를 포함합니다:

```typescript
try {
  const result = await barcodeApi.printLabel(data);
  if (result.ok) {
    // 성공 처리
  } else {
    // 에러 처리
    console.error(result.message);
  }
} catch (error) {
  // 네트워크 에러 등
  console.error(error);
}
```

## 타입 정의

모든 타입은 `barcodeApi.ts` 파일에 정의되어 있습니다:

- `ApiResponse<T>` - API 응답 공통 타입
- `Printer` - 프린터 정보
- `Label` - 라벨 정보
- `PrintLabelRequest` - 라벨 프린트 요청
- `PrintResult` - 프린트 결과

## 추가 리소스

- [전체 API 가이드](../FRONTEND_API_GUIDE.md)
- [배포 가이드](../DEPLOYMENT.md)
- [Axios 문서](https://axios-http.com/)

## 문제 해결

### 프린터가 나타나지 않는 경우

- 로컬 환경: 프린터가 시스템에 설치되어 있는지 확인
- 클라우드 환경: 정상 동작 (PDF 저장 모드)

### 프린트가 실패하는 경우

- 프린터 이름이 올바른지 확인
- 네트워크 연결 확인
- 서버 로그 확인

### 날짜 형식 오류

- 날짜는 `YYYY-MM-DD` 형식이어야 합니다
- 유통기한은 제조일자보다 이후여야 합니다

## 라이선스

이 예제 코드는 프로젝트와 동일한 라이선스를 따릅니다.


