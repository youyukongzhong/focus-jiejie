$projectRoot = Split-Path -Parent $PSScriptRoot

Start-Process -FilePath "npm.cmd" `
  -ArgumentList "start" `
  -WorkingDirectory $projectRoot `
  -Verb RunAs
