$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== Starting WORDLY Update ===" -ForegroundColor Cyan

# 1. Check Git status
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    exit
}

# 2. Add files to stage
Write-Host "1. Adding files..." -ForegroundColor Green
git add .

# 3. Create commit
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$commitMessage = "Update site content ($timestamp)"

Write-Host "2. Creating commit: '$commitMessage'..." -ForegroundColor Green
git commit -m "$commitMessage"

# 4. Push to main
Write-Host "3. Pushing to GitHub Pages..." -ForegroundColor Green
git push origin main

Write-Host "=== SUCCESS! Site updated ===" -ForegroundColor Cyan

