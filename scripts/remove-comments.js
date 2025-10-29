const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const targetPath = args[0] || "./src";
const dryRun = args.includes("--dry-run");

function removeComments(code) {
  let result = code;
  
  result = result.replace(/\/\*\*[\s\S]*?\*\//g, "");
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");
  result = result.replace(/\/\/.*/g, "");
  result = result.replace(/^\s*[\r\n]/gm, "");
  result = result.replace(/\n{3,}/g, "\n\n");
  
  return result.trim() + "\n";
}

function processFile(filePath) {
  if (!filePath.endsWith(".js")) return;
  
  const content = fs.readFileSync(filePath, "utf8");
  const cleaned = removeComments(content);
  
  if (content !== cleaned) {
    console.log(`Processing: ${filePath}`);
    
    if (!dryRun) {
      fs.writeFileSync(filePath, cleaned, "utf8");
      console.log(`  ✓ Comments removed`);
    } else {
      console.log(`  [DRY RUN] Would remove comments`);
    }
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes("node_modules")) {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      processFile(fullPath);
    }
  }
}

console.log("\n========================================");
console.log("주석 제거 스크립트");
console.log("========================================\n");
console.log(`대상 경로: ${targetPath}`);
console.log(`모드: ${dryRun ? "테스트 (실제 변경 없음)" : "실행"}\n`);

const fullPath = path.resolve(targetPath);

if (fs.existsSync(fullPath)) {
  const stat = fs.statSync(fullPath);
  
  if (stat.isDirectory()) {
    processDirectory(fullPath);
  } else {
    processFile(fullPath);
  }
  
  console.log("\n✅ 완료!\n");
} else {
  console.error(`❌ 경로를 찾을 수 없습니다: ${fullPath}\n`);
}


