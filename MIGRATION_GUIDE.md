# 🔄 Migration 자동 생성 가이드

이 가이드는 모델 파일을 기반으로 자동으로 migration 파일을 생성하는 방법을 설명합니다.

## 📋 목차

1. [개요](#개요)
2. [사용 방법](#사용-방법)
3. [생성되는 파일](#생성되는-파일)
4. [주의사항](#주의사항)
5. [문제 해결](#문제-해결)

---

## 🎯 개요

`generate-migrations.js` 스크립트는 다음 모델 파일들을 자동으로 분석하여 migration 파일을 생성합니다:

### 지원되는 모델 목록

- ✅ `applicableitem.js` - 적용 가능한 품목
- ✅ `approval.js` - 승인
- ✅ `approvaldata.js` - 승인 데이터
- ✅ `approvaltask.js` - 승인 작업
- ✅ `attachment.js` - 첨부 파일
- ✅ `auditlog.js` - 감사 로그
- ✅ `bom.js` - 자재 명세서
- ✅ `bomComponent.js` - BOM 구성 요소
- ✅ `factory.js` - 공장
- ✅ `items.js` - 품목
- ✅ `item.js` - 재고 (Inventories)
- ✅ `InventoryMovement.js` - 재고 이동
- ✅ `position.js` - 직책
- ✅ `process.js` - 공정
- ✅ `requiredapprover.js` - 필수 승인자
- ✅ `storagecondition.js` - 보관 조건
- ✅ `temperature.js` - 온도 기록
- ✅ `user.js` - 사용자
- ✅ `userprofile.js` - 사용자 프로필

---

## 🚀 사용 방법

### 방법 1: PowerShell 스크립트 사용 (권장)

```powershell
# PowerShell에서 실행
.\create-migrations.ps1
```

### 방법 2: Node.js 직접 실행

```bash
# 터미널에서 실행
node generate-migrations.js
```

### 실행 결과

스크립트 실행 시 다음과 같은 출력을 확인할 수 있습니다:

```
🚀 Migration 파일 자동 생성 시작...

📁 migrations 디렉토리 생성됨

📦 처리 중: applicableitem.js
✅ 생성 완료: 20241029123456-create-applicableitems.js
   테이블: ApplicableItems

📦 처리 중: approval.js
✅ 생성 완료: 20241029123457-create-approvals.js
   테이블: Approvals

...

==================================================
✨ 완료: 19개 생성, 0개 실패
==================================================

💡 다음 명령어로 migration을 실행하세요:
   npx sequelize-cli db:migrate
```

---

## 📁 생성되는 파일

### 파일 위치
모든 migration 파일은 `migrations/` 디렉토리에 생성됩니다.

### 파일 명명 규칙
```
[타임스탬프]-create-[테이블명].js
```

예시:
- `20241029123456-create-users.js`
- `20241029123457-create-factories.js`
- `20241029123458-create-items.js`

### 생성되는 파일 구조

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TableName', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      // ... 기타 필드들
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'updated_at'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TableName');
  }
};
```

---

## ⚠️ 주의사항

### 1. 자동 생성되지 않는 요소

다음 요소들은 자동으로 생성되지 않으므로, **수동으로 추가**해야 합니다:

#### 외래키 (Foreign Keys)
```javascript
// 수동으로 추가 필요
await queryInterface.addConstraint('TableName', {
  fields: ['user_id'],
  type: 'foreign key',
  name: 'fk_table_user_id',
  references: {
    table: 'Users',
    field: 'id'
  },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
```

#### 인덱스 (Indexes)
```javascript
// 수동으로 추가 필요
await queryInterface.addIndex('TableName', ['field_name'], {
  name: 'idx_table_field',
  unique: false
});
```

#### Many-to-Many 관계 테이블
```javascript
// FactoryProcesses 같은 조인 테이블은 별도로 생성 필요
await queryInterface.createTable('FactoryProcesses', {
  factory_id: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'Factories',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  process_id: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'Processes',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    field: 'created_at'
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: false,
    field: 'updated_at'
  }
});

await queryInterface.addIndex('FactoryProcesses', ['factory_id', 'process_id'], {
  unique: true,
  name: 'factory_process_unique'
});
```

### 2. 생성 전 확인 사항

- ✅ `models/` 디렉토리에 모든 모델 파일이 있는지 확인
- ✅ 각 모델 파일이 올바른 형식인지 확인
- ✅ 데이터베이스 연결 설정이 완료되었는지 확인 (`config/config.js`)

### 3. 생성 후 확인 사항

1. **생성된 파일 검토**: `migrations/` 폴더의 파일들을 열어 내용 확인
2. **외래키 추가**: 필요한 외래키 제약조건 추가
3. **인덱스 추가**: 성능을 위한 인덱스 추가
4. **테스트**: 개발 환경에서 먼저 테스트

---

## 🔧 Migration 실행

### 1. Migration 실행 (DB 테이블 생성)

```bash
# 모든 pending migration 실행
npx sequelize-cli db:migrate

# 특정 migration까지만 실행
npx sequelize-cli db:migrate --to 20241029123456-create-users.js
```

### 2. Migration 취소 (Rollback)

```bash
# 가장 최근 migration 취소
npx sequelize-cli db:migrate:undo

# 모든 migration 취소
npx sequelize-cli db:migrate:undo:all

# 특정 migration까지 취소
npx sequelize-cli db:migrate:undo:all --to 20241029123456-create-users.js
```

### 3. Migration 상태 확인

```bash
# 실행된 migration 목록 확인
npx sequelize-cli db:migrate:status
```

---

## 🛠️ 문제 해결

### 문제 1: "파일을 찾을 수 없습니다"

**원인**: 모델 파일이 `models/` 디렉토리에 없음

**해결**:
```bash
# models 디렉토리 확인
ls models/

# 파일이 있는지 확인
ls models/user.js
```

### 문제 2: "테이블명을 찾을 수 없습니다"

**원인**: 모델 파일에 `tableName` 속성이 없음

**해결**: 모델 파일의 `.init()` 메서드에 `tableName` 추가
```javascript
Model.init(
  { /* fields */ },
  { 
    sequelize, 
    modelName: "ModelName", 
    tableName: "TableNames",  // 이 부분 확인
    timestamps: true 
  }
);
```

### 문제 3: Migration 실행 시 "SequelizeMeta 테이블 없음"

**원인**: 데이터베이스가 초기화되지 않음

**해결**:
```bash
# 데이터베이스 초기화 (주의: 기존 데이터 삭제됨)
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate
```

### 문제 4: 외래키 제약조건 위반

**원인**: 테이블 생성 순서 문제 (참조되는 테이블이 먼저 생성되어야 함)

**해결**: Migration 파일명의 타임스탬프를 수정하여 순서 조정
```
순서:
1. UserProfiles (독립 테이블)
2. Users (UserProfiles 참조)
3. Positions (Users 참조)
```

### 문제 5: ENUM 값 오류

**원인**: 모델과 migration의 ENUM 값이 일치하지 않음

**해결**: Migration 파일에서 ENUM 값 수동 확인 및 수정
```javascript
type: Sequelize.ENUM('value1', 'value2', 'value3')
```

---

## 📝 체크리스트

### Migration 생성 전
- [ ] 모든 모델 파일이 `models/` 디렉토리에 있음
- [ ] 각 모델에 `tableName` 속성이 정의됨
- [ ] 데이터베이스 연결 설정 완료 (`config/config.js`)
- [ ] `node_modules` 설치 완료 (`npm install`)

### Migration 생성 후
- [ ] 생성된 파일 개수 확인 (19개)
- [ ] 각 파일의 테이블명 확인
- [ ] 필드 타입 및 제약조건 확인
- [ ] 필요한 외래키 추가
- [ ] 필요한 인덱스 추가
- [ ] Many-to-Many 조인 테이블 생성

### Migration 실행 전
- [ ] 데이터베이스 백업 (운영 환경)
- [ ] 개발 환경에서 먼저 테스트
- [ ] Migration 순서 확인 (의존성)
- [ ] Rollback 계획 수립

### Migration 실행 후
- [ ] 테이블 생성 확인
- [ ] 외래키 제약조건 확인
- [ ] 인덱스 생성 확인
- [ ] 애플리케이션 동작 테스트
- [ ] 데이터 삽입 테스트

---

## 💡 유용한 명령어

```bash
# 데이터베이스 재생성 (개발 환경에서만!)
npx sequelize-cli db:drop && npx sequelize-cli db:create && npx sequelize-cli db:migrate

# Migration 상태와 테이블 확인
npx sequelize-cli db:migrate:status
mysql -u root -p -e "SHOW TABLES;" database_name

# 특정 테이블 구조 확인
mysql -u root -p -e "DESCRIBE TableName;" database_name

# 로그와 함께 migration 실행
npx sequelize-cli db:migrate --debug
```

---

## 🔗 관련 문서

- [Sequelize Migrations 공식 문서](https://sequelize.org/docs/v6/other-topics/migrations/)
- [Sequelize CLI 공식 문서](https://github.com/sequelize/cli)
- [MySQL 외래키 가이드](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html)

---

## 📞 도움이 필요하신가요?

문제가 해결되지 않으면:
1. `generate-migrations.js` 스크립트의 로그 확인
2. 모델 파일의 형식 확인
3. 데이터베이스 연결 상태 확인
4. Sequelize 버전 확인 (`npm list sequelize`)

---

**마지막 업데이트**: 2024-10-29
**버전**: 1.0.0

