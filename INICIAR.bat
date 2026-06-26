@echo off
echo Iniciando Plataforma de Expositores - Perfil Refrigeracao...
set PATH=C:\NODE\node-v22.13.1-win-x64;%PATH%
cd /d "%~dp0"
npm run dev
pause
