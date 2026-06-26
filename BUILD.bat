@echo off
echo Gerando build de producao...
set PATH=C:\NODE\node-v22.13.1-win-x64;%PATH%
cd /d "%~dp0"
npm run build
echo.
echo Build concluido! Pasta dist/ pronta para deploy.
pause
