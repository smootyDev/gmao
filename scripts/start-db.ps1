$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$container = "gmao-db"

Set-Location $root

docker inspect -f "{{.State.Running}}" $container 2>$null | Out-Null
$containerExists = ($LASTEXITCODE -eq 0)

if ($containerExists) {
    $running = docker inspect -f "{{.State.Running}}" $container 2>$null
    if ($running -eq "true") {
        $healthy = docker inspect -f "{{.State.Health.Status}}" $container 2>$null
        if ($healthy -eq "healthy") {
            Write-Host "[db] El contenedor '$container' ya esta corriendo y saludable." -ForegroundColor Green
            exit 0
        }
        Write-Host "[db] El contenedor '$container' esta arrancando, esperando a que la BD este saludable..." -ForegroundColor Yellow
    }
    else {
        Write-Host "[db] El contenedor '$container' existe pero esta detenido. Levantandolo..." -ForegroundColor Yellow
    }
}
else {
    Write-Host "[db] El contenedor '$container' no existe. Levantandolo con docker compose..." -ForegroundColor Yellow
}

docker compose up -d db
if ($LASTEXITCODE -ne 0) {
    Write-Host "[db] ERROR: 'docker compose up -d db' fallo. Comprueba que Docker Desktop este en marcha." -ForegroundColor Red
    exit 1
}

for ($i = 1; $i -le 60; $i++) {
    $healthy = docker inspect -f "{{.State.Health.Status}}" $container 2>$null
    if ($healthy -eq "healthy") {
        Write-Host "[db] BD lista (contenedor saludable)." -ForegroundColor Green
        exit 0
    }
    Start-Sleep -Seconds 2
}

Write-Host "[db] Timeout esperando a que la BD este saludable. Revisa: docker logs $container" -ForegroundColor Red
exit 1
