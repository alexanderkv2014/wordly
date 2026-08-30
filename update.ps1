# Скрипт автоматического обновления файлов и отправки в Git с правильной кодировкой UTF8

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
        <div class="menu-item" onclick="startStudy('learn')">
          <div class="menu-icon icon-purple">☷</div>
          <div class="menu-info">
            <div class="title">Заучивание</div>
            <div class="subtitle">Пошаговое изучение слов</div>
          </div>
          <span class="chevron">›</span>
        </div>
        <div class="menu-item" onclick="startStudy('test')">
          <div class="menu-icon icon-indigo">⁛</div>
          <div class="menu-info">
            <div class="title">Тест</div>
            <div class="subtitle">Проверка знаний</div>
          </div>
          <span class="chevron">›</span>
        </div>
        <div class="menu-item" onclick="switchTab('tab-library')">
          <div class="menu-icon icon-cyan">▦</div>
          <div class="menu-info">
            <div class="title">Готовые наборы</div>
            <div class="subtitle">Слова по уровням A1–B2</div>
          </div>
          <span class="chevron">›</span>
        </div>
        <div class="menu-item" onclick="openFavorites()">
          <div class="menu-icon icon-star">★</div>
          <div class="menu-info">
            <div class="title">Избранное</div>
            <div class="subtitle">Слова, отмеченные звездой</div>
          </div>
          <span class="chevron">›</span>
        </div>
      </div>
      <button class="btn-add-word-main" id="btn-add-word">+ Добавить слово</button>
    </main>
  </section>

  <section id="tab-library" class="tab-content">
    <header class="library-header">
      <div class="header-top">
        <h1>Ваша библиотека</h1>
        <button class="icon-btn-add" id="lib-add-btn">+</button>
      </div>
      <div class="chip-group">
        <button class="chip active" data-subtab="modules">Модули</button>
        <button class="chip" data-subtab="folders">Папки</button>
      </div>
    </header>
    <main class="content-scroll">
      <div id="subtab-modules" class="subtab-content active">
        <div class="list-container" id="library-modules-list"></div>
      </div>
      <div id="subtab-folders" class="subtab-content">
        <div class="list-container" id="library-folders-list"></div>
      </div>
    </main>
  </section>

  <section id="screen-profile" class="screen-full">
    <header class="study-header">
      <button class="btn-close" id="close-profile">✕</button>
      <span class="study-progress-text">Профиль</span>
      <div style="width: 24px;"></div>
    </header>
    <main class="content-scroll profile-body">
      <div class="user-card">
        <div class="profile-avatar large">A</div>
        <h2>alexanderkv2014</h2>
        <p class="user-email">alexanderkv2014@gmail.com</p>
      </div>
      <div class="menu-list">
        <div class="menu-item" onclick="alert('Настройки открыты')">
          <div class="menu-info"><div class="title">Настройки аккаунта</div></div>
          <span class="chevron">›</span>
        </div>
      </div>
    </main>
  </section>

  <section id="screen-study" class="screen-full">
    <header class="study-header">
      <button class="btn-close" id="close-study">✕</button>
      <span class="study-progress-text" id="study-counter">1 / 10</span>
      <button class="btn-gear">⚙️</button>
    </header>
    <div class="study-body">
      <div class="card-container" id="flashcard">
        <div class="card-inner">
          <div class="card-front"><span class="card-term" id="card-term-text">Term</span></div>
          <div class="card-back"><span class="card-definition" id="card-def-text">Definition</span></div>
        </div>
      </div>
    </div>
    <footer class="study-footer">
      <p class="hint-text">Коснитесь карточки, чтобы перевернуть</p>
      <div class="study-actions">
        <button class="btn-know-bad" id="btn-know-bad">Еще изучаю</button>
        <button class="btn-know-good" id="btn-know-good">Знаю</button>
      </div>
    </footer>
  </section>

  <nav class="bottom-nav">
    <button class="nav-item active" data-tab="tab-home">
      <span class="nav-icon">🏠</span>
      <span class="nav-label">Главная</span>
    </button>
    <button class="nav-item" id="nav-create-btn">
      <span class="nav-icon">➕</span>
      <span class="nav-label">Создать</span>
    </button>
    <button class="nav-item" data-tab="tab-library">
      <span class="nav-icon">📁</span>
      <span class="nav-label">Библиотека</span>
    </button>
  </nav>

  <script src="app.js"></script>
</body>
</html>
'@

[System.IO.File]::WriteAllText("index.html", $htmlContent, [System.Text.Encoding]::UTF8)

git commit -am "fix encoding to utf-8"
git push