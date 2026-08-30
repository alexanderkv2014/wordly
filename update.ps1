# update.ps1 — Скрипт автоматического обновления курса и тестов на GitHub

Write-Host "=== Запуск обновления сайта WORDLY ===" -ForegroundColor Cyan

# 1. Проверяем статус Git
$status = git status --porcelain
if (-not $status) {
    Write-Host "Нет новых изменений для отправки." -ForegroundColor Yellow
    exit
}

# 2. Индексируем все измененные файлы
Write-Host "1. Добавление файлов в индекс..." -ForegroundColor Green
git add .

# 3. Создаем коммит с меткой времени
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$commitMessage = "Update grammar modules, tests and UTF-8 fixes ($timestamp)"

Write-Host "2. Создание коммита: '$commitMessage'..." -ForegroundColor Green
git commit -m "$commitMessage"

# 4. Отправляем изменения в ветку main
Write-Host "3. Отправка изменений на GitHub Pages..." -ForegroundColor Green
git push origin main

Write-Host "=== Успешно! Обновления отправлены на сайт ===" -ForegroundColor Cyan