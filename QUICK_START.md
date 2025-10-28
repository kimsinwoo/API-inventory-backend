# 🚀 빠른 시작 가이드

재고 관리 시스템을 5분 안에 실행하는 가이드입니다.

## 📋 사전 준비

다음 프로그램이 설치되어 있어야 합니다:
- ✅ Node.js (14.x 이상)
- ✅ MySQL (5.7 이상)
- ✅ npm 또는 yarn

## 🎬 1단계: 환경 설정

### 1.1 환경 변수 파일 생성
```bash
# Windows PowerShell
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

### 1.2 .env 파일 수정
`.env` 파일을 열어서 다음 항목을 수정하세요:

```env
# 데이터베이스 비밀번호 (중요!)
DEV_DB_PASSWORD=your_actual_password

# 세션 시크릿 (32자 이상)
SESSION_SECRET=change-this-to-random-32-character-string

# 필요시 포트 변경
PORT=4000
```

## 🎬 2단계: 데이터베이스 설정

### 2.1 MySQL 데이터베이스 생성
```sql
CREATE DATABASE inventory_development CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.2 마이그레이션 실행
```bash
npx sequelize-cli db:migrate
```

### 2.3 초기 데이터 입력
```bash
npm run seed
```

**결과:**
- ✅ 3개 공장 생성
- ✅ 3개 저장 조건 생성
- ✅ 5개 품목 생성

## 🎬 3단계: 서버 실행

```bash
npm start
```

**성공 메시지:**
```
========================================
✓ 서버가 정상적으로 시작되었습니다
✓ 포트: 4000
✓ URL: http://localhost:4000
✓ 환경: development
========================================
```

## ✅ 4단계: 확인

### 4.1 헬스체크
브라우저나 Postman에서:
```
http://localhost:4000/api/health/ping
```

**예상 응답:**
```json
{
  "status": "ok",
  "timestamp": "2024-10-28 14:30:00",
  "message": "pong"
}
```

### 4.2 대시보드
```
http://localhost:4000/api/dashboard
```

### 4.3 품목 목록
```
http://localhost:4000/api/items
```

## 🎯 주요 기능 테스트

### 1. 재고 입고
```bash
POST http://localhost:4000/api/inventories/receive
Content-Type: application/json

{
  "itemId": 1,
  "factoryId": 1,
  "storageConditionId": 1,
  "lotNumber": "LOT-TEST-001",
  "quantity": 100,
  "wholesalePrice": 15000,
  "receivedAt": "2024-10-28",
  "unit": "kg"
}
```

### 2. 알림 확인
```bash
GET http://localhost:4000/api/notifications/summary
```

### 3. 일일 리포트
```bash
GET http://localhost:4000/api/reports/daily
```

### 4. 재고 예측
```bash
GET http://localhost:4000/api/predictions/stockouts
```

## 🛠️ 문제 해결

### 문제: 데이터베이스 연결 실패
**해결:**
1. MySQL 서비스가 실행 중인지 확인
2. `.env` 파일의 비밀번호가 정확한지 확인
3. 데이터베이스가 생성되었는지 확인

### 문제: 포트 충돌
**해결:**
`.env` 파일에서 포트 변경:
```env
PORT=5000
```

### 문제: 마이그레이션 실패
**해결:**
```bash
# 마이그레이션 취소
npx sequelize-cli db:migrate:undo:all

# 다시 실행
npx sequelize-cli db:migrate
```

## 📚 다음 단계

### 1. Postman 컬렉션 사용
`Inventory_Management_Complete_API.postman_collection.json` 파일을 Postman에 import하세요.

### 2. 문서 읽기
- `README.md` - 전체 프로젝트 문서
- `API_DOCUMENTATION.md` - 상세 API 문서
- `IMPROVEMENTS_SUMMARY.md` - 개선 사항 요약

### 3. 백업 설정
정기적인 백업을 위해 cron job이나 Windows 작업 스케줄러 설정:
```bash
# 매일 새벽 2시 백업
npm run backup
```

### 4. 프로덕션 배포
프로덕션 환경에서는:
1. `.env`에서 `NODE_ENV=production` 설정
2. 강력한 `SESSION_SECRET` 사용
3. HTTPS 사용
4. 방화벽 설정
5. 정기 백업 자동화

## 🎉 축하합니다!

재고 관리 시스템이 성공적으로 실행되었습니다!

이제 다음 기능들을 사용할 수 있습니다:
- ✅ 실시간 대시보드
- ✅ 재고 입출고 관리
- ✅ 자동 알림
- ✅ 리포트 생성
- ✅ 재고 예측
- ✅ 시스템 모니터링

## 📞 도움말

문제가 있거나 질문이 있으시면:
1. `README.md` 확인
2. `API_DOCUMENTATION.md` 참조
3. GitHub 이슈 생성

---

**Happy Coding! 🚀**

