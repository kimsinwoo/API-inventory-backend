# 📦 재고 관리 시스템 (Inventory Management System)

실제 공장에서 사용 가능한 전문적인 재고 관리 백엔드 시스템입니다.

## 🌟 주요 기능

### 📊 핵심 기능
- **재고 관리**: 입고/출고/이동 처리 (FIFO 로직 적용)
- **BOM(자재 명세서) 관리**: 제품 구성 관리
- **공장 관리**: 다중 공장 재고 통합 관리
- **품목 관리**: 원재료, 반제품, 완제품, 소모품 분류
- **저장 조건 관리**: 온도/습도 조건별 관리
- **승인 시스템**: 다단계 승인 워크플로우
- **라벨 생성**: 바코드 라벨 자동 생성

### 🆕 새로운 기능 (개선)
- **대시보드**: 실시간 재고 통계 및 KPI 지표
- **알림 시스템**: 재고 부족, 유통기한 임박 자동 알림
- **리포트**: 일일/주간/월간 자동 리포트 생성 (Excel)
- **재고 예측**: AI 기반 소비 패턴 분석 및 수요 예측
- **헬스체크**: 시스템 모니터링 및 상태 확인
- **배치 작업**: 자동화된 정기 작업 스케줄러

## 🚀 시작하기

### 필수 요구사항
- Node.js 14.x 이상
- MySQL 5.7 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd inventory-management_backend

# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env
# .env 파일을 열어서 데이터베이스 비밀번호 등 설정

# 데이터베이스 마이그레이션
npx sequelize-cli db:migrate

# 초기 데이터 시딩
node seed-data.js
```

### 실행

```bash
# 개발 모드
npm start

# 프로덕션 모드
NODE_ENV=production npm start
```

서버가 시작되면 `http://localhost:4000` 에서 접속 가능합니다.

## 📡 API 엔드포인트

### 🏠 대시보드
```
GET /api/dashboard                      # 메인 대시보드 (전체 데이터)
GET /api/dashboard/total-value          # 총 재고 가치
GET /api/dashboard/category-breakdown   # 카테고리별 분포
GET /api/dashboard/recent-movements     # 최근 재고 이동
GET /api/dashboard/top-moving-items     # 가장 많이 움직인 품목
GET /api/dashboard/monthly-trend        # 월별 트렌드
GET /api/dashboard/kpis                 # KPI 지표
```

### 🔔 알림
```
GET /api/notifications/summary          # 전체 알림 요약
GET /api/notifications/low-stock        # 재고 부족 알림
GET /api/notifications/expiring         # 유통기한 임박
GET /api/notifications/expired          # 만료된 재고
GET /api/notifications/factory-alerts   # 공장별 알림
```

### 📊 리포트
```
GET /api/reports/daily                  # 일일 리포트
GET /api/reports/weekly                 # 주간 리포트
GET /api/reports/monthly                # 월간 리포트
GET /api/reports/inventory-status       # 재고 현황
GET /api/reports/turnover-analysis      # 재고 회전율 분석
GET /api/reports/list                   # 생성된 리포트 목록
GET /api/reports/download/:filename     # 리포트 다운로드
```

### 🔮 재고 예측
```
GET /api/predictions/stockouts                      # 전체 품목 재고 소진 예측
GET /api/predictions/:itemId/consumption-pattern    # 소비 패턴 분석
GET /api/predictions/:itemId/stockout               # 품목별 재고 소진 예측
GET /api/predictions/:itemId/reorder-quantity       # 재주문 수량 계산
GET /api/predictions/:itemId/seasonality            # 계절성 분석
GET /api/predictions/:itemId/forecast               # 수요 예측
```

### 🏥 헬스체크
```
GET /api/health                         # 전체 헬스체크
GET /api/health/ping                    # Ping
GET /api/health/readiness               # Readiness probe
GET /api/health/liveness                # Liveness probe
GET /api/health/metrics                 # 시스템 메트릭스
```

### 📦 재고 관리 (기존)
```
GET  /api/inventories                   # 재고 목록
POST /api/inventories/receive           # 입고
POST /api/inventories/issue             # 출고
POST /api/inventories/transfer          # 이동
GET  /api/inventories/movements         # 이동 이력
```

### 📝 품목 관리
```
GET    /api/items                       # 품목 목록
POST   /api/items                       # 품목 생성
GET    /api/items/:id                   # 품목 상세
PUT    /api/items/:id                   # 품목 수정
DELETE /api/items/:id                   # 품목 삭제
```

### 🏭 공장 관리
```
GET    /api/factories                   # 공장 목록
POST   /api/factories                   # 공장 생성
GET    /api/factories/:id               # 공장 상세
PUT    /api/factories/:id               # 공장 수정
DELETE /api/factories/:id               # 공장 삭제
```

### 🔐 인증
```
POST /api/auth/register                 # 회원가입
POST /api/auth/login                    # 로그인
POST /api/auth/logout                   # 로그아웃
GET  /api/auth/me                       # 현재 사용자 정보
```

자세한 API 문서는 Postman 컬렉션을 참고하세요: `Inventory_Management_Complete_API.postman_collection.json`

## 🔧 유지보수 작업

### 데이터베이스 백업
```bash
node scripts/backup-database.js
```
- 백업 파일은 `backups/` 디렉토리에 저장됩니다
- 파일명 형식: `backup_<db명>_<날짜시간>.sql`
- 30일 이상 된 백업은 자동 삭제됩니다

### 데이터베이스 복구
```bash
# 사용 가능한 백업 목록 확인
node scripts/restore-database.js

# 특정 백업 파일로 복구
node scripts/restore-database.js backup_inventory_development_20241028_120000.sql
```

## ⚙️ 환경 변수 설정

`.env` 파일에서 다음 항목들을 설정하세요:

```env
# 서버 설정
NODE_ENV=development
PORT=4000

# 데이터베이스
DEV_DB_PASSWORD=your_password
PRODUCTION_DB_PASSWORD=your_production_password

# 세션
SESSION_SECRET=your-secret-key-minimum-32-characters

# CORS
CORS_ORIGIN=http://localhost:3000

# 알림 설정
ENABLE_NOTIFICATIONS=true
LOW_STOCK_THRESHOLD_DAYS=7
EXPIRY_WARNING_DAYS=3
```

## 📁 프로젝트 구조

```
inventory-management_backend/
├── config/                 # 설정 파일
├── migrations/            # 데이터베이스 마이그레이션
├── models/                # Sequelize 모델
├── scripts/               # 유틸리티 스크립트
│   ├── backup-database.js
│   └── restore-database.js
├── src/
│   ├── controller/        # 컨트롤러
│   │   ├── dashboardController.js
│   │   ├── notificationController.js
│   │   ├── reportController.js
│   │   ├── predictionController.js
│   │   └── ...
│   ├── middleware/        # 미들웨어
│   ├── routes/            # 라우트
│   │   ├── dashboardRoute.js
│   │   ├── notificationRoute.js
│   │   ├── reportRoute.js
│   │   └── ...
│   ├── services/          # 비즈니스 로직
│   │   ├── dashboardService.js
│   │   ├── notificationService.js
│   │   ├── reportService.js
│   │   ├── predictionService.js
│   │   ├── schedulerService.js
│   │   └── ...
│   ├── utils/             # 유틸리티
│   └── views/             # EJS 템플릿 (라벨)
├── uploads/               # 업로드 파일
│   ├── order-imports/
│   ├── order-outputs/
│   └── reports/
├── env.example            # 환경 변수 예시
├── package.json
└── README.md
```

## 🤖 자동화 작업

시스템은 다음 작업을 자동으로 수행합니다:

1. **재고 상태 업데이트** (매일)
   - 유통기한 기준으로 재고 상태 자동 갱신

2. **일일 알림** (매일 오전 8시)
   - 재고 부족, 유통기한 임박 알림 생성

3. **일일 리포트** (매일)
   - 전일 재고 이동 현황 리포트 생성

4. **오래된 기록 정리** (주기적)
   - 90일 이상 된 만료 재고 기록 삭제

## 📈 주요 개선 사항

### 1. 대시보드 강화
- 실시간 재고 가치 계산
- 카테고리별/공장별 분포 시각화
- 월별 입출고 트렌드 분석
- KPI 지표 제공

### 2. 알림 시스템
- 재고 부족 자동 감지
- 유통기한 임박 알림 (3일 전)
- 만료 재고 추적
- 공장별 알림 통합

### 3. 리포트 자동화
- 일일/주간/월간 리포트 자동 생성
- Excel 파일 자동 다운로드
- 재고 회전율 분석
- 이메일 전송 준비 (향후 구현)

### 4. 재고 예측
- 소비 패턴 분석 (30일 기준)
- 재고 소진 예상일 계산
- 최적 재주문 수량 추천
- 계절성 분석
- 수요 예측

### 5. 시스템 모니터링
- 헬스체크 API
- 데이터베이스 상태 확인
- 시스템 리소스 모니터링
- Kubernetes readiness/liveness probe 지원

## 🔒 보안

- 세션 기반 인증
- CORS 설정
- SQL Injection 방지 (Sequelize ORM)
- XSS 방어 (httpOnly 쿠키)

## 📝 로그

- 모든 재고 이동은 `InventoryMovements` 테이블에 기록
- 승인 이력은 `AuditLog` 테이블에 저장
- 애플리케이션 로그는 콘솔에 출력

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

ISC License

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**Made with ❤️ for efficient factory inventory management**

