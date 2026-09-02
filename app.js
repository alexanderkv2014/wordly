const KEY = "wordly-words-v2";
const THEME = "wordly-theme-v2";
const STATS = "wordly-stats-v1";

// Чтение localStorage всегда защищено: приватный режим, переполнение или
// повреждённый JSON не должны обрушивать всё приложение.
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    toast("Не удалось сохранить: хранилище недоступно");
    return false;
  }
}

// Приводим карточки к единому виду: старые записи могли не иметь части полей.
function normalizeWord(w) {
  return {
    id: w.id || id(),
    en: String(w.en || "").trim(),
    ru: String(w.ru || "").trim(),
    example: String(w.example || ""),
    note: String(w.note || ""),
    level: Math.min(5, Math.max(0, Number(w.level) || 0)),
    favorite: !!w.favorite,
    nextReview: Number(w.nextReview) || Date.now(),
    createdAt: Number(w.createdAt) || Date.now()
  };
}

const storedWords = readJSON(KEY, []);
let words = (Array.isArray(storedWords) ? storedWords : []).map(normalizeWord);

// Статистика по дням: { "2026-08-30": { correct: 5, wrong: 2 } }
let stats = readJSON(STATS, {});
if (typeof stats !== "object" || stats === null) stats = {};

function dayKey(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function recordAnswer(correct) {
  const k = dayKey();
  const day = stats[k] || (stats[k] = { correct: 0, wrong: 0 });
  correct ? day.correct++ : day.wrong++;
  writeJSON(STATS, stats);
}
// Серия дней подряд, в которые был хотя бы один ответ.
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
function streak() {
  let n = 0;
  const d = new Date();
  if (!stats[dayKey(d)]) d.setDate(d.getDate() - 1); // сегодня ещё можно наверстать
  while (stats[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// Короткое всплывающее уведомление вместо «немой» реакции интерфейса.
let toastTimer;
function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2200);
}

// Честное перемешивание (Фишер–Йетс). sort(() => Math.random() - .5)
// даёт смещённый результат и в разных браузерах ведёт себя по-разному.
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let activeFilter = "all";
let learnQueue = [];
let learnIndex = 0;
let cardsQueue = [];
let cardsIndex = 0;
let cardsScope = "all"; // "all" | "favorites" — что показываем на экране "Карточки"
let testWords = [];
let testIndex = 0;

function save() { writeJSON(KEY, words); }
function id() { return "w" + Date.now() + Math.random().toString(16).slice(2); }
function mastered(w) { return w.level >= 5; }
function due(w) { return w.nextReview <= Date.now(); }
function escapeHTML(s) { const d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; }

function screen(name) {
  document.querySelectorAll(".screen").forEach(x => x.classList.toggle("active", x.id === name));
  document.querySelectorAll(".nav").forEach(x => x.classList.toggle("active", x.dataset.screen === name));
  if (name === "screen-cards") startCards();
  if (name === "screen-library") renderLibrary();
  if (name === "screen-progress") renderProgress();
  if (name === "screen-learn") startLearn();
  if (name === "screen-test") startTest();
  if (name === "screen-packs") renderPacks();
  if (name === "screen-grammar") renderGrammarModules();
  scrollTo(0, 0);
}

document.addEventListener("click", e => {
  const button = e.target.closest("[data-screen]");
  if (!button) return;
  if (button.dataset.screen === "screen-cards") cardsScope = "all"; // обычный переход всегда начинает с "Все слова"
  screen(button.dataset.screen);
});

// Переключает "избранное" у слова (звёздочка на карточке/в библиотеке/в деталях)
function toggleFavorite(wordId) {
  const w = words.find(x => x.id === wordId);
  if (!w) return;
  w.favorite = !w.favorite;
  save();
}

document.getElementById("tile-favorites").onclick = () => {
  cardsScope = "favorites";
  screen("screen-cards");
};

/* ===================== БИБЛИОТЕКА ===================== */
function renderLibrary() {
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  const list = document.getElementById("cards-list");
  let arr = words.filter(w => (w.en + " " + w.ru).toLowerCase().includes(q));

  if (activeFilter === "learning") arr = arr.filter(w => !mastered(w));
  if (activeFilter === "mastered") arr = arr.filter(mastered);
  if (activeFilter === "favorites") arr = arr.filter(w => w.favorite);

  document.getElementById("all-count").textContent = words.length;
  document.getElementById("learn-count").textContent = words.filter(w => !mastered(w)).length;
  document.getElementById("mastered-count").textContent = words.filter(mastered).length;
  document.getElementById("favorite-count").textContent = words.filter(w => w.favorite).length;

  if (!arr.length) {
    list.innerHTML = '<div class="empty">Ничего не найдено</div>';
    return;
  }

  list.innerHTML = arr.map(w => `
    <button class="word-row" data-id="${w.id}">
      <span class="star-btn ${w.favorite ? "active" : ""}" data-star="${w.id}">${w.favorite ? "★" : "☆"}</span>
      <div class="main"><b>${escapeHTML(w.en)}</b><small>${escapeHTML(w.ru)}</small></div>
      <span class="level-dot ${mastered(w) ? "mastered" : ""}">${mastered(w) ? "✓" : "ур. " + w.level}</span>
    </button>`).join("");

  list.querySelectorAll(".word-row").forEach(b => {
    b.addEventListener("click", e => {
      if (e.target.closest(".star-btn")) return; // звезду обрабатывает свой обработчик ниже
      detail(b.dataset.id);
    });
  });
  list.querySelectorAll(".star-btn").forEach(star => {
    star.addEventListener("click", e => {
      e.stopPropagation();
      toggleFavorite(star.dataset.star);
      renderLibrary();
    });
  });
}

document.getElementById("search-input").addEventListener("input", renderLibrary);
document.querySelectorAll(".filter").forEach(btn => {
  btn.onclick = () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll(".filter").forEach(x => x.classList.toggle("active", x === btn));
    renderLibrary();
  };
});
document.getElementById("open-library").onclick = () => screen("screen-library");

function detail(wordId) {
  const w = words.find(x => x.id === wordId);
  if (!w) return;
  document.getElementById("detail-content").innerHTML = `
    <div class="detail-card">
      <div class="word-big">${escapeHTML(w.en)}</div>
      <div class="translation">${escapeHTML(w.ru)}</div>
      <hr>
      <div class="detail-meta">Пример</div><p>${escapeHTML(w.example || "—")}</p>
      ${w.note ? `<div class="detail-meta">Заметка</div><p>${escapeHTML(w.note)}</p>` : ""}
      <div class="detail-meta">Уровень ${w.level} · ${mastered(w) ? "Выучено" : "Следующее повторение: " + new Date(w.nextReview).toLocaleDateString("ru-RU")}</div>
      <button class="fav-toggle ${w.favorite ? "active" : ""}" id="detail-fav">${w.favorite ? "★ Убрать из избранного" : "☆ Добавить в избранное"}</button>
      <div class="detail-actions">
        <button id="detail-speak">◖ Произнести</button>
        <button id="detail-delete">Удалить</button>
      </div>
    </div>`;
  document.getElementById("detail-speak").onclick = () => speak(w.en);
  document.getElementById("detail-delete").onclick = () => deleteWord(w.id);
  document.getElementById("detail-edit").onclick = () => editWord(w.id);
  document.getElementById("detail-fav").onclick = () => { toggleFavorite(w.id); detail(w.id); };
  screen("screen-detail");
}

function deleteWord(wordId) {
  if (!confirm("Удалить карточку?")) return;
  words = words.filter(w => w.id !== wordId);
  save();
  screen("screen-library");
}

function editWord(wordId) {
  const w = words.find(x => x.id === wordId);
  if (!w) return;
  document.getElementById("input-en").value = w.en;
  document.getElementById("input-ru").value = w.ru;
  document.getElementById("input-example").value = w.example || "";
  document.getElementById("input-note").value = w.note || "";
  document.getElementById("word-form").dataset.edit = wordId;
  screen("screen-add");
}

/* ===================== ДОБАВЛЕНИЕ ===================== */
document.getElementById("word-form").addEventListener("submit", e => {
  e.preventDefault();
  const en = document.getElementById("input-en").value.trim();
  const ru = document.getElementById("input-ru").value.trim();
  const example = document.getElementById("input-example").value.trim();
  const note = document.getElementById("input-note").value.trim();
  const edit = e.target.dataset.edit;

  if (!en || !ru) { toast("Заполни слово и перевод"); return; }

  if (edit) {
    const w = words.find(x => x.id === edit);
    if (w) Object.assign(w, { en, ru, example, note });
    delete e.target.dataset.edit;
    toast("Карточка обновлена");
  } else {
    const duplicate = words.find(w => w.en.toLowerCase() === en.toLowerCase());
    if (duplicate) { toast(`«${en}» уже есть в библиотеке`); return; }
    words.push(normalizeWord({ id: id(), en, ru, example, note, level: 0, favorite: false, nextReview: Date.now(), createdAt: Date.now() }));
    toast("Карточка добавлена");
  }
  save();
  e.target.reset();
  screen("screen-library");
});
document.getElementById("save-word").onclick = () => document.getElementById("word-form").requestSubmit();

/* ===================== АВТОПОДСКАЗКА АНГЛИЙСКОГО СЛОВА ===================== */
// Список слов для подсказки при вводе — работает полностью офлайн, без сети.
// Часть слов совпадает с "Готовыми наборами" (PACKS), остальные — дополнительный
// словарь на ~290 слов, чтобы подсказка находилась чаще.
const WORD_SUGGESTIONS = [
  // из "Готовых наборов" (A1–B2)
  "hello","name","water","house","family","friend","school","book","food","day",
  "night","time","work","money","city","car","dog","cat","big","small",
  "good","bad","happy","sad","eat","drink","sleep","today","tomorrow","yesterday",
  "weather","holiday","shop","buy","sell","travel","airport","ticket","hotel","restaurant",
  "hospital","doctor","teacher","student","job","meeting","weekend","sport","exercise","healthy",
  "tired","busy","free","remember","forget","explain","understand","decide","borrow","lend",
  "opinion","suggest","improve","achieve","success","failure","challenge","opportunity","experience","skill",
  "responsible","reliable","confident","anxious","relationship","environment","pollution","government","economy","increase",
  "decrease","compare","describe","imagine","avoid","encourage","behavior","attitude","society","culture",
  "inevitable","controversial","significant","sustainable","innovative","efficient","flexible","ambiguous","genuine","reluctant",
  "thorough","deliberate","ultimately","consequently","nevertheless","contradict","justify","persuade","assume","acknowledge",
  "perspective","dilemma","controversy","adapt","accomplish","prioritize","overwhelmed","resilient","subtle","versatile",
  // еда и кухня
  "garlic","onion","potato","tomato","carrot","cucumber","banana","orange","grape","strawberry",
  "lemon","pineapple","mango","peach","cherry","pizza","sandwich","chicken","beef","pork",
  "fish","rice","pasta","salt","sugar","cheese","butter","honey","jam","cake",
  "bread","milk","coffee","tea","juice","soup","salad","meat","vegetable","fruit",
  "egg","cookie","chocolate","yogurt","sauce",
  // природа и география
  "mountain","river","lake","sea","ocean","forest","desert","island","valley","field",
  "hill","cave","waterfall","cliff","coast","jungle","volcano","canyon","glacier","meadow",
  "grass","leaf","root","branch","seed","soil","rock","sand","wave","stone","bush","moss",
  // одежда
  "shirt","trousers","jacket","shoes","hat","gloves","scarf","socks","belt","jeans",
  "dress","skirt","sweater","coat","boots",
  // профессии
  "engineer","lawyer","driver","waiter","farmer","artist","musician","actor","nurse","pilot",
  "soldier","chef","journalist","plumber","electrician",
  // прилагательные
  "fast","slow","heavy","light","loud","quiet","soft","hard","sharp","smooth",
  "dry","wet","narrow","dirty","empty","full","cheap","expensive","strong","weak",
  // глаголы
  "jump","climb","swim","fly","dance","sing","paint","cook","clean","wash",
  "push","pull","carry","throw","catch","build","break","fix","open","close",
  "wait","laugh","cry","shout","whisper",
  // месяцы и дни недели
  "january","february","march","april","june","july","august","september","october","november","december",
  "monday","tuesday","wednesday","thursday","friday","saturday","sunday",
  // цвета
  "black","white","yellow","purple","pink","brown","grey","gold","silver","navy",
  // части тела
  "head","arm","leg","hand","foot","eye","ear","nose","mouth","hair",
  "finger","knee","shoulder","back","chest","stomach",
  // погода
  "rain","snow","wind","storm","cloud","fog","thunder","lightning","rainbow","hurricane",
  // транспорт
  "bicycle","train","bus","ship","boat","motorcycle","subway","taxi","truck","helicopter","tractor","scooter",
  // мебель
  "table","chair","bed","sofa","shelf","wardrobe","mirror","lamp","curtain","carpet","drawer","cupboard",
  // электроника
  "television","radio","camera","printer","keyboard","charger","headphones","tablet","speaker","router",
  // животные
  "horse","cow","pig","sheep","goat","duck","rabbit","mouse","elephant","lion",
  "tiger","bear","wolf","fox","deer","monkey","snake","bird","butterfly","spider",
  // семья
  "mother","father","sister","brother","grandmother","grandfather","uncle","aunt","cousin","husband","wife","son","daughter","baby",
  // школа
  "pencil","pen","paper","notebook","eraser","ruler","desk","classroom","homework","exam",
  "lesson","university","library","dictionary"
];

document.getElementById("input-en").addEventListener("input", e => {
  const query = e.target.value.trim().toLowerCase();
  const box = document.getElementById("en-suggestions");

  if (query.length < 2) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  const matches = WORD_SUGGESTIONS.filter(w => w.startsWith(query)).slice(0, 6);
  if (!matches.length) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  box.innerHTML = matches.map(w => `<button type="button">${escapeHTML(w)}</button>`).join("");
  box.classList.remove("hidden");
  box.querySelectorAll("button").forEach((btn, i) => {
    btn.onclick = () => {
      e.target.value = matches[i];
      box.classList.add("hidden");
      box.innerHTML = "";
      document.getElementById("input-ru").focus();
    };
  });
});

// Скрываем подсказки при клике мимо поля и списка
document.addEventListener("click", e => {
  if (!e.target.closest(".field-autocomplete")) {
    document.getElementById("en-suggestions").classList.add("hidden");
  }
});

/* ===================== ГОТОВЫЕ НАБОРЫ ПО УРОВНЯМ ===================== */
// Формат одного слова: [английское, перевод, пример]
const PACKS = {
  a1: { title: "A1 · Starter", words: [
    ["hello","привет","Hello, how are you?"],
    ["name","имя","What is your name?"],
    ["water","вода","I drink water every day."],
    ["house","дом","This is my house."],
    ["family","семья","I love my family."],
    ["friend","друг","He is my best friend."],
    ["school","школа","I go to school by bus."],
    ["book","книга","I am reading a book."],
    ["food","еда","The food here is delicious."],
    ["day","день","Have a nice day!"],
    ["night","ночь","Good night, see you tomorrow."],
    ["time","время","What time is it?"],
    ["work","работа","I go to work at 9."],
    ["money","деньги","I need more money."],
    ["city","город","London is a big city."],
    ["car","машина","He has a new car."],
    ["dog","собака","My dog likes to play."],
    ["cat","кошка","The cat is sleeping."],
    ["big","большой","This is a big house."],
    ["small","маленький","I have a small room."],
    ["good","хороший","This is a good idea."],
    ["bad","плохой","The weather is bad today."],
    ["happy","счастливый","She looks very happy."],
    ["sad","грустный","Don't be sad."],
    ["eat","есть (кушать)","I eat breakfast at 8."],
    ["drink","пить","Let's drink some tea."],
    ["sleep","спать","I need to sleep more."],
    ["today","сегодня","What are you doing today?"],
    ["tomorrow","завтра","See you tomorrow."],
    ["yesterday","вчера","I called you yesterday."]
  ]},
  a2: { title: "A2 · Elementary", words: [
    ["weather","погода","The weather is nice today."],
    ["holiday","отпуск / праздник","We are going on holiday next week."],
    ["shop","магазин","I need to go to the shop."],
    ["buy","покупать","I want to buy a new phone."],
    ["sell","продавать","They sell fresh vegetables here."],
    ["travel","путешествовать","I love to travel abroad."],
    ["airport","аэропорт","The airport is far from here."],
    ["ticket","билет","Can I buy a ticket, please?"],
    ["hotel","отель","We stayed in a nice hotel."],
    ["restaurant","ресторан","Let's have dinner at a restaurant."],
    ["hospital","больница","She works at the hospital."],
    ["doctor","врач","I need to see a doctor."],
    ["teacher","учитель","My teacher is very kind."],
    ["student","студент","He is a university student."],
    ["job","работа (должность)","She found a new job."],
    ["meeting","встреча","We have a meeting at 3 pm."],
    ["weekend","выходные","What are your plans for the weekend?"],
    ["sport","спорт","I play sport twice a week."],
    ["exercise","упражнение / тренировка","Exercise is good for your health."],
    ["healthy","здоровый","Try to eat healthy food."],
    ["tired","усталый","I feel tired after work."],
    ["busy","занятый","Sorry, I am very busy today."],
    ["free","свободный","Are you free this evening?"],
    ["remember","помнить","I can't remember his name."],
    ["forget","забывать","Don't forget your keys."],
    ["explain","объяснять","Can you explain this rule?"],
    ["understand","понимать","I don't understand this word."],
    ["decide","решать","We need to decide soon."],
    ["borrow","брать взаймы","Can I borrow your pen?"],
    ["lend","давать взаймы","He lent me some money."]
  ]},
  b1: { title: "B1 · Intermediate", words: [
    ["opinion","мнение","What is your opinion on this?"],
    ["suggest","предлагать","I suggest we leave early."],
    ["improve","улучшать","I want to improve my English."],
    ["achieve","достигать","She achieved her goals."],
    ["success","успех","Hard work leads to success."],
    ["failure","неудача","Failure is part of learning."],
    ["challenge","вызов / сложная задача","This project is a big challenge."],
    ["opportunity","возможность","This is a great opportunity for you."],
    ["experience","опыт","I have five years of experience."],
    ["skill","навык","Communication is an important skill."],
    ["responsible","ответственный","He is responsible for the team."],
    ["reliable","надёжный","She is a reliable friend."],
    ["confident","уверенный","He seems very confident."],
    ["anxious","тревожный","I feel anxious before exams."],
    ["relationship","отношения","They have a good relationship."],
    ["environment","окружающая среда","We must protect the environment."],
    ["pollution","загрязнение","Air pollution is a big problem."],
    ["government","правительство","The government announced new rules."],
    ["economy","экономика","The economy is growing slowly."],
    ["increase","увеличивать(ся)","Prices continue to increase."],
    ["decrease","уменьшать(ся)","Sales decreased last month."],
    ["compare","сравнивать","Let's compare the two options."],
    ["describe","описывать","Can you describe your city?"],
    ["imagine","представлять","Imagine a world without cars."],
    ["avoid","избегать","Try to avoid stress."],
    ["encourage","поддерживать / поощрять","My parents encourage me to study."],
    ["behavior","поведение","His behavior surprised everyone."],
    ["attitude","отношение (позиция)","She has a positive attitude."],
    ["society","общество","Technology changes society."],
    ["culture","культура","I'm interested in Japanese culture."]
  ]},
  b2: { title: "B2 · Upper-Intermediate", words: [
    ["inevitable","неизбежный","Change is inevitable."],
    ["controversial","спорный","It's a controversial topic."],
    ["significant","значительный","There was a significant improvement."],
    ["sustainable","устойчивый (экологически)","We need sustainable energy sources."],
    ["innovative","инновационный","The company is very innovative."],
    ["efficient","эффективный","This method is more efficient."],
    ["flexible","гибкий","My schedule is quite flexible."],
    ["ambiguous","неоднозначный","The instructions were ambiguous."],
    ["genuine","искренний / настоящий","He gave a genuine apology."],
    ["reluctant","неохотный","She was reluctant to agree."],
    ["thorough","тщательный","He did a thorough analysis."],
    ["deliberate","намеренный","It was a deliberate decision."],
    ["ultimately","в конечном счёте","Ultimately, we chose the cheaper option."],
    ["consequently","следовательно","He was late; consequently, he missed the train."],
    ["nevertheless","тем не менее","It was raining; nevertheless, we went out."],
    ["contradict","противоречить","His words contradict his actions."],
    ["justify","оправдывать / обосновывать","Can you justify this decision?"],
    ["persuade","убеждать","She persuaded me to join."],
    ["assume","предполагать","Don't assume you know the answer."],
    ["acknowledge","признавать","He acknowledged his mistake."],
    ["perspective","точка зрения","Try to see it from her perspective."],
    ["dilemma","дилемма","I'm facing a difficult dilemma."],
    ["controversy","противоречие / спор","The plan caused a lot of controversy."],
    ["adapt","адаптироваться","We had to adapt to the new rules."],
    ["accomplish","выполнять / достигать","She accomplished all her tasks."],
    ["prioritize","расставлять приоритеты","You need to prioritize your tasks."],
    ["overwhelmed","подавленный (эмоционально)","I feel overwhelmed with work."],
    ["resilient","стойкий / устойчивый","Children can be very resilient."],
    ["subtle","тонкий / едва заметный","There's a subtle difference between them."],
    ["versatile","универсальный / разносторонний","He is a versatile actor."]
  ]}
};

// Добавляет все слова набора в личную колоду. Слова, которые уже есть
// (совпадают английское + перевод), пропускаются, чтобы не плодить дубли.
function addPackWords(levelKey) {
  const pack = PACKS[levelKey];
  if (!pack) return 0;
  const existingKeys = new Set(words.map(w => (w.en + "|" + w.ru).toLowerCase()));
  let added = 0;
  pack.words.forEach(([en, ru, example]) => {
    const key = (en + "|" + ru).toLowerCase();
    if (existingKeys.has(key)) return;
    words.push({ id: id(), en, ru, example, note: "", level: 0, favorite: false, nextReview: Date.now(), createdAt: Date.now() });
    existingKeys.add(key);
    added++;
  });
  save();
  return added;
}

// Убирает из личной библиотеки все слова, которые пришли из этого набора
// (сравниваем по паре английское+перевод, как и при добавлении). Прогресс
// и статус "избранное" по этим словам теряются безвозвратно.
function removePackWords(levelKey) {
  const pack = PACKS[levelKey];
  if (!pack) return 0;
  const keysToRemove = new Set(pack.words.map(([en, ru]) => (en + "|" + ru).toLowerCase()));
  const before = words.length;
  words = words.filter(w => !keysToRemove.has((w.en + "|" + w.ru).toLowerCase()));
  save();
  return before - words.length;
}

function renderPacks() {
  const list = document.getElementById("packs-list");
  list.innerHTML = Object.entries(PACKS).map(([key, pack]) => {
    const existingKeys = new Set(words.map(w => (w.en + "|" + w.ru).toLowerCase()));
    const alreadyAdded = pack.words.filter(([en, ru]) => existingKeys.has((en + "|" + ru).toLowerCase())).length;
    const done = alreadyAdded === pack.words.length;
    return `
      <div class="pack-card">
        <div class="pack-info"><b>${pack.title}</b><small>${pack.words.length} слов${alreadyAdded ? ` · добавлено ${alreadyAdded}` : ""}</small></div>
        <button class="pack-add ${done ? "done" : ""}" data-level="${key}" data-done="${done}">${done ? "✓ Добавлено · Убрать" : "Добавить"}</button>
      </div>`;
  }).join("");

  list.querySelectorAll(".pack-add").forEach(btn => {
    btn.onclick = () => {
      const levelKey = btn.dataset.level;
      const pack = PACKS[levelKey];

      // Набор уже полностью добавлен — повторное нажатие убирает его целиком
      if (btn.dataset.done === "true") {
        openModal(`
          <div class="modal-icon">⌦</div>
          <h2>Удалить набор «${pack.title}»?</h2>
          <p>Все слова этого набора и прогресс по ним удалятся из твоей библиотеки безвозвратно.</p>
          <button class="big-add danger" id="confirm-pack-remove">Удалить набор</button>
          <button class="modal-cancel" id="modal-cancel">Отмена</button>
        `);
        document.getElementById("modal-cancel").onclick = closeModal;
        document.getElementById("confirm-pack-remove").onclick = () => {
          const removed = removePackWords(levelKey);
          closeModal();
          renderPacks();
          toast(`Удалено слов: ${removed}`);
        };
        return;
      }

      // Набора ещё нет (или добавлен не весь) — нажатие добавляет остаток
      const added = addPackWords(levelKey);
      renderPacks();
      openModal(`
        <div class="modal-icon">✓</div>
        <h2>${added ? `Добавлено ${added} слов` : "Все слова уже добавлены"}</h2>
        <p>${added ? "Новые карточки появились в твоей библиотеке." : "В этом наборе не осталось новых слов для добавления."}</p>
        <button class="big-add" id="modal-ok">Понятно</button>
      `);
      document.getElementById("modal-ok").onclick = closeModal;
    };
  });
}

/* ===================== ОЗВУЧИВАНИЕ ===================== */
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

/* ===================== ОБЩАЯ МЕХАНИКА КАРТОЧЕК: СВАЙП ===================== */
// Карточка следует за пальцем в реальном времени (Pointer Events — единое
// API для пальца и мыши). Три события:
// 1. pointerdown — запоминаем стартовую точку.
// 2. pointermove — двигаем карточку вслед за пальцем, подсвечиваем ярлыки.
// 3. pointerup — если утащили меньше 6px, это был тап (ничего не делаем,
//    клик по карточке сам обработает переворот); если утащили дальше
//    порога SWIPE_THRESHOLD — карточка улетает и вызывается onLeft/onRight;
//    иначе — плавно возвращается на место.
const SWIPE_THRESHOLD = 90;
const TAP_TOLERANCE = 6;

function setupSwipe(element, onLeft, onRight) {
  const labelNo = element.querySelector(".swipe-no");
  const labelYes = element.querySelector(".swipe-yes");
  let startX = 0, startY = 0, dx = 0, dragging = false;

  element.addEventListener("pointerdown", e => {
    if (e.target.closest(".sound-btn") || e.target.closest(".fc-star")) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    element.classList.add("dragging");
    element.setPointerCapture(e.pointerId);
  });

  element.addEventListener("pointermove", e => {
    if (!dragging) return;
    const moveX = e.clientX - startX;
    const moveY = e.clientY - startY;
    if (Math.abs(moveY) > Math.abs(moveX) * 1.5) return; // вертикальная прокрутка — не мешаем
    dx = moveX;
    element.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    const progress = Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1);
    if (labelYes) labelYes.style.opacity = dx > 0 ? progress : 0;
    if (labelNo) labelNo.style.opacity = dx < 0 ? progress : 0;
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    element.classList.remove("dragging");

    if (Math.abs(dx) < TAP_TOLERANCE) {
      resetPosition(); // это был тап — переворот карточки обработает отдельный onclick
      return;
    }

    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      const fly = dx > 0 ? 500 : -500;
      element.style.transform = `translateX(${fly}px) rotate(${fly / 18}deg)`;
      element.style.opacity = "0";
      const knewIt = dx > 0;
      setTimeout(() => {
        resetPosition();
        knewIt ? onRight() : onLeft();
      }, 200);
    } else {
      resetPosition();
    }
  }

  function resetPosition() {
    element.style.transform = "";
    element.style.opacity = "1";
    if (labelYes) labelYes.style.opacity = 0;
    if (labelNo) labelNo.style.opacity = 0;
  }

  element.addEventListener("pointerup", endDrag);
  element.addEventListener("pointercancel", endDrag);
}

/* ===================== КАРТОЧКИ ===================== */
function startCards() {
  document.querySelectorAll("#cards-scope button").forEach(b => b.classList.toggle("active", b.dataset.scope === cardsScope));

  const pool = cardsScope === "favorites" ? words.filter(w => w.favorite) : words;
  cardsQueue = pool.filter(w => !mastered(w));
  if (!cardsQueue.length) cardsQueue = [...pool];
  cardsQueue.sort((a, b) => a.level - b.level);
  cardsIndex = 0;
  showCardsCard();
}

document.querySelectorAll("#cards-scope button").forEach(btn => {
  btn.onclick = () => { cardsScope = btn.dataset.scope; startCards(); };
});

function showCardsCard() {
  if (!cardsQueue.length || cardsIndex >= cardsQueue.length) {
    const empty = words.length === 0;
    const noFavorites = cardsScope === "favorites" && words.filter(w => w.favorite).length === 0;
    document.getElementById("cards-word").textContent = noFavorites ? "Нет избранных" : (empty ? "Пока пусто" : "Готово!");
    document.getElementById("cards-hint").textContent = noFavorites
      ? "Отметь звёздочкой слова, которые хочешь учить отдельно"
      : (empty ? "Добавь первое слово, чтобы начать" : "Все карточки в этой сессии пройдены");
    document.getElementById("cards-answer").classList.add("hidden");
    document.getElementById("cards-progress-label").textContent = `${cardsQueue.length} / ${cardsQueue.length}`;
    document.getElementById("cards-progress-bar").style.width = "100%";
    document.getElementById("cards-review-actions").classList.add("hidden");
    // "Завершить" показываем только если сессия реально пройдена (не для пустой библиотеки)
    document.getElementById("cards-finish").classList.toggle("hidden", empty || noFavorites);
    return;
  }
  document.getElementById("cards-review-actions").classList.remove("hidden");
  document.getElementById("cards-finish").classList.add("hidden");
  const w = cardsQueue[cardsIndex];
  document.getElementById("cards-word").textContent = w.en;
  document.getElementById("cards-translation").textContent = w.ru;
  document.getElementById("cards-example").textContent = w.example || "";
  document.getElementById("cards-answer").classList.add("hidden");
  document.getElementById("cards-hint").classList.remove("hidden");
  document.getElementById("cards-progress-label").textContent = `${cardsIndex + 1} / ${cardsQueue.length}`;
  document.getElementById("cards-progress-bar").style.width = `${(cardsIndex / cardsQueue.length) * 100}%`;
  const star = document.getElementById("cards-star");
  star.textContent = w.favorite ? "★" : "☆";
  star.classList.toggle("active", !!w.favorite);
}

document.getElementById("cards-star").onclick = e => {
  e.stopPropagation();
  const w = cardsQueue[cardsIndex];
  if (!w) return;
  toggleFavorite(w.id);
  e.target.textContent = w.favorite ? "★" : "☆";
  e.target.classList.toggle("active", !!w.favorite);
};

function answerCards(knew) {
  const w = cardsQueue[cardsIndex];
  if (!w) return;
  updateWordProgress(w, knew);

  if (!knew) {
    // Слово, которое пользователь не знает, не просто откладывается на
    // завтра — оно ещё раз всплывёт в этой же сессии, через 1–10 карточек.
    const offset = 1 + Math.floor(Math.random() * 10); // от 1 до 10
    cardsQueue.splice(cardsIndex + offset, 0, w);
  }

  cardsIndex++;
  showCardsCard();
}

document.getElementById("cards-finish").onclick = () => screen("screen-home");

document.getElementById("cards-card").onclick = () => {
  const answer = document.getElementById("cards-answer");
  answer.classList.toggle("hidden");
  document.getElementById("cards-hint").classList.toggle("hidden", !answer.classList.contains("hidden"));
};
document.getElementById("cards-speak").onclick = e => { e.stopPropagation(); const w = cardsQueue[cardsIndex]; if (w) speak(w.en); };
document.getElementById("cards-no").onclick = () => answerCards(false);
document.getElementById("cards-yes").onclick = () => answerCards(true);

/* ===================== ЗАУЧИВАНИЕ ===================== */
function startLearn() {
  learnQueue = words.filter(due);
  if (!learnQueue.length) learnQueue = words.filter(w => !mastered(w));
  learnQueue.sort((a, b) => a.level - b.level);
  learnIndex = 0;
  showLearnCard();
}

function showLearnCard() {
  if (!learnQueue.length || learnIndex >= learnQueue.length) {
    const empty = words.length === 0;
    document.getElementById("learn-word").textContent = empty ? "Пока пусто" : "На сегодня всё!";
    document.getElementById("learn-hint").textContent = empty
      ? "Добавь первое слово, чтобы начать"
      : "Вернитесь позже для следующего повторения";
    document.getElementById("learn-answer").classList.add("hidden");
    document.getElementById("learn-progress-label").textContent = `${learnQueue.length} / ${learnQueue.length}`;
    document.getElementById("learn-progress-bar").style.width = "100%";
    return;
  }

  const w = learnQueue[learnIndex];
  document.getElementById("learn-word").textContent = w.en;
  document.getElementById("learn-translation").textContent = w.ru;
  document.getElementById("learn-example").textContent = w.example || "";
  document.getElementById("learn-answer").classList.add("hidden");
  document.getElementById("learn-hint").classList.remove("hidden");
  document.getElementById("learn-progress-label").textContent = `${learnIndex + 1} / ${learnQueue.length}`;
  document.getElementById("learn-progress-bar").style.width = `${(learnIndex / learnQueue.length) * 100}%`;
  const star = document.getElementById("learn-star");
  star.textContent = w.favorite ? "★" : "☆";
  star.classList.toggle("active", !!w.favorite);
}

document.getElementById("learn-star").onclick = e => {
  e.stopPropagation();
  const w = learnQueue[learnIndex];
  if (!w) return;
  toggleFavorite(w.id);
  e.target.textContent = w.favorite ? "★" : "☆";
  e.target.classList.toggle("active", !!w.favorite);
};

function updateWordProgress(w, knew) {
  recordAnswer(knew);
  if (knew) {
    w.level = Math.min(5, w.level + 1);
    const days = [0, 1, 3, 7, 14, 30][w.level];
    w.nextReview = Date.now() + days * 86400000;
  } else {
    w.level = Math.max(0, w.level - 1);
    // Важно: неизвестное слово НЕ остаётся текущей карточкой.
    // Мы переносим повторение на 10 минут и сразу идём дальше.
    w.nextReview = Date.now() + 10 * 60 * 1000;
  }
  save();
}

function answerLearn(knew) {
  const w = learnQueue[learnIndex];
  if (!w) return;
  updateWordProgress(w, knew);
  learnIndex++;
  showLearnCard();
}

document.getElementById("study-card").onclick = () => {
  const answer = document.getElementById("learn-answer");
  answer.classList.toggle("hidden");
  document.getElementById("learn-hint").classList.toggle("hidden", !answer.classList.contains("hidden"));
};
document.getElementById("learn-speak").onclick = e => { e.stopPropagation(); const w = learnQueue[learnIndex]; if (w) speak(w.en); };
document.getElementById("learn-yes").onclick = () => answerLearn(true);
document.getElementById("learn-no").onclick = () => answerLearn(false);

setupSwipe(document.getElementById("study-card"), () => answerLearn(false), () => answerLearn(true));
setupSwipe(document.getElementById("cards-card"), () => answerCards(false), () => answerCards(true));

/* ===================== ТЕСТ ===================== */
// Ответ засчитываем «по-человечески»: без регистра, лишних пробелов,
// с равными «е»/«ё», игнорируя пояснения в скобках и принимая любой
// из вариантов перевода, перечисленных через «/» или запятую.
function normalizeAnswer(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-zа-я0-9\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function answerVariants(ru) {
  return ru.split(/[\/,;]/).map(normalizeAnswer).filter(Boolean);
}

function startTest() {
  testWords = shuffle(words).slice(0, Math.min(10, words.length));
  testIndex = 0;
  document.getElementById("test-answer").style.display = "";
  document.getElementById("test-check").style.display = "";
  document.getElementById("test-skip").style.display = "";
  showTest();
}
function showTest() {
  const w = testWords[testIndex];
  if (!w) {
    const empty = words.length === 0;
    document.getElementById("test-word").textContent = empty ? "Пока пусто" : "Готово!";
    document.getElementById("test-answer").style.display = "none";
    document.getElementById("test-check").style.display = "none";
    document.getElementById("test-skip").style.display = "none";
    document.getElementById("test-result").textContent = empty
      ? "Добавь первое слово, чтобы начать"
      : "Тест завершён";
    return;
  }
  document.getElementById("test-label").textContent = `${testIndex + 1} / ${testWords.length}`;
  document.getElementById("test-word").textContent = w.en;
  document.getElementById("test-answer").value = "";
  const res = document.getElementById("test-result");
  res.textContent = "";
  res.className = "test-result";
  document.getElementById("test-answer").focus({ preventScroll: true });
  document.getElementById("test-bar").style.width = `${(testIndex / testWords.length) * 100}%`;
}
function checkTest(skipped) {
  const w = testWords[testIndex];
  if (!w) return;
  const input = document.getElementById("test-answer");
  const answer = normalizeAnswer(input.value);
  if (!answer && !skipped) { toast("Введи перевод или нажми «Не помню»"); return; }

  const ok = !skipped && answerVariants(w.ru).includes(answer);
  const result = document.getElementById("test-result");
  result.textContent = ok ? "✓ Правильно!" : "✕ Правильный ответ: " + w.ru;
  result.className = "test-result " + (ok ? "ok" : "fail");
  // Ошибка тоже влияет на прогресс — иначе тест не учит, а только хвалит.
  updateWordProgress(w, ok);
  input.disabled = true;
  setTimeout(() => { input.disabled = false; testIndex++; showTest(); }, ok ? 700 : 1600);
}
document.getElementById("test-check").onclick = () => checkTest(false);
document.getElementById("test-skip").onclick = () => checkTest(true);
document.getElementById("test-answer").addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); checkTest(false); }
});

/* ===================== ГРАММАТИКА ===================== */
// Короткие тесты с выбором варианта, отдельно от словарных карточек:
// тут проверяются грамматические конструкции, а не перевод слов.
const GRAMMAR = {
  numbers: { title: "Числа и даты", questions: [
    { q: "Today is the _____ of May.", options: ["five", "fifth"], correct: 1 },
    { q: "I have _____ brothers.", options: ["three", "third"], correct: 0 },
    { q: "We are leaving _____ 3 o'clock.", options: ["in", "on", "at"], correct: 2 },
    { q: "Her wedding is _____ June 15th.", options: ["in", "on", "at"], correct: 1 }
  ]},
  degrees: { title: "Степени сравнения", questions: [
    { q: "This house is _____ than mine.", options: ["biger", "bigger", "more big"], correct: 1 },
    { q: "English is _____ than Chinese.", options: ["easier", "more easy", "easyer"], correct: 0 },
    { q: "He is _____ boy in our class.", options: ["tallest", "the tallest", "the most tall"], correct: 1 },
    { q: "It was _____ day of my life.", options: ["the best", "the goodest", "the better"], correct: 0 }
  ]},
  continuous: { title: "Present Continuous", questions: [
    { q: "Form of 'Make':", options: ["makeing", "making", "makes"], correct: 1 },
    { q: "Form of 'Swim':", options: ["swiming", "swimming", "swimes"], correct: 1 },
    { q: "Look! She _____.", options: ["is dancing", "are dancing", "dances"], correct: 0 },
    { q: "What _____ at the moment?", options: ["you are doing", "are you doing", "do you do"], correct: 1 }
  ]},
  perfect: { title: "Present Perfect", questions: [
    { q: "I _____ already finished my homework.", options: ["have", "has"], correct: 0 },
    { q: "She _____ never been to London.", options: ["have", "has"], correct: 1 },
    { q: "I have already _____ lunch.", options: ["eat", "ate", "eaten"], correct: 2 },
    { q: "I haven't finished the report _____.", options: ["already", "yet", "never"], correct: 1 }
  ]},
  modals: { title: "Модальные глаголы", questions: [
    { q: "You _____ wear a seatbelt in the car. (обязанность)", options: ["must", "can", "may"], correct: 0 },
    { q: "You _____ drink more water every day. (совет)", options: ["should", "must", "can"], correct: 0 },
    { q: "I _____ a new phone next week. (план)", options: ["am going to buy", "is going to buy", "will buying"], correct: 0 }
  ]}
};

let grammarKey = null;
let grammarIndex = 0;
let grammarScore = 0;

function renderGrammarModules() {
  const list = document.getElementById("grammar-list");
  list.innerHTML = Object.entries(GRAMMAR).map(([key, mod]) => `
    <button class="set-card" data-grammar="${key}">
      <span class="set-icon">✎</span>
      <span><b>${escapeHTML(mod.title)}</b><small>${mod.questions.length} ${plural(mod.questions.length, "вопрос", "вопроса", "вопросов")}</small></span>
      <span class="chev">›</span>
    </button>`).join("");
  list.querySelectorAll("[data-grammar]").forEach(btn => {
    btn.onclick = () => startGrammarQuiz(btn.dataset.grammar);
  });
}

function startGrammarQuiz(key) {
  grammarKey = key;
  grammarIndex = 0;
  grammarScore = 0;
  document.getElementById("grammar-quiz-title").textContent = GRAMMAR[key].title;
  document.getElementById("grammar-result").classList.add("hidden");
  document.getElementById("grammar-question-wrap").classList.remove("hidden");
  screen("screen-grammar-quiz");
  renderGrammarQuestion();
}

function renderGrammarQuestion() {
  const mod = GRAMMAR[grammarKey];
  const q = mod.questions[grammarIndex];
  document.getElementById("grammar-progress-label").textContent = `${grammarIndex + 1} / ${mod.questions.length}`;
  document.getElementById("grammar-progress-bar").style.width = `${(grammarIndex / mod.questions.length) * 100}%`;
  document.getElementById("grammar-question").textContent = q.q;
  const feedback = document.getElementById("grammar-feedback");
  feedback.textContent = "";
  feedback.className = "test-result";

  const optionsEl = document.getElementById("grammar-options");
  optionsEl.innerHTML = q.options.map((opt, i) => `<button data-idx="${i}">${escapeHTML(opt)}</button>`).join("");
  optionsEl.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => answerGrammar(Number(btn.dataset.idx), q, optionsEl);
  });
}

function answerGrammar(selected, q, optionsEl) {
  const buttons = optionsEl.querySelectorAll("button");
  buttons.forEach(b => b.disabled = true);
  const feedback = document.getElementById("grammar-feedback");

  if (selected === q.correct) {
    buttons[selected].classList.add("correct");
    feedback.textContent = "✓ Правильно!";
    feedback.className = "test-result ok";
    grammarScore++;
    setTimeout(nextGrammarQuestion, 700);
  } else {
    buttons[selected].classList.add("wrong");
    buttons[q.correct].classList.add("correct");
    feedback.textContent = "✕ Правильный ответ: " + q.options[q.correct];
    feedback.className = "test-result fail";
    setTimeout(nextGrammarQuestion, 1400);
  }
}

function nextGrammarQuestion() {
  grammarIndex++;
  if (grammarIndex >= GRAMMAR[grammarKey].questions.length) {
    finishGrammarQuiz();
  } else {
    renderGrammarQuestion();
  }
}

function finishGrammarQuiz() {
  const mod = GRAMMAR[grammarKey];
  document.getElementById("grammar-question-wrap").classList.add("hidden");
  document.getElementById("grammar-result").classList.remove("hidden");
  document.getElementById("grammar-score-text").textContent = `${grammarScore} / ${mod.questions.length}`;
  document.getElementById("grammar-progress-label").textContent = `${mod.questions.length} / ${mod.questions.length}`;
  document.getElementById("grammar-progress-bar").style.width = "100%";
}

document.getElementById("grammar-retry").onclick = () => startGrammarQuiz(grammarKey);
document.getElementById("grammar-to-list").onclick = () => screen("screen-grammar");

/* ===================== ПРОГРЕСС ===================== */
function renderProgress() {
  const m = words.filter(mastered).length, l = words.length - m;
  document.getElementById("p-mastered").textContent = m;
  document.getElementById("p-learning").textContent = l;
  document.getElementById("p-total").textContent = words.length;
  document.getElementById("p-streak").textContent = streak();

  // График строится по реальной истории ответов, а не по фиксированным числам.
  const days = Number(document.getElementById("period").value) || 7;
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = stats[dayKey(d)] || { correct: 0, wrong: 0 };
    buckets.push({ date: d, total: day.correct + day.wrong, correct: day.correct });
  }
  const max = Math.max(1, ...buckets.map(b => b.total));
  const short = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  document.getElementById("chart").innerHTML = buckets.map((b, i) => {
    const label = days <= 7 ? short[b.date.getDay()] : (i % 5 === 0 ? b.date.getDate() : "");
    return `<div class="bar" style="height:${Math.max(3, (b.total / max) * 100)}%" title="${b.total} ответов, верных ${b.correct}"><small>${label}</small></div>`;
  }).join("");
  const answered = buckets.reduce((sum, b) => sum + b.total, 0);
  const right = buckets.reduce((sum, b) => sum + b.correct, 0);
  document.getElementById("chart-note").textContent = answered
    ? `${answered} ${plural(answered, "ответ", "ответа", "ответов")} за период · верно ${Math.round((right / answered) * 100)}%`
    : "Пока нет ответов за этот период";
  const total = words.length || 1;
  document.getElementById("levels").innerHTML = [0,1,2,3,4,5].map(x => {
    const n = words.filter(w => w.level === x).length;
    return `<div class="level-stat"><span>${x === 5 ? "Выучено" : "Уровень " + x}</span><div class="track"><span style="width:${n/total*100}%"></span></div><b>${n}</b></div>`;
  }).join("");
}

document.getElementById("period").addEventListener("change", renderProgress);

/* ===================== ТЕМА ===================== */
const themeLabel = { system: "Системная", light: "Светлая", dark: "Тёмная" };
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
function applyTheme(t) {
  // data-theme всегда содержит конкретную тему (light/dark), поэтому
  // "Системная" реально переключается вместе с настройкой устройства.
  const resolved = t === "system" ? (darkQuery.matches ? "dark" : "light") : t;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = t;
  document.getElementById("theme-label").textContent = themeLabel[t] || "Системная";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = resolved === "dark" ? "#101115" : "#5962f4";
}
darkQuery.addEventListener("change", () => {
  if ((localStorage.getItem(THEME) || "system") === "system") applyTheme("system");
});
function setTheme(t) {
  localStorage.setItem(THEME, t);
  applyTheme(t);
  document.querySelector(".theme-panel").classList.remove("open");
}
applyTheme(localStorage.getItem(THEME) || "system");
document.getElementById("theme-btn").onclick = () => document.querySelector(".theme-panel").classList.toggle("open");
document.querySelectorAll(".theme-panel button").forEach(b => b.onclick = () => setTheme(b.dataset.theme));

/* ===================== ДАННЫЕ: СБРОС ПРОГРЕССА ===================== */
const modal = document.getElementById("data-modal");
const sheet = document.getElementById("modal-sheet");
function closeModal() { modal.classList.add("hidden"); sheet.innerHTML = ""; }
function openModal(html) { sheet.innerHTML = html; modal.classList.remove("hidden"); }
modal.querySelector(".modal-backdrop").onclick = closeModal;

document.getElementById("reset-btn").onclick = () => {
  openModal(`<div class="modal-icon">⌫</div><h2>Сбросить прогресс?</h2><p>Карточки останутся на месте, но уровни изучения будут сброшены.</p><button class="big-add danger" id="confirm-reset">Сбросить</button><button class="modal-cancel" id="modal-cancel">Отмена</button>`);
  document.getElementById("modal-cancel").onclick = closeModal;
  document.getElementById("confirm-reset").onclick = () => {
    words.forEach(w => { w.level = 0; w.nextReview = Date.now(); });
    save(); closeModal(); renderProgress();
  };
};

document.getElementById("wipe-btn").onclick = () => {
  openModal(`<div class="modal-icon">⌦</div><h2>Удалить всю библиотеку?</h2><p>Слова и статистика будут удалены безвозвратно.</p><button class="big-add danger" id="confirm-wipe">Удалить всё</button><button class="modal-cancel" id="modal-cancel">Отмена</button>`);
  document.getElementById("modal-cancel").onclick = closeModal;
  document.getElementById("confirm-wipe").onclick = () => {
    words = [];
    stats = {};
    save();
    writeJSON(STATS, stats);
    closeModal();
    toast("Все данные удалены");
    screen("screen-home");
  };
};

document.getElementById("about-btn").onclick = () => {
  openModal(`<div class="modal-icon">ⓘ</div><h2>Wordly v3.0</h2><p>Карточки английских слов с интервальным повторением. Работает офлайн, данные хранятся только на этом устройстве.</p><button class="big-add" id="modal-ok">Понятно</button>`);
  document.getElementById("modal-ok").onclick = closeModal;
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
}