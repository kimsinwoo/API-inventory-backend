# ============================================
# Auto Migration Generator Script
# ============================================
# Purpose: Generate migration files from all model files
# Usage: .\create-migrations.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration Auto Generator Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run Node.js script
Write-Host "Analyzing model files and generating migrations..." -ForegroundColor Yellow
Write-Host ""

node generate-migrations.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Migration files created successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Check generated files in migrations folder" -ForegroundColor White
    Write-Host "   2. Add foreign keys and indexes if needed" -ForegroundColor White
    Write-Host "   3. Run migration with:" -ForegroundColor White
    Write-Host "      npx sequelize-cli db:migrate" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error occurred during generation" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host ""
}
