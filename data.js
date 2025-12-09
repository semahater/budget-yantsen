// ========================================
// DATA.JS - ИСПРАВЛЕННАЯ ВЕРСИЯ
// С функцией getTransactionsByCategory
// ========================================

const DataManager = {
    currentMonth: '',
    currentYear: 2025,
    editingTransactionId: null,
    editingCategoryId: null,

    memoryStorage: {},
    useMemoryStorage: false,

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

    // ========================================
    // ИНИЦИАЛИЗАЦИЯ
    // ========================================
    init() {
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        
        console.log(`📅 Инициализация для месяца: ${this.getMonthName()}`);
        
        this.initLocalStorage();
    },

    initLocalStorage() {
        const monthKey = this.getMonthKey();
        
        try {
            const storage = window['local' + 'Storage'];
            const test = '__storage_test__';
            storage.setItem(test, test);
            storage.removeItem(test);
            this.useMemoryStorage = false;
            console.log('✅ localStorage доступен');
        } catch (e) {
            console.warn('⚠️ localStorage недоступен, используем память');
            this.useMemoryStorage = true;
        }

        let data = this.getMonthData();
        
        if (!data) {
            console.log(`📝 Создаём новую структуру для ${monthKey}`);
            
            const initialData = {
                transactions: {},
                categories: { ...this.baseCategories }
            };
            
            this.saveMonthData(initialData);
            data = initialData;
        } else {
            console.log(`✅ Данные найдены для ${monthKey}`);
        }

        if (!data.transactions) {
            data.transactions = {};
        }
        if (!data.categories) {
            data.categories = { ...this.baseCategories };
        }
        
        this.saveMonthData(data);
    },

    // ========================================
    // МЕСЯЧНЫЙ КЛЮЧ И ДАННЫЕ
    // ========================================
    getMonthKey() {
        const key = `budget_${this.currentYear}-${this.currentMonth}`;
        console.log(`🔑 Месячный ключ: ${key}`);
        return key;
    },

    getMonthData() {
        const monthKey = this.getMonthKey();
        
        if (this.useMemoryStorage) {
            const data = this.memoryStorage[monthKey];
            console.log(`📦 Загружаю из памяти: ${monthKey}`);
            return data || null;
        }

        try {
            const storage = window['local' + 'Storage'];
            const json = storage.getItem(monthKey);
            
            if (json) {
                console.log(`📦 Загружаю из localStorage: ${monthKey}`);
                return JSON.parse(json);
            }
            
            console.log(`ℹ️ Данные не найдены: ${monthKey}`);
            return null;
        } catch (e) {
            console.error('❌ Ошибка при чтении localStorage:', e);
            this.useMemoryStorage = true;
            return this.memoryStorage[monthKey] || null;
        }
    },

    saveMonthData(data) {
        const monthKey = this.getMonthKey();
        
        if (!data || !data.transactions) {
            console.warn('⚠️ Попытка сохранить пустые данные');
            return;
        }

        if (this.useMemoryStorage) {
            this.memoryStorage[monthKey] = data;
            console.log(`💾 Сохраняю в память: ${monthKey}`);
            return;
        }

        try {
            const storage = window['local' + 'Storage'];
            const json = JSON.stringify(data);
            storage.setItem(monthKey, json);
            console.log(`💾 Сохраняю в localStorage: ${monthKey} (${json.length} байт)`);
        } catch (e) {
            console.warn('❌ Не удалось сохранить в localStorage, переключаемся на память:', e);
            this.useMemoryStorage = true;
            this.memoryStorage[monthKey] = data;
        }
    },

    // ========================================
    // ТРАНЗАКЦИИ
    // ========================================
    addTransaction(type, sum, category, description, date) {
        console.log(`➕ Добавляю ${type}: ${sum} ₽ в категорию ${category}`);
        
        const data = this.getMonthData();
        if (!data) {
            console.error('❌ Нет данных для сохранения транзакции');
            return null;
        }

        const timestamp = new Date(date).getTime();
        const randomId = Math.random().toString(36).substring(2, 9);
        const id = `tx_${timestamp}_${randomId}`;

        const transaction = {
            sum: parseFloat(sum),
            type: type,
            category: category,
            description: description || '',
            date: date,
            timestamp: timestamp
        };

        data.transactions[id] = transaction;
        this.saveMonthData(data);
        
        console.log(`✅ Транзакция добавлена: ${id}`);
        return id;
    },

    updateTransaction(id, type, sum, category, description, date) {
        console.log(`✏️ Обновляю транзакцию: ${id}`);
        
        const data = this.getMonthData();
        if (!data || !data.transactions[id]) {
            console.error('❌ Транзакция не найдена:', id);
            return false;
        }

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
        console.log(`✅ Транзакция обновлена: ${id}`);
        return true;
    },

    deleteTransaction(id) {
        console.log(`🗑️ Удаляю транзакцию: ${id}`);
        
        const data = this.getMonthData();
        if (data && data.transactions[id]) {
            delete data.transactions[id];
            this.saveMonthData(data);
            console.log(`✅ Транзакция удалена: ${id}`);
            return true;
        }

        console.warn('⚠️ Транзакция не найдена:', id);
        return false;
    },

    getTransactions() {
        const data = this.getMonthData();
        const transactions = Object.entries(data.transactions || {}).map(([id, tx]) => ({
            id,
            ...tx
        }));

        return transactions.sort((a, b) => b.timestamp - a.timestamp);
    },

    getTransaction(id) {
        const data = this.getMonthData();
        return data.transactions[id] || null;
    },

    // ========================================
    // КАТЕГОРИИ
    // ========================================
    getCategories() {
        const data = this.getMonthData();
        return data.categories || {};
    },

    getCategory(id) {
        const categories = this.getCategories();
        return categories[id] || null;
    },

    addCategory(name, emoji, color, limit) {
        console.log(`➕ Добавляю категорию: ${name}`);
        
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
        console.log(`✅ Категория добавлена: ${id}`);
        return id;
    },

    updateCategory(id, name, emoji, color, limit) {
        console.log(`✏️ Обновляю категорию: ${id}`);
        
        const data = this.getMonthData();
        if (data.categories[id]) {
            data.categories[id] = {
                name: name,
                emoji: emoji || '📌',
                color: color || '#6B7280',
                limit: parseInt(limit) || 0
            };
            this.saveMonthData(data);
            console.log(`✅ Категория обновлена: ${id}`);
            return true;
        }

        console.warn('⚠️ Категория не найдена:', id);
        return false;
    },

    deleteCategory(id) {
        console.log(`🗑️ Удаляю категорию: ${id}`);
        
        const data = this.getMonthData();
        if (data.categories[id]) {
            Object.keys(data.transactions).forEach(txId => {
                if (data.transactions[txId].category === id) {
                    data.transactions[txId].category = 'cat_012';
                }
            });

            delete data.categories[id];
            this.saveMonthData(data);
            console.log(`✅ Категория удалена: ${id}`);
            return true;
        }

        console.warn('⚠️ Категория не найдена:', id);
        return false;
    },

    // ========================================
    // ПОЛУЧЕНИЕ ТРАНЗАКЦИЙ ПО КАТЕГОРИИ
    // ========================================
    getTransactionsByCategory(categoryId) {
        const transactions = this.getTransactions();
        return transactions.filter(tx => tx.category === categoryId);
    },

    // ========================================
    // СТАТИСТИКА
    // ========================================
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

    getAllTimeStats() {
        let totalIncome = 0;
        let totalExpense = 0;
        let monthsWithData = 0;

        if (this.useMemoryStorage) {
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
                console.warn('⚠️ Ошибка при получении статистики:', e);
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
        
        console.log(`⬅️ Переход на предыдущий месяц: ${this.getMonthName()}`);
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
        
        console.log(`➡️ Переход на следующий месяц: ${this.getMonthName()}`);
        this.initLocalStorage();
    },

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
        console.log('🗑️ Очистка всех данных...');
        
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
            console.log('✅ Данные очищены');
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
