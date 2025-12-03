# Script PowerShell pour exécuter la migration zone_canal
# Usage: .\run_migration_zone_canal.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Migration Zone-Canal (N:M)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Lire la DATABASE_URL depuis .env
$envFile = ".\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "Erreur: Le fichier .env n'existe pas dans le dossier backend" -ForegroundColor Red
    Write-Host "Veuillez créer le fichier .env avec votre DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

$envContent = Get-Content $envFile
$databaseUrl = $envContent | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_ -replace "^DATABASE_URL=", "" } | ForEach-Object { $_ -replace '^"|"$', '' }

if (-not $databaseUrl) {
    Write-Host "Erreur: DATABASE_URL non trouvé dans .env" -ForegroundColor Red
    exit 1
}

# Parser la DATABASE_URL
# Format: mysql://user:password@host:port/database
if ($databaseUrl -match "mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "Connexion à la base de données..." -ForegroundColor Yellow
    Write-Host "Host: $dbHost" -ForegroundColor Gray
    Write-Host "Database: $dbName" -ForegroundColor Gray
    Write-Host ""
    
    # Lire le fichier SQL
    $sqlFile = ".\migrations\migrate_zone_canal_to_nm.sql"
    if (-not (Test-Path $sqlFile)) {
        Write-Host "Erreur: Le fichier de migration n'existe pas: $sqlFile" -ForegroundColor Red
        exit 1
    }
    
    $sqlContent = Get-Content $sqlFile -Raw
    
    Write-Host "Exécution de la migration..." -ForegroundColor Yellow
    
    # Exécuter via mysql CLI (si disponible)
    $mysqlPath = "mysql"
    $mysqlArgs = "-h$dbHost", "-P$dbPort", "-u$dbUser", "-p$dbPassword", "$dbName"
    
    try {
        $sqlContent | & $mysqlPath $mysqlArgs 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ Migration exécutée avec succès!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Prochaine étape: Régénérer le client Prisma" -ForegroundColor Yellow
            Write-Host "  npx prisma generate" -ForegroundColor Cyan
        } else {
            Write-Host "Erreur lors de l'exécution de la migration" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host ""
        Write-Host "Erreur: MySQL CLI n'est pas disponible ou la connexion a échoué" -ForegroundColor Red
        Write-Host ""
        Write-Host "Alternative: Exécutez manuellement le fichier SQL:" -ForegroundColor Yellow
        Write-Host "  $sqlFile" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Ou utilisez un client MySQL (phpMyAdmin, MySQL Workbench, etc.)" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Erreur: Format de DATABASE_URL invalide" -ForegroundColor Red
    Write-Host "Format attendu: mysql://user:password@host:port/database" -ForegroundColor Yellow
    exit 1
}

