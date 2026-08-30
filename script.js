function startStudy(type) {
    if (type === 'cards') {
        alert('Раздел "Карточки" открывается');
        // Здесь логика перехода или открытия раздела карточек
    } else if (type === 'learn') {
        alert('Раздел "Обучение" открывается');
        // Здесь логика перехода к разделам грамматики и тестам
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.getElementById('open-profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            alert('Профиль пользователя');
        });
    }
});