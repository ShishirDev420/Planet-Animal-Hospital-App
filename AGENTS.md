# User Preferences

- **Preferred browser:** Chrome (`chrome.exe`)
- **Default preview:** Always use the customized mobile preview via `MobilePreview.tsx`
- **Preview URL pattern:** `http://localhost:3000/preview?path=/&demo_mode=true&device=samsung-s26-ultra`

## Dev Server Start Command

Always use `Start-Job` to start the dev server — never run vite directly with a timeout, as the process gets killed when the shell times out.

```powershell
Start-Job -Name "vite-dev" -ArgumentList (Get-Location).Path -ScriptBlock { param($dir); Set-Location $dir; & "C:\Program Files\nodejs\node.exe" ".\node_modules\vite\bin\vite.js" --port=3000 --host=0.0.0.0 } | Out-Null; Start-Sleep -Seconds 4; Get-Job -Name "vite-dev" | Select-Object Name, State
```

After server is confirmed running, open Chrome:
```powershell
Start-Process "chrome.exe" -ArgumentList "http://localhost:3000/preview?path=/&demo_mode=true&device=samsung-s26-ultra"
```