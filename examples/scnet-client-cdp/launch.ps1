# 带调试端口启动 SCNet 客户端（解决“双击没反应”的单实例锁问题）
# 用法：在 Windows 上右键“用 PowerShell 运行”，或 powershell -ExecutionPolicy Bypass -File launch.ps1
param(
  [string]$Exe = 'D:\AppData\scnet-client\计算服务.exe',
  [int]$Port = 9223,
  [switch]$CreateShortcut,
  [switch]$NoKill
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Exe)) { Write-Error "找不到客户端：$Exe"; exit 1 }

# 1) 清掉占单实例锁的旧实例（否则新实例会转交参数后自己退出 → 看不到窗口）
if (-not $NoKill) {
  Get-Process -Name '计算服务' -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "停止旧实例 pid=$($_.Id)"
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 2
}

# 2) 带调试端口启动（窗口照常出现）
$argList = "--remote-debugging-port=$Port --remote-allow-origins=*"
Start-Process -FilePath $Exe -ArgumentList $argList | Out-Null
Write-Host "已启动：$Exe $argList"

# 3) 可选：桌面快捷方式（以后双击即可，窗口+调试口两全）
if ($CreateShortcut) {
  $ws = New-Object -ComObject WScript.Shell
  $lnkPath = Join-Path ([Environment]::GetFolderPath('Desktop')) 'SCNet (可被澪控制).lnk'
  $lnk = $ws.CreateShortcut($lnkPath)
  $lnk.TargetPath = $Exe
  $lnk.Arguments = $argList
  $lnk.WorkingDirectory = Split-Path $Exe
  $lnk.Description = '打开 SCNet 客户端（带 CDP 调试口）'
  $lnk.Save()
  Write-Host "快捷方式已创建：$lnkPath"
}

# 4) 等端口就绪并自检
Start-Sleep -Seconds 6
$r = $null; try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 6 "http://127.0.0.1:$Port/json/version" } catch {}
if ($r -and $r.Content -match 'Chrome/') { Write-Host "OK: $Port 已监听且可访问" }
else { Write-Warning "端口 $Port 未就绪：客户端可能仍在加载，或该版本忽略调试参数" }
