$ErrorActionPreference = 'Stop'
$env:CLIENT_CLAIM_MODE = 'TEST_AUTO'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDirectory = Join-Path $projectRoot 'backend\kuri-api'
$jarPath = 'target\kuri-api-0.0.1-SNAPSHOT.jar'

Write-Host 'Starting Kuri Labo API with CLIENT_CLAIM_MODE=TEST_AUTO'
Write-Host 'API: http://localhost:8080'

Push-Location $backendDirectory
try {
    & '.\mvnw.cmd' '-DskipTests' 'package'
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed with exit code $LASTEXITCODE."
    }

    & java '-jar' $jarPath
    if ($LASTEXITCODE -ne 0) {
        throw "Backend process exited with code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}
