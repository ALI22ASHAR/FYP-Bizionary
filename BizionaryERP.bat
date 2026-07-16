@echo off
title Bizionary ERP Launcher
echo Starting Bizionary ERP Desktop Server...

:: Start the server executable in a minimized background shell
start /min "" "%~dp0BizionaryERP.exe"

:: Wait 3 seconds for the server to spin up
timeout /t 3 /nobreak > NUL

:: Open default web browser to the ERP login page
echo Opening browser...
start http://127.0.0.1:8000

echo Application launched. To stop the server, close the minimized console window.
