$env:Path = "C:\Program Files\nodejs;" + $env:Path
Set-Location -Path "client"
& "C:\Program Files\nodejs\npm.cmd" run build
