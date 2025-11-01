// UI.JS - Управление интерфейсом
class BudgetUI {
    constructor(storage, sync = null) {
        this.storage = storage;
        this.sync = sync;
        this.monthChart = null;
        this.categoryChart = null;
        this.currentMonth = new Date().toISOString().slice(0, 7);
        this.initCharts();
    }
    // 📊 Инициализация графиков
    initCharts() {
        const monthCtx = document.getElementById('monthChart')?.getContext('2d');
        const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
        if (monthCtx) {
            this.monthChart = new Chart(monthCtx, {
                type: 'line',
                data: { labels: [], datasets: [{ label: 'Расходы', data: [], borderColor: '#FF6384', tension: 0.1 }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        if (categoryCtx) {
            this.categoryChart = new Chart(categoryCtx, {
                type: 'doughnut',
                data: { labels: [], datasets: [{ data: [], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
    // 🏠 Рендер главной страницы (обзор)
    renderOverview() {
        const data = this.storage.getData();
        const currentMonthKey = this.currentMonth;
        const monthData = data.months[currentMonthKey] || { expenses: [], income: 0 };
        // Подсчет расходов
        const totalExpense = monthData.expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = monthData.income || 0;
        const balance = totalIncome - totalExpense;
        // Обновление карточек
        document.getElementById('total-income').textContent = `${totalIncome.toFixed(2)} ₽`;
        document.getElementById('total-expense').textContent = `${totalExpense.toFixed(2)} ₽`;
        document.getElementById('balance').textContent = `${balance.toFixed(2)} ₽`;
        document.getElementById('balance').style.color = balance >= 0 ? '#4CAF50' : '#f44336';
        this.renderMonthChart();
        this.renderCategoryChart();
    }
    // 📈 График расходов по дням месяца
    renderMonthChart() {
        if (!this.monthChart) return;
        const data = this.storage.getData();
        const monthData = data.months[this.currentMonth] || { expenses: [] };
        const days = {};
        monthData.expenses.forEach(exp => {
            const day = exp.date.split('-')[2];
            days[day] = (days[day] || 0) + exp.amount;
        });
        const labels = Object.keys(days).sort((a, b) => a - b);
        const values = labels.map(l => days[l]);
        this.monthChart.data.labels = labels;
        this.monthChart.data.datasets[0].data = values;
        this.monthChart.update();
    }
    // 🍰 График расходов по категориям
    renderCategoryChart() {
        if (!this.categoryChart) return;
        const data = this.storage.getData();
        const monthData = data.months[this.currentMonth] || { expenses: [] };
        const categories = {};
        monthData.expenses.forEach(exp => {
            categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
        });
        this.categoryChart.data.labels = Object.keys(categories);
        this.categoryChart.data.datasets[0].data = Object.values(categories);
        this.categoryChart.update();
    }
    // 💰 Рендер страницы расходов
    renderExpenses() {
        const data = this.storage.getData();
        const monthData = data.months[this.currentMonth] || { expenses: [] };
        const list = document.getElementById('expense-list');
        list.innerHTML = monthData.expenses.length === 0
            ? '<p style="text-align:center;color:#999;">Расходов пока нет</p>'
            : monthData.expenses.map(exp => `
                <div class="expense-item">
                    <div>
                        ${exp.category}
                        <span style="color:#999;font-size:12px;">${exp.date} ${exp.time || ''}</span>
                        ${exp.description ? `<div style="font-size:12px;color:#666;">${exp.description}</div>` : ''}
                    </div>
                    <div style="text-align:right;">
                        <strong style="color:#f44336;">${exp.amount.toFixed(2)} ₽</strong>
                        <button onclick="ui.deleteExpense('${exp.id}')" style="margin-left:10px;padding:4px 8px;">❌</button>
                    </div>
                </div>
            `).join('');
    }
    // ➕ Добавление расхода
    addExpense() {
        const categorySelect = document.getElementById('expense-category');
        const amountInput = document.getElementById('expense-amount');
        const descInput = document.getElementById('expense-description');
        const category = categorySelect.value;
        const amount = parseFloat(amountInput.value);
        const description = descInput.value.trim();
        if (!category || isNaN(amount) || amount <= 0) {
            alert('Заполните все обязательные поля!');
            return;
        }
        this.storage.addExpense(this.currentMonth, { category, amount, description });
        // Очистка формы
        categorySelect.value = '';
        amountInput.value = '';
        descInput.value = '';
        this.renderExpenses();
        this.showNotification('✅ Расход добавлен!');
    }
    // 🗑️ Удаление расхода
    deleteExpense(expenseId) {
        if (!confirm('Удалить этот расход?')) return;
        this.storage.deleteExpense(this.currentMonth, expenseId);
        this.renderExpenses();
        this.showNotification('✅ Расход удалён!');
    }
    // 📋 Рендер страницы планирования
    renderPlan() {
        const data = this.storage.getData();
        const monthData = data.months[this.currentMonth] || { expenses: [] };
        const categoryStats = {};
        data.categories.forEach(cat => {
            categoryStats[cat.name] = { limit: cat.limit, spent: 0 };
        });
        monthData.expenses.forEach(exp => {
            if (categoryStats[exp.category]) {
                categoryStats[exp.category].spent += exp.amount;
            }
        });
        const list = document.getElementById('plan-list');
        list.innerHTML = data.categories.map(cat => {
            const stats = categoryStats[cat.name];
            const percent = stats.limit > 0 ? (stats.spent / stats.limit * 100).toFixed(1) : 0;
            const color = percent >= 100 ? '#f44336' : percent >= 80 ? '#ff9800' : '#4CAF50';
            return `
                <div class="plan-item">
                    <div>
                        ${cat.name}
                        <div style="font-size:12px;color:#999;">Лимит: ${stats.limit.toFixed(2)} ₽</div>
                    </div>
                    <div style="text-align:right;">
                        <strong style="color:${color};">${stats.spent.toFixed(2)} ₽</strong>
                        <div style="font-size:12px;color:#999;">${percent}%</div>
                    </div>
                    <button onclick="ui.editCategoryLimit('${cat.id}')" style="padding:4px 8px;">✏️</button>
                </div>
            `;
        }).join('');
    }
    // 🔧 Рендер настроек
    renderSettings() {
        const data = this.storage.getData();
        const lastSync = data.lastSync
            ? new Date(data.lastSync).toLocaleString('ru-RU')
            : 'Никогда';
        document.getElementById('last-sync-time').textContent = lastSync;
        document.getElementById('app-version').textContent = CONFIG.VERSION;
    }
    // ✏️ Редактирование лимита категории
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
    // 🗑️ Очистка кеша
    clearCache() {
        if (!confirm('Удалить все данные? Это действие необратимо!')) return;
        this.storage.clearAll();
        alert('Кеш очищен. Приложение перезагрузится.');
        location.reload();
    }
    // 🔔 Уведомление
    showNotification(message) {
        const notif = document.createElement('div');
        notif.textContent = message;
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 9999;
        `;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2000);
        // 🔄 Синхронизировать с Firebase
        if (this.sync && typeof this.sync.sync === 'function') {
            this.sync.sync().catch(err => console.error('❌ Ошибка синхронизации:', err));
        }
    }
}
