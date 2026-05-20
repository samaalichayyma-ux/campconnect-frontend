param(
  [string]$Token = "",
  [string]$LoginEmail = "admin123@campconnect.com",
  [string]$LoginPassword = "admin123",
  [string]$BackendBaseUrl = "http://localhost:8082",
  [int]$PageSize = 50,
  [switch]$Appliquer,
  [switch]$SansGuide,
  [string]$RapportPath = "./formation-persist-report.json"
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

function Normalize-Text([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }
  return (($Value -replace "\s+", " ").Trim())
}

function To-IntOrNull([object]$Value) {
  try {
    if ($null -eq $Value) {
      return $null
    }
    $parsed = [int]$Value
    if ($parsed -gt 0) {
      return $parsed
    }
    return $null
  } catch {
    return $null
  }
}

function Get-FormationTitle([object]$Formation) {
  $candidates = @(
    (Normalize-Text ([string]$Formation.titre)),
    (Normalize-Text ([string]$Formation.title)),
    (Normalize-Text ([string]$Formation.nom))
  )
  foreach ($candidate in $candidates) {
    if (-not [string]::IsNullOrWhiteSpace($candidate)) {
      return $candidate
    }
  }
  $idValue = To-IntOrNull $Formation.id
  if ($idValue) {
    return "Formation #$idValue"
  }
  return "Formation"
}

function Normalize-Level([string]$RawLevel) {
  $normalized = (Normalize-Text $RawLevel).ToUpperInvariant()
  if ($normalized -eq "INTERMEDIATE" -or $normalized -eq "ADVANCED") {
    return $normalized
  }
  return "BEGINNER"
}

function Normalize-Status([string]$RawStatus) {
  $normalized = (Normalize-Text $RawStatus).ToUpperInvariant()
  if ($normalized -eq "PUBLISHED" -or $normalized -eq "ARCHIVED") {
    return $normalized
  }
  return "DRAFT"
}

function Get-DurationSlot([object]$Formation, [int]$SectionsCount) {
  $rawDurationLabel = Normalize-Text ([string]$Formation.estimatedDuration)
  if ([string]::IsNullOrWhiteSpace($rawDurationLabel)) {
    $rawDurationLabel = Normalize-Text ([string]$Formation.dureeEstimee)
  }

  $durationNumber = $null
  if (-not [string]::IsNullOrWhiteSpace($rawDurationLabel)) {
    if ($rawDurationLabel -match "(\d{1,3})") {
      $durationNumber = To-IntOrNull $matches[1]
    }
  }
  if ($null -eq $durationNumber) {
    $durationNumber = To-IntOrNull $Formation.duration
  }

  if ($durationNumber -eq 15 -or $durationNumber -eq 30 -or $durationNumber -eq 45) {
    return $durationNumber
  }

  if ($SectionsCount -ge 5) {
    return 45
  }
  if ($SectionsCount -ge 4) {
    return 30
  }
  return 15
}

function New-Section([string]$Title, [string]$Content, [string]$MediaType = "IMAGE", [string]$MediaUrl = "") {
  $section = @{
    title = (Normalize-Text $Title)
    content = (Normalize-Text $Content)
    mediaType = "IMAGE"
  }
  $mt = (Normalize-Text $MediaType).ToUpperInvariant()
  if ($mt -eq "VIDEO") {
    $section.mediaType = "VIDEO"
  }
  $mu = Normalize-Text $MediaUrl
  if (-not [string]::IsNullOrWhiteSpace($mu)) {
    $section.mediaUrl = $mu
  }
  return $section
}

function Get-SubjectBlueprint([string]$Subject, [string]$Level) {
  $cleanSubject = Normalize-Text $Subject
  if ([string]::IsNullOrWhiteSpace($cleanSubject)) {
    $cleanSubject = "Formation pratique camping"
  }
  $lower = $cleanSubject.ToLowerInvariant()

  $isTent = $lower -match "tente|piquet|mont"
  $isSafety = $lower -match "securit|incend|risque|urgence|secour"
  $isEnvironment = $lower -match "foret|environ|ecolo|nature"
  $isEquipment = $lower -match "materiel|equip|sac|lampe|rechaud"
  $isCooking = $lower -match "cuisin|repas|barbecue|alimen"
  $isReservation = $lower -match "reservation|client|accueil|disponibilite"

  if ($isTent) {
    return @{
      description = "Apprendre a monter une tente de facon simple et fiable: choix du terrain, montage progressif et verification finale de stabilite."
      objectives = @(
        "Choisir un emplacement adapte: sol plat, sec et stable.",
        "Preparer correctement le materiel avant le montage.",
        "Monter la tente dans le bon ordre avec des gestes simples.",
        "Verifier l ancrage et la securite avant utilisation."
      )
      sections = @(
        (New-Section "Choisir le terrain" "Reperez une zone plate, drainee et sans danger. Nettoyez le sol avant d installer la toile."),
        (New-Section "Preparer le materiel" "Regroupez la toile, les arceaux, les piquets et le maillet. Verifiez qu aucun element ne manque."),
        (New-Section "Monter la structure" "Assemblez les arceaux, redressez la tente puis fixez les coins progressivement."),
        (New-Section "Controler la stabilite" "Ajustez la tension des haubans et verifiez chaque point d ancrage avant validation.")
      )
      summary = "Cette formation explique une methode claire pour monter une tente en toute securite."
      quiz = @(
        @{ question = "Quel est le premier point a verifier ?"; choices = @("Le terrain", "La decoration", "La vitesse"); correctAnswer = "Le terrain" },
        @{ question = "Pourquoi fixer les coins progressivement ?"; choices = @("Pour equilibrer la tension", "Pour gagner une minute", "Pour eviter la checklist"); correctAnswer = "Pour equilibrer la tension" },
        @{ question = "Que valider en fin de montage ?"; choices = @("Ancrage et stabilite", "Couleur de la toile", "Nombre de sacs"); correctAnswer = "Ancrage et stabilite" }
      )
    }
  }

  if ($isSafety) {
    return @{
      description = "Apprendre les reflexes de securite en camping pour prevenir les incidents et reagir correctement en cas de risque."
      objectives = @(
        "Identifier les risques du terrain avant chaque activite.",
        "Organiser une zone de campement sure.",
        "Appliquer les gestes essentiels en cas d urgence.",
        "Verifier une checklist securite quotidienne."
      )
      sections = @(
        (New-Section "Identifier les risques" "Analysez la zone: feu, pente, branches fragiles, circulation et meteo."),
        (New-Section "Securiser le campement" "Definissez des zones distinctes: cuisson, repos, stockage et passage."),
        (New-Section "Reagir en urgence" "Preparez une trousse, alertez rapidement et appliquez les gestes de base."),
        (New-Section "Verification quotidienne" "Avant la nuit, controlez feu, eclairage, materiel critique et acces.")
      )
      summary = "La securite repose sur la prevention, l organisation et un controle systematique."
      quiz = @(
        @{ question = "Quel reflexe vient en premier ?"; choices = @("Identifier les risques", "Ignorer la meteo", "Changer de sujet"); correctAnswer = "Identifier les risques" },
        @{ question = "Quel outil est indispensable ?"; choices = @("Checklist securite", "Application musique", "Poster decoratif"); correctAnswer = "Checklist securite" },
        @{ question = "Que faire en cas d incident ?"; choices = @("Alerter et proteger", "Attendre sans agir", "Quitter sans informer"); correctAnswer = "Alerter et proteger" }
      )
    }
  }

  if ($isEnvironment) {
    return @{
      description = "Apprendre a camper en foret en limitant l impact sur l environnement et en respectant le site."
      objectives = @(
        "Choisir un emplacement sans degrader la vegetation.",
        "Gerer les dechets et le tri pendant le sejour.",
        "Economiser l eau et l energie sur le campement.",
        "Quitter le site propre avec une verification finale."
      )
      sections = @(
        (New-Section "Installer sans impact" "Utilisez les zones autorisees et evitez de detruire la vegetation."),
        (New-Section "Gerer les dechets" "Separez les dechets et conservez-les dans des contenants adaptes."),
        (New-Section "Limiter la consommation" "Optimisez l usage de l eau, de la lumiere et des ressources."),
        (New-Section "Controle avant depart" "Verifiez qu aucun dechet ni materiel ne reste sur place.")
      )
      summary = "Cette formation propose des gestes simples pour un camping responsable en foret."
      quiz = @(
        @{ question = "Quel principe est prioritaire ?"; choices = @("Laisser le site propre", "Laisser du materiel", "Bruler les dechets"); correctAnswer = "Laisser le site propre" },
        @{ question = "Comment reduire l impact ?"; choices = @("Tri et consommation maitrisee", "Eclairage permanent", "Aucune verification"); correctAnswer = "Tri et consommation maitrisee" },
        @{ question = "Que faire avant de partir ?"; choices = @("Controle final du site", "Ignorer la zone", "Reporter au lendemain"); correctAnswer = "Controle final du site" }
      )
    }
  }

  if ($isEquipment) {
    return @{
      description = "Apprendre a preparer le materiel de camping pour eviter les oublis et rester efficace sur le terrain."
      objectives = @(
        "Lister le materiel indispensable selon le sejour.",
        "Construire une checklist claire et utilisable.",
        "Organiser le rangement pour un acces rapide.",
        "Verifier l etat du materiel critique."
      )
      sections = @(
        (New-Section "Lister les besoins" "Definissez les besoins selon la duree, la meteo et le type de terrain."),
        (New-Section "Construire la checklist" "Classez le materiel par categorie pour simplifier la preparation."),
        (New-Section "Optimiser le rangement" "Placez les elements frequents en acces direct et equilibrez les charges."),
        (New-Section "Verifier avant depart" "Testez le materiel de securite et controlez l etat des equipements.")
      )
      summary = "Une preparation methodique du materiel limite les oublis et augmente la securite."
      quiz = @(
        @{ question = "Quel outil evite les oublis ?"; choices = @("Checklist", "Memoire seule", "Improvisation"); correctAnswer = "Checklist" },
        @{ question = "Pourquoi verifier le materiel ?"; choices = @("Pour eviter les pannes terrain", "Pour perdre du temps", "Sans raison"); correctAnswer = "Pour eviter les pannes terrain" },
        @{ question = "Quel critere de rangement est utile ?"; choices = @("Acces rapide", "Ordre aleatoire", "Poids maximal"); correctAnswer = "Acces rapide" }
      )
    }
  }

  if ($isCooking) {
    return @{
      description = "Apprendre a cuisiner en camping avec une methode simple: hygiene, securite et organisation."
      objectives = @(
        "Installer une zone de cuisson sure.",
        "Conserver les aliments dans de bonnes conditions.",
        "Realiser des cuissons simples avec peu de materiel.",
        "Nettoyer et fermer correctement le poste cuisine."
      )
      sections = @(
        (New-Section "Installer la zone cuisine" "Choisissez un espace stable, ventile et eloigne de la tente."),
        (New-Section "Preparer les aliments" "Organisez les ingredients et respectez la chaine du froid."),
        (New-Section "Cuisson pratique" "Adaptez la flamme et surveillez la cuisson a chaque etape."),
        (New-Section "Nettoyage final" "Nettoyez les ustensiles et verifiez qu aucune source chaude ne reste active.")
      )
      summary = "Cette formation aide a cuisiner en camping de facon sure et efficace."
      quiz = @(
        @{ question = "Quel point est essentiel avant cuisson ?"; choices = @("Zone stable et sure", "Flamme forte immediate", "Aucune preparation"); correctAnswer = "Zone stable et sure" },
        @{ question = "Pourquoi respecter la chaine du froid ?"; choices = @("Eviter les risques alimentaires", "Gagner du style", "Sans utilite"); correctAnswer = "Eviter les risques alimentaires" },
        @{ question = "Que faire en fin de repas ?"; choices = @("Nettoyage et verification", "Laisser allume", "Partir direct"); correctAnswer = "Nettoyage et verification" }
      )
    }
  }

  if ($isReservation) {
    return @{
      description = "Apprendre a gerer une reservation camping de facon fiable: verification des besoins, comparaison et confirmation."
      objectives = @(
        "Clarifier les besoins du client avant confirmation.",
        "Verifier disponibilite, services et conditions.",
        "Comparer les options selon des criteres clairs.",
        "Valider la reservation avec un recapitulatif fiable."
      )
      sections = @(
        (New-Section "Analyser la demande" "Recueillez les besoins: date, budget, capacite et attentes du client."),
        (New-Section "Verifier les conditions" "Controlez disponibilite, regles du site et services inclus."),
        (New-Section "Comparer les options" "Presentez les alternatives avec avantages, limites et couts."),
        (New-Section "Confirmer la reservation" "Envoyez un recapitulatif complet et validez les informations finales.")
      )
      summary = "Une reservation reussie repose sur la verification, la transparence et la validation finale."
      quiz = @(
        @{ question = "Quelle etape vient en premier ?"; choices = @("Analyser la demande", "Confirmer sans verifier", "Ignorer le budget"); correctAnswer = "Analyser la demande" },
        @{ question = "Que faut-il verifier ?"; choices = @("Disponibilite et conditions", "Seulement le prix", "Rien"); correctAnswer = "Disponibilite et conditions" },
        @{ question = "Comment finaliser ?"; choices = @("Recapitulatif fiable", "Validation orale vague", "Sans trace"); correctAnswer = "Recapitulatif fiable" }
      )
    }
  }

  return @{
    description = "Apprendre $cleanSubject avec une methode terrain simple: preparation, execution, controle et validation finale."
    objectives = @(
      "Preparer le contexte terrain avant de commencer.",
      "Executer l action en etapes courtes et logiques.",
      "Verifier la securite et la qualite du resultat.",
      "Valider avec une checklist claire."
    )
    sections = @(
      (New-Section "Preparation" "Verifier terrain, meteo et materiel avant de commencer."),
      (New-Section "Mise en pratique" "Executer l action dans le bon ordre, sans sauter les controles."),
      (New-Section "Controle" "Verifier la stabilite, la securite et corriger les points faibles."),
      (New-Section "Validation finale" "Completer la checklist finale et confirmer le resultat.")
    )
    summary = "Cette formation propose une progression claire, pratique et orientee terrain."
    quiz = @(
      @{ question = "Quelle est la premiere etape ?"; choices = @("Preparation", "Validation", "Aucune"); correctAnswer = "Preparation" },
      @{ question = "Pourquoi controler le resultat ?"; choices = @("Assurer qualite et securite", "Perdre du temps", "Sans utilite"); correctAnswer = "Assurer qualite et securite" },
      @{ question = "Quel outil final utiliser ?"; choices = @("Checklist", "Supposition", "Hasard"); correctAnswer = "Checklist" }
    )
  }
}

function Parse-SectionsFromContent([string]$Content) {
  $lines = @()
  if (-not [string]::IsNullOrWhiteSpace($Content)) {
    $lines = $Content -replace "`r", "`n" -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_.Length -gt 0 }
  }

  $sections = @()
  foreach ($line in $lines) {
    if ($line -match "^@media\[(IMAGE|VIDEO)\]\s*=\s*(.+)$") {
      if ($sections.Count -gt 0) {
        $last = $sections[$sections.Count - 1]
        $last.mediaType = $matches[1].ToUpperInvariant()
        $last.mediaUrl = (Normalize-Text $matches[2])
      }
      continue
    }

    if ($line -match "^([^:.-]{3,})\s*[:.-]\s*(.+)$") {
      $sections += (New-Section $matches[1] $matches[2])
      continue
    }

    $sections += (New-Section ("Etape " + ($sections.Count + 1)) $line)
  }

  return $sections | Where-Object { -not [string]::IsNullOrWhiteSpace($_.content) }
}

function Get-Existing-Objectives([object]$Formation) {
  $raw = @()
  if ($Formation.objectives) { $raw += $Formation.objectives }
  if ($Formation.objectifs) { $raw += $Formation.objectifs }

  $normalized = @()
  foreach ($item in $raw) {
    $clean = Normalize-Text ([string]$item)
    if (-not [string]::IsNullOrWhiteSpace($clean)) {
      $normalized += $clean
    }
  }
  return $normalized
}

function Get-Existing-Sections([object]$Formation) {
  $sections = @()
  if ($Formation.sections -and $Formation.sections.Count -gt 0) {
    foreach ($section in $Formation.sections) {
      $title = Normalize-Text ([string]$section.title)
      $content = Normalize-Text ([string]$section.content)
      if (-not [string]::IsNullOrWhiteSpace($content)) {
        $sections += (New-Section $title $content ([string]$section.mediaType) ([string]$section.mediaUrl))
      }
    }
  }

  if ($sections.Count -eq 0) {
    $contentRaw = Normalize-Text ([string]$Formation.content)
    if ([string]::IsNullOrWhiteSpace($contentRaw)) {
      $contentRaw = Normalize-Text ([string]$Formation.contenu)
    }
    if (-not [string]::IsNullOrWhiteSpace($contentRaw)) {
      $sections = Parse-SectionsFromContent $contentRaw
    }
  }

  return $sections
}

function Merge-With-Minimum([array]$Existing, [array]$Fallback, [int]$Minimum) {
  $merged = @()
  $seen = New-Object System.Collections.Generic.HashSet[string]

  foreach ($candidate in @($Existing + $Fallback)) {
    if ($null -eq $candidate) {
      continue
    }
    $text = Normalize-Text ([string]$candidate)
    if ([string]::IsNullOrWhiteSpace($text)) {
      continue
    }
    $key = $text.ToLowerInvariant()
    if ($seen.Add($key)) {
      $merged += $text
    }
  }

  if ($merged.Count -lt $Minimum) {
    foreach ($fallbackItem in $Fallback) {
      $text = Normalize-Text ([string]$fallbackItem)
      if ([string]::IsNullOrWhiteSpace($text)) {
        continue
      }
      $key = $text.ToLowerInvariant()
      if ($seen.Add($key)) {
        $merged += $text
      }
      if ($merged.Count -ge $Minimum) {
        break
      }
    }
  }

  return $merged
}

function Merge-Sections-With-Minimum([array]$Existing, [array]$Fallback, [int]$Minimum) {
  $merged = @()
  $seen = New-Object System.Collections.Generic.HashSet[string]

  foreach ($candidate in @($Existing + $Fallback)) {
    if ($null -eq $candidate) {
      continue
    }
    $title = Normalize-Text ([string]$candidate.title)
    $content = Normalize-Text ([string]$candidate.content)
    if ([string]::IsNullOrWhiteSpace($content)) {
      continue
    }
    if ([string]::IsNullOrWhiteSpace($title)) {
      $title = "Etape " + ($merged.Count + 1)
    }
    $key = ($title + "||" + $content).ToLowerInvariant()
    if ($seen.Add($key)) {
      $merged += (New-Section $title $content ([string]$candidate.mediaType) ([string]$candidate.mediaUrl))
    }
  }

  while ($merged.Count -lt $Minimum -and $merged.Count -lt $Fallback.Count) {
    $candidate = $Fallback[$merged.Count]
    $merged += (New-Section ([string]$candidate.title) ([string]$candidate.content) ([string]$candidate.mediaType) ([string]$candidate.mediaUrl))
  }

  for ($i = 0; $i -lt $merged.Count; $i++) {
    if ([string]::IsNullOrWhiteSpace((Normalize-Text ([string]$merged[$i].title)))) {
      $merged[$i].title = "Etape " + ($i + 1)
    }
  }

  return $merged
}

function Build-ContentFromSections([array]$Sections) {
  $lines = @()
  foreach ($section in $Sections) {
    $lines += ((Normalize-Text ([string]$section.title)) + ": " + (Normalize-Text ([string]$section.content)))
    if ($section.mediaUrl) {
      $mediaType = (Normalize-Text ([string]$section.mediaType)).ToUpperInvariant()
      if ($mediaType -ne "VIDEO") {
        $mediaType = "IMAGE"
      }
      $lines += ("@media[" + $mediaType + "]=" + (Normalize-Text ([string]$section.mediaUrl)))
    }
  }
  return ($lines -join "`n")
}

function Build-GuideSteps([int]$FormationId, [array]$Sections) {
  $guideSteps = @()
  $order = 1
  foreach ($section in $Sections) {
    $title = Normalize-Text ([string]$section.title)
    if ([string]::IsNullOrWhiteSpace($title)) {
      $title = "Etape $order"
    }
    $description = Normalize-Text ([string]$section.content)
    $step = @{
      id = "guide-$FormationId-$order"
      formationId = $FormationId
      order = $order
      title = $title
      description = $description
    }
    $mediaType = (Normalize-Text ([string]$section.mediaType)).ToUpperInvariant()
    $mediaUrl = Normalize-Text ([string]$section.mediaUrl)
    if (-not [string]::IsNullOrWhiteSpace($mediaUrl)) {
      if ($mediaType -eq "VIDEO") {
        $step.videoUrl = $mediaUrl
      } else {
        $step.imageUrl = $mediaUrl
      }
    }
    $guideSteps += $step
    $order += 1
  }
  return $guideSteps
}

function Try-SaveGuideSteps([int]$FormationId, [array]$GuideSteps, [hashtable]$Headers, [string]$BackendBaseUrl) {
  $candidates = @(
    @{ method = "POST"; url = "$BackendBaseUrl/api/formations/$FormationId/guide" },
    @{ method = "PUT";  url = "$BackendBaseUrl/api/formations/$FormationId/guide" },
    @{ method = "POST"; url = "$BackendBaseUrl/api/formations/$FormationId/guide/steps" },
    @{ method = "PUT";  url = "$BackendBaseUrl/api/guides/formations/$FormationId/steps" },
    @{ method = "POST"; url = "$BackendBaseUrl/api/guides/formations/$FormationId/steps" },
    @{ method = "PUT";  url = "$BackendBaseUrl/api/guides/formation/$FormationId/steps" },
    @{ method = "POST"; url = "$BackendBaseUrl/api/guides/formation/$FormationId/steps" }
  )

  $payload = @{
    formationId = $FormationId
    steps = $GuideSteps
  }
  $json = $payload | ConvertTo-Json -Depth 20

  foreach ($candidate in $candidates) {
    try {
      Invoke-RestMethod -Method $candidate.method -Uri $candidate.url -Headers $Headers -ContentType "application/json" -Body $json | Out-Null
      return @{
        ok = $true
        message = "$($candidate.method) $($candidate.url)"
      }
    } catch {
      $lastError = Resolve-ErrorMessage $_.Exception
      continue
    }
  }

  return @{
    ok = $false
    message = $lastError
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

Write-Section "Chargement des formations"
$page = 0
$allFormations = @()
while ($true) {
  $pageUrl = "${formationsUrl}?page=${page}&size=${PageSize}"
  try {
    $response = Invoke-RestMethod -Method GET -Uri $pageUrl -Headers $headers
  } catch {
    Write-Host "Erreur GET formations page ${page}: $(Resolve-ErrorMessage $_.Exception)" -ForegroundColor Red
    exit 1
  }

  $items = @()
  if ($response -is [System.Array]) {
    $items = $response
  } elseif ($response.content) {
    $items = $response.content
  } elseif ($response.items) {
    $items = $response.items
  }

  if ($items.Count -eq 0) {
    break
  }

  $allFormations += $items

  if ($response.last -eq $true) {
    break
  }
  if ($items.Count -lt $PageSize) {
    break
  }
  $page += 1
}

Write-Host ("Formations trouvees: " + $allFormations.Count) -ForegroundColor Yellow

$report = @()
$updatedCount = 0
$skippedCount = 0
$guideSavedCount = 0

foreach ($formation in $allFormations) {
  $id = To-IntOrNull $formation.id
  if (-not $id) {
    continue
  }

  $title = Get-FormationTitle $formation
  $level = Normalize-Level ([string]$formation.level)
  $rawStatus = Normalize-Text ([string]$formation.status)
  if ([string]::IsNullOrWhiteSpace($rawStatus)) {
    $rawStatus = Normalize-Text ([string]$formation.statut)
  }
  $status = Normalize-Status $rawStatus

  $blueprint = Get-SubjectBlueprint $title $level
  $existingObjectives = Get-Existing-Objectives $formation
  $existingSections = Get-Existing-Sections $formation

  $finalObjectives = Merge-With-Minimum $existingObjectives $blueprint.objectives 3
  $finalSections = Merge-Sections-With-Minimum $existingSections $blueprint.sections 4

  $existingDescription = Normalize-Text ([string]$formation.description)
  $finalDescription = $existingDescription
  if ([string]::IsNullOrWhiteSpace($finalDescription) -or $finalDescription.Length -lt 30) {
    $finalDescription = $blueprint.description
  }

  $existingSummary = Normalize-Text ([string]$formation.summary)
  if ([string]::IsNullOrWhiteSpace($existingSummary)) {
    $existingSummary = Normalize-Text ([string]$formation.resume)
  }
  $finalSummary = $existingSummary
  if ([string]::IsNullOrWhiteSpace($finalSummary) -or $finalSummary.Length -lt 25) {
    $finalSummary = $blueprint.summary
  }

  $existingQuiz = @()
  if ($formation.quiz) {
    $existingQuiz = $formation.quiz
  }
  $finalQuiz = $existingQuiz
  if ($null -eq $finalQuiz -or $finalQuiz.Count -lt 3) {
    $finalQuiz = $blueprint.quiz
  }

  $durationSlot = Get-DurationSlot $formation $finalSections.Count
  $durationLabel = "$durationSlot minutes"

  $mainImage = Normalize-Text ([string]$formation.coverImageUrl)
  if ([string]::IsNullOrWhiteSpace($mainImage)) { $mainImage = Normalize-Text ([string]$formation.imagePrincipale) }
  if ([string]::IsNullOrWhiteSpace($mainImage)) { $mainImage = Normalize-Text ([string]$formation.imageUrl) }
  if ([string]::IsNullOrWhiteSpace($mainImage)) { $mainImage = Normalize-Text ([string]$formation.photoUrl) }

  $mainVideo = Normalize-Text ([string]$formation.coverVideoUrl)
  if ([string]::IsNullOrWhiteSpace($mainVideo)) { $mainVideo = Normalize-Text ([string]$formation.videoPrincipale) }
  if ([string]::IsNullOrWhiteSpace($mainVideo)) { $mainVideo = Normalize-Text ([string]$formation.videoUrl) }

  $content = Build-ContentFromSections $finalSections

  $payload = @{
    titre = $title
    title = $title
    nom = $title
    description = $finalDescription
    content = $content
    contenu = $content
    objectives = $finalObjectives
    objectifs = $finalObjectives
    sections = $finalSections
    summary = $finalSummary
    resume = $finalSummary
    level = $level
    niveau = $level
    estimatedDuration = $durationLabel
    dureeEstimee = $durationLabel
    duration = $durationSlot
    quiz = $finalQuiz
    status = $status
    statut = $status
    generatedByAi = $true
    aiGenerated = $true
  }

  if (-not [string]::IsNullOrWhiteSpace($mainImage)) {
    $payload.coverImageUrl = $mainImage
    $payload.imagePrincipale = $mainImage
    $payload.imageUrl = $mainImage
    $payload.photoUrl = $mainImage
  }
  if (-not [string]::IsNullOrWhiteSpace($mainVideo)) {
    $payload.coverVideoUrl = $mainVideo
    $payload.videoPrincipale = $mainVideo
    $payload.videoUrl = $mainVideo
  }

  $guideSteps = Build-GuideSteps $id $finalSections

  $updateResult = @{
    ok = $true
    message = "Simulation"
  }
  $guideResult = @{
    ok = $false
    message = "Non execute"
  }

  if ($Appliquer) {
    $updateUrl = "$formationsUrl/$id"
    $jsonPayload = $payload | ConvertTo-Json -Depth 30
    try {
      Invoke-RestMethod -Method PUT -Uri $updateUrl -Headers $headers -ContentType "application/json" -Body $jsonPayload | Out-Null
      $updatedCount += 1
      $updateResult = @{
        ok = $true
        message = "PUT $updateUrl"
      }
    } catch {
      $updateResult = @{
        ok = $false
        message = Resolve-ErrorMessage $_.Exception
      }
    }

    if (-not $SansGuide -and $updateResult.ok) {
      $guideResult = Try-SaveGuideSteps $id $guideSteps $headers $BackendBaseUrl
      if ($guideResult.ok) {
        $guideSavedCount += 1
      }
    }
  } else {
    $skippedCount += 1
  }

  $report += [ordered]@{
    id = $id
    titre = $title
    level = $level
    status = $status
    objectifsCount = $finalObjectives.Count
    sectionsCount = $finalSections.Count
    guideStepsCount = $guideSteps.Count
    updateOk = $updateResult.ok
    updateMessage = $updateResult.message
    guideOk = $guideResult.ok
    guideMessage = $guideResult.message
  }

  $tag = if ($updateResult.ok) { "OK" } else { "KO" }
  Write-Host ("[" + $tag + "] Formation " + $id + " -> " + $title) -ForegroundColor $(if ($updateResult.ok) { "Green" } else { "Red" })
}

$summary = [ordered]@{
  mode = $(if ($Appliquer) { "APPLY" } else { "DRY_RUN" })
  totalFormations = $allFormations.Count
  updatesApplied = $updatedCount
  dryRunCount = $skippedCount
  guideSaved = $guideSavedCount
  timestamp = (Get-Date).ToString("s")
  items = $report
}

$summaryJson = $summary | ConvertTo-Json -Depth 20

Write-Section "Resume"
Write-Host $summaryJson

try {
  Set-Content -Path $RapportPath -Value $summaryJson -Encoding UTF8
  Write-Host ("Rapport ecrit: " + $RapportPath) -ForegroundColor Yellow
} catch {
  Write-Host ("Impossible d ecrire le rapport: " + $_.Exception.Message) -ForegroundColor Red
}
