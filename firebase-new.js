// ========================================
// FIREBASE-NEW.JS - Firebase интеграция
// С ЗАЩИТОЙ ОТ ПЕРЕЗАПИСИ ПУСТЫХ ДАННЫХ
// ========================================

const FirebaseManager = {
    apiKey: 'AIzaSyB-Lcl3TFm3wZgEoFMWxoL7pSL4erZFylU',
    databaseURL: 'https://family-budget-yanzen-36ed3-default-rtdb.europe-west1.firebasedatabase.app',
    syncInterval: null,
    lastSyncTime: null,
    isConnected: true,

    // Инициализация
    init() {
        this.testConnection();
        this.startAutoSync();
    },

    // Тестирование подключения
    async testConnection() {
        try {
            const response = await fetch(`${this.databaseURL}/.json`);
            this.isConnected = response.ok;
            return this.isConnected;
        } catch (error) {
            console.warn('Firebase недоступен:', error);
            this.isConnected = false;
            return false;
        }
    },

    // Получить текущий месяц
    getCurrentMonth() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    },

    // Получить путь к данным месяца
    getMonthPath() {
        const monthKey = this.getCurrentMonth();
        return `/budget/${monthKey}`;
    },

    // ========================================
    // ЗАГРУЗКА ДАННЫХ ИЗ FIREBASE
    // ========================================

    async loadFromFirebase() {
        if (!this.isConnected) {
            console.log('Firebase недоступен, используем localStorage');
            return null;
        }

        try {
            const path = this.getMonthPath();
            const url = `${this.databaseURL}${path}.json`;
            
            console.log('📥 Загружаем из Firebase:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Данные загружены из Firebase:', data);
                return data;
            } else {
                console.warn('Firebase вернул статус:', response.status);
                return null;
            }
        } catch (error) {
            console.warn('❌ Ошибка загрузки из Firebase:', error);
            return null;
        }
    },

    // ========================================
    // СОХРАНЕНИЕ ДАННЫХ В FIREBASE
    // ========================================

    async saveToFirebase(data) {
        if (!this.isConnected) {
            console.log('Firebase недоступен, данные только в localStorage');
            return false;
        }

        try {
            const path = this.getMonthPath();
            const url = `${this.databaseURL}${path}.json`;

            // Убедиться, что отправляются обе части
            const dataToSend = {
                categories: data.categories || {},
                transactions: data.transactions || {}
            };

            console.log('📤 Отправляем в Firebase:', url);
            console.log('📊 Данные:', dataToSend);

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            if (response.ok) {
                console.log('✅ Данные успешно отправлены в Firebase');
                return true;
            } else {
                console.warn('❌ Firebase вернул ошибку:', response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.warn('❌ Ошибка отправки в Firebase:', error);
            return false;
        }
    },

    // ========================================
    // СИНХРОНИЗАЦИЯ
    // ========================================

    // Получить локальные данные из localStorage
    getLocalData() {
        const monthKey = `budget_${this.getCurrentMonth()}`;
        const storedData = localStorage.getItem(monthKey);

        if (!storedData) {
            console.warn('⚠️ Локальные данные не найдены');
            return null;
        }

        try {
            const data = JSON.parse(storedData);
            return data;
        } catch (error) {
            console.error('❌ Ошибка парсинга локальных данных:', error);
            return null;
        }
    },

    // Сохранить данные в localStorage
    saveLocalData(data) {
        const monthKey = `budget_${this.getCurrentMonth()}`;
        try {
            localStorage.setItem(monthKey, JSON.stringify(data));
            console.log('✅ Данные сохранены в localStorage');
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения в localStorage:', error);
            return false;
        }
    },

    // ✅ ЗАЩИТА: проверить, что данные не пусто
    hasValidData(data) {
        if (!data) return false;
        
        const hasTransactions = data.transactions && Object.keys(data.transactions).length > 0;
        const hasCategories = data.categories && Object.keys(data.categories).length > 0;
        
        return hasTransactions || hasCategories;
    },

    // Синхронизировать текущий месяц (загрузить локальные → отправить в Firebase)
    async syncCurrentMonth() {
        console.log('🔄 Начинаем синхронизацию текущего месяца...');

        // Получаем локальные данные
        const localData = this.getLocalData();

        if (!this.hasValidData(localData)) {
            console.warn('⚠️ Локальные данные пусто или невалидны, синхронизация пропущена');
            return false;
        }

        console.log('📊 Локальные данные:', {
            categories: Object.keys(localData.categories || {}).length,
            transactions: Object.keys(localData.transactions || {}).length
        });

        // Проверяем подключение
        await this.testConnection();

        if (!this.isConnected) {
            console.warn('❌ Firebase недоступен, данные остаются в localStorage');
            return false;
        }

        // Отправляем в Firebase
        const success = await this.saveToFirebase(localData);

        if (success) {
            this.lastSyncTime = new Date();
            this.updateSyncStatus();
            console.log('✅ Синхронизация завершена успешно');
        } else {
            console.warn('⚠️ Синхронизация не удалась');
        }

        return success;
    },

    // ✅ ЗАЩИТА: загрузить данные из Firebase в localStorage ТОЛЬКО если Firebase не пустой
    async syncFromFirebase() {
        console.log('⬇️ Загружаем данные из Firebase в localStorage...');

        const firebaseData = await this.loadFromFirebase();

        // ✅ НОВАЯ ЗАЩИТА: если Firebase пустой, НЕ перезаписываем localStorage!
        if (!this.hasValidData(firebaseData)) {
            console.warn('⚠️ Firebase пустой или недоступен, NOT перезаписываем localStorage');
            return false;
        }

        // Только если Firebase имеет валидные данные - сохраняем в localStorage
        console.log('✅ Firebase имеет данные, обновляем localStorage');
        this.saveLocalData(firebaseData);
        this.lastSyncTime = new Date();
        this.updateSyncStatus();
        console.log('✅ Данные загружены из Firebase');
        return true;
    },

    // ========================================
    // АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ
    // ========================================

    startAutoSync() {
        console.log('🚀 Запускаем автосинхронизацию...');

        // Первая загрузка при инициализации
        this.syncFromFirebase().then(() => {
            if (window.UI) {
                console.log('🔄 Обновляем UI после первой загрузки');
                window.UI.refreshAll();
            }
        });

        // Автоматическая синхронизация каждые 30 секунд
        this.syncInterval = setInterval(async () => {
            console.log('⏰ Автосинхронизация (каждые 30 сек)');
            await this.syncCurrentMonth();
        }, 30000);
    },

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏸️ Автосинхронизация остановлена');
        }
    },

    // ========================================
    // UI СТАТУС
    // ========================================

    updateSyncStatus() {
        if (this.lastSyncTime) {
            const hours = String(this.lastSyncTime.getHours()).padStart(2, '0');
            const minutes = String(this.lastSyncTime.getMinutes()).padStart(2, '0');
            const timeString = `${hours}:${minutes}`;

            // Обновляем на главной
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.textContent = `Последняя синхронизация: ${timeString}`;
            }

            // Обновляем в параметрах
            const lastSyncTime = document.getElementById('last-sync-time');
            if (lastSyncTime) {
                lastSyncTime.textContent = timeString;
            }
        }
    },

    updateFirebaseStatus() {
        const status = document.getElementById('firebase-status');
        if (status) {
            status.innerHTML = this.isConnected 
                ? '✅ Подключен' 
                : '❌ Ошибка';
        }
    },

    // ========================================
    // РУЧНАЯ СИНХРОНИЗАЦИЯ
    // ========================================

    async syncNow() {
        console.log('🔄 Ручная синхронизация (syncNow)');

        const btn = document.getElementById('btn-sync-now');
        if (btn) {
            btn.textContent = '🔄 Синхронизация...';
            btn.disabled = true;
        }

        // Проверяем подключение
        await this.testConnection();
        this.updateFirebaseStatus();

        // Синхронизируем если есть подключение
        if (this.isConnected) {
            console.log('✅ Firebase доступен, отправляем данные');
            await this.syncCurrentMonth();
            // ✅ Загружаем только если Firebase не пустой
            await this.syncFromFirebase();
        } else {
            console.warn('❌ Firebase недоступен');
        }

        // Обновляем UI
        if (window.UI) {
            window.UI.refreshAll();
        }

        if (btn) {
            btn.textContent = '🔄 Синхронизировать сейчас';
            btn.disabled = false;
        }

        console.log('✅ Ручная синхронизация завершена');
    },

    // ========================================
    // ПРОВЕРКА СТАТУСА FIREBASE
    // ========================================

    async checkFirebaseStatus() {
        await this.testConnection();
        this.updateFirebaseStatus();
        return this.isConnected;
    }
};

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        FirebaseManager.init();
    });
} else {
    FirebaseManager.init();
}
