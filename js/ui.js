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
            })
        });

        // Кнопки добавления
        const addExpenseBtn = document.getElementById('add-expense-btn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => this.openAddModal('expense'))
        }
        const addIncomeBtn = document.getElementById('add-income-btn');
        if (addIncomeBtn) {
            addIncomeBtn.addEventListener('click', () => this.openAddModal('income'))
        }

        // Закрытие модального окна
        const closeModalBtn = document.getElementById('close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal())
        }
        const modal = document.getElementById('transaction-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            })
        }

        // Сохранение транзакции
        const saveBtn = document.getElementById('save-transaction');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveTransaction());
        }
    }

    // ===== НОВОЕ: Прямая форма добавления расхода =====
    // Ожидает поля с ID: expense-name, expense-amount, expense-date, expense-category
    addExpense() {
      // Получить значения из формы
      const nameInput = document.getElementById('expense-name');
      const amountInput = document.getElementById('expense-amount');
      const dateInput = document.getElementById('expense-date');
      const categoryInput = document.getElementById('expense-category');

      const name = nameInput?.value?.trim();
      const amount = parseFloat(amountInput?.value);
      const date = dateInput?.value;
      const categoryId = parseInt(categoryInput?.value);

      // Валидация
      if (!name || !amount || !date || !categoryId) {
        alert('❌ Заполните все поля!');
        return;
      }
      if (amount <= 0) {
        alert('❌ Сумма должна быть больше 0!');
        return;
      }

      // Добавить транзакцию
      const transaction = {
        id: Date.now().toString(),
        name: name,
        amount: amount,
        date: date,
        categoryId: categoryId,
        type: 'expense'
      };

      const data = this.storage.getData();
      data.transactions.push(transaction);
      data.expenses = (data.expenses || 0) + amount;
      this.storage.saveData(data);

      console.log(`✅ Добавлен расход: ${name} - ${amount}₽`);

      // 🔄 Перерисовать интерфейс
      if (typeof this.renderDashboard === 'function') this.renderDashboard();
      if (typeof this.renderExpenses === 'function') this.renderExpenses();

      // 🧹 Очистить форму
      if (nameInput) nameInput.value = '';
      if (amountInput) amountInput.value = '';
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0]; // сегодня
      if (categoryInput) categoryInput.value = '1';

      // 🔔 Уведомление пользователю
      const notif = document.createElement('div');
      notif.textContent = '✅ Расход добавлен!';
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

    // ... остальной код класса (рендеры, модалки и т.д.) ...

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
