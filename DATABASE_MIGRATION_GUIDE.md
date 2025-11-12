# 데이터베이스 마이그레이션 가이드

## 수정된 내용

### 1. 모델 수정
- `models/labeltemplate.js`: `html_content` 필드 추가 (TEXT("long"), allowNull: true)

### 2. 마이그레이션 수정
- `migrations/20251106170000-create-label-templates.js`: `html_content` 필드의 `allowNull: true`로 수정
- `migrations/20251106180000-update-label-templates-html-content-nullable.js`: 새 마이그레이션 파일 생성 (기존 DB 업데이트용)

## 마이그레이션 실행 방법

### 1. 새로 데이터베이스를 생성하는 경우
기존 마이그레이션 파일이 수정되었으므로, 새로 마이그레이션을 실행하면 됩니다:

```bash
# 마이그레이션 실행
npx sequelize-cli db:migrate
```

### 2. 이미 데이터베이스가 생성된 경우
기존 데이터베이스가 있다면, 새로운 마이그레이션을 실행하여 `html_content` 컬럼을 수정해야 합니다:

```bash
# 마이그레이션 실행
npx sequelize-cli db:migrate
```

이 마이그레이션은:
- `html_content` 컬럼이 이미 존재하면 `allowNull: true`로 변경
- `html_content` 컬럼이 없으면 추가

### 3. 마이그레이션 롤백
필요한 경우 마이그레이션을 롤백할 수 있습니다:

```bash
# 마지막 마이그레이션 롤백
npx sequelize-cli db:migrate:undo

# 특정 마이그레이션까지 롤백
npx sequelize-cli db:migrate:undo:all --to 20251106170000-create-label-templates.js
```

## 데이터베이스 스키마

### LabelTemplates 테이블

```sql
CREATE TABLE `LabelTemplates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_id` INT UNSIGNED NULL,
  `item_name` VARCHAR(100) NULL,
  `label_type` VARCHAR(20) NULL,
  `storage_condition` VARCHAR(20) NULL,
  `registration_number` VARCHAR(50) NULL,
  `category_and_form` VARCHAR(100) NULL,
  `ingredients` VARCHAR(255) NULL,
  `raw_materials` VARCHAR(255) NULL,
  `actual_weight` VARCHAR(50) NULL,
  `html_content` TEXT NULL,  -- allowNull: true로 수정됨
  `printer_name` VARCHAR(150) NULL,
  `print_count` INT UNSIGNED NOT NULL DEFAULT 1,
  `print_status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `error_message` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `item_id` (`item_id`),
  INDEX `registration_number` (`registration_number`),
  INDEX `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 확인 사항

### 1. 모델과 데이터베이스 일치 확인
모델 파일(`models/labeltemplate.js`)과 데이터베이스 스키마가 일치하는지 확인하세요.

### 2. 마이그레이션 상태 확인
```bash
# 마이그레이션 상태 확인
npx sequelize-cli db:migrate:status
```

### 3. 데이터베이스 직접 확인
```sql
-- LabelTemplates 테이블 구조 확인
DESCRIBE LabelTemplates;

-- html_content 컬럼 확인
SHOW COLUMNS FROM LabelTemplates LIKE 'html_content';
```

## 문제 해결

### 문제 1: 마이그레이션 실행 시 에러
```
Error: Column 'html_content' cannot be null
```

**해결 방법:**
1. 기존 데이터가 있다면 먼저 `html_content`를 NULL로 업데이트:
   ```sql
   UPDATE LabelTemplates SET html_content = NULL WHERE html_content IS NOT NULL;
   ```
2. 그 다음 마이그레이션 실행:
   ```bash
   npx sequelize-cli db:migrate
   ```

### 문제 2: 컬럼이 이미 존재하는 경우
마이그레이션이 자동으로 처리합니다. 컬럼이 이미 존재하면 `allowNull`만 변경하고, 없으면 추가합니다.

### 문제 3: 마이그레이션 순서 문제
마이그레이션 파일 이름의 타임스탬프가 올바른지 확인하세요:
- `20251106170000-create-label-templates.js` (기존)
- `20251106180000-update-label-templates-html-content-nullable.js` (새로 추가)

## 주의사항

1. **데이터 백업**: 마이그레이션 실행 전 데이터베이스를 백업하세요.
2. **프로덕션 환경**: 프로덕션 환경에서는 먼저 스테이징 환경에서 테스트하세요.
3. **동시성**: 마이그레이션 실행 중에는 애플리케이션을 중지하는 것이 안전합니다.

## 수정된 파일 목록

1. `models/labeltemplate.js` - `html_content` 필드 추가
2. `migrations/20251106170000-create-label-templates.js` - `html_content` 필드의 `allowNull: true`로 수정
3. `migrations/20251106180000-update-label-templates-html-content-nullable.js` - 새 마이그레이션 파일 (기존 DB 업데이트용)


