param(
  [ValidateSet("block", "restore")]
  [string]$Action,

  [string]$DomainsBase64 = "",
  [string]$BackupDir,
  [string]$ResultPath,
  [string]$Marker = "FOCUS-JIEJIE",
  [string]$SessionId = "manual"
)

$ErrorActionPreference = "Stop"

function Write-JsonResult {
  param([hashtable]$Payload)

  $json = $Payload | ConvertTo-Json -Depth 5
  [System.IO.File]::WriteAllText($ResultPath, $json, [System.Text.UTF8Encoding]::new($false))
}

function Get-LineEnding {
  param([string]$Content)

  if ($Content.Contains("`r`n")) {
    return "`r`n"
  }

  return "`n"
}

function Remove-ManagedBlock {
  param(
    [string]$Content,
    [string]$MarkerValue
  )

  $escapedMarker = [regex]::Escape($MarkerValue)
  $pattern = "(?s)(?:\r?\n)?# BEGIN $escapedMarker.*?# END $escapedMarker(?:\r?\n)?"
  return [regex]::Replace($Content, $pattern, "`n").TrimEnd()
}

try {
  $hostsPath = Join-Path $env:SystemRoot "System32\drivers\etc\hosts"

  if (-not (Test-Path $hostsPath)) {
    throw "hosts file not found: $hostsPath"
  }

  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
  $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ss-fffZ")
  $backupPath = Join-Path $BackupDir "hosts.$timestamp.bak"
  Copy-Item -LiteralPath $hostsPath -Destination $backupPath -Force

  $content = [System.IO.File]::ReadAllText($hostsPath, [System.Text.Encoding]::UTF8)
  $lineEnding = Get-LineEnding $content
  $stripped = Remove-ManagedBlock -Content $content -MarkerValue $Marker
  $next = $stripped

  if ($Action -eq "block") {
    $domainJson = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($DomainsBase64))
    $domains = @($domainJson | ConvertFrom-Json)

    if ($domains.Count -eq 0) {
      throw "no domains to block"
    }

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("# BEGIN $Marker")
    $lines.Add("# Managed by Focus Jiejie. Delete this block or use Restore inside the app to unblock.")
    $lines.Add("# Session: $SessionId")
    $lines.Add("# UpdatedAt: $((Get-Date).ToUniversalTime().ToString("o"))")

    foreach ($domain in $domains) {
      $lines.Add("127.0.0.1 $domain")
    }

    $lines.Add("# END $Marker")
    $block = [string]::Join($lineEnding, $lines)
    $next = $stripped.TrimEnd() + $lineEnding + $lineEnding + $block + $lineEnding
  }
  else {
    if ($stripped.Length -gt 0) {
      $next = $stripped + $lineEnding
    }
    else {
      $next = ""
    }
  }

  [System.IO.File]::WriteAllText($hostsPath, $next, [System.Text.UTF8Encoding]::new($false))
  $dnsOutput = ipconfig /flushdns | Out-String

  Write-JsonResult @{
    ok = $true
    action = $Action
    changed = ($content -ne $next)
    backupPath = $backupPath
    dns = @{
      ok = $true
      stdout = $dnsOutput
      stderr = ""
    }
  }
}
catch {
  try {
    Write-JsonResult @{
      ok = $false
      action = $Action
      error = $_.Exception.Message
    }
  }
  catch {
  }

  exit 1
}
