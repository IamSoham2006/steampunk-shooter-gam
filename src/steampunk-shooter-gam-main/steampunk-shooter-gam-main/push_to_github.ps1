# Push Steampunk Shooter Game to GitHub
Write-Host "Pushing Steampunk Shooter Game to GitHub..." -ForegroundColor Green
Write-Host ""

try {
    # Initialize git repository
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init

    # Add all files
    Write-Host "Adding files..." -ForegroundColor Yellow
    git add .

    # Create initial commit
    Write-Host "Creating initial commit..." -ForegroundColor Yellow
    git commit -m "Initial commit: Steampunk shooter game with mobile controls and UI improvements"

    # Add remote repository
    Write-Host "Adding remote repository..." -ForegroundColor Yellow
    git remote add origin https://github.com/IamSoham2006/steampunk-shooter-gam.git

    # Set main branch and push
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git branch -M main
    git push -u origin main

    Write-Host ""
    Write-Host "Success! Your project is now on GitHub." -ForegroundColor Green
    Write-Host "Visit: https://github.com/IamSoham2006/steampunk-shooter-gam" -ForegroundColor Cyan
}
catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure Git is installed. If not, run:" -ForegroundColor Yellow
    Write-Host "winget install --id Git.Git -e --source winget" -ForegroundColor White
}

Read-Host "Press Enter to continue"