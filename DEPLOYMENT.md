# 배포 가이드

## 개요
이 문서는 재고 관리 시스템 백엔드를 클라우드 서버에 배포하는 방법을 설명합니다.

## 주요 개선 사항

### 1. 환경별 설정 분리
- 로컬 환경: 프린터 직접 접근
- 클라우드 환경: PDF 파일 저장 모드

### 2. 프린터 처리
- **로컬 환경**: Windows/Linux/macOS 프린터 직접 접근
- **클라우드 환경**: PDF 파일로 저장 (다운로드 가능)

### 3. Puppeteer 최적화
- 브라우저 인스턴스 재사용 (싱글톤 패턴)
- 클라우드 환경 지원

## 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# 서버 설정
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# 클라우드 배포 설정
CLOUD_DEPLOYMENT=true

# 데이터베이스 설정
PRODUCTION_DB_PASSWORD=your_production_db_password

# 세션 설정
SESSION_SECRET=your-strong-secret-key

# CORS 설정
CORS_ORIGIN=https://your-frontend-domain.com

# 프린터 설정 (클라우드 환경)
PRINTER_ENABLED=false
PRINTER_TYPE=cloud
PDF_SAVE_PATH=./uploads/label-pdfs
TEMP_PATH=./temp

# 파일 업로드 설정
UPLOAD_PATH=./uploads

# 로깅 설정
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

## 클라우드 배포 설정

### 1. 환경 변수 설정
클라우드 환경에서는 다음 환경 변수를 설정하세요:
```bash
CLOUD_DEPLOYMENT=true
PRINTER_ENABLED=false
PRINTER_TYPE=cloud
```

### 2. 필요한 디렉토리 생성
서버 시작 시 자동으로 생성되지만, 필요시 수동으로 생성할 수 있습니다:
```bash
mkdir -p uploads/label-pdfs
mkdir -p temp
mkdir -p uploads
```

### 3. Puppeteer 설정
클라우드 환경에서 Puppeteer를 사용하려면 Chrome/Chromium이 설치되어 있어야 합니다.

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

환경 변수에 추가:
```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 로컬 환경 설정

### 1. 환경 변수 설정
로컬 환경에서는 다음 환경 변수를 설정하세요:
```bash
CLOUD_DEPLOYMENT=false
PRINTER_ENABLED=true
PRINTER_TYPE=local
```

### 2. 프린터 설정
- Windows: 프린터가 시스템에 설치되어 있어야 합니다
- Linux: CUPS 프린터가 설정되어 있어야 합니다
- macOS: 시스템 프린터가 설정되어 있어야 합니다

## API 사용법

### 1. 프린터 목록 조회
```bash
GET /api/barcode/printers
```

**응답 (로컬 환경):**
```json
{
  "ok": true,
  "message": "프린터 목록 조회 성공 (2개)",
  "data": [
    {
      "name": "HP LaserJet",
      "status": "Ready",
      "driver": "HP LaserJet Driver",
      "isDefault": true
    }
  ]
}
```

**응답 (클라우드 환경):**
```json
{
  "ok": true,
  "message": "프린터가 발견되지 않았습니다.",
  "data": [],
  "warning": "프린터가 설치되어 있지 않거나 클라우드 환경일 수 있습니다."
}
```

### 2. 라벨 프린트 (로컬 환경)
```bash
POST /api/barcode/print-label
Content-Type: application/json

{
  "htmlContent": "<div>라벨 내용</div>",
  "printerName": "HP LaserJet",
  "printCount": 1,
  "pdfOptions": {
    "width": "50mm",
    "height": "30mm",
    "margin": "0mm"
  }
}
```

### 3. 라벨 프린트 (클라우드 환경)
클라우드 환경에서는 프린터 이름이 없어도 동작하며, PDF 파일로 저장됩니다:

```bash
POST /api/barcode/print-label
Content-Type: application/json

{
  "htmlContent": "<div>라벨 내용</div>",
  "printCount": 1,
  "pdfOptions": {
    "width": "50mm",
    "height": "30mm",
    "margin": "0mm"
  }
}
```

**응답:**
```json
{
  "ok": true,
  "message": "PDF 파일이 저장되었습니다 (1개 라벨)",
  "data": {
    "templateId": 123,
    "printCount": 1,
    "printerName": null,
    "filePath": "./uploads/label-pdfs/label-1234567890-abc123.pdf",
    "mode": "cloud",
    "printedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 트러블슈팅

### 1. 프린터가 발견되지 않는 경우
- 로컬 환경: 프린터가 시스템에 설치되어 있는지 확인
- 클라우드 환경: 정상 동작 (PDF 저장 모드)

### 2. Puppeteer 초기화 실패
- Chrome/Chromium이 설치되어 있는지 확인
- `PUPPETEER_EXECUTABLE_PATH` 환경 변수 설정
- 클라우드 환경에서는 `--no-sandbox` 플래그가 필요할 수 있음

### 3. PDF 파일 저장 실패
- 디렉토리 권한 확인
- 디스크 공간 확인
- `PDF_SAVE_PATH` 환경 변수 확인

## 성능 최적화

### 1. Puppeteer 브라우저 재사용
- 브라우저 인스턴스는 싱글톤 패턴으로 재사용됩니다
- 서버 종료 시 자동으로 정리됩니다

### 2. 임시 파일 관리
- 임시 파일은 자동으로 삭제됩니다
- 프린트 작업 완료 후 5초 후 삭제

### 3. 에러 처리
- 모든 에러는 적절히 처리되며 서버가 중단되지 않습니다
- 클라우드 환경에서 프린터 관련 에러는 무시됩니다

## 보안 고려사항

### 1. 환경 변수
- `.env` 파일은 절대 커밋하지 마세요
- 프로덕션 환경에서는 강력한 `SESSION_SECRET` 사용

### 2. CORS 설정
- 프로덕션 환경에서는 실제 프론트엔드 도메인만 허용
- 개발 환경에서만 `*` 사용

### 3. 파일 업로드
- 파일 크기 제한 설정
- 파일 타입 검증

## 모니터링

### 1. 로깅
- 요청 로깅 활성화/비활성화 가능
- 로그 레벨 설정 가능

### 2. 헬스 체크
```bash
GET /api/health/ping
GET /api/health/liveness
```

## 추가 리소스

- [Puppeteer 문서](https://pptr.dev/)
- [Node.js 배포 가이드](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

