# 📁 경로: C:\Users\khcst\inventory-management_backend\
# 📄 파일명: create-migrations.ps1

$models = @(
    "applicableitem",
    "approval",
    "approvaldata",
    "approvaltask",
    "attachment",
    "auditlog",
    "bom",
    "bomComponent",
    "factory",
    "item",
    "items",
    "position",
    "process",
    "requiredapprover",
    "storagecondition",
    "temperature",
    "user",
    "userprofile"
)

foreach ($model in $models) {
    $name = "create-$model-table"
    Write-Host "📦 Generating migration: $name"
    npx sequelize migration:create --name $name
}
