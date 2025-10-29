/**
 * 모델 기반 Migration 자동 생성 스크립트
 * 사용법: node generate-migrations.js
 */

const fs = require('fs');
const path = require('path');

// 모델 파일 목록
const modelFiles = [
  'applicableitem.js',
  'approval.js',
  'approvaldata.js',
  'approvaltask.js',
  'attachment.js',
  'auditlog.js',
  'bom.js',
  'bomComponent.js',
  'factory.js',
  'items.js',
  'item.js',
  'InventoryMovement.js',
  'position.js',
  'process.js',
  'requiredapprover.js',
  'storagecondition.js',
  'temperature.js',
  'user.js',
  'userprofile.js',
  'order.js',
  'shippingBatch.js',
];

// 타입 매핑
const typeMapping = {
  'DataTypes.INTEGER.UNSIGNED': 'Sequelize.INTEGER.UNSIGNED',
  'DataTypes.INTEGER': 'Sequelize.INTEGER',
  'DataTypes.STRING': 'Sequelize.STRING',
  'DataTypes.TEXT': 'Sequelize.TEXT',
  'DataTypes.BOOLEAN': 'Sequelize.BOOLEAN',
  'DataTypes.DATE': 'Sequelize.DATE',
  'DataTypes.DATEONLY': 'Sequelize.DATEONLY',
  'DataTypes.DECIMAL': 'Sequelize.DECIMAL',
  'DataTypes.FLOAT': 'Sequelize.FLOAT',
  'DataTypes.ENUM': 'Sequelize.ENUM',
  'DataTypes.JSON': 'Sequelize.JSON',
  'DataTypes.NOW': 'Sequelize.NOW',
};

// 모델 정의 추출
function extractModelInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // ENUM 상수 추출
  const enumConstants = {};
  const enumRegex = /const\s+(\w+)\s*=\s*\[([^\]]+)\]/g;
  let enumMatch;
  while ((enumMatch = enumRegex.exec(content)) !== null) {
    const constName = enumMatch[1];
    const values = enumMatch[2]
      .split(',')
      .map(v => v.trim().replace(/["']/g, ''))
      .filter(v => v);
    enumConstants[constName] = values;
  }
  
  // 테이블명 추출
  const tableNameMatch = content.match(/tableName:\s*["']([^"']+)["']/);
  const tableName = tableNameMatch ? tableNameMatch[1] : null;
  
  // 모델명 추출
  const modelNameMatch = content.match(/class\s+(\w+)\s+extends\s+Model/);
  const modelName = modelNameMatch ? modelNameMatch[1] : null;
  
  if (!tableName || !modelName) {
    console.warn(`⚠️  테이블명 또는 모델명을 찾을 수 없습니다: ${path.basename(filePath)}`);
    return null;
  }
  
  // 필드 정의 추출 (간단한 파싱)
  const initMatch = content.match(/\.init\s*\(\s*\{([\s\S]*?)\},\s*\{/);
  if (!initMatch) {
    console.warn(`⚠️  필드 정의를 찾을 수 없습니다: ${path.basename(filePath)}`);
    return null;
  }
  
  const fieldsContent = initMatch[1];
  const fields = {};
  
  // 각 필드를 정규식으로 추출
  const fieldRegex = /(\w+):\s*\{([^}]+)\}/g;
  let fieldMatch;
  
  while ((fieldMatch = fieldRegex.exec(fieldsContent)) !== null) {
    const fieldName = fieldMatch[1];
    const fieldDef = fieldMatch[2];
    
    fields[fieldName] = {
      raw: fieldDef.trim(),
    };
  }
  
  return {
    modelName,
    tableName,
    fields,
    content,
    enumConstants,
  };
}

// Migration 파일 생성
function generateMigration(modelInfo) {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const fileName = `${timestamp}-create-${modelInfo.tableName.toLowerCase()}.js`;
  const filePath = path.join(__dirname, 'migrations', fileName);
  
  // 필드를 migration 형식으로 변환
  let fieldsCode = '';
  
  for (const [fieldName, fieldInfo] of Object.entries(modelInfo.fields)) {
    const raw = fieldInfo.raw;
    
    // type 추출
    let typeMatch = raw.match(/type:\s*(DataTypes\.[A-Z_]+(?:\([^)]*\))?(?:\.[A-Z_]+)?)/);
    if (!typeMatch) continue;
    
    let typeStr = typeMatch[1];
    
    // ENUM 처리 - 상수명을 실제 값으로 치환
    if (typeStr.includes('DataTypes.ENUM')) {
      // DataTypes.ENUM(...CONSTANT_NAME) 패턴 찾기
      const enumSpreadMatch = typeStr.match(/DataTypes\.ENUM\(\.\.\.(\w+)\)/);
      if (enumSpreadMatch) {
        const constName = enumSpreadMatch[1];
        if (modelInfo.enumConstants[constName]) {
          const enumValues = modelInfo.enumConstants[constName]
            .map(v => `"${v}"`)
            .join(', ');
          typeStr = `Sequelize.ENUM(${enumValues})`;
        }
      } else {
        // DataTypes를 Sequelize로 변환
        typeStr = typeStr.replace(/DataTypes/g, 'Sequelize');
      }
    } else {
      // DataTypes를 Sequelize로 변환
      typeStr = typeStr.replace(/DataTypes/g, 'Sequelize');
    }
    
    // 옵션 추출
    const options = [];
    if (raw.includes('allowNull: false')) options.push('allowNull: false');
    if (raw.includes('allowNull: true')) options.push('allowNull: true');
    if (raw.includes('primaryKey: true')) options.push('primaryKey: true');
    if (raw.includes('autoIncrement: true')) options.push('autoIncrement: true');
    if (raw.includes('unique: true')) options.push('unique: true');
    
    // defaultValue 추출
    const defaultMatch = raw.match(/defaultValue:\s*([^,\n}]+)/);
    if (defaultMatch) {
      let defaultVal = defaultMatch[1].trim();
      // DataTypes.NOW를 Sequelize.NOW로 변환
      if (defaultVal.includes('DataTypes')) {
        defaultVal = defaultVal.replace(/DataTypes/g, 'Sequelize');
      }
      options.push(`defaultValue: ${defaultVal}`);
    }
    
    fieldsCode += `      ${fieldName}: {\n`;
    fieldsCode += `        type: ${typeStr}`;
    if (options.length > 0) {
      fieldsCode += ',\n        ' + options.join(',\n        ');
    }
    fieldsCode += '\n      },\n';
  }
  
  const migrationContent = `'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('${modelInfo.tableName}', {
${fieldsCode}      createdAt: {
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
    await queryInterface.dropTable('${modelInfo.tableName}');
  }
};
`;
  
  return {
    fileName,
    filePath,
    content: migrationContent,
  };
}

// 메인 실행
async function main() {
  console.log('🚀 Migration 파일 자동 생성 시작...\n');
  
  const modelsDir = path.join(__dirname, 'models');
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // migrations 디렉토리 확인
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    console.log('📁 migrations 디렉토리 생성됨\n');
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (const modelFile of modelFiles) {
    const modelPath = path.join(modelsDir, modelFile);
    
    if (!fs.existsSync(modelPath)) {
      console.log(`❌ 파일을 찾을 수 없습니다: ${modelFile}`);
      failCount++;
      continue;
    }
    
    try {
      console.log(`📦 처리 중: ${modelFile}`);
      
      const modelInfo = extractModelInfo(modelPath);
      if (!modelInfo) {
        failCount++;
        continue;
      }
      
      const migration = generateMigration(modelInfo);
      
      // 파일 저장
      fs.writeFileSync(migration.filePath, migration.content, 'utf8');
      
      console.log(`✅ 생성 완료: ${migration.fileName}`);
      console.log(`   테이블: ${modelInfo.tableName}\n`);
      
      successCount++;
    } catch (error) {
      console.error(`❌ 오류 발생 (${modelFile}):`, error.message);
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✨ 완료: ${successCount}개 생성, ${failCount}개 실패`);
  console.log('='.repeat(50));
  
  if (successCount > 0) {
    console.log('\n💡 다음 명령어로 migration을 실행하세요:');
    console.log('   npx sequelize-cli db:migrate');
  }
}

main().catch(console.error);

