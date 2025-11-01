// APP.JS - Инициализация приложения
let budgetApp = null;
// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Семейный бюджет Янцен v2.1');
    // Создаём экземпляры классов
    const storage = new BudgetStorage();
    const sync = new FirebaseSync(storage);
    await sync.initializeFirebase();
    const ui = new BudgetUI(storage, sync);
    // Сохраняем в глобальную переменную для доступа из onclick
    budgetApp = ui;
    // Запускаем автосинхронизацию
    sync.startAutoSync();
    // Рендерим начальный экран (Dashboard)
    ui.switchScreen('dashboard');
    console.log('✅ Приложение инициализировано');
});
// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('✅ Service Worker зарегистрирован:', registration);
        })
        .catch(error => {
            console.log('❌ Ошибка Service Worker:', error);
        });
}
