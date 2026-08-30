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
    },
    perfect: {
        title: "Present Perfect",
        questions: [
            { q: "I _____ already finished my homework.", options: ["have", "has"], correct: 0 },
            { q: "She _____ never been to London.", options: ["have", "has"], correct: 1 },
            { q: "I have already _____ lunch.", options: ["eat", "ate", "eaten"], correct: 2 },
            { q: "I haven't finished the report _____ .", options: ["already", "yet", "never"], correct: 1 }
        ]
    },
    modals: {
        title: "Модальные глаголы",
        questions: [
            { q: "You _____ wear a seatbelt in the car. (обязанность)", options: ["must", "can", "may"], correct: 0 },
            { q: "You _____ drink more water every day. (совет)", options: ["should", "must", "can"], correct: 0 },
            { q: "I _____ a new phone next week. (план)", options: ["am going to buy", "is going to buy", "will buying"], correct: 0 }
        ]
    }
};

let currentTest = null;
let currentQuestionIndex = 0;

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');
}

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