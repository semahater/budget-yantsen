// ========================================
// APP.JS - Инициализация и управление UI
// ========================================

const UI = {
    currentScreen: 'dashboard',
    chart: null,

    // ========================================
    // ИНИЦИАЛИЗАЦИЯ
    // ========================================

    init() {
        // Инициализация данных
        DataManager.init();
        FirebaseManager.init();

        // Навигация
        this.initNavigation();

        // Dashboard
        this.initDashboard();

        // Transactions
        this.initTransactions();

        // Categories
        this.initCategories();

        // Settings
        this.initSettings();

        // Modals
        this.initModals();

        // Первичное обновление UI
        this.refreshAll();
    },

    // ========================================
    // НАВИГАЦИЯ
    // ========================================

    initNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const screen = btn.dataset.screen;
                this.switchScreen(screen);
            });
        });
    },

    switchScreen(screenName) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        
        // Показываем нужный экран
        const screen = document.getElementById(`screen-${screenName}`);
        if (screen) {
            screen.classList.add('active');
        }

        // Обновляем активную кнопку навигации
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-screen="${screenName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.currentScreen = screenName;

        // Обновляем данные экрана
        if (screenName === 'dashboard') {
            this.updateDashboard();
        } else if (screenName === 'transactions') {
            this.updateTransactions();
        } else if (screenName === 'categories') {
            this.updateCategories();
        } else if (screenName === 'settings') {
            this.updateSettings();
        }
    },

    // ========================================
    // DASHBOARD
    // ========================================

    initDashboard() {
        // Навигация по месяцам
        document.getElementById('btn-prev-month').addEventListener('click', () => {
            DataManager.prevMonth();
            this.refreshAll();
        });

        document.getElementById('btn-next-month').addEventListener('click', () => {
            DataManager.nextMonth();
            this.refreshAll();
        });

        // Кнопки добавления
        document.getElementById('btn-add-expense').addEventListener('click', () => {
            this.openExpenseModal();
        });

        document.getElementById('btn-add-income').addEventListener('click', () => {
            this.openIncomeModal();
        });
    },

    updateDashboard() {
        // Обновляем название месяца
        document.getElementById('current-month-label').textContent = DataManager.getMonthName();

        // Обновляем статистику
        const stats = DataManager.getMonthStats();
        document.getElementById('stat-income').textContent = `${DataManager.formatNumber(stats.income)} ₽`;
        document.getElementById('stat-expense').textContent = `${DataManager.formatNumber(stats.expense)} ₽`;
        document.getElementById('stat-balance').textContent = `${DataManager.formatNumber(stats.balance)} ₽`;

        // Обновляем диаграмму
        this.updateChart();
    },

    updateChart() {
        const expenses = DataManager.getExpensesByCategory();
        const canvas = document.getElementById('expenses-chart');
        const emptyMessage = document.getElementById('chart-empty');
        const legendContainer = document.getElementById('chart-legend');

        if (expenses.length === 0) {
            // Нет данных
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            canvas.style.display = 'none';
            emptyMessage.style.display = 'block';
            legendContainer.innerHTML = '';
            return;
        }

        canvas.style.display = 'block';
        emptyMessage.style.display = 'none';

        // Подготовка данных
        const labels = expenses.map(e => e.name);
        const data = expenses.map(e => e.sum);
        const colors = expenses.map(e => e.color);
        const total = data.reduce((a, b) => a + b, 0);

        // Создание/обновление диаграммы
        if (this.chart) {
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = data;
            this.chart.data.datasets[0].backgroundColor = colors;
            this.chart.update();
        } else {
            this.chart = new Chart(canvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#FFFFFF'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed;
                                    const percent = ((value / total) * 100).toFixed(1);
                                    return `${context.label}: ${DataManager.formatNumber(value)} ₽ (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Обновление легенды
        legendContainer.innerHTML = '';
        expenses.forEach(exp => {
            const percent = ((exp.sum / total) * 100).toFixed(1);
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <div class="legend-left">
                    <div class="legend-color" style="background-color: ${exp.color}"></div>
                    <span class="legend-emoji">${exp.emoji}</span>
                    <span class="legend-name">${exp.name}</span>
                </div>
                <span class="legend-percent">${percent}%</span>
            `;
            legendContainer.appendChild(item);
        });
    },

    // ========================================
    // TRANSACTIONS
    // ========================================

    initTransactions() {
        // События будут добавлены динамически
    },

    updateTransactions() {
        const transactions = DataManager.getTransactions();
        const container = document.getElementById('transactions-list');
        const emptyMessage = document.getElementById('transactions-empty');
        const monthLabel = document.getElementById('transactions-month-label');

        monthLabel.textContent = DataManager.getMonthName();

        if (transactions.length === 0) {
            container.innerHTML = '';
            emptyMessage.style.display = 'block';
            return;
        }

        emptyMessage.style.display = 'none';
        container.innerHTML = '';

        transactions.forEach(tx => {
            const category = DataManager.getCategory(tx.category) || { emoji: '❓', name: 'Неизвестно' };
            const isIncome = tx.type === 'income';
            
            const item = document.createElement('div');
            item.className = 'transaction-item';
            item.innerHTML = `
                <div class="transaction-emoji">${isIncome ? '💰' : category.emoji}</div>
                <div class="transaction-details">
                    <div class="transaction-category">${isIncome ? 'Доход' : category.name}</div>
                    <div class="transaction-description">${tx.description || '—'}</div>
                    <div class="transaction-date">${DataManager.formatDate(tx.date)}</div>
                </div>
                <div class="transaction-amount ${tx.type}">${isIncome ? '+' : '-'}${DataManager.formatNumber(tx.sum)} ₽</div>
                <div class="transaction-actions">
                    <button class="btn-edit" data-id="${tx.id}">✏️</button>
                    <button class="btn-delete" data-id="${tx.id}">🗑️</button>
                </div>
            `;

            // События
            item.querySelector('.btn-edit').addEventListener('click', () => {
                if (tx.type === 'income') {
                    this.openIncomeModal(tx.id);
                } else {
                    this.openExpenseModal(tx.id);
                }
            });

            item.querySelector('.btn-delete').addEventListener('click', () => {
                this.deleteTransaction(tx.id);
            });

            container.appendChild(item);
        });
    },

    deleteTransaction(id) {
        if (confirm('Вы уверены, что хотите удалить эту операцию?')) {
            DataManager.deleteTransaction(id);
            FirebaseManager.syncCurrentMonth();
            this.refreshAll();
        }
    },

    // ========================================
    // CATEGORIES
    // ========================================

    initCategories() {
        document.getElementById('btn-add-category').addEventListener('click', () => {
            this.openCategoryModal();
        });
    },

    updateCategories() {
        const categories = DataManager.getCategories();
        const container = document.getElementById('categories-list');
        container.innerHTML = '';

        Object.entries(categories).forEach(([id, cat]) => {
            const spent = DataManager.getCategorySpent(id);
            
            const item = document.createElement('div');
            item.className = 'category-item';
            item.innerHTML = `
                <div class="category-emoji">${cat.emoji}</div>
                <div class="category-details">
                    <div class="category-name">${cat.name}</div>
                    <div class="category-spent">Потрачено: ${DataManager.formatNumber(spent)} ₽</div>
                    ${cat.limit > 0 ? `<div class="category-limit">Лимит: ${DataManager.formatNumber(cat.limit)} ₽</div>` : ''}
                </div>
                <div class="category-actions">
                    <button class="btn-edit" data-id="${id}">✏️</button>
                    <button class="btn-delete" data-id="${id}">🗑️</button>
                </div>
            `;

            // События
            item.querySelector('.btn-edit').addEventListener('click', () => {
                this.openCategoryModal(id);
            });

            item.querySelector('.btn-delete').addEventListener('click', () => {
                this.deleteCategory(id);
            });

            container.appendChild(item);
        });
    },

    deleteCategory(id) {
        if (confirm('Вы уверены? Все операции этой категории будут перенесены в "Прочее".')) {
            DataManager.deleteCategory(id);
            FirebaseManager.syncCurrentMonth();
            this.refreshAll();
        }
    },

    // ========================================
    // SETTINGS
    // ========================================

    initSettings() {
        document.getElementById('btn-sync-now').addEventListener('click', () => {
            FirebaseManager.syncNow();
        });

        document.getElementById('btn-share').addEventListener('click', () => {
            this.shareLink();
        });

        document.getElementById('btn-clear-data').addEventListener('click', () => {
            this.clearData();
        });
    },

    updateSettings() {
        const stats = DataManager.getAllTimeStats();

        document.getElementById('total-income').textContent = `${DataManager.formatNumber(stats.totalIncome)} ₽`;
        document.getElementById('total-expenses').textContent = `${DataManager.formatNumber(stats.totalExpense)} ₽`;
        document.getElementById('avg-income').textContent = `${DataManager.formatNumber(stats.avgIncome)} ₽`;
        document.getElementById('avg-expenses').textContent = `${DataManager.formatNumber(stats.avgExpense)} ₽`;

        document.getElementById('firebase-status').textContent = FirebaseManager.isConnected ? '✅ Подключен' : '❌ Ошибка';
        document.getElementById('device-id').textContent = DataManager.getDeviceId();

        if (FirebaseManager.lastSyncTime) {
            const hours = String(FirebaseManager.lastSyncTime.getHours()).padStart(2, '0');
            const minutes = String(FirebaseManager.lastSyncTime.getMinutes()).padStart(2, '0');
            document.getElementById('last-sync-time').textContent = `${hours}:${minutes}`;
        }
    },

    shareLink() {
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'Семейный Бюджет Янцен',
                text: 'Присоединяйся к семейному бюджету',
                url: url
            }).catch(() => {});
        } else {
            // Копируем в буфер
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            alert('Ссылка скопирована в буфер обмена!');
        }
    },
    
    exportDataAsText() {
        const data = localStorage.getItem('familyBudgetData') || '{}';
        const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'family-budget-backup.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    },

    clearData() {
        if (confirm('ВЫ УВЕРЕНЫ? Это удалит ВСЕ данные безвозвратно!')) {
            if (confirm('ЭТО ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ! Все данные будут удалены!')) {
                DataManager.clearAllData();
                FirebaseManager.syncCurrentMonth();
                this.refreshAll();
                alert('Все данные удалены.');
            }
        }
    },

    // ========================================
    // MODALS
    // ========================================

    initModals() {
        // Закрытие модалей
        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                this.closeModal(modalId);
            });
        });

        // Закрытие по клику на фон
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Закрытие по Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });

        // Сохранение расхода
        document.getElementById('btn-save-expense').addEventListener('click', () => {
            this.saveExpense();
        });

        // Сохранение дохода
        document.getElementById('btn-save-income').addEventListener('click', () => {
            this.saveIncome();
        });

        // Сохранение категории
        document.getElementById('btn-save-category').addEventListener('click', () => {
            this.saveCategory();
        });
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Сброс форм
        if (modalId === 'modal-expense') {
            DataManager.editingTransactionId = null;
            document.getElementById('expense-sum').value = '';
            document.getElementById('expense-category').value = '';
            document.getElementById('expense-description').value = '';
            document.getElementById('expense-date').value = DataManager.getCurrentDate();
        } else if (modalId === 'modal-income') {
            DataManager.editingTransactionId = null;
            document.getElementById('income-sum').value = '';
            document.getElementById('income-description').value = '';
            document.getElementById('income-date').value = DataManager.getCurrentDate();
        } else if (modalId === 'modal-category') {
            DataManager.editingCategoryId = null;
            document.getElementById('category-name').value = '';
            document.getElementById('category-emoji').value = '';
            document.getElementById('category-color').value = '#6B7280';
            document.getElementById('category-limit').value = '0';
        }
    },

    // EXPENSE MODAL
    openExpenseModal(transactionId = null) {
        const modal = document.getElementById('modal-expense');
        const title = document.getElementById('modal-expense-title');
        
        // Заполняем список категорий
        const categories = DataManager.getCategories();
        const select = document.getElementById('expense-category');
        select.innerHTML = '';
        
        Object.entries(categories).forEach(([id, cat]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${cat.emoji} ${cat.name}`;
            select.appendChild(option);
        });

        if (transactionId) {
            // Режим редактирования
            title.textContent = '✏️ Редактировать расход';
            DataManager.editingTransactionId = transactionId;
            
            const tx = DataManager.getTransaction(transactionId);
            if (tx) {
                document.getElementById('expense-sum').value = tx.sum;
                document.getElementById('expense-category').value = tx.category;
                document.getElementById('expense-description').value = tx.description;
                document.getElementById('expense-date').value = tx.date;
            }
        } else {
            // Режим добавления
            title.textContent = '💸 Добавить расход';
            DataManager.editingTransactionId = null;
            document.getElementById('expense-sum').value = '';
            document.getElementById('expense-description').value = '';
            document.getElementById('expense-date').value = DataManager.getCurrentDate();
        }

        this.openModal('modal-expense');
    },

    saveExpense() {
        const sum = document.getElementById('expense-sum').value;
        const category = document.getElementById('expense-category').value;
        const description = document.getElementById('expense-description').value;
        const date = document.getElementById('expense-date').value;

        if (!sum || !category || !date) {
            alert('Заполните обязательные поля!');
            return;
        }

        if (DataManager.editingTransactionId) {
            // Редактирование
            DataManager.updateTransaction(DataManager.editingTransactionId, 'expense', sum, category, description, date);
        } else {
            // Добавление
            DataManager.addTransaction('expense', sum, category, description, date);
        }

        // Синхронизация
        FirebaseManager.syncCurrentMonth();

        this.closeModal('modal-expense');
        this.refreshAll();
    },

    // INCOME MODAL
    openIncomeModal(transactionId = null) {
        const modal = document.getElementById('modal-income');
        const title = document.getElementById('modal-income-title');

        if (transactionId) {
            // Режим редактирования
            title.textContent = '✏️ Редактировать доход';
            DataManager.editingTransactionId = transactionId;
            
            const tx = DataManager.getTransaction(transactionId);
            if (tx) {
                document.getElementById('income-sum').value = tx.sum;
                document.getElementById('income-description').value = tx.description;
                document.getElementById('income-date').value = tx.date;
            }
        } else {
            // Режим добавления
            title.textContent = '💵 Добавить доход';
            DataManager.editingTransactionId = null;
            document.getElementById('income-sum').value = '';
            document.getElementById('income-description').value = '';
            document.getElementById('income-date').value = DataManager.getCurrentDate();
        }

        this.openModal('modal-income');
    },

    saveIncome() {
        const sum = document.getElementById('income-sum').value;
        const description = document.getElementById('income-description').value;
        const date = document.getElementById('income-date').value;

        if (!sum || !date) {
            alert('Заполните обязательные поля!');
            return;
        }

        if (DataManager.editingTransactionId) {
            // Редактирование
            DataManager.updateTransaction(DataManager.editingTransactionId, 'income', sum, 'income', description, date);
        } else {
            // Добавление
            DataManager.addTransaction('income', sum, 'income', description, date);
        }

        // Синхронизация
        FirebaseManager.syncCurrentMonth();

        this.closeModal('modal-income');
        this.refreshAll();
    },

    // CATEGORY MODAL
    openCategoryModal(categoryId = null) {
        const modal = document.getElementById('modal-category');
        const title = document.getElementById('modal-category-title');

        if (categoryId) {
            // Режим редактирования
            title.textContent = '✏️ Редактировать категорию';
            DataManager.editingCategoryId = categoryId;
            
            const cat = DataManager.getCategory(categoryId);
            if (cat) {
                document.getElementById('category-name').value = cat.name;
                document.getElementById('category-emoji').value = cat.emoji;
                document.getElementById('category-color').value = cat.color;
                document.getElementById('category-limit').value = cat.limit;
            }
        } else {
            // Режим добавления
            title.textContent = '➕ Добавить категорию';
            DataManager.editingCategoryId = null;
            document.getElementById('category-name').value = '';
            document.getElementById('category-emoji').value = '📌';
            document.getElementById('category-color').value = '#6B7280';
            document.getElementById('category-limit').value = '0';
        }

        this.openModal('modal-category');
    },

    saveCategory() {
        const name = document.getElementById('category-name').value;
        const emoji = document.getElementById('category-emoji').value;
        const color = document.getElementById('category-color').value;
        const limit = document.getElementById('category-limit').value;

        if (!name) {
            alert('Введите название категории!');
            return;
        }

        if (DataManager.editingCategoryId) {
            // Редактирование
            DataManager.updateCategory(DataManager.editingCategoryId, name, emoji, color, limit);
        } else {
            // Добавление
            DataManager.addCategory(name, emoji, color, limit);
        }

        // Синхронизация
        FirebaseManager.syncCurrentMonth();

        this.closeModal('modal-category');
        this.refreshAll();
    },

    // ========================================
    // ОБНОВЛЕНИЕ ВСЕГО UI
    // ========================================

    refreshAll() {
        this.updateDashboard();
        if (this.currentScreen === 'transactions') {
            this.updateTransactions();
        } else if (this.currentScreen === 'categories') {
            this.updateCategories();
        } else if (this.currentScreen === 'settings') {
            this.updateSettings();
        }
    }
};

// ========================================
// ЗАПУСК ПРИЛОЖЕНИЯ
// ========================================

// Ждем загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        UI.init();
    });
} else {
    UI.init();
}

// Экспорт для доступа из других модулей
window.UI = UI;
