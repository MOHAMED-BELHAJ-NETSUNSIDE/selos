# Script pour configurer l'URL de l'API pour l'APK Android
# Usage: .\setup-api-url.ps1

Write-Host "🔧 Configuration de l'URL de l'API pour Selos Mobile" -ForegroundColor Cyan
Write-Host ""

# Trouver l'IP locale
Write-Host "📡 Recherche de votre IP locale..." -ForegroundColor Yellow
$ipConfig = ipconfig | Select-String "IPv4" | Select-Object -First 1
if ($ipConfig) {
    $ip = ($ipConfig -split ":")[1].Trim()
    Write-Host "✅ IP trouvée: $ip" -ForegroundColor Green
} else {
    Write-Host "❌ Impossible de trouver l'IP automatiquement" -ForegroundColor Red
    $ip = Read-Host "Veuillez entrer votre IP locale manuellement"
}

Write-Host ""
Write-Host "🔗 URL de l'API qui sera utilisée: http://$ip:3001" -ForegroundColor Cyan
Write-Host ""

# Demander confirmation
$confirm = Read-Host "Voulez-vous créer/mettre à jour le fichier .env avec cette IP? (O/N)"
if ($confirm -eq "O" -or $confirm -eq "o" -or $confirm -eq "Y" -or $confirm -eq "y") {
    $envContent = "VITE_API_URL=http://$ip:3001`n"
    Set-Content -Path ".env" -Value $envContent -Force
    Write-Host ""
    Write-Host "✅ Fichier .env créé/mis à jour avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "   1. npm run build" -ForegroundColor White
    Write-Host "   2. npx cap sync" -ForegroundColor White
    Write-Host "   3. Ouvrir Android Studio et régénérer l'APK" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Configuration annulée" -ForegroundColor Red
}

