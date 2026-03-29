# ============================================================
# setup-frontend.ps1 — ReservaTuCancha Frontend
# Ejecutar desde la carpeta Frontend/:
#   .\setup-frontend.ps1
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ReservaTuCancha — Frontend Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 1. Verificar Node
Write-Host "Verificando Node.js..." -ForegroundColor Cyan
node -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js no encontrado. Instala Node 20+ desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. Instalar dependencias
Write-Host ""
Write-Host "Instalando dependencias npm..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR en npm install" -ForegroundColor Red
    exit 1
}

# 3. Inicializar shadcn
Write-Host ""
Write-Host "Inicializando shadcn/ui..." -ForegroundColor Cyan
npx shadcn@latest init --yes --defaults

# 4. Instalar componentes shadcn
Write-Host ""
Write-Host "Instalando componentes shadcn/ui..." -ForegroundColor Cyan
$components = @(
    "button",
    "card",
    "input",
    "label",
    "textarea",
    "badge",
    "separator",
    "avatar",
    "dropdown-menu",
    "skeleton",
    "dialog",
    "select",
    "tabs",
    "sheet",
    "table"
)

foreach ($component in $components) {
    Write-Host "  + $component" -ForegroundColor Gray
    npx shadcn@latest add $component --yes --overwrite
}

# 5. Copiar .env
Write-Host ""
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "Archivo .env.local creado desde .env.example" -ForegroundColor Yellow
    Write-Host "IMPORTANTE: Edita .env.local con tus credenciales antes de correr el proyecto" -ForegroundColor Yellow
} else {
    Write-Host ".env.local ya existe, no se sobreescribe" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup completado exitosamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso:" -ForegroundColor Cyan
Write-Host "  1. Edita .env.local con tus credenciales"
Write-Host "  2. Corre: npm run dev"
Write-Host "  3. Abre: http://localhost:3000"
Write-Host ""
