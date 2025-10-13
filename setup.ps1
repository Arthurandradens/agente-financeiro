# Dashboard Financeiro - Setup Script
Write-Host "🚀 Configurando Dashboard Financeiro..." -ForegroundColor Green

# Verificar se Node.js está instalado
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro." -ForegroundColor Red
    exit 1
}

# Verificar versão do Node.js
$version = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($version -lt 18) {
    Write-Host "❌ Node.js versão 18+ é necessária. Versão atual: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Setup concluído!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para executar o projeto:" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Para build de produção:" -ForegroundColor Cyan
    Write-Host "  npm run build" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Consulte o README.md para mais informações." -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}
