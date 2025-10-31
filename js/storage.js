// STORAGE.JS - Управление данными в localStorage
class BudgetStorage {
    constructor() {
        this.initializeIfNeeded();
    }

    // Инициализация при первом запуске
    initializeIfNeeded() {
        const data = this.getData();
        if (!data || !data.initialized) {
            console.log('Первый запуск - инициализация данных');
            const now = new Date();
            const initialData = {
                initialized: true,
                currentMonth: now.getMonth(),
                currentYear: now.getFullYear(),
                income: 0,
                transactions: [],
                categories: CONFIG.CATEGORIES.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    limit: cat.limit,
                    color: cat.color
                })),
                lastSync: null
            };
            this.saveData(initialData);
            return initialData;
        }
        return data;
    }

    // Получить все данные
    getData() {
        try {
            const data = localStorage.getItem('budgetData');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Ошибка чтения localStorage:', e);
            return null;
        }
    }

    // Сохранить все данные
    saveData(data) {
        try {
            localStorage.setItem('budgetData', JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Ошибка записи localStorage:', e);
            return false;
        }
    }

    // Получить транзакции текущего месяца
    getTransactions() {
        const data = this.getData();
        if (!data) return [];

        const monthKey = `${data.currentYear}-${String(data.currentMonth + 1).padStart(2, '0')}`;
        return data.transactions.filter(t => t.month === monthKey);
    }

    // Добавить транзакцию
    addTransaction(transaction) {
        const data = this.getData();
        const monthKey = `${data.currentYear}-${String(data.currentMonth + 1).padStart(2, '0')}`;

        const newTransaction = {
            id: Date.now().toString(),
            month: monthKey,
            date: transaction.date,
            name: transaction.name,
            amount: parseFloat(transaction.amount),
            category: transaction.category,
            type: transaction.type
        };

        data.transactions.push(newTransaction);
        this.saveData(data);
        return newTransaction;
    }

    // Удалить транзакцию
    deleteTransaction(id) {
        const data = this.getData();
        data.transactions = data.transactions.filter(t => t.id !== id);
        this.saveData(data);
    }

    // Обновить транзакцию
    updateTransaction(id, updates) {
        const data = this.getData();
        const index = data.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            data.transactions[index] = { ...data.transactions[index], ...updates };
            this.saveData(data);
        }
    }

    // Получить доход
    getIncome() {
        const data = this.getData();
        return data ? data.income : 0;
    }

    // Установить доход
    setIncome(amount) {
        const data = this.getData();
        data.income = parseFloat(amount);
        this.saveData(data);
    }

    // Получить категории
    getCategories() {
        const data = this.getData();
        return data ? data.categories : [];
    }

    // Обновить лимит категории
    updateCategoryLimit(categoryId, newLimit) {
        const data = this.getData();
        const category = data.categories.find(c => c.id === categoryId);
        if (category) {
            category.limit = parseFloat(newLimit);
            this.saveData(data);
        }
    }

    // Изменить текущий месяц
    changeMonth(offset) {
        const data = this.getData();
        let month = data.currentMonth + offset;
        let year = data.currentYear;

        if (month < 0) {
            month = 11;
            year--;
        } else if (month > 11) {
            month = 0;
            year++;
        }

        data.currentMonth = month;
        data.currentYear = year;
        this.saveData(data);
        return { month, year };
    }

    // Очистить все данные
    clearAll() {
        localStorage.removeItem('budgetData');
        this.initializeIfNeeded();
    }
}
