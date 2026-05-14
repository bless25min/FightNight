@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-preview-boot-camp.ps1"

endlocal
