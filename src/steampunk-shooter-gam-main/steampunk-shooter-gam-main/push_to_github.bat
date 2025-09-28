@echo off
echo Pushing Steampunk Shooter Game to GitHub...
echo.

REM Initialize git repository
git init

REM Add all files
git add .

REM Create initial commit
git commit -m "Initial commit: Steampunk shooter game with mobile controls and UI improvements"

REM Add remote repository
git remote add origin https://github.com/IamSoham2006/steampunk-shooter-gam.git

REM Set main branch and push
git branch -M main
git push -u origin main

echo.
echo Done! Your project should now be on GitHub.
echo Visit: https://github.com/IamSoham2006/steampunk-shooter-gam
pause