@echo off
setlocal
set R=%~dp0..
where python >nul 2>&1 || (echo [DEPENDENCY] Python 3 not found.&exit /b 2)
python "%R%build-tools\build.py" %*
exit /b %ERRORLEVEL%
