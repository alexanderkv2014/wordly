// Состояние приложения
const state = {
  modules: [
    {
      id: "1",
      title: "English",
      termsCount: 2,
      author: "вы",
      cards: [
        { term: "hungry", definition: "голодный" },
        { term: "tired", definition: "уставший" }
      ]
    },
    {
      id: "2",
      title: "Unit 1-10",
      termsCount: 1,
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

// Данные для тестов грамматики
const testsData = {
    numbers: {
        title: "Числа и даты",
        questions: [
            { q: "Today is the _____ of May.", options: ["five", "fifth"], correct: 1 },
            { q: "I have _____ brothers.", options: ["three", "third"], correct: 0 },
            { q: "We are leaving _____ 3 o'clock.", options: ["in", "on", "at"], correct: 2 },
            { q: "Her wedding is _____ June 15th.", options: ["in", "on", "at"], correct: 1 }
        ]
    },
    degrees: {
        title: "Степени сравнения",
        questions: [
            { q: "This house is _____ than mine.", options: ["biger", "bigger", "more big"], correct: 1 },
            { q: "English is _____ than Chinese.", options: ["easier", "more easy", "easyer"], correct: 0 },
            { q: "He is _____ boy in our class.", options: ["tallest", "the tallest", "the most tall"], correct: 1 },
            { q: "It was _____ day of my life.", options: ["the best", "the goodest", "the better"], correct: 0 }
        ]
    },
    continuous: {
        title: "Present Continuous",
        questions: [
            { q: "Form of 'Make':", options: ["makeing", "making", "makes"], correct: 1 },
            { q: "Form of 'Swim':", options: ["swiming", "swimming", "swimes"], correct: 1 },
            { q: "Look! She _____ .", options: ["is dancing", "are dancing", "dances"], correct: 0 },
            { q: "What _____ at the moment?", options: ["you are doing", "are you doing", "do you do"], correct: 1 }
        ]
    }
};

let currentTest = null;
let currentQuestionIndex = 0;

// Переключение экранов
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  renderHome();
  renderLibrary();
  setupNavigation();
  setupStudyEvents();
});

// Навигация
function setupNavigation() {
  const chips = document.querySelectorAll(".chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const subtab = chip.getAttribute("data-subtab");
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      document.querySelectorAll(".subtab-content").forEach(st => st.classList.remove("active"));
      const activeSubtab = document.getElementById(`subtab-${subtab}`);
      if (activeSubtab) activeSubtab.classList.add("active");
    });
  });

  // Кнопка "+" (Создание модуля и карточек)
  const createBtn = document.getElementById("nav-create-btn");
  if (createBtn) {
    createBtn.addEventListener("click", () => {
      const title = prompt("Введите название нового модуля:");
      if (!title) return;

      const newCards = [];
      let adding = true;

      while (adding) {
        const term = prompt("Введите слово / термин (или нажмите Отмена для завершения):");
        if (!term) break;
        const definition = prompt(`Введите перевод для "${term}":`) || "";
        newCards.push({ term, definition });

        adding = confirm("Добавить ещё одну карточку в этот модуль?");
      }

      const newMod = {
        id: Date.now().toString(),
        title: title,
        termsCount: newCards.length,
        author: "вы",
        cards: newCards
      };

      state.modules.unshift(newMod);
      renderHome();
      renderLibrary();
      alert(`Модуль "${title}" создан! Карточек: ${newCards.length}`);
    });
  }
}

// Отрисовка Главного экрана
function renderHome() {
  const carousel = document.getElementById("continue-cards");
  const recentList = document.getElementById("recent-list");

  if (carousel) carousel.innerHTML = "";
  if (recentList) recentList.innerHTML = "";

  state.modules.forEach(mod => {
    if (recentList) recentList.appendChild(createModuleItem(mod));
  });
}

// Отрисовка Библиотеки
function renderLibrary() {
  const modContainer = document.getElementById("library-modules-list");
  const folderContainer = document.getElementById("library-folders-list");

  if (modContainer) {
    modContainer.innerHTML = "";
    state.modules.forEach(mod => {
      modContainer.appendChild(createModuleItem(mod));
    });
  }

  if (folderContainer) {
    folderContainer.innerHTML = "";
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
}

// Вспомогательный элемент модуля
function createModuleItem(mod) {
  const item = document.createElement("div");
  item.className = "menu-item";
  item.onclick = () => startStudy(mod.id);
  item.innerHTML = `
    <div class="menu-icon icon-blue">🎴</div>
    <div class="menu-info">
      <div class="title">${mod.title}</div>
      <div class="subtitle">${mod.cards.length} карточек • Автор: ${mod.author}</div>
    </div>
    <span class="chevron">›</span>
  `;
  return item;
}

// Режим заучивания
function startStudy(modId) {
  const mod = state.modules.find(m => m.id === modId);
  if (!mod || !mod.cards || mod.cards.length === 0) {
    alert("В этом модуле пока нет карточек!");
    return;
  }

  state.activeModule = mod;
  state.currentCardIdx = 0;

  showScreen("screen-study");
  updateCardUI();
}

function updateCardUI() {
  const mod = state.activeModule;
  const card = mod.cards[state.currentCardIdx];

  document.getElementById("study-counter").innerText = `${state.currentCardIdx + 1} / ${mod.cards.length}`;
  document.getElementById("card-term-text").innerText = card.term;
  document.getElementById("card-def-text").innerText = card.definition;
  
  const flashcard = document.getElementById("flashcard");
  if (flashcard) flashcard.classList.remove("flipped");
}

function setupStudyEvents() {
  const flashcard = document.getElementById("flashcard");
  if (flashcard) {
    flashcard.addEventListener("click", () => {
      flashcard.classList.toggle("flipped");
    });
  }

  const closeBtn = document.getElementById("close-study");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      showScreen("screen-cards");
    });
  }

  const nextCard = () => {
    if (state.currentCardIdx < state.activeModule.cards.length - 1) {
      state.currentCardIdx++;
      updateCardUI();
    } else {
      alert("Модуль пройден!");
      showScreen("screen-cards");
    }
  };

  const badBtn = document.getElementById("btn-know-bad");
  if (badBtn) {
    badBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      nextCard();
    });
  }

  const goodBtn = document.getElementById("btn-know-good");
  if (goodBtn) {
    goodBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      nextCard();
    });
  }
}

// Логика тестов
function openTest(categoryKey) {
    currentTest = testsData[categoryKey];
    if (!currentTest) return;
    currentQuestionIndex = 0;
    
    document.getElementById('test-title').innerText = currentTest.title;
    renderQuestion();
    showScreen('screen-test-player');
}

function renderQuestion() {
    const qData = currentTest.questions[currentQuestionIndex];
    document.getElementById('question-text').innerText = `${currentQuestionIndex + 1}. ${qData.q}`;
    
    const optionsContainer = document.getElementById('options-list');
    optionsContainer.innerHTML = '';
    document.getElementById('test-feedback').innerText = '';

    qData.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(idx, qData.correct);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selectedIdx, correctIdx) {
    const feedback = document.getElementById('test-feedback');
    if (selectedIdx === correctIdx) {
        feedback.innerText = "✨ Правильно!";
        feedback.className = "test-feedback success";
        setTimeout(() => {
            if (currentQuestionIndex + 1 < currentTest.questions.length) {
                currentQuestionIndex++;
                renderQuestion();
            } else {
                feedback.innerText = "🎉 Тест пройден!";
            }
        }, 1000);
    } else {
        feedback.innerText = "❌ Неверно, попробуйте еще раз";
        feedback.className = "test-feedback error";
    }
}

// Автоматическая инициализация тестовых данных
if (!localStorage.getItem('wordly_initialized_v3')) {
    localStorage.clear();
    localStorage.setItem('wordly_initialized_v3', 'true');
    location.reload();
}