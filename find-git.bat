@echo off
chcp 65001 >nul
set RESULT=D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\fishing-app\git-location.txt
echo Searching for git.exe... > %RESULT%
if exist "C:\Program Files\Git\cmd\git.exe" echo FOUND: C:\Program Files\Git\cmd\git.exe >> %RESULT%
if exist "C:\Program Files (x86)\Git\cmd\git.exe" echo FOUND: C:\Program Files (x86)\Git\cmd\git.exe >> %RESULT%
if exist "C:\Users\razor\AppData\Local\Programs\Git\cmd\git.exe" echo FOUND: AppData\Local\Programs >> %RESULT%
where git >> %RESULT% 2>&1
echo Done >> %RESULT%
type %RESULT%
pause
