// Default Data Seed
const DEFAULT_WORDS = [
    { id: 1, word: 'apple', translation: 'яблоко', example: 'I eat a fresh apple.', errors: 0 },
    { id: 2, word: 'application', translation: 'приложение', example: 'FastAPI is a web application framework.', errors: 0 },
    { id: 3, word: 'dictionary', translation: 'словарь', example: 'Use a dictionary to check words.', errors: 0 }
];

class WordlyApp {
    constructor() {
        this.words = JSON.parse(localStorage.getItem('wordly_words')) || DEFAULT_WORDS;
        this.currentIndex = 0;
        
        this.initElements();
        this.initEvents();
        this.initSwipe();
        this.renderCurrentCard();
        this.renderLibrary();
    }

    initElements() {
        // Screens & Nav
        this.screens = document.querySelectorAll('.screen');
        this.navBtns = document.querySelectorAll('.nav-btn');
        this.headerTitle = document.getElementById('header-title');
        this.cardCounter = document.getElementById('card-counter');

        // Card Elements
        this.flashcard = document.getElementById('flashcard');
        this.cardFrontWord = document.getElementById('card-front-word');
        this.cardBackTranslation = document.getElementById('card-back-translation');
        this.cardBackExample = document.getElementById('card-back-example');

        // Buttons
        this.btnKnow = document.getElementById('btn-know');
        this.btnDontKnow = document.getElementById('btn-dont-know');

        // Library & Settings Forms
        this.addForm = document.getElementById('add-card-form');
        this.wordsList = document.getElementById('words-list');
        this.searchInput = document.getElementById('search-input');
        this.btnExport = document.getElementById('btn-export');
        this.fileImport = document.getElementById('file-import');
        this.btnClearData = document.getElementById('btn-clear-data');
    }

    initEvents() {
        // Navigation Switcher
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                this.switchScreen(target, btn);
            });
        });

        // Flip Card
        this.flashcard.addEventListener('click', () => {
            this.flashcard.classList.toggle('flipped');
        });

        // Answer Actions
        this.btnKnow.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleAnswer(true);
        });

        this.btnDontKnow.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleAnswer(false);
        });

        // Add New Word
        this.addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewWord();
        });

        // Search Filter
        this.searchInput.addEventListener('input', (e) => {
            this.renderLibrary(e.target.value);
        });

        // Export/Import JSON UX
        this.btnExport.addEventListener('click', () => this.exportData());
        this.fileImport.addEventListener('change', (e) => this.importData(e));
        this.btnClearData.addEventListener('click', () => this.clearAllData());
    }

    // Touch & Swipe Logic
    initSwipe() {
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;

        this.flashcard.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isSwiping = true;
            this.flashcard.style.transition = 'none';
        }, { passive: true });

        this.flashcard.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            currentX = e.touches[0].clientX - startX;
            this.flashcard.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`;
        }, { passive: true });

        this.flashcard.addEventListener('touchend', () => {
            if (!isSwiping) return;
            isSwiping = false;
            this.flashcard.style.transition = 'transform 0.2s ease';

            if (currentX > 90) {
                // Swiped Right -> Know
                this.handleAnswer(true);
            } else if (currentX < -90) {
                // Swiped Left -> Don't Know
                this.handleAnswer(false);
            } else {
                // Reset Position
                this.flashcard.style.transform = 'translateX(0) rotate(0)';
            }
            currentX = 0;
        });
    }

    switchScreen(screenId, activeBtn) {
        this.screens.forEach(s => s.classList.remove('active'));
        this.navBtns.forEach(b => b.classList.remove('active'));

        document.getElementById(screenId).classList.add('active');
        activeBtn.classList.add('active');

        const titles = {
            'screen-learn': 'Изучение',
            'screen-library': 'Библиотека',
            'screen-settings': 'Настройки'
        };
        this.headerTitle.textContent = titles[screenId];
    }

    renderCurrentCard() {
        if (this.words.length === 0) {
            this.cardFrontWord.textContent = "Словарь пуст";
            this.cardBackTranslation.textContent = "Добавьте слова в библиотеке";
            this.cardBackExample.textContent = "";
            this.cardCounter.textContent = "0 / 0";
            return;
        }

        if (this.currentIndex >= this.words.length) {
            this.currentIndex = 0;
        }

        const card = this.words[this.currentIndex];
        this.flashcard.classList.remove('flipped');
        this.flashcard.style.transform = 'translateX(0) rotate(0)';

        this.cardFrontWord.textContent = card.word;
        this.cardBackTranslation.textContent = card.translation;
        this.cardBackExample.textContent = card.example ? `"${card.example}"` : '';
        this.cardCounter.textContent = `${this.currentIndex + 1} / ${this.words.length}`;
    }

    handleAnswer(isKnown) {
        if (this.words.length === 0) return;

        const currentWord = this.words[this.currentIndex];

        if (!isKnown) {
            currentWord.errors = (currentWord.errors || 0) + 1;
            // Логика перестановки: переместить карточку через 2 позиции вперед
            this.words.splice(this.currentIndex, 1);
            const targetIndex = Math.min(this.currentIndex + 2, this.words.length);
            this.words.splice(targetIndex, 0, currentWord);
        } else {
            this.currentIndex++;
        }

        this.saveData();
        this.renderCurrentCard();
    }

    addNewWord() {
        const wordInput = document.getElementById('input-word');
        const translationInput = document.getElementById('input-translation');
        const exampleInput = document.getElementById('input-example');

        const newCard = {
            id: Date.now(),
            word: wordInput.value.trim(),
            translation: translationInput.value.trim(),
            example: exampleInput.value.trim(),
            errors: 0
        };

        this.words.push(newCard);
        this.saveData();
        this.renderLibrary();
        
        wordInput.value = '';
        translationInput.value = '';
        exampleInput.value = '';

        alert('Слово добавлено!');
    }

    renderLibrary(filter = '') {
        this.wordsList.innerHTML = '';
        
        const filtered = this.words.filter(w => 
            w.word.toLowerCase().includes(filter.toLowerCase()) || 
            w.translation.toLowerCase().includes(filter.toLowerCase())
        );

        filtered.forEach(item => {
            const el = document.createElement('div');
            el.className = 'word-item';
            el.innerHTML = `
                <div class="word-item-info">
                    <strong>${item.word}</strong>
                    <span>${item.translation}</span>
                </div>
                <button class="delete-btn" data-id="${item.id}">🗑</button>
            `;

            el.querySelector('.delete-btn').addEventListener('click', (e) => {
                this.deleteWord(Number(e.target.dataset.id));
            });

            this.wordsList.appendChild(el);
        });
    }

    deleteWord(id) {
        this.words = this.words.filter(w => w.id !== id);
        this.saveData();
        this.renderLibrary();
        this.renderCurrentCard();
    }

    exportData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.words, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `wordly_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    importData(event) {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            try {
                const importedWords = JSON.parse(e.target.result);
                if (Array.isArray(importedWords)) {
                    this.words = importedWords;
                    this.saveData();
                    this.renderLibrary();
                    this.renderCurrentCard();
                    alert('Данные успешно импортированы!');
                } else {
                    alert('Неверный формат файла JSON.');
                }
            } catch (err) {
                alert('Ошибка при чтении файла JSON.');
            }
        };
        fileReader.readAsText(event.target.files[0]);
    }

    clearAllData() {
        if (confirm('Вы уверены, что хотите полностью сбросить все карточки?')) {
            this.words = [];
            this.saveData();
            this.renderLibrary();
            this.renderCurrentCard();
        }
    }

    saveData() {
        localStorage.setItem('wordly_words', JSON.stringify(this.words));
    }
}

// Init App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WordlyApp();
});