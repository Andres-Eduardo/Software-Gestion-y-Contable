$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups"

if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$backupFile = "$backupDir\opa_db_$timestamp.sql"

docker exec opa_postgres pg_dump -U opa_user -d opa_db > $backupFile

Write-Host "Backup creado: $backupFile"