const DEFAULT_SETS = [
    {
        id: 1,
        title: "Базовые фразы",
        words: [
            { id: 101, word: "apple", translation: "яблоко", example: "Fresh apple" },
            { id: 102, word: "application", translation: "приложение", example: "Mobile app" }
        ]
    }
];

class QuizletApp {
    constructor() {
        this.sets = JSON.parse(localStorage.getItem('wordly_quizlet_sets')) || DEFAULT_SETS;
        this.activeSet = null;
        this.learnIndex = 0;

        this.initElements();
        this.initEvents();
        this.renderHomeSets();
    }

    initElements() {
        this.screens = document.querySelectorAll('.screen');
        this.navBtns = document.querySelectorAll('.nav-btn');

        // Modals
        this.modalCreateSet = document.getElementById('modal-create-set');
        this.modalAddWord = document.getElementById('modal-add-word');

        // Cards & Learn
        this.flashcard = document.getElementById('flashcard');
        this.miniCard = document.getElementById('mini-flashcard');
        this.progressFill = document.getElementById('progress-fill');
        this.learnCounter = document.getElementById('learn-counter');
    }

    initEvents() {
        // Navigation
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchScreen(btn.dataset.target);
                this.navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Open Create Set Modal
        document.getElementById('btn-create-set').addEventListener('click', () => {
            this.modalCreateSet.showModal();
        });

        document.getElementById('btn-cancel-set').addEventListener('click', () => {
            this.modalCreateSet.close();
        });

        document.getElementById('form-create-set').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createSet();
        });

        // Open Add Word Modal
        document.getElementById('btn-add-word-modal').addEventListener('click', () => {
            this.modalAddWord.showModal();
        });

        document.getElementById('btn-cancel-word').addEventListener('click', () => {
            this.modalAddWord.close();
        });

        document.getElementById('form-add-word').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addWordToSet();
        });

        // Back to Home
        document.getElementById('btn-back-to-home').addEventListener('click', () => {
            this.switchScreen('screen-home');
        });

        // Start Learning
        document.getElementById('btn-start-learn').addEventListener('click', () => {
            if (this.activeSet.words.length === 0) return alert('Добавьте слова в модуль!');
            this.learnIndex = 0;
            this.switchScreen('screen-learn');
            this.renderLearnCard();
        });

        document.getElementById('btn-close-learn').addEventListener('click', () => {
            this.switchScreen('screen-set-view');
        });

        // Flip Cards
        this.flashcard.addEventListener('click', () => this.flashcard.classList.toggle('flipped'));
        this.miniCard.addEventListener('click', () => this.miniCard.classList.toggle('flipped'));

        // Controls
        document.getElementById('btn-know').addEventListener('click', () => this.handleAnswer(true));
        document.getElementById('btn-dont-know').addEventListener('click', () => this.handleAnswer(false));

        // Export/Import
        document.getElementById('btn-export').addEventListener('click', () => this.exportJSON());
        document.getElementById('file-import').addEventListener('change', (e) => this.importJSON(e));

        this.initSwipe();
    }

    switchScreen(id) {
        this.screens.forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    renderHomeSets() {
        const list = document.getElementById('sets-list');
        list.innerHTML = '';
        this.sets.forEach(set => {
            const card = document.createElement('div');
            card.className = 'set-card';
            card.innerHTML = `
                <h3>${set.title}</h3>
                <span>${set.words.length} слов</span>
            `;
            card.addEventListener('click', () => this.openSetView(set));
            list.appendChild(card);
        });
    }

    createSet() {
        const titleInput = document.getElementById('input-set-title');
        const newSet = {
            id: Date.now(),
            title: titleInput.value.trim(),
            words: []
        };
        this.sets.push(newSet);
        this.saveData();
        titleInput.value = '';
        this.modalCreateSet.close();
        this.renderHomeSets();
    }

    openSetView(set) {
        this.activeSet = set;
        document.getElementById('set-view-title').textContent = set.title;
        document.getElementById('set-words-count').textContent = set.words.length;

        // Render Mini Card
        if (set.words.length > 0) {
            document.getElementById('mini-front-word').textContent = set.words[0].word;
            document.getElementById('mini-back-trans').textContent = set.words[0].translation;
        } else {
            document.getElementById('mini-front-word').textContent = "Пусто";
            document.getElementById('mini-back-trans').textContent = "Добавьте слова";
        }

        // Render Words List
        const wordsList = document.getElementById('set-words-list');
        wordsList.innerHTML = '';
        set.words.forEach(w => {
            const item = document.createElement('div');
            item.className = 'word-item';
            item.innerHTML = `<strong>${w.word}</strong><span>${w.translation}</span>`;
            wordsList.appendChild(item);
        });

        this.switchScreen('screen-set-view');
    }

    addWordToSet() {
        const wVal = document.getElementById('input-word').value.trim();
        const tVal = document.getElementById('input-translation').value.trim();
        const eVal = document.getElementById('input-example').value.trim();

        this.activeSet.words.push({ id: Date.now(), word: wVal, translation: tVal, example: eVal });
        this.saveData();
        
        document.getElementById('input-word').value = '';
        document.getElementById('input-translation').value = '';
        document.getElementById('input-example').value = '';
        this.modalAddWord.close();

        this.openSetView(this.activeSet);
    }

    renderLearnCard() {
        const words = this.activeSet.words;
        if (this.learnIndex >= words.length) {
            alert('Сессия завершена!');
            this.switchScreen('screen-set-view');
            return;
        }

        const card = words[this.learnIndex];
        this.flashcard.classList.remove('flipped');
        document.getElementById('card-front-word').textContent = card.word;
        document.getElementById('card-back-translation').textContent = card.translation;
        document.getElementById('card-back-example').textContent = card.example ? `"${card.example}"` : '';

        // Progress
        const percent = ((this.learnIndex + 1) / words.length) * 100;
        this.progressFill.style.width = `${percent}%`;
        this.learnCounter.textContent = `${this.learnIndex + 1} / ${words.length}`;
    }

    handleAnswer(isKnown) {
        if (!isKnown) {
            // Переместить сложное слово через 2 позиции
            const current = this.activeSet.words.splice(this.learnIndex, 1)[0];
            this.activeSet.words.splice(Math.min(this.learnIndex + 2, this.activeSet.words.length), 0, current);
        } else {
            this.learnIndex++;
        }
        this.renderLearnCard();
    }

    initSwipe() {
        let startX = 0, currentX = 0, isSwiping = false;

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

            if (currentX > 90) this.handleAnswer(true);
            else if (currentX < -90) this.handleAnswer(false);
            else this.flashcard.style.transform = 'translateX(0) rotate(0)';
            
            currentX = 0;
        });
    }

    saveData() {
        localStorage.setItem('wordly_quizlet_sets', JSON.stringify(this.sets));
    }

    exportJSON() {
        const blob = new Blob([JSON.stringify(this.sets, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `quizlet_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
    }

    importJSON(e) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            this.sets = JSON.parse(evt.target.result);
            this.saveData();
            this.renderHomeSets();
            alert('Модули загружены!');
        };
        reader.readAsText(e.target.files[0]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuizletApp();
});