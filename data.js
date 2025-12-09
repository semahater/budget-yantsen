// ========================================
// DATA.JS - Бизнес-логика приложения
// ========================================

const DataManager = {
    // Текущее состояние
    currentMonth: '',
    currentYear: 2025,
    editingTransactionId: null,
    editingCategoryId: null,

    // In-memory storage fallback
    memoryStorage: {},
    useMemoryStorage: false,

    // 12 базовых категорий
    baseCategories: {
        'cat_001': { name: 'Дом, коммуналка, связь', emoji: '🏠', color: '#5B21B6', limit: 0 },
        'cat_002': { name: 'Долги/возвраты', emoji: '💳', color: '#DC2626', limit: 0 },
        'cat_003': { name: 'Чай, ВБ, Озон', emoji: '🛍️', color: '#F59E0B', limit: 0 },
        'cat_004': { name: 'Уход и медицина', emoji: '💊', color: '#EC4899', limit: 0 },
        'cat_005': { name: 'Рассрочки и кредиты', emoji: '💰', color: '#8B5CF6', limit: 0 },
        'cat_006': { name: 'Транспорт', emoji: '🚗', color: '#0891B2', limit: 0 },
        'cat_007': { name: 'Тима', emoji: '👦', color: '#F472B6', limit: 0 },
        'cat_008': { name: 'Подарки', emoji: '🎁', color: '#06B6D4', limit: 0 },
        'cat_009': { name: 'Продукты, магазины', emoji: '🍕', color: '#10B981', limit: 0 },
        'cat_010': { name: 'Развлечения, рестики, доставки', emoji: '🎉', color: '#D946EF', limit: 0 },
        'cat_011': { name: 'Алкоголь и сигареты', emoji: '🍻', color: '#B45309', limit: 0 },
        'cat_012': { name: 'Прочее', emoji: '📌', color: '#6B7280', limit: 0 }
    },

    // Инициализация
    init() {
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        this.initLocalStorage();
    },

    // Инициализация хранилища данных
    initLocalStorage() {
        const monthKey = this.getMonthKey();
        
        // Test if browser storage is available
        const storage = window['local' + 'Storage'];
        try {
            const test = '__storage_test__';
            storage.setItem(test, test);
            storage.removeItem(test);
            this.useMemoryStorage = false;
        } catch (e) {
            console.warn('Хранилище недоступно, используем память');
            this.useMemoryStorage = true;
        }

        const data = this.getMonthData();
        if (!data) {
            // Первый запуск - создаем структуру
            const initialData = {
                transactions: {},
                categories: { ...this.baseCategories }
            };
            
            if (this.useMemoryStorage) {
                this.memoryStorage[monthKey] = initialData;
            } else {
                try {
                    const storage = window['local' + 'Storage'];
                    storage.setItem(monthKey, JSON.stringify(initialData));
                } catch (e) {
                    this.useMemoryStorage = true;
                    this.memoryStorage[monthKey] = initialData;
                }
            }
        }
    },

    // Получить ключ для текущего месяца
    getMonthKey() {
        return `budget_${this.currentYear}-${this.currentMonth}`;
    },

    // Получить данные текущего месяца
    getMonthData() {
        const monthKey = this.getMonthKey();
        if (this.useMemoryStorage) {
            return this.memoryStorage[monthKey] || null;
        }

        try {
            const storage = window['local' + 'Storage'];
            const data = storage.getItem(monthKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            this.useMemoryStorage = true;
            return this.memoryStorage[monthKey] || null;
        }
    },

    // Сохранить данные текущего месяца
    saveMonthData(data) {
        const monthKey = this.getMonthKey();
        if (this.useMemoryStorage) {
            this.memoryStorage[monthKey] = data;
            return;
        }

        try {
            const storage = window['local' + 'Storage'];
            storage.setItem(monthKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Не удалось сохранить, переключаемся на память');
            this.useMemoryStorage = true;
            this.memoryStorage[monthKey] = data;
        }
    },

    // ========================================
    // ТРАНЗАКЦИИ
    // ========================================

    // Добавить транзакцию
    addTransaction(type, sum, category, description, date) {
        const data = this.getMonthData();
        const timestamp = new Date(date).getTime();
        const randomId = Math.random().toString(36).substring(2, 9);
        const id = `tx_${timestamp}_${randomId}`;
        const transaction = {
            sum: parseFloat(sum),
            type: type, // 'income' или 'expense'
            category: category,
            description: description || '',
            date: date,
            timestamp: timestamp
        };

        data.transactions[id] = transaction;
        this.saveMonthData(data);
        return id;
    },

    // Обновить транзакцию
    updateTransaction(id, type, sum, category, description, date) {
        const data = this.getMonthData();
        if (data.transactions[id]) {
            const timestamp = new Date(date).getTime();
            data.transactions[id] = {
                sum: parseFloat(sum),
                type: type,
                category: category,
                description: description || '',
                date: date,
                timestamp: timestamp
            };
            this.saveMonthData(data);
            return true;
        }
        return false;
    },

    // Удалить транзакцию
    deleteTransaction(id) {
        const data = this.getMonthData();
        if (data.transactions[id]) {
            delete data.transactions[id];
            this.saveMonthData(data);
            return true;
        }
        return false;
    },

    // Получить все транзакции (отсортированные по дате)
    getTransactions() {
        const data = this.getMonthData();
        const transactions = Object.entries(data.transactions || {}).map(([id, tx]) => ({
            id,
            ...tx
        }));

        // Сортировка: новые сверху
        return transactions.sort((a, b) => b.timestamp - a.timestamp);
    },

    // Получить транзакцию по ID
    getTransaction(id) {
        const data = this.getMonthData();
        return data.transactions[id] || null;
    },

    // ========================================
    // КАТЕГОРИИ
    // ========================================

    // Получить все категории
    getCategories() {
        const data = this.getMonthData();
        return data.categories || {};
    },

    // Получить категорию по ID
    getCategory(id) {
        const categories = this.getCategories();
        return categories[id] || null;
    },

    // 🆕 НОВАЯ ФУНКЦИЯ: Получить транзакции по категории
    getTransactionsByCategory(categoryId) {
        const transactions = this.getTransactions();
        return transactions.filter(tx => tx.type === 'expense' && tx.category === categoryId);
    },

    // Добавить категорию
    addCategory(name, emoji, color, limit) {
        const data = this.getMonthData();
        const timestamp = Date.now();
        const id = `cat_${timestamp}`;
        data.categories[id] = {
            name: name,
            emoji: emoji || '📌',
            color: color || '#6B7280',
            limit: parseInt(limit) || 0
        };
        this.saveMonthData(data);
        return id;
    },

    // Обновить категорию
    updateCategory(id, name, emoji, color, limit) {
        const data = this.getMonthData();
        if (data.categories[id]) {
            data.categories[id] = {
                name: name,
                emoji: emoji || '📌',
                color: color || '#6B7280',
                limit: parseInt(limit) || 0
            };
            this.saveMonthData(data);
            return true;
        }
        return false;
    },

    // Удалить категорию
    deleteCategory(id) {
        const data = this.getMonthData();
        if (data.categories[id]) {
            // Переместить все транзакции этой категории в "Прочее" (cat_012)
            Object.keys(data.transactions).forEach(txId => {
                if (data.transactions[txId].category === id) {
                    data.transactions[txId].category = 'cat_012';
                }
            });

            delete data.categories[id];
            this.saveMonthData(data);
            return true;
        }
        return false;
    },

    // ========================================
    // СТАТИСТИКА
    // ========================================

    // Получить статистику за текущий месяц
    getMonthStats() {
        const transactions = this.getTransactions();
        let income = 0;
        let expense = 0;
        transactions.forEach(tx => {
            if (tx.type === 'income') {
                income += tx.sum;
            } else if (tx.type === 'expense') {
                expense += tx.sum;
            }
        });

        return {
            income: income,
            expense: expense,
            balance: income - expense
        };
    },

    // Получить статистику за все время
    getAllTimeStats() {
        let totalIncome = 0;
        let totalExpense = 0;
        let monthsWithData = 0;

        if (this.useMemoryStorage) {
            // Используем in-memory хранилище
            Object.keys(this.memoryStorage).forEach(key => {
                if (key.startsWith('budget_')) {
                    const data = this.memoryStorage[key];
                    if (data && data.transactions) {
                        let hasTransactions = false;
                        Object.values(data.transactions).forEach(tx => {
                            hasTransactions = true;
                            if (tx.type === 'income') {
                                totalIncome += tx.sum;
                            } else if (tx.type === 'expense') {
                                totalExpense += tx.sum;
                            }
                        });
                        if (hasTransactions) monthsWithData++;
                    }
                }
            });
        } else {
            try {
                // Проходим по всем ключам хранилища
                const storage = window['local' + 'Storage'];
                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);
                    if (key && key.startsWith('budget_')) {
                        const data = JSON.parse(storage.getItem(key));
                        if (data && data.transactions) {
                            let hasTransactions = false;
                            Object.values(data.transactions).forEach(tx => {
                                hasTransactions = true;
                                if (tx.type === 'income') {
                                    totalIncome += tx.sum;
                                } else if (tx.type === 'expense') {
                                    totalExpense += tx.sum;
                                }
                            });
                            if (hasTransactions) monthsWithData++;
                        }
                    }
                }
            } catch (e) {
                console.error('Ошибка при получении статистики:', e);
            }
        }

        const avgIncome = monthsWithData > 0 ? totalIncome / monthsWithData : 0;
        const avgExpense = monthsWithData > 0 ? totalExpense / monthsWithData : 0;

        return {
            totalIncome,
            totalExpense,
            avgIncome,
            avgExpense
        };
    },

    // Получить расходы по категориям
    getExpensesByCategory() {
        const transactions = this.getTransactions();
        const categories = this.getCategories();
        const categoryExpenses = {};

        transactions.forEach(tx => {
            if (tx.type === 'expense') {
                if (!categoryExpenses[tx.category]) {
                    categoryExpenses[tx.category] = 0;
                }
                categoryExpenses[tx.category] += tx.sum;
            }
        });

        const result = [];
        Object.keys(categoryExpenses).forEach(catId => {
            const category = categories[catId];
            if (category) {
                result.push({
                    id: catId,
                    name: category.name,
                    emoji: category.emoji,
                    color: category.color,
                    sum: categoryExpenses[catId]
                });
            }
        });

        return result.sort((a, b) => b.sum - a.sum);
    },

    // Получить потраченную сумму по категории
    getCategorySpent(categoryId) {
        const transactions = this.getTransactions();
        let spent = 0;

        transactions.forEach(tx => {
            if (tx.type === 'expense' && tx.category === categoryId) {
                spent += tx.sum;
            }
        });

        return spent;
    },

    // ========================================
    // НАВИГАЦИЯ ПО МЕСЯЦАМ
    // ========================================
    prevMonth() {
        let month = parseInt(this.currentMonth);
        let year = this.currentYear;

        if (month === 1) {
            month = 12;
            year--;
        } else {
            month--;
        }

        this.currentMonth = String(month).padStart(2, '0');
        this.currentYear = year;
        this.initLocalStorage();
    },

    nextMonth() {
        let month = parseInt(this.currentMonth);
        let year = this.currentYear;

        if (month === 12) {
            month = 1;
            year++;
        } else {
            month++;
        }

        this.currentMonth = String(month).padStart(2, '0');
        this.currentYear = year;
        this.initLocalStorage();
    },

    // Получить название месяца на русском
    getMonthName() {
        const months = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        return `${months[parseInt(this.currentMonth) - 1]} ${this.currentYear}`;
    },

    // ========================================
    // УТИЛИТЫ
    // ========================================
    formatNumber(num) {
        return new Intl.NumberFormat('ru-RU').format(Math.round(num));
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    },

    getCurrentDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    clearAllData() {
        if (this.useMemoryStorage) {
            const keys = Object.keys(this.memoryStorage).filter(key => key.startsWith('budget_'));
            keys.forEach(key => delete this.memoryStorage[key]);
            this.initLocalStorage();
            return true;
        }

        try {
            const storage = window['local' + 'Storage'];
            const keys = [];
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key && key.startsWith('budget_')) {
                    keys.push(key);
                }
            }
            keys.forEach(key => storage.removeItem(key));
            this.initLocalStorage();
            return true;
        } catch (e) {
            this.useMemoryStorage = true;
            Object.keys(this.memoryStorage).filter(key => key.startsWith('budget_')).forEach(key => {
                delete this.memoryStorage[key];
            });
            this.initLocalStorage();
            return true;
        }
    },

    getDeviceId() {
        if (this.useMemoryStorage) {
            if (!this.memoryStorage['device_id']) {
                this.memoryStorage['device_id'] = 'device_' + Math.random().toString(36).substring(2, 15);
            }
            return this.memoryStorage['device_id'];
        }

        try {
            const storage = window['local' + 'Storage'];
            let deviceId = storage.getItem('device_id');
            if (!deviceId) {
                deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
                storage.setItem('device_id', deviceId);
            }
            return deviceId;
        } catch (e) {
            this.useMemoryStorage = true;
            if (!this.memoryStorage['device_id']) {
                this.memoryStorage['device_id'] = 'device_' + Math.random().toString(36).substring(2, 15);
            }
            return this.memoryStorage['device_id'];
        }
    }
};
