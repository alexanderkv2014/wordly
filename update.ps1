# Обновление стилей и верстки

$styleCss = @'
:root {
  --bg-color: #0d0f17;
  --card-bg: #161922;
  --text-main: #ffffff;
  --text-sub: #8e95a5;
  --accent-blue: #5b7fff;
  --accent-red: #ff5252;
  --accent-green: #2ecc71;
  --border-color: #232734;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

body {
  background-color: var(--bg-color);
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 90px;
}

/* Карточки и отступы */
.study-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 10px 0;
}

.card-container {
  width: 100%;
  max-width: 360px;
  height: 380px;
  perspective: 1000px;
  margin-bottom: 20px; /* Отступ от кнопок "Знаю / Не знаю" */
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  cursor: pointer;
}

.card-container.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  background-color: var(--card-bg);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  border: 1px solid var(--border-color);
}

.card-back {
  transform: rotateY(180deg);
}

.card-term {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
}

.card-definition {
  font-size: 24px;
  color: var(--accent-blue);
}

.hint-text {
  font-size: 14px;
  color: var(--text-sub);
  margin-top: 12px;
}

.study-actions {
  display: flex;
  gap: 16px;
  width: 100%;
  max-width: 360px;
  margin-top: 10px;
}

.btn-know-bad, .btn-know-good {
  flex: 1;
  padding: 16px;
  border-radius: 14px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.btn-know-bad {
  background-color: rgba(255, 82, 82, 0.15);
  color: var(--accent-red);
}

.btn-know-good {
  background-color: rgba(46, 204, 113, 0.15);
  color: var(--accent-green);
}

/* Меню Настроек и Профиля */
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background-color: var(--card-bg);
  border-radius: 16px;
  overflow: hidden;
  margin-top: 16px;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-title {
  font-size: 16px;
  font-weight: 500;
}

.settings-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-value {
  font-size: 14px;
  color: var(--text-sub);
}

.chevron {
  color: var(--text-sub);
  font-size: 18px;
}

/* Нижняя навигация */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: #11131c;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid var(--border-color);
  padding-bottom: 10px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  color: var(--text-sub);
  font-size: 11px;
  cursor: pointer;
  gap: 4px;
}

.nav-item.active {
  color: var(--accent-blue);
}

.nav-icon {
  font-size: 20px;
}
'@

$htmlContent = @'
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Wordly</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <section id="tab-home" class="tab-content active">
    <header class="app-header">
      <div class="brand-title">
        <span class="small-tag">WORDLY</span>
        <h1>Мой набор</h1>
      </div>
      <button class="profile-avatar" id="open-profile-btn" aria-label="Профиль">A</button>
    </header>
    <main class="content-scroll">
      <div class="menu-list">
        <div class="menu-item" onclick="startStudy('cards')">
          <div class="menu-icon icon-blue">🎴</div>
          <div class="menu-info">
            <div class="title">Карточки</div>
            <div class="subtitle">Свайпайте и повторяйте</div>
          </div>
          <span class="chevron">›</span>
        </div>
      </div>
    </main>
  </section>

  <!-- Экран настроек с правильными отступами -->
  <section id="screen-profile" class="screen-full">
    <header class="study-header">
      <button class="btn-close" id="close-profile">✕</button>
      <span class="study-progress-text">Настройки</span>
      <div style="width: 24px;"></div>
    </header>
    <main class="content-scroll profile-body">
      <div class="settings-list">
        <div class="settings-item">
          <div class="settings-left">
            <span>◐</span>
            <span class="settings-title">Тема</span>
          </div>
          <div class="settings-right">
            <span class="settings-value">Системная</span>
            <span class="chevron">›</span>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-left">
            <span>文</span>
            <span class="settings-title">Язык приложения</span>
          </div>
          <div class="settings-right">
            <span class="settings-value">Русский</span>
            <span class="chevron">›</span>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-left">
            <span>⌫</span>
            <span class="settings-title">Сбросить прогресс</span>
          </div>
          <div class="settings-right">
            <span class="settings-value">Начать заново</span>
            <span class="chevron">›</span>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-left">
            <span>ⓘ</span>
            <span class="settings-title">О обучении</span>
          </div>
          <div class="settings-right">
            <span class="settings-value">Wordly v2.1</span>
            <span class="chevron">›</span>
          </div>
        </div>
      </div>
    </main>
  </section>

  <!-- Экран карточек -->
  <section id="screen-study" class="screen-full">
    <header class="study-header">
      <button class="btn-close" id="close-study">✕</button>
      <span class="study-progress-text" id="study-counter">1 / 10</span>
      <button class="btn-gear">⚙️</button>
    </header>
    <div class="study-body">
      <div class="card-container" id="flashcard">
        <div class="card-inner">
          <div class="card-front">
            <span class="card-term" id="card-term-text">friend</span>
            <p class="hint-text">Нажмите, чтобы показать перевод</p>
          </div>
          <div class="card-back">
            <span class="card-definition" id="card-def-text">друг</span>
          </div>
        </div>
      </div>
      <div class="study-actions">
        <button class="btn-know-bad" id="btn-know-bad">Не знаю</button>
        <button class="btn-know-good" id="btn-know-good">Знаю</button>
      </div>
    </div>
  </section>

  <!-- Нижняя панель навигации с иконкой трейдерского графика -->
  <nav class="bottom-nav">
    <button class="nav-item active" data-tab="tab-home">
      <span class="nav-icon">🏠</span>
      <span class="nav-label">Главная</span>
    </button>
    <button class="nav-item" data-tab="tab-cards">
      <span class="nav-icon">🎴</span>
      <span class="nav-label">Карточки</span>
    </button>
    <button class="nav-item" data-tab="tab-progress">
      <span class="nav-icon">📈</span>
      <span class="nav-label">Прогресс</span>
    </button>
    <button class="nav-item" data-tab="tab-profile">
      <span class="nav-icon">👤</span>
      <span class="nav-label">Профиль</span>
    </button>
  </nav>

  <script src="app.js"></script>
</body>
</html>
'@

[System.IO.File]::WriteAllText("style.css", $styleCss, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText("index.html", $htmlContent, [System.Text.Encoding]::UTF8)

git commit -am "fix layout spacing, settings list flex layout and progress icon"
git push