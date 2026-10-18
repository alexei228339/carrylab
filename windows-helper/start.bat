@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
 where python >nul 2>nul
 if errorlevel 1 (
  echo Install Python 3 first
  pause
  exit /b 1
 )
 set "CMD=python"
) else (
 set "CMD=py -3"
)
set /p MATCH=Enter Dota 2 match ID: 
%CMD% replay_helper.py %MATCH% --unpack
pause
