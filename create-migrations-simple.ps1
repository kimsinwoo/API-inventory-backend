# ============================================
# Simple Migration Generator
# ============================================
# Creates empty migration files for each table

$tables = @(
    "ApplicableItems",
    "Approvals",
    "ApprovalData",
    "ApprovalTasks",
    "Attachments",
    "AuditLogs",
    "BOMs",
    "BOMComponents",
    "Factories",
    "Items",
    "Inventories",
    "InventoryMovements",
    "Positions",
    "Processes",
    "RequiredApprovers",
    "StorageConditions",
    "Temperature",
    "Users",
    "UserProfiles",
    "FactoryProcesses"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating migration files..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($table in $tables) {
    $migrationName = "create-$($table.ToLower())"
    Write-Host "Creating: $migrationName" -ForegroundColor Yellow
    npx sequelize-cli migration:generate --name $migrationName
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Migration files created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Edit each file in migrations/ folder" -ForegroundColor Yellow
Write-Host ""

