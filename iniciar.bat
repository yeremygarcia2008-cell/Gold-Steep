@echo off
title Parra es Hermoso - Servidor de Joyeria
color 0A
echo.
echo  ========================================
echo    PARRA ES HERMOSO - Panel de Joyeria
echo  ========================================
echo.
echo  Iniciando servidor...
echo.
cd /d "%~dp0"
node server.js
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: No se pudo iniciar el servidor.
    echo  Asegurate de tener Node.js instalado.
    echo  Descarga desde: https://nodejs.org
    echo.
)
pause
