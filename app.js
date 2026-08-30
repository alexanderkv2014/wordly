// Начальное состояние данных
const state = {
  modules: [
    {
      id: "1",
      title: "English",
      termsCount: 22,
      author: "вы",
      cards: [
        { term: "hungry", definition: "голодный" },
        { term: "tired", definition: "уставший" }
      ]
    },
    {
      id: "2",
      title: "Unit1-10",
      termsCount: 312,
      author: "knk169_njt8",
      cards: [
        { term: "application", definition: "приложение" }
      ]
    }
  ],
  folders: [
    { id: "f1", title: "Exam Prep for IELTS® Academic", author: "вы" },
    { id: "f2", title: "Бурение", author: "вы" }
  ],
  activeModule: null,
  currentCardIdx: 0
};

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  renderHome();
  renderLibrary();
  setupNavigation();
  setupStudyEvents();
});

// Навигация по вкладкам нижней панели
function setupNavigation() {
  const navItems = document.querySelectorAll(".bottom-nav .nav-item[data-tab]");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetTab = item.getAttribute("data-tab");
      
      document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
      document.querySelectorAll(".bottom-nav .nav-item").forEach(nav => nav.classList.remove("active"));
      
      document.getElementById(targetTab).classList.add("active");
      item.classList.add("active");
    });
  });

  // Вкладки в библиотеке (Модули / Папки)
  const chips = document.querySelectorAll(".chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const subtab = chip.getAttribute("data-subtab");
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      document.querySelectorAll(".subtab-content").forEach(st => st.classList.remove("active"));
      document.getElementById(`subtab-${subtab}`).classList.add("active");
    });
  });

  // Кнопка "+" (Создание)
  document.getElementById("nav-create-btn").addEventListener("click", () => {
    const title = prompt("Введите название нового модуля:");
    if (title) {
      const newMod = { id: Date.now().toString(), title, termsCount: 0, author: "вы", cards: [] };
      state.modules.unshift(newMod);
      renderHome();
      renderLibrary();
    }
  });
}

// Отрисовка Главного экрана
function renderHome() {
  const carousel = document.getElementById("continue-cards");
  const recentList = document.getElementById("recent-list");

  carousel.innerHTML = "";
  recentList.innerHTML = "";

  state.modules.forEach(mod => {
    // Карусель
    const cCard = document.createElement("div");
    cCard.className = "continue-card";
    cCard.innerHTML = `
      <div class="title">${mod.title}</div>
      <button class="btn-primary-wide" onclick="startStudy('${mod.id}')">Продолжить</button>
    `;
    carousel.appendChild(cCard);

    // Список
    recentList.appendChild(createModuleItem(mod));
  });
}

// Отрисовка Библиотеки
function renderLibrary() {
  const modContainer = document.getElementById("library-modules-list");
  const folderContainer = document.getElementById("library-folders-list");

  modContainer.innerHTML = "";
  folderContainer.innerHTML = "";

  state.modules.forEach(mod => {
    modContainer.appendChild(createModuleItem(mod));
  });

  state.folders.forEach(f => {
    const item = document.createElement("div");
    item.className = "module-item";
    item.innerHTML = `
      <div class="module-icon">📁</div>
      <div class="module-info">
        <div class="title">${f.title}</div>
        <div class="subtitle">Папка • Автор: ${f.author}</div>
      </div>
    `;
    folderContainer.appendChild(item);
  });
}

// Вспомогательный элемент модуля
function createModuleItem(mod) {
  const item = document.createElement("div");
  item.className = "module-item";
  item.onclick = () => startStudy(mod.id);
  item.innerHTML = `
    <div class="module-icon">🎴</div>
    <div class="module-info">
      <div class="title">${mod.title}</div>
      <div class="subtitle">${mod.termsCount} карточек • Автор: ${mod.author}</div>
    </div>
  `;
  return item;
}

// Режим заучивания
function startStudy(modId) {
  const mod = state.modules.find(m => m.id === modId);
  if (!mod || !mod.cards.length) {
    alert("В этом модуле нет карточек!");
    return;
  }

  state.activeModule = mod;
  state.currentCardIdx = 0;

  document.getElementById("screen-study").classList.add("active");
  updateCardUI();
}

function updateCardUI() {
  const mod = state.activeModule;
  const card = mod.cards[state.currentCardIdx];

  document.getElementById("study-counter").innerText = `${state.currentCardIdx + 1} / ${mod.cards.length}`;
  document.getElementById("card-term-text").innerText = card.term;
  document.getElementById("card-def-text").innerText = card.definition;
  document.getElementById("flashcard").classList.remove("flipped");
}

function setupStudyEvents() {
  const flashcard = document.getElementById("flashcard");
  flashcard.addEventListener("click", () => {
    flashcard.classList.toggle("flipped");
  });

  document.getElementById("close-study").addEventListener("click", () => {
    document.getElementById("screen-study").classList.remove("active");
  });

  const nextCard = () => {
    if (state.currentCardIdx < state.activeModule.cards.length - 1) {
      state.currentCardIdx++;
      updateCardUI();
    } else {
      alert("Модуль пройден!");
      document.getElementById("screen-study").classList.remove("active");
    }
  };

  document.getElementById("btn-know-bad").addEventListener("click", (e) => {
    e.stopPropagation();
    nextCard();
  });

  document.getElementById("btn-know-good").addEventListener("click", (e) => {
    e.stopPropagation();
    nextCard();
  });
}