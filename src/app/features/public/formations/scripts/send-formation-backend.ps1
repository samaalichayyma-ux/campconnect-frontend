param(
  [string]$Token = "",

  [string]$LoginEmail = "",
  [string]$LoginPassword = "",

  [string]$BackendBaseUrl = "http://localhost:8082",
  [string]$Titre = "Formation test CampConnect",
  [string]$Description = "Formation generee via script PowerShell pour verifier le backend.",
  [switch]$ListerSeulement
)

$ErrorActionPreference = "Stop"

function Write-Section([string]$Text) {
  Write-Host ""
  Write-Host ("==== " + $Text + " ====") -ForegroundColor Cyan
}

function Resolve-ErrorMessage([object]$Exception) {
  try {
    $response = $Exception.Response
    if ($null -eq $response) {
      return $Exception.Message
    }

    $stream = $response.GetResponseStream()
    if ($null -eq $stream) {
      return $Exception.Message
    }

    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    $reader.Close()

    if ([string]::IsNullOrWhiteSpace($body)) {
      return $Exception.Message
    }

    return $body
  } catch {
    return $Exception.Message
  }
}

$formationsUrl = "$BackendBaseUrl/api/formations"

if ([string]::IsNullOrWhiteSpace($Token) -and
    -not [string]::IsNullOrWhiteSpace($LoginEmail) -and
    -not [string]::IsNullOrWhiteSpace($LoginPassword)) {
  Write-Section "Connexion (POST /api/auth/login)"
  $loginPayload = @{
    email = $LoginEmail
    motDePasse = $LoginPassword
  } | ConvertTo-Json

  try {
    $loginResponse = Invoke-RestMethod `
      -Method POST `
      -Uri "$BackendBaseUrl/api/auth/login" `
      -ContentType "application/json" `
      -Body $loginPayload

    if ($loginResponse -and $loginResponse.PSObject.Properties.Name -contains "token") {
      $Token = [string]$loginResponse.token
      Write-Host "Connexion reussie." -ForegroundColor Green
    }
  } catch {
    Write-Host "Erreur connexion: $(Resolve-ErrorMessage $_.Exception)" -ForegroundColor Red
    exit 1
  }
}

if ([string]::IsNullOrWhiteSpace($Token)) {
  Write-Host "Token manquant. Passez -Token ou bien -LoginEmail et -LoginPassword." -ForegroundColor Red
  exit 1
}

$headers = @{
  Authorization = "Bearer $Token"
}

if ($ListerSeulement) {
  Write-Section "Lecture formations (GET /api/formations)"
  try {
    $listResponse = Invoke-RestMethod -Method GET -Uri "${formationsUrl}?page=0&size=20" -Headers $headers
    $json = $listResponse | ConvertTo-Json -Depth 10
    Write-Host $json
    exit 0
  } catch {
    Write-Host "Erreur GET formations: $(Resolve-ErrorMessage $_.Exception)" -ForegroundColor Red
    exit 1
  }
}

$payload = @{
  titre = $Titre
  description = $Description
}

$jsonPayload = $payload | ConvertTo-Json -Depth 10

Write-Section "Creation formation (POST /api/formations)"
Write-Host $jsonPayload

try {
  $createResponse = Invoke-RestMethod `
    -Method POST `
    -Uri $formationsUrl `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $jsonPayload

  Write-Host "Creation OK" -ForegroundColor Green
  Write-Host ($createResponse | ConvertTo-Json -Depth 10)

  $createdId = $null
  if ($createResponse -and $createResponse.PSObject.Properties.Name -contains "id") {
    $createdId = $createResponse.id
  } elseif ($createResponse -and $createResponse.PSObject.Properties.Name -contains "formationId") {
    $createdId = $createResponse.formationId
  }

  Write-Section "Verification (GET /api/formations)"
  $listResponse = Invoke-RestMethod -Method GET -Uri "${formationsUrl}?page=0&size=20" -Headers $headers
  $json = $listResponse | ConvertTo-Json -Depth 10
  Write-Host $json

  if ($null -ne $createdId) {
    Write-Host ""
    Write-Host "Formation creee avec ID: $createdId" -ForegroundColor Green
  }
} catch {
  Write-Host "Erreur POST formation: $(Resolve-ErrorMessage $_.Exception)" -ForegroundColor Red
  exit 1
}
