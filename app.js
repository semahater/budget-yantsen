// ========================================
// APP.JS - Инициализация и управление UI
// ИСПРАВЛЕННАЯ ВЕРСИЯ С NULL-CHECKS И ДЕТАЛЯМИ КАТЕГОРИИ
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
            if (btn) {  // ← NULL-CHECK
                btn.addEventListener('click', () => {
                    const screen = btn.dataset.screen;
                    this.switchScreen(screen);
                });
            }
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
        const btnPrevMonth = document.getElementById('btn-prev-month');
        if (btnPrevMonth) {  // ← NULL-CHECK
            btnPrevMonth.addEventListener('click', () => {
                DataManager.prevMonth();
                this.refreshAll();
            });
        }

        const btnNextMonth = document.getElementById('btn-next-month');
        if (btnNextMonth) {  // ← NULL-CHECK
            btnNextMonth.addEventListener('click', () => {
                DataManager.nextMonth();
                this.refreshAll();
            });
        }

        // Кнопки добавления
        const btnAddExpense = document.getElementById('btn-add-expense');
        if (btnAddExpense) {  // ← NULL-CHECK
            btnAddExpense.addEventListener('click', () => {
                this.openExpenseModal();
            });
        }

        const btnAddIncome = document.getElementById('btn-add-income');
        if (btnAddIncome) {  // ← NULL-CHECK
            btnAddIncome.addEventListener('click', () => {
                this.openIncomeModal();
            });
        }
    },

    updateDashboard() {
        // Обновляем название месяца
        const monthLabel = document.getElementById('current-month-label');
        if (monthLabel) {
            monthLabel.textContent = DataManager.getMonthName();
        }

        // Обновляем статистику
        const stats = DataManager.getMonthStats();
        
        const statIncome = document.getElementById('stat-income');
        if (statIncome) {
            statIncome.textContent = `${DataManager.formatNumber(stats.income)} ₽`;
        }

        const statExpense = document.getElementById('stat-expense');
        if (statExpense) {
            statExpense.textContent = `${DataManager.formatNumber(stats.expense)} ₽`;
        }

        const statBalance = document.getElementById('stat-balance');
        if (statBalance) {
            statBalance.textContent = `${DataManager.formatNumber(stats.balance)} ₽`;
        }

        // Обновляем диаграмму
        this.updateChart();
    },

    updateChart() {
        const expenses = DataManager.getExpensesByCategory();
        const canvas = document.getElementById('expenses-chart');
        const emptyMessage = document.getElementById('chart-empty');
        const legendContainer = document.getElementById('chart-legend');

        if (!canvas || !emptyMessage || !legendContainer) {
            return;
        }

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
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px;">
                    <div style="width: 12px; height: 12px; background: ${exp.color}; border-radius: 2px;"></div>
                    <span style="flex: 1;">${exp.emoji} ${exp.name}</span>
                    <span style="font-weight: 600;">${DataManager.formatNumber(exp.sum)} ₽</span>
                </div>
            `;
            legendContainer.appendChild(item);
        });
    },

    // ========================================
    // ТРАНЗАКЦИИ
    // ========================================
    initTransactions() {
        const btnAddTransaction = document.getElementById('btn-add-transaction');
        if (btnAddTransaction) {  // ← NULL-CHECK
            btnAddTransaction.addEventListener('click', () => {
                this.openExpenseModal();
            });
        }
    },

    updateTransactions() {
        const transactions = DataManager.getTransactions();
        const container = document.getElementById('transactions-list');

        if (!container) return;

        container.innerHTML = '';

        if (transactions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Нет операций за этот месяц</p>';
            return;
        }

        transactions.forEach(tx => {
            const category = DataManager.getCategory(tx.category);
            const item = document.createElement('div');
            item.className = 'transaction-item';
            item.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #eee;
                background: white;
                margin-bottom: 8px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            `;

            const categoryEmoji = category ? category.emoji : '📌';
            const categoryName = category ? category.name : 'Неизвестная';
            const typeLabel = tx.type === 'income' ? '+' : '−';
            const typeColor = tx.type === 'income' ? '#10B981' : '#EF4444';

            item.innerHTML = `
                <div>
                    <div style="font-weight: 600;">${categoryEmoji} ${categoryName}</div>
                    <div style="font-size: 12px; color: #999;">${tx.description || 'Без описания'}</div>
                    <div style="font-size: 11px; color: #999;">${DataManager.formatDate(tx.date)}</div>
                </div>
                <div style="font-weight: 700; color: ${typeColor}; font-size: 16px;">
                    ${typeLabel}${DataManager.formatNumber(tx.sum)} ₽
                </div>
            `;

            // Добавляем обработчик для удаления по клику
            item.addEventListener('click', () => {
                if (confirm('Удалить эту транзакцию?')) {
                    DataManager.deleteTransaction(tx.id);
                    this.refreshAll();
                }
            });

            container.appendChild(item);
        });
    },

    // ========================================
    // КАТЕГОРИИ
    // ========================================
    initCategories() {
        const btnAddCategory = document.getElementById('btn-add-category');
        if (btnAddCategory) {  // ← NULL-CHECK
            btnAddCategory.addEventListener('click', () => {
                this.openCategoryModal();
            });
        }
    },

    updateCategories() {
        const categories = DataManager.getCategories();
        const container = document.getElementById('categories-list');

        if (!container) return;

        container.innerHTML = '';

        Object.entries(categories).forEach(([catId, category]) => {
            const spent = DataManager.getCategorySpent(catId);
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #eee;
                background: white;
                margin-bottom: 8px;
                border-radius: 8px;
            `;

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <span style="font-size: 24px;">${category.emoji}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">${category.name}</div>
                        <div style="font-size: 12px; color: #999;">Потрачено: ${DataManager.formatNumber(spent)} ₽</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-view-category" data-id="${catId}" style="background: none; border: 1px solid #ddd; padding: 6px 10px; border-radius: 4px; cursor: pointer;">👁️</button>
                    <button class="btn-edit-category" data-id="${catId}" style="background: none; border: 1px solid #ddd; padding: 6px 10px; border-radius: 4px; cursor: pointer;">✏️</button>
                    <button class="btn-delete-category" data-id="${catId}" style="background: none; border: 1px solid #ddd; padding: 6px 10px; border-radius: 4px; cursor: pointer;">🗑️</button>
                </div>
            `;

            container.appendChild(item);

            // Кнопка просмотра
            const viewBtn = item.querySelector('.btn-view-category');
            if (viewBtn) {  // ← NULL-CHECK
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openCategoryDetails(catId);
                });
            }

            // Кнопка редактирования
            const editBtn = item.querySelector('.btn-edit-category');
            if (editBtn) {  // ← NULL-CHECK
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    DataManager.editingCategoryId = catId;
                    this.openCategoryModal();
                });
            }

            // Кнопка удаления
            const deleteBtn = item.querySelector('.btn-delete-category');
            if (deleteBtn) {  // ← NULL-CHECK
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Удалить категорию?')) {
                        DataManager.deleteCategory(catId);
                        this.refreshAll();
                    }
                });
            }
        });
    },

    // ========================================
    // ДЕТАЛИ КАТЕГОРИИ (НОВОЕ)
    // ========================================
    openCategoryDetails(categoryId) {
        const category = DataManager.getCategory(categoryId);
        if (!category) return;

        const transactions = DataManager.getTransactionsByCategory(categoryId);
        
        const modal = document.getElementById('modal-category-details');
        if (!modal) return;
        
        const categoryName = document.getElementById('category-details-name');
        const categoryEmoji = document.getElementById('category-details-emoji');
        const categoryTotal = document.getElementById('category-details-total');
        const transactionsList = document.getElementById('category-transactions-list');
        
        if (categoryName) categoryName.textContent = category.name;
        if (categoryEmoji) categoryEmoji.textContent = category.emoji;
        
        let total = 0;
        if (transactionsList) {
            transactionsList.innerHTML = '';
            
            if (transactions.length === 0) {
                transactionsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Нет транзакций в этой категории</div>';
            } else {
                transactions.forEach(tx => {
                    total += tx.sum;
                    const item = document.createElement('div');
                    item.style.cssText = `
                        display: flex;
                        justify-content: space-between;
                        padding: 12px;
                        border-bottom: 1px solid #eee;
                    `;
                    item.innerHTML = `
                        <div>
                            <div style="font-weight: 600;">${tx.description || 'Без описания'}</div>
                            <div style="font-size: 12px; color: #999;">${DataManager.formatDate(tx.date)}</div>
                        </div>
                        <div style="font-weight: 600;">${DataManager.formatNumber(tx.sum)} ₽</div>
                    `;
                    transactionsList.appendChild(item);
                });
            }
        }
        
        if (categoryTotal) {
            categoryTotal.textContent = `${DataManager.formatNumber(total)} ₽`;
        }
        
        modal.style.display = 'flex';
    },

    closeCategoryDetails() {
        const modal = document.getElementById('modal-category-details');
        if (modal) {  // ← NULL-CHECK
            modal.style.display = 'none';
        }
    },

    // ========================================
    // ПАРАМЕТРЫ
    // ========================================
    initSettings() {
        const btnSync = document.getElementById('btn-sync-now');
        if (btnSync) {  // ← NULL-CHECK
            btnSync.addEventListener('click', () => {
                FirebaseManager.syncNow();
            });
        }

        const btnClearData = document.getElementById('btn-clear-data');
        if (btnClearData) {  // ← NULL-CHECK
            btnClearData.addEventListener('click', () => {
                if (confirm('Удалить все данные? Это нельзя отменить!')) {
                    DataManager.clearAllData();
                    this.refreshAll();
                }
            });
        }
    },

    updateSettings() {
        const allTimeStats = DataManager.getAllTimeStats();
        
        const totalIncome = document.getElementById('stat-all-time-income');
        if (totalIncome) {
            totalIncome.textContent = `${DataManager.formatNumber(allTimeStats.totalIncome)} ₽`;
        }

        const totalExpense = document.getElementById('stat-all-time-expense');
        if (totalExpense) {
            totalExpense.textContent = `${DataManager.formatNumber(allTimeStats.totalExpense)} ₽`;
        }

        const avgIncome = document.getElementById('stat-avg-income');
        if (avgIncome) {
            avgIncome.textContent = `${DataManager.formatNumber(allTimeStats.avgIncome)} ₽`;
        }

        const avgExpense = document.getElementById('stat-avg-expense');
        if (avgExpense) {
            avgExpense.textContent = `${DataManager.formatNumber(allTimeStats.avgExpense)} ₽`;
        }

        const deviceId = document.getElementById('device-id');
        if (deviceId) {
            deviceId.textContent = DataManager.getDeviceId();
        }
    },

    // ========================================
    // МОДАЛИ
    // ========================================
    initModals() {
        // Закрытие модалей
        document.addEventListener('click', (e) => {
            if (e.target.classList && e.target.classList.contains('modal-overlay')) {
                e.target.style.display = 'none';
            }
        });
    },

    openExpenseModal() {
        const modal = document.getElementById('modal-expense');
        if (modal) {  // ← NULL-CHECK
            modal.style.display = 'flex';
            
            const categorySelect = document.getElementById('modal-expense-category');
            if (categorySelect) {  // ← NULL-CHECK
                categorySelect.innerHTML = '';
                Object.entries(DataManager.getCategories()).forEach(([catId, cat]) => {
                    const option = document.createElement('option');
                    option.value = catId;
                    option.textContent = `${cat.emoji} ${cat.name}`;
                    categorySelect.appendChild(option);
                });
            }

            const dateInput = document.getElementById('modal-expense-date');
            if (dateInput) {  // ← NULL-CHECK
                dateInput.value = DataManager.getCurrentDate();
            }
        }
    },

    closeExpenseModal() {
        const modal = document.getElementById('modal-expense');
        if (modal) {  // ← NULL-CHECK
            modal.style.display = 'none';
        }
    },

    saveExpense() {
        const sumInput = document.getElementById('modal-expense-sum');
        const categorySelect = document.getElementById('modal-expense-category');
        const descriptionInput = document.getElementById('modal-expense-description');
        const dateInput = document.getElementById('modal-expense-date');

        if (!sumInput || !categorySelect || !dateInput) {  // ← NULL-CHECK
            alert('Ошибка: не все поля найдены');
            return;
        }

        const sum = sumInput.value;
        const category = categorySelect.value;
        const description = descriptionInput ? descriptionInput.value : '';
        const date = dateInput.value;

        if (!sum || !category || !date) {
            alert('Заполни все обязательные поля');
            return;
        }

        DataManager.addTransaction('expense', sum, category, description, date);
        this.refreshAll();
        this.closeExpenseModal();

        if (sumInput) sumInput.value = '';
        if (categorySelect) categorySelect.value = '';
        if (descriptionInput) descriptionInput.value = '';
    },

    openIncomeModal() {
        const modal = document.getElementById('modal-income');
        if (modal) {  // ← NULL-CHECK
            modal.style.display = 'flex';
            
            const dateInput = document.getElementById('modal-income-date');
            if (dateInput) {  // ← NULL-CHECK
                dateInput.value = DataManager.getCurrentDate();
            }
        }
    },

    closeIncomeModal() {
        const modal = document.getElementById('modal-income');
        if (modal) {  // ← NULL-CHECK
            modal.style.display = 'none';
        }
    },

    saveIncome() {
        const sumInput = document.getElementById('modal-income-sum');
        const descriptionInput = document.getElementById('modal-income-description');
        const dateInput = document.getElementById('modal-income-date');

        if (!sumInput || !dateInput) {  // ← NULL-CHECK
            alert('Ошибка: не все поля найдены');
            return;
        }

        const sum = sumInput.value;
        const description = descriptionInput ? descriptionInput.value : '';
        const date = dateInput.value;

        if (!sum || !date) {
            alert('Заполни все обязательные поля');
            return;
        }

        DataManager.addTransaction('income', sum, 'income', description, date);
        this.refreshAll();
        this.closeIncomeModal();

        if (sumInput) sumInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
    },

    openCategoryModal() {
        const modal = document.getElementById('modal-category');
        if (modal) {  // ← NULL-CHECK
            modal.style.display = 'flex';
        }
    },

    closeCategoryModal() {
        const modal = document.getElementById('modal-category');
        if (modal) {  // ← NULL-CHECK
            modal.style.display = 'none';
        }
        DataManager.editingCategoryId = null;
    },

    saveCategory() {
        const nameInput = document.getElementById('modal-category-name');
        const emojiInput = document.getElementById('modal-category-emoji');
        const colorInput = document.getElementById('modal-category-color');
        const limitInput = document.getElementById('modal-category-limit');

        if (!nameInput) {  // ← NULL-CHECK
            alert('Ошибка: не все поля найдены');
            return;
        }

        const name = nameInput.value;
        const emoji = emojiInput ? emojiInput.value : '📌';
        const color = colorInput ? colorInput.value : '#6B7280';
        const limit = limitInput ? limitInput.value : 0;

        if (!name) {
            alert('Введи название категории');
            return;
        }

        if (DataManager.editingCategoryId) {
            DataManager.updateCategory(DataManager.editingCategoryId, name, emoji, color, limit);
            DataManager.editingCategoryId = null;
        } else {
            DataManager.addCategory(name, emoji, color, limit);
        }

        this.refreshAll();
        this.closeCategoryModal();

        if (nameInput) nameInput.value = '';
        if (emojiInput) emojiInput.value = '📌';
        if (limitInput) limitInput.value = 0;
    },

    // ========================================
    // ОБЩИЕ МЕТОДЫ
    // ========================================
    refreshAll() {
        this.updateDashboard();
        this.updateTransactions();
        this.updateCategories();
        this.updateSettings();
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
