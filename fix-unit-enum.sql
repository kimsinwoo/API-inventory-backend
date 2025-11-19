-- Items 테이블의 unit ENUM을 업데이트하는 SQL 스크립트
-- 배포 서버에서 직접 실행할 수 있습니다.

-- 현재 ENUM 확인 (실행 전 확인용)
-- SHOW COLUMNS FROM Items WHERE Field = 'unit';

-- ENUM 업데이트
ALTER TABLE Items 
MODIFY COLUMN unit ENUM('kg', 'g', 'L', 'EA', 'BOX', 'PCS', 'ROLL') 
NOT NULL DEFAULT 'kg';

-- 업데이트 확인
-- SHOW COLUMNS FROM Items WHERE Field = 'unit';

