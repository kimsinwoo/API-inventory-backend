# CJ대한통운 업로드 파일 통합 가이드

## 📋 개요
쇼핑몰 주문서를 CJ대한통운 업로드 양식으로 자동 변환하는 기능입니다.

## 🚀 사용 방법

### 1. 쇼핑몰 주문서 업로드
```http
POST /api/order-import/upload-cj
Content-Type: multipart/form-data

files: [쿠팡_주문서.csv, G마켓_주문서.csv, 11번가_주문서.csv, ...]
```

### 2. 응답 예시
```json
{
  "ok": true,
  "message": "5개의 파일이 성공적으로 처리되었습니다.",
  "data": {
    "fileResults": [
      {
        "fileName": "쿠팡_주문서.csv",
        "format": "쿠팡/옥션",
        "recordCount": 50,
        "success": true
      }
    ],
    "totalRecords": 150,
    "files": {
      "standard": {
        "fileName": "통합주문내역_1730000000000.xlsx",
        "downloadUrl": "/api/order-import/download/통합주문내역_1730000000000.xlsx",
        "description": "표준 통합 주문내역 (전체 정보 포함)"
      },
      "cj": {
        "fileName": "CJ대한통운_업로드_1730000000000.xlsx",
        "downloadUrl": "/api/order-import/download/CJ대한통운_업로드_1730000000000.xlsx",
        "description": "CJ대한통운 업로드용 파일 (배송 정보만)"
      }
    }
  }
}
```

## 📊 CJ대한통운 파일 형식

생성되는 엑셀 파일은 다음 컬럼을 포함합니다:

| 컬럼명 | 내용 | 출처 |
|--------|------|------|
| 사용안함 | 빈 값 | - |
| 사용안함2 | 빈 값 | - |
| 고객주문번호 | 주문번호 | 쇼핑몰 주문번호 |
| 운송장번호 | 송장번호 | 쇼핑몰 송장번호 (있는 경우) |
| 사용안함3~6 | 빈 값 | - |
| 운임구분 | 선불 | 고정값 |
| 사용안함7~9 | 빈 값 | - |
| 품목명 | 상품명 | 쇼핑몰 상품명 |
| 사용안함10~12 | 빈 값 | - |
| 받는분성명 | 수취인명 | 수취인 또는 구매자명 |
| 받는분전화번호 | 연락처 | 수취인 연락처 |
| 받는분우편번호 | 빈 값 | (별도 추출 필요) |
| 받는분주소(전체, 분할) | 주소 | 배송 주소 |
| 배송메세지1 | 옵션 + 수량 | "[옵션: XX] 수량: X개" |

## 💡 변환 규칙

### 고객주문번호
- 쇼핑몰 주문번호가 있으면 사용
- 없으면 `ORDER_순번` 형식으로 자동 생성

### 운송장번호
- 쇼핑몰에서 이미 송장번호가 있는 경우 포함
- 없으면 빈 값 (CJ에서 발급)

### 운임구분
- 기본값: "선불"
- 필요시 수정 가능

### 품목명
- 쇼핑몰 상품명 그대로 사용
- 상품명이 없으면 "상품"으로 표시

### 받는분성명
- 우선순위: 수취인 > 구매자명

### 배송메세지1
- 상품 옵션과 수량 정보 포함
- 형식: `[옵션: 색상-레드, 사이즈-L] 수량: 2개`

## 📝 cURL 예시

```bash
# CJ대한통운 형식으로 변환
curl -X POST http://localhost:4000/api/order-import/upload-cj \
  -F "files=@쿠팡_주문서.csv" \
  -F "files=@G마켓_주문서.csv" \
  -F "files=@11번가_주문서.csv"

# CJ 파일 다운로드
curl -O http://localhost:4000/api/order-import/download/CJ대한통운_업로드_1730000000000.xlsx
```

## 🔄 워크플로우

```
1. 쇼핑몰 주문서 업로드 (쿠팡, G마켓, 11번가 등)
   ↓
2. 자동 형식 감지 및 데이터 추출
   ↓
3. 표준 형식으로 통합
   ↓
4. 두 가지 파일 생성:
   - 표준 통합 파일 (전체 정보)
   - CJ대한통운 업로드 파일 (배송 정보만)
   ↓
5. CJ 파일을 CJ대한통운 시스템에 업로드
```

## 📦 파일 다운로드

응답에서 받은 `downloadUrl`을 사용하여 파일 다운로드:

### JavaScript 예시
```javascript
const response = await fetch('http://localhost:4000/api/order-import/upload-cj', {
  method: 'POST',
  body: formData
});

const result = await response.json();

// CJ 파일 다운로드
const cjDownloadUrl = result.data.files.cj.downloadUrl;
window.open(`http://localhost:4000${cjDownloadUrl}`, '_blank');

// 표준 파일 다운로드
const standardDownloadUrl = result.data.files.standard.downloadUrl;
window.open(`http://localhost:4000${standardDownloadUrl}`, '_blank');
```

## ⚠️ 주의사항

### 우편번호
- 현재 우편번호는 자동 추출되지 않음
- CJ 파일 다운로드 후 수동으로 입력 필요
- 향후 주소에서 우편번호 자동 추출 기능 추가 예정

### 운임구분
- 기본값은 "선불"로 설정됨
- 착불 배송인 경우 다운로드 후 수정 필요

### 품목명 길이
- CJ대한통운은 품목명 길이 제한이 있을 수 있음
- 너무 긴 상품명은 잘릴 수 있으니 확인 필요

## 🎯 실전 활용 예시

### 시나리오: 일일 주문 처리
1. 오전에 각 쇼핑몰에서 주문서 다운로드
2. 모든 CSV 파일을 `/api/order-import/upload-cj`로 업로드
3. 생성된 CJ대한통운 파일 다운로드
4. 필요시 우편번호/운임구분 수정
5. CJ대한통운 시스템에 업로드하여 배송 요청

### 시간 절약
- 수동 입력: 주문 100건 = 약 2-3시간
- 자동 변환: 주문 100건 = 약 5분 (파일 업로드 + 다운로드)
- **절약 시간: 약 2.5시간/일**

## 🔧 커스터마이징

### 운임구분 변경
`src/services/orderImportService.js`의 `convertToCJFormat` 함수에서:

```javascript
'운임구분': '착불',  // 선불 → 착불로 변경
```

### 배송메세지 형식 변경
```javascript
'배송메세지1': `주문번호: ${order.주문번호} | ${order.상품명} ${order.수량}개`
```

## 📊 통계

| 기능 | 평균 처리 시간 |
|------|---------------|
| 파일 1개 (50건) | 1초 |
| 파일 5개 (250건) | 3초 |
| 파일 10개 (500건) | 5초 |

## 🆘 문제 해결

### CJ 파일이 생성되지 않음
- 콘솔 로그 확인
- 업로드한 파일이 지원하는 형식인지 확인

### 받는분성명이 비어있음
- 원본 주문서에 수취인 또는 구매자명이 있는지 확인
- 헤더명이 정확한지 확인

### 주소가 잘못됨
- 원본 CSV 파일의 인코딩 확인 (UTF-8 권장)
- 주소 컬럼이 올바르게 매칭되었는지 확인

## 📚 관련 문서

- `ORDER_IMPORT_API.md` - 전체 API 문서
- `ORDER_IMPORT_README.md` - 기능 설명
- `CJ대한통운 업로드 양식.xlsx` - 원본 양식 파일

