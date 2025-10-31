// UI.JS - Управление интерфейсом
class BudgetUI {
    constructor(storage, sync) {
        this.storage = storage;
        this.sync = sync;
        this.currentScreen = 'dashboard';
        this.chart = null;
        this.editingTransactionId = null;

        this.initEventListeners();
    }

    // Инициализация обработчиков событий
    initEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const screen = item.dataset.screen;
                this.switchScreen(screen);
            });
        });

        // Кнопки добавления
        const addExpenseBtn = document.getElementById('add-expense-btn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => this.openAddModal('expense'));
        }

        const addIncomeBtn = document.getElementById('add-income-btn');
        if (addIncomeBtn) {
            addIncomeBtn.addEventListener('click', () => this.openAddModal('income'));
        }

        // Закрытие модального окна
        const closeModalBtn = document.getElementById('close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal());
        }

        const modal = document.getElementById('transaction-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Сохранение транзакции
        const saveBtn = document.getElementById('save-transaction');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveTransaction());
        }

        // Переключатели месяца
        const prevMonthBtn = document.getElementById('prev-month');
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        }

        const nextMonthBtn = document.getElementById('next-month');
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
        }

        const resetMonthBtn = document.getElementById('reset-month');
        if (resetMonthBtn) {
            resetMonthBtn.addEventListener('click', () => this.resetMonth());
        }

        // Поиск и фильтры на экране расходов
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterExpenses());
        }

        // Кнопка синхронизации
        const syncNowBtn = document.getElementById('sync-now-btn');
        if (syncNowBtn) {
            syncNowBtn.addEventListener('click', () => this.sync.forceSyncNow());
        }

        // Кнопка очистки кеша
        const clearCacheBtn = document.getElementById('clear-cache-btn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => this.clearCache());
        }
    }

    // Переключение экранов
    switchScreen(screenName) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Показываем нужный экран
        const screen = document.getElementById(`${screenName}-screen`);
        if (screen) {
            screen.classList.add('active');
        }

        // Обновляем активную кнопку навигации
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeNavItem = document.querySelector(`[data-screen="${screenName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        this.currentScreen = screenName;

        // Рендерим нужный экран
        switch(screenName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'expenses':
                this.renderExpenses();
                break;
            case 'plan':
                this.renderPlan();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    }

    // Открытие модального окна
    openAddModal(type = 'expense') {
        const modal = document.getElementById('transaction-modal');
        const title = document.getElementById('modal-title');
        const categoryGroup = document.getElementById('category-group');

        if (!modal || !title) return;

        this.editingTransactionId = null;

        if (type === 'income') {
            title.textContent = '💵 Добавить доход';
            if (categoryGroup) categoryGroup.style.display = 'none';
        } else {
            title.textContent = '➕ Добавить расход';
            if (categoryGroup) categoryGroup.style.display = 'block';
            this.renderCategorySelect();
        }

        // Очищаем форму
        document.getElementById('transaction-name').value = '';
        document.getElementById('transaction-amount').value = '';
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('transaction-type').value = type;

        modal.classList.add('active');
    }

    // Закрытие модального окна
    closeModal() {
        const modal = document.getElementById('transaction-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.editingTransactionId = null;
    }

    // Рендер выбора категории
    renderCategorySelect() {
        const select = document.getElementById('transaction-category');
        if (!select) return;

        const categories = this.storage.getCategories();
        select.innerHTML = categories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
    }
    
    // Сохранение транзакции
    saveTransaction() {
        const name = document.getElementById('transaction-name').value.trim();
        const amount = document.getElementById('transaction-amount').value;
        const date = document.getElementById('transaction-date').value;
        const type = document.getElementById('transaction-type').value;
        const categoryId = document.getElementById('transaction-category')?.value;

        if (!name || !amount || !date) {
            alert('Заполните все поля');
            return;
        }

        const transaction = {
            name,
            amount: parseFloat(amount),
            date,
            type,
            category: type === 'expense' ? parseInt(categoryId) : null
        };

        if (this.editingTransactionId) {
            this.storage.updateTransaction(this.editingTransactionId, transaction);
        } else {
            if (type === 'income') {
                const currentIncome = this.storage.getIncome();
                this.storage.setIncome(currentIncome + transaction.amount);
            } else {
                this.storage.addTransaction(transaction);
            }
        }

        this.closeModal();
        this.sync.sync(); // Синхронизация
        this.renderCurrentScreen();
    }

    // Изменение месяца
    changeMonth(offset) {
        this.storage.changeMonth(offset);
        this.renderCurrentScreen();
    }

    // Сброс на текущий месяц
    resetMonth() {
        const data = this.storage.getData();
        const now = new Date();
        data.currentMonth = now.getMonth();
        data.currentYear = now.getFullYear();
        this.storage.saveData(data);
        this.renderCurrentScreen();
    }

    // Рендер текущего экрана
    renderCurrentScreen() {
        switch(this.currentScreen) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'expenses':
                this.renderExpenses();
                break;
            case 'plan':
                this.renderPlan();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    }

    // Рендер Dashboard
    renderDashboard() {
        const data = this.storage.getData();
        const transactions = this.storage.getTransactions();
        const income = this.storage.getIncome();

        // Подсчёт расходов
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - totalExpenses;

        // Обновляем заголовок месяца
        document.getElementById('current-month').textContent = 
            `${CONFIG.MONTHS[data.currentMonth]} ${data.currentYear}`;

        // Обновляем карточки баланса
        document.getElementById('income-amount').textContent = `${income.toLocaleString('ru-RU')} ₽`;
        document.getElementById('expenses-amount').textContent = `${totalExpenses.toLocaleString('ru-RU')} ₽`;
        document.getElementById('balance-amount').textContent = `${balance.toLocaleString('ru-RU')} ₽`;

        // Рендерим диаграмму
        this.renderChart(transactions);

        // Рендерим последние транзакции
        this.renderRecentTransactions(transactions);
    }

    // Рендер диаграммы
    renderChart(transactions) {
        const canvas = document.getElementById('expenses-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Группируем по категориям
        const categories = this.storage.getCategories();
        const categoryTotals = {};

        categories.forEach(cat => {
            categoryTotals[cat.id] = {
                name: cat.name,
                total: 0,
                color: cat.color
            };
        });

        transactions.filter(t => t.type === 'expense').forEach(t => {
            if (categoryTotals[t.category]) {
                categoryTotals[t.category].total += t.amount;
            }
        });

        // Фильтруем категории с расходами
        const chartData = Object.values(categoryTotals).filter(c => c.total > 0);

        if (chartData.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Arial';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('Нет данных', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Уничтожаем старую диаграмму
        if (this.chart) {
            this.chart.destroy();
        }

        // Создаём новую
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.map(c => c.name),
                datasets: [{
                    data: chartData.map(c => c.total),
                    backgroundColor: chartData.map(c => c.color),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 11 },
                            padding: 10
                        }
                    }
                }
            }
        });
    }
    
    // Рендер последних транзакций
    renderRecentTransactions(transactions) {
        const container = document.getElementById('recent-transactions');
        if (!container) return;

        const recent = transactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        if (recent.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет транзакций</div>';
            return;
        }

        const categories = this.storage.getCategories();

        container.innerHTML = recent.map(t => {
            const category = categories.find(c => c.id === t.category);
            const categoryName = category ? category.name : 'Без категории';
            const date = new Date(t.date).toLocaleDateString('ru-RU');

            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-name">${t.name}</div>
                        <div class="transaction-category">${categoryName} • ${date}</div>
                    </div>
                    <div class="transaction-amount">${t.amount.toLocaleString('ru-RU')} ₽</div>
                </div>
            `;
        }).join('');
    }

    // Рендер экрана расходов
    renderExpenses() {
        const transactions = this.storage.getTransactions()
            .filter(t => t.type === 'expense')
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        this.renderExpensesList(transactions);
        this.renderCategoryFilters();
    }

    // Рендер списка расходов
    renderExpensesList(transactions) {
        const container = document.getElementById('expenses-list');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет расходов</div>';
            return;
        }

        const categories = this.storage.getCategories();

        container.innerHTML = transactions.map(t => {
            const category = categories.find(c => c.id === t.category);
            const categoryName = category ? category.name : 'Без категории';
            const date = new Date(t.date).toLocaleDateString('ru-RU');

            return `
                <div class="expense-item" data-id="${t.id}">
                    <div class="expense-info">
                        <div class="expense-name">${t.name}</div>
                        <div class="expense-meta">${categoryName} • ${date}</div>
                    </div>
                    <div class="expense-actions">
                        <div class="expense-amount">${t.amount.toLocaleString('ru-RU')} ₽</div>
                        <button class="btn-icon" onclick="budgetApp.deleteTransaction('${t.id}')">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Рендер фильтров категорий
    renderCategoryFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;

        const categories = this.storage.getCategories();

        container.innerHTML = `
            <button class="filter-btn active" data-category="all">Все</button>
            ${categories.map(cat => 
                `<button class="filter-btn" data-category="${cat.id}">${cat.name}</button>`
            ).join('')}
        `;

        // Добавляем обработчики
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterExpenses();
            });
        });
    }

    // Фильтрация расходов
    filterExpenses() {
        const searchQuery = document.getElementById('search-input')?.value.toLowerCase() || '';
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.category || 'all';

        let transactions = this.storage.getTransactions()
            .filter(t => t.type === 'expense');

        // Фильтр по категории
        if (activeFilter !== 'all') {
            transactions = transactions.filter(t => t.category === parseInt(activeFilter));
        }

        // Поиск по названию
        if (searchQuery) {
            transactions = transactions.filter(t => 
                t.name.toLowerCase().includes(searchQuery)
            );
        }

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.renderExpensesList(transactions);
    }

    // Удаление транзакции
    deleteTransaction(id) {
        if (!confirm('Удалить эту транзакцию?')) return;

        this.storage.deleteTransaction(id);
        this.sync.sync();
        this.renderCurrentScreen();
    }

    // Рендер экрана плана
    renderPlan() {
        const container = document.getElementById('plan-list');
        if (!container) return;

        const categories = this.storage.getCategories();
        const transactions = this.storage.getTransactions().filter(t => t.type === 'expense');

        // Подсчёт фактических расходов по категориям
        const spent = {};
        categories.forEach(cat => { spent[cat.id] = 0; });

        transactions.forEach(t => {
            if (spent[t.category] !== undefined) {
                spent[t.category] += t.amount;
            }
        });

        container.innerHTML = categories.map(cat => {
            const spentAmount = spent[cat.id] || 0;
            const limit = cat.limit;
            const percentage = limit > 0 ? (spentAmount / limit) * 100 : 0;

            let progressColor = '#A6F5C8'; // зелёный
            if (percentage >= 100) progressColor = '#F5A6A6'; // красный
            else if (percentage >= 80) progressColor = '#FFE5A6'; // жёлтый

            return `
                <div class="plan-item">
                    <div class="plan-header">
                        <div class="plan-name">${cat.name}</div>
                        <div class="plan-amounts">
                            <span class="spent">${spentAmount.toLocaleString('ru-RU')} ₽</span>
                            <span class="limit">/ ${limit.toLocaleString('ru-RU')} ₽</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background: ${progressColor};"></div>
                    </div>
                    <div class="plan-footer">
                        <span class="percentage">${percentage.toFixed(1)}%</span>
                        <button class="btn-edit" onclick="budgetApp.editCategoryLimit(${cat.id})">✏️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Редактирование лимита категории
    editCategoryLimit(categoryId) {
        const category = this.storage.getCategories().find(c => c.id === categoryId);
        if (!category) return;

        const newLimit = prompt(`Новый лимит для "${category.name}":`, category.limit);
        if (newLimit === null) return;

        const limit = parseFloat(newLimit);
        if (isNaN(limit) || limit < 0) {
            alert('Введите корректную сумму');
            return;
        }

        this.storage.updateCategoryLimit(categoryId, limit);
        this.renderPlan();
    }

    // Рендер настроек
    renderSettings() {
        const data = this.storage.getData();
        const lastSync = data.lastSync 
            ? new Date(data.lastSync).toLocaleString('ru-RU')
            : 'Никогда';

        document.getElementById('last-sync-time').textContent = lastSync;
        document.getElementById('app-version').textContent = CONFIG.VERSION;
    }

    // Очистка кеша
    clearCache() {
        if (!confirm('Удалить все данные? Это действие необратимо!')) return;

        this.storage.clearAll();
        alert('Кеш очищен. Приложение перезагрузится.');
        location.reload();
    }
}
