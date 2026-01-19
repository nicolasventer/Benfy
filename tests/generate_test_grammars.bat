@echo off
setlocal enabledelayedexpansion

for %%F in ("%~dp0grammars\*.bf") do (
  bun "%~dp0..\index.ts" "%%~fF"
  if errorlevel 1 (
    echo bun failed for %%~fF
    goto :end
  )
)

:end
