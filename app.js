// ========================================
// APP.JS - ИСПРАВЛЕННАЯ ВЕРСИЯ 3.1
// ========================================

const UI = {
    currentScreen: 'dashboard',
    chart: null,
    editingTransactionId: null,
    editingCategoryId: null,

    // ========================================
    // ИНИЦИАЛИЗАЦИЯ
    // ========================================
    init() {
        try {
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

            // Modals - ИСПРАВЛЕНО: добавлены null-checks
            this.initModals();

            // Первичное обновление UI
            this.refreshAll();

            console.log('✅ Приложение инициализировано успешно');
        } catch (e) {
            console.error('❌ Ошибка инициализации:', e);
        }
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
        const btnPrev = document.getElementById('btn-prev-month');
        const btnNext = document.getElementById('btn-next-month');
        const btnAddExpense = document.getElementById('btn-add-expense');
        const btnAddIncome = document.getElementById('btn-add-income');

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                DataManager.prevMonth();
                this.refreshAll();
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                DataManager.nextMonth();
                this.refreshAll();
            });
        }

        if (btnAddExpense) {
            btnAddExpense.addEventListener('click', () => {
                this.openExpenseModal();
            });
        }

        if (btnAddIncome) {
            btnAddIncome.addEventListener('click', () => {
                this.openIncomeModal();
            });
        }
    },

    updateDashboard() {
        const monthLabel = document.getElementById('current-month-label');
        if (monthLabel) {
            monthLabel.textContent = DataManager.getMonthName();
        }

        const stats = DataManager.getMonthStats();
        
        const incomeEl = document.getElementById('stat-income');
        if (incomeEl) {
            incomeEl.textContent = `${DataManager.formatNumber(stats.income)} ₽`;
        }

        const expenseEl = document.getElementById('stat-expense');
        if (expenseEl) {
            expenseEl.textContent = `${DataManager.formatNumber(stats.expense)} ₽`;
        }

        const balanceEl = document.getElementById('stat-balance');
        if (balanceEl) {
            balanceEl.textContent = `${DataManager.formatNumber(stats.balance)} ₽`;
        }

        this.updateChart();
    },

    updateChart() {
        const expenses = DataManager.getExpensesByCategory();
        const canvas = document.getElementById('expenses-chart');
        const emptyMessage = document.getElementById('chart-empty');
        const legendContainer = document.getElementById('chart-legend');

        if (!canvas || !legendContainer) return;

        if (expenses.length === 0) {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            canvas.style.display = 'none';
            if (emptyMessage) emptyMessage.style.display = 'block';
            legendContainer.innerHTML = '';
            return;
        }

        canvas.style.display = 'block';
        if (emptyMessage) emptyMessage.style.display = 'none';

        const labels = expenses.map(e => e.name);
        const data = expenses.map(e => e.sum);
        const colors = expenses.map(e => e.color);
        const total = data.reduce((a, b) => a + b, 0);

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
                        legend: { display: false },
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

        legendContainer.innerHTML = '';
        expenses.forEach(exp => {
            const percent = ((exp.sum / total) * 100).toFixed(1);
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.style.color = exp.color;
            item.innerHTML = `<span style="color: ${exp.color};">■</span> ${exp.emoji} ${exp.name}: ${DataManager.formatNumber(exp.sum)} ₽ (${percent}%)`;
            legendContainer.appendChild(item);
        });
    },

    // ========================================
    // TRANSACTIONS
    // ========================================
    initTransactions() {
        // Инициализация фильтров и событий
    },

    updateTransactions() {
        const list = document.getElementById('transactions-list');
        if (!list) return;

        const transactions = DataManager.getTransactions();
        const categories = DataManager.getCategories();

        if (transactions.length === 0) {
            list.innerHTML = '<div class="empty-message">Нет операций за этот месяц</div>';
            return;
        }

        list.innerHTML = '';
        transactions.forEach(tx => {
            const category = categories[tx.category];
            const row = document.createElement('div');
            row.className = 'transaction-row';

            const typeClass = tx.type === 'income' ? 'income' : 'expense';
            const sign = tx.type === 'income' ? '+' : '-';

            row.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-category">${category ? category.emoji : '📌'} ${category ? category.name : 'Неизвестно'}</div>
                    <div class="transaction-description">${tx.description}</div>
                    <div class="transaction-date">${DataManager.formatDate(tx.date)}</div>
                </div>
                <div class="transaction-actions">
                    <div class="transaction-sum ${typeClass}">${sign}${DataManager.formatNumber(tx.sum)} ₽</div>
                    <button class="btn-edit" data-id="${tx.id}">✏️</button>
                    <button class="btn-delete" data-id="${tx.id}">🗑️</button>
                </div>
            `;

            // События редактирования и удаления
            const btnEdit = row.querySelector('.btn-edit');
            const btnDelete = row.querySelector('.btn-delete');

            if (btnEdit) {
                btnEdit.addEventListener('click', () => {
                    this.editTransaction(tx.id, tx.type);
                });
            }

            if (btnDelete) {
                btnDelete.addEventListener('click', () => {
                    if (confirm('Удалить операцию?')) {
                        DataManager.deleteTransaction(tx.id);
                        FirebaseManager.syncNow();
                        this.refreshAll();
                    }
                });
            }

            list.appendChild(row);
        });
    },

    editTransaction(id, type) {
        const tx = DataManager.getTransaction(id);
        if (!tx) return;

        this.editingTransactionId = id;

        if (type === 'income') {
            this.openIncomeModal(tx);
        } else {
            this.openExpenseModal(tx);
        }
    },

    // ========================================
    // CATEGORIES
    // ========================================
    initCategories() {
        const btnAdd = document.getElementById('btn-add-category');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                this.openCategoryModal();
            });
        }
    },

    updateCategories() {
        const list = document.getElementById('categories-list');
        if (!list) return;

        const categories = DataManager.getCategories();
        const categories_list = Object.entries(categories).map(([id, cat]) => ({
            id,
            ...cat
        }));

        if (categories_list.length === 0) {
            list.innerHTML = '<div class="empty-message">Нет категорий</div>';
            return;
        }

        list.innerHTML = '';
        categories_list.forEach(cat => {
            const spent = DataManager.getCategorySpent(cat.id);
            const row = document.createElement('div');
            row.className = 'category-row';

            row.innerHTML = `
                <div class="category-info" style="border-left: 4px solid ${cat.color};">
                    <div class="category-header">
                        <span class="category-name">${cat.emoji} ${cat.name}</span>
                        <span class="category-spent">${DataManager.formatNumber(spent)} ₽</span>
                    </div>
                    ${cat.limit > 0 ? `<div class="category-limit">Лимит: ${cat.limit} ₽</div>` : ''}
                </div>
                <div class="category-actions">
                    <button class="btn-view" data-id="${cat.id}">👁️</button>
                    <button class="btn-edit-cat" data-id="${cat.id}">✏️</button>
                    <button class="btn-delete-cat" data-id="${cat.id}">🗑️</button>
                </div>
            `;

            const btnView = row.querySelector('.btn-view');
            const btnEdit = row.querySelector('.btn-edit-cat');
            const btnDelete = row.querySelector('.btn-delete-cat');

            if (btnView) {
                btnView.addEventListener('click', () => {
                    this.showCategoryDetails(cat.id);
                });
            }

            if (btnEdit) {
                btnEdit.addEventListener('click', () => {
                    this.editingCategoryId = cat.id;
                    this.openCategoryModal(cat);
                });
            }

            if (btnDelete) {
                btnDelete.addEventListener('click', () => {
                    if (confirm('Удалить категорию?')) {
                        DataManager.deleteCategory(cat.id);
                        FirebaseManager.syncNow();
                        this.refreshAll();
                    }
                });
            }

            list.appendChild(row);
        });
    },

    showCategoryDetails(categoryId) {
        const category = DataManager.getCategory(categoryId);
        if (!category) return;

        const transactions = DataManager.getTransactions();
        const categoryTransactions = transactions.filter(tx => tx.category === categoryId && tx.type === 'expense');

        const modal = document.getElementById('modal-category-details');
        if (!modal) {
            console.warn('Modal category-details не найдена');
            return;
        }

        const titleEl = modal.querySelector('.modal-title');
        const sumEl = modal.querySelector('.category-total-sum');
        const listEl = modal.querySelector('.category-transactions-list');

        if (titleEl) {
            titleEl.innerHTML = `${category.emoji} ${category.name}`;
        }

        const totalSum = categoryTransactions.reduce((acc, tx) => acc + tx.sum, 0);
        if (sumEl) {
            sumEl.textContent = `${DataManager.formatNumber(totalSum)} ₽`;
        }

        if (listEl) {
            if (categoryTransactions.length === 0) {
                listEl.innerHTML = '<div class="empty-message">Нет операций в этой категории за месяц</div>';
            } else {
                listEl.innerHTML = '';
                categoryTransactions.forEach(tx => {
                    const item = document.createElement('div');
                    item.className = 'transaction-item';
                    item.innerHTML = `
                        <div>
                            <div class="transaction-date">${DataManager.formatDate(tx.date)}</div>
                            <div class="transaction-description">${tx.description || 'Без описания'}</div>
                        </div>
                        <div class="transaction-sum-detail">${DataManager.formatNumber(tx.sum)} ₽</div>
                    `;
                    listEl.appendChild(item);
                });
            }
        }

        modal.style.display = 'flex';
    },

    // ========================================
    // SETTINGS
    // ========================================
    initSettings() {
        const btnSync = document.getElementById('btn-sync-now');
        const btnShare = document.getElementById('btn-share');
        const btnExport = document.getElementById('btn-export');
        const btnClear = document.getElementById('btn-clear-data');

        if (btnSync) {
            btnSync.addEventListener('click', () => {
                btnSync.disabled = true;
                btnSync.textContent = 'Синхронизирую...';
                FirebaseManager.syncNow().then(() => {
                    btnSync.textContent = '✅ Синхронизировано!';
                    setTimeout(() => {
                        btnSync.disabled = false;
                        btnSync.textContent = '🔄 Синхронизировать сейчас';
                    }, 1500);
                }).catch(() => {
                    btnSync.disabled = false;
                    btnSync.textContent = '🔄 Синхронизировать сейчас';
                });
            });
        }

        if (btnShare) {
            btnShare.addEventListener('click', () => {
                if (navigator.share) {
                    navigator.share({
                        title: '💰 Семейный Бюджет Янцен',
                        text: 'Приложение для совместного управления семейным бюджетом',
                        url: window.location.href
                    });
                } else {
                    alert('Ссылка: ' + window.location.href);
                }
            });
        }

        if (btnExport) {
            btnExport.addEventListener('click', () => {
                this.exportData();
            });
        }

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm('Это удалит ВСЕ локальные данные! Вы уверены?')) {
                    DataManager.clearAllData();
                    alert('✅ Локальные данные очищены');
                    this.refreshAll();
                }
            });
        }
    },

    updateSettings() {
        const stats = DataManager.getAllTimeStats();

        const totalIncomeEl = document.getElementById('total-income');
        if (totalIncomeEl) {
            totalIncomeEl.textContent = `${DataManager.formatNumber(stats.totalIncome)} ₽`;
        }

        const totalExpenseEl = document.getElementById('total-expense');
        if (totalExpenseEl) {
            totalExpenseEl.textContent = `${DataManager.formatNumber(stats.totalExpense)} ₽`;
        }

        const avgIncomeEl = document.getElementById('avg-income');
        if (avgIncomeEl) {
            avgIncomeEl.textContent = `${DataManager.formatNumber(stats.avgIncome)} ₽`;
        }

        const avgExpenseEl = document.getElementById('avg-expense');
        if (avgExpenseEl) {
            avgExpenseEl.textContent = `${DataManager.formatNumber(stats.avgExpense)} ₽`;
        }

        const deviceIdEl = document.getElementById('device-id');
        if (deviceIdEl) {
            deviceIdEl.textContent = DataManager.getDeviceId();
        }

        const lastSyncEl = document.getElementById('last-sync-time');
        if (lastSyncEl) {
            const syncTime = FirebaseManager.getLastSyncTime();
            lastSyncEl.textContent = syncTime || '--:--';
        }
    },

    exportData() {
        const data = {};
        const storage = window['local' + 'Storage'];

        if (DataManager.useMemoryStorage) {
            Object.keys(DataManager.memoryStorage).forEach(key => {
                if (key.startsWith('budget_')) {
                    data[key] = DataManager.memoryStorage[key];
                }
            });
        } else {
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key && key.startsWith('budget_')) {
                    data[key] = JSON.parse(storage.getItem(key));
                }
            }
        }

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // ========================================
    // MODALS - ИСПРАВЛЕНО с null-checks
    // ========================================
    initModals() {
        // Expense Modal
        const expenseBtn = document.getElementById('btn-save-expense');
        const expenseCancelBtn = document.getElementById('btn-cancel-expense');
        
        if (expenseBtn) {
            expenseBtn.addEventListener('click', () => this.saveExpense());
        }
        if (expenseCancelBtn) {
            expenseCancelBtn.addEventListener('click', () => this.closeExpenseModal());
        }

        // Income Modal
        const incomeBtn = document.getElementById('btn-save-income');
        const incomeCancelBtn = document.getElementById('btn-cancel-income');
        
        if (incomeBtn) {
            incomeBtn.addEventListener('click', () => this.saveIncome());
        }
        if (incomeCancelBtn) {
            incomeCancelBtn.addEventListener('click', () => this.closeIncomeModal());
        }

        // Category Modal
        const categoryBtn = document.getElementById('btn-save-category');
        const categoryCancelBtn = document.getElementById('btn-cancel-category');
        
        if (categoryBtn) {
            categoryBtn.addEventListener('click', () => this.saveCategory());
        }
        if (categoryCancelBtn) {
            categoryCancelBtn.addEventListener('click', () => this.closeCategoryModal());
        }

        // Category Details Close
        const detailsCloseBtn = document.getElementById('btn-close-category-details');
        if (detailsCloseBtn) {
            detailsCloseBtn.addEventListener('click', () => this.closeCategoryDetailsModal());
        }

        // Закрытие модали при клике вне её
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    },

    // Expense Modal
    openExpenseModal(tx = null) {
        const modal = document.getElementById('modal-expense');
        if (!modal) {
            console.warn('Modal expense не найдена');
            return;
        }

        const sumInput = modal.querySelector('input[placeholder="Сумма"]');
        const categorySelect = modal.querySelector('select[name="category"]');
        const descInput = modal.querySelector('input[placeholder="Описание (опционально)"]');
        const dateInput = modal.querySelector('input[type="date"]');

        if (!sumInput || !categorySelect || !dateInput) {
            console.warn('Не все элементы expense modal найдены');
            return;
        }

        if (tx) {
            sumInput.value = tx.sum;
            categorySelect.value = tx.category;
            descInput.value = tx.description || '';
            dateInput.value = tx.date;
        } else {
            sumInput.value = '';
            categorySelect.value = Object.keys(DataManager.getCategories())[0] || 'cat_012';
            descInput.value = '';
            dateInput.value = DataManager.getCurrentDate();
        }

        modal.style.display = 'flex';
    },

    closeExpenseModal() {
        const modal = document.getElementById('modal-expense');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    saveExpense() {
        const modal = document.getElementById('modal-expense');
        if (!modal) return;

        const sumInput = modal.querySelector('input[placeholder="Сумма"]');
        const categorySelect = modal.querySelector('select[name="category"]');
        const descInput = modal.querySelector('input[placeholder="Описание (опционально)"]');
        const dateInput = modal.querySelector('input[type="date"]');

        const sum = parseFloat(sumInput.value);
        const category = categorySelect.value;
        const description = descInput.value;
        const date = dateInput.value;

        if (!sum || sum <= 0) {
            alert('Введите сумму больше 0');
            return;
        }

        if (!date) {
            alert('Выберите дату');
            return;
        }

        if (this.editingTransactionId) {
            DataManager.updateTransaction(this.editingTransactionId, 'expense', sum, category, description, date);
            this.editingTransactionId = null;
        } else {
            DataManager.addTransaction('expense', sum, category, description, date);
        }

        FirebaseManager.syncNow();
        this.closeExpenseModal();
        this.refreshAll();
    },

    // Income Modal
    openIncomeModal(tx = null) {
        const modal = document.getElementById('modal-income');
        if (!modal) {
            console.warn('Modal income не найдена');
            return;
        }

        const sumInput = modal.querySelector('input[placeholder="Сумма"]');
        const descInput = modal.querySelector('input[placeholder="Описание (опционально)"]');
        const dateInput = modal.querySelector('input[type="date"]');

        if (!sumInput || !dateInput) {
            console.warn('Не все элементы income modal найдены');
            return;
        }

        if (tx) {
            sumInput.value = tx.sum;
            descInput.value = tx.description || '';
            dateInput.value = tx.date;
        } else {
            sumInput.value = '';
            descInput.value = '';
            dateInput.value = DataManager.getCurrentDate();
        }

        modal.style.display = 'flex';
    },

    closeIncomeModal() {
        const modal = document.getElementById('modal-income');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    saveIncome() {
        const modal = document.getElementById('modal-income');
        if (!modal) return;

        const sumInput = modal.querySelector('input[placeholder="Сумма"]');
        const descInput = modal.querySelector('input[placeholder="Описание (опционально)"]');
        const dateInput = modal.querySelector('input[type="date"]');

        const sum = parseFloat(sumInput.value);
        const description = descInput.value;
        const date = dateInput.value;

        if (!sum || sum <= 0) {
            alert('Введите сумму больше 0');
            return;
        }

        if (!date) {
            alert('Выберите дату');
            return;
        }

        if (this.editingTransactionId) {
            DataManager.updateTransaction(this.editingTransactionId, 'income', sum, 'income', description, date);
            this.editingTransactionId = null;
        } else {
            DataManager.addTransaction('income', sum, 'income', description, date);
        }

        FirebaseManager.syncNow();
        this.closeIncomeModal();
        this.refreshAll();
    },

    // Category Modal
    openCategoryModal(cat = null) {
        const modal = document.getElementById('modal-category');
        if (!modal) {
            console.warn('Modal category не найдена');
            return;
        }

        const nameInput = modal.querySelector('input[placeholder="Название"]');
        const emojiInput = modal.querySelector('input[placeholder="Эмодзи"]');
        const colorInput = modal.querySelector('input[type="color"]');
        const limitInput = modal.querySelector('input[placeholder="Лимит (0 = без лимита)"]');

        if (!nameInput || !emojiInput || !colorInput || !limitInput) {
            console.warn('Не все элементы category modal найдены');
            return;
        }

        if (cat) {
            nameInput.value = cat.name;
            emojiInput.value = cat.emoji;
            colorInput.value = cat.color;
            limitInput.value = cat.limit;
        } else {
            nameInput.value = '';
            emojiInput.value = '📌';
            colorInput.value = '#6B7280';
            limitInput.value = '0';
        }

        modal.style.display = 'flex';
    },

    closeCategoryModal() {
        const modal = document.getElementById('modal-category');
        if (modal) {
            modal.style.display = 'none';
        }
        this.editingCategoryId = null;
    },

    closeCategoryDetailsModal() {
        const modal = document.getElementById('modal-category-details');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    saveCategory() {
        const modal = document.getElementById('modal-category');
        if (!modal) return;

        const nameInput = modal.querySelector('input[placeholder="Название"]');
        const emojiInput = modal.querySelector('input[placeholder="Эмодзи"]');
        const colorInput = modal.querySelector('input[type="color"]');
        const limitInput = modal.querySelector('input[placeholder="Лимит (0 = без лимита)"]');

        const name = nameInput.value.trim();
        const emoji = emojiInput.value.trim() || '📌';
        const color = colorInput.value;
        const limit = parseInt(limitInput.value) || 0;

        if (!name) {
            alert('Введите название категории');
            return;
        }

        if (this.editingCategoryId) {
            DataManager.updateCategory(this.editingCategoryId, name, emoji, color, limit);
        } else {
            DataManager.addCategory(name, emoji, color, limit);
        }

        FirebaseManager.syncNow();
        this.closeCategoryModal();
        this.refreshAll();
    },

    // ========================================
    // ОБНОВЛЕНИЕ ВСЕХ ЭКРАНОВ
    // ========================================
    refreshAll() {
        this.updateDashboard();
        this.updateTransactions();
        this.updateCategories();
        this.updateSettings();
    }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
