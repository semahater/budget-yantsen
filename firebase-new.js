// ========================================
// FIREBASE-NEW.JS - Firebase интеграция
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

    // Получить путь к данным месяца
    getMonthPath() {
        return `/budget/${DataManager.currentYear}-${DataManager.currentMonth}`;
    },

    // ========================================
    // СИНХРОНИЗАЦИЯ
    // ========================================

    // Загрузить данные из Firebase
    async loadFromFirebase() {
        if (!this.isConnected) return null;

        try {
            const path = this.getMonthPath();
            const response = await fetch(`${this.databaseURL}${path}.json`);
            
            if (response.ok) {
                const data = await response.json();
                return data;
            }
            return null;
        } catch (error) {
            console.warn('Ошибка загрузки из Firebase:', error);
            return null;
        }
    },

    // Сохранить данные в Firebase
    async saveToFirebase(data) {
        if (!this.isConnected) return false;

        try {
            const path = this.getMonthPath();
            const response = await fetch(`${this.databaseURL}${path}.json`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            return response.ok;
        } catch (error) {
            console.warn('Ошибка сохранения в Firebase:', error);
            return false;
        }
    },

    // Синхронизировать текущий месяц
    async syncCurrentMonth() {
        // Получаем локальные данные
        const localData = DataManager.getMonthData();
        
        if (!localData) return;

        // Отправляем в Firebase
        const success = await this.saveToFirebase(localData);
        
        if (success) {
            this.lastSyncTime = new Date();
            this.updateSyncStatus();
        }

        return success;
    },

    // Загрузить данные из Firebase в localStorage
    async syncFromFirebase() {
        const firebaseData = await this.loadFromFirebase();
        
        if (firebaseData) {
            // Перезаписываем локальные данные
            DataManager.saveMonthData(firebaseData);
            this.lastSyncTime = new Date();
            this.updateSyncStatus();
            return true;
        }
        
        return false;
    },

    // Запустить автоматическую синхронизацию (каждые 30 секунд)
    startAutoSync() {
        // Синхронизация при загрузке
        this.syncFromFirebase().then(() => {
            // Обновляем UI после первой синхронизации
            if (window.UI) {
                window.UI.refreshAll();
            }
        });

        // Автоматическая синхронизация каждые 30 секунд
        this.syncInterval = setInterval(async () => {
            await this.syncCurrentMonth();
        }, 30000); // 30 секунд
    },

    // Остановить автоматическую синхронизацию
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    },

    // Обновить статус синхронизации в UI
    updateSyncStatus() {
        if (this.lastSyncTime) {
            const hours = String(this.lastSyncTime.getHours()).padStart(2, '0');
            const minutes = String(this.lastSyncTime.getMinutes()).padStart(2, '0');
            const timeString = `${hours}:${minutes}`;

            // Обновляем статус на главной
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.textContent = `Последняя синхронизация: ${timeString}`;
            }

            // Обновляем время в настройках
            const lastSyncTime = document.getElementById('last-sync-time');
            if (lastSyncTime) {
                lastSyncTime.textContent = timeString;
            }
        }
    },

    // Синхронизировать вручную
    async syncNow() {
        const btn = document.getElementById('btn-sync-now');
        if (btn) {
            btn.textContent = '🔄 Синхронизация...';
            btn.disabled = true;
        }

        // Проверяем подключение
        await this.testConnection();

        // Обновляем статус Firebase
        const status = document.getElementById('firebase-status');
        if (status) {
            status.textContent = this.isConnected ? '✅ Подключен' : '❌ Ошибка';
        }

        // Синхронизируем
        if (this.isConnected) {
            await this.syncCurrentMonth();
            await this.syncFromFirebase();
            
            // Обновляем UI
            if (window.UI) {
                window.UI.refreshAll();
            }
        }

        if (btn) {
            btn.textContent = '🔄 Синхронизировать сейчас';
            btn.disabled = false;
        }
    }
};