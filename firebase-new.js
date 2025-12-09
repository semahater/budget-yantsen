// ========================================
// FIREBASE-NEW.JS - ИСПРАВЛЕННАЯ ВЕРСИЯ 3.1
// ========================================

const FirebaseManager = {
    // Firebase config
    API_KEY: 'AIzaSyB-Lcl3TFm3wZgEoFMWxoL7pSL4erZFylU',
    DATABASE_URL: 'https://family-budget-yanzen-36ed3-default-rtdb.europe-west1.firebasedatabase.app',

    lastSyncTime: null,
    lastSyncStatus: 'idle', // idle, syncing, success, error
    syncInterval: null,
    syncInProgress: false,

    // ========================================
    // ИНИЦИАЛИЗАЦИЯ
    // ========================================
    init() {
        console.log('🔥 Firebase инициализирован');
        
        // Проверяем подключение
        this.checkConnection();
        
        // Запускаем автоматическую синхронизацию каждые 30 сек
        this.startAutoSync();
    },

    // ========================================
    // СИНХРОНИЗАЦИЯ
    // ========================================
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            if (!this.syncInProgress) {
                this.syncNow();
            }
        }, 30000); // 30 секунд
    },

    syncNow() {
        return new Promise((resolve, reject) => {
            if (this.syncInProgress) {
                console.log('⏳ Синхронизация уже в процессе...');
                reject('Sync already in progress');
                return;
            }

            this.syncInProgress = true;
            this.lastSyncStatus = 'syncing';

            console.log('🔄 Начинаем синхронизацию...');

            // Загружаем локальные данные
            const localData = this.getAllLocalData();

            if (!localData || Object.keys(localData).length === 0) {
                console.log('ℹ️ Нет локальных данных для синхронизации');
                this.downloadFromFirebase()
                    .then(() => {
                        this.syncInProgress = false;
                        this.lastSyncStatus = 'success';
                        this.updateSyncTime();
                        resolve();
                    })
                    .catch((e) => {
                        this.syncInProgress = false;
                        this.lastSyncStatus = 'error';
                        reject(e);
                    });
                return;
            }

            // Проверяем Firebase
            this.checkConnection()
                .then((hasConnection) => {
                    if (!hasConnection) {
                        console.log('⚠️ Нет подключения к Firebase, работаем offline');
                        this.syncInProgress = false;
                        this.lastSyncStatus = 'idle';
                        resolve();
                        return;
                    }

                    // Загружаем с сервера (текущий месяц)
                    this.downloadFromFirebase()
                        .then(() => {
                            // Загружаем на сервер (текущий месяц)
                            return this.uploadToFirebase();
                        })
                        .then(() => {
                            console.log('✅ Синхронизация завершена успешно');
                            this.syncInProgress = false;
                            this.lastSyncStatus = 'success';
                            this.updateSyncTime();
                            resolve();
                        })
                        .catch((e) => {
                            console.error('❌ Ошибка синхронизации:', e);
                            this.syncInProgress = false;
                            this.lastSyncStatus = 'error';
                            reject(e);
                        });
                })
                .catch((e) => {
                    console.error('❌ Ошибка проверки подключения:', e);
                    this.syncInProgress = false;
                    this.lastSyncStatus = 'error';
                    reject(e);
                });
        });
    },

    downloadFromFirebase() {
        return new Promise((resolve, reject) => {
            const monthKey = DataManager.getMonthKey();
            const url = `${this.DATABASE_URL}/budget/${monthKey}.json?key=${this.API_KEY}`;

            fetch(url)
                .then(response => response.json())
                .then(remoteData => {
                    if (!remoteData || remoteData === null) {
                        console.log('ℹ️ На сервере нет данных для этого месяца');
                        resolve();
                        return;
                    }

                    // Объединяем данные (приоритет локальным)
                    const localData = DataManager.getMonthData();
                    
                    if (remoteData.transactions) {
                        localData.transactions = {
                            ...remoteData.transactions,
                            ...localData.transactions
                        };
                    }

                    if (remoteData.categories) {
                        localData.categories = {
                            ...remoteData.categories,
                            ...localData.categories
                        };
                    }

                    DataManager.saveMonthData(localData);
                    console.log('⬇️ Данные загружены с Firebase');
                    resolve();
                })
                .catch(e => {
                    console.warn('⚠️ Не удалось загрузить с Firebase:', e);
                    // Не отклоняем, продолжаем работу
                    resolve();
                });
        });
    },

    uploadToFirebase() {
        return new Promise((resolve, reject) => {
            const monthKey = DataManager.getMonthKey();
            const localData = DataManager.getMonthData();

            // ИСПРАВЛЕНИЕ: Не отправляем пустые данные
            if (!localData || !localData.transactions || Object.keys(localData.transactions).length === 0) {
                console.log('ℹ️ Нет данных для загрузки');
                resolve();
                return;
            }

            const url = `${this.DATABASE_URL}/budget/${monthKey}.json?key=${this.API_KEY}`;

            fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(localData)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('⬆️ Данные загружены на Firebase');
                    resolve();
                })
                .catch(e => {
                    console.warn('⚠️ Не удалось загрузить на Firebase:', e);
                    // Не отклоняем, продолжаем работу
                    resolve();
                });
        });
    },

    // ========================================
    // ПРОВЕРКА ПОДКЛЮЧЕНИЯ
    // ========================================
    checkConnection() {
        return new Promise((resolve) => {
            const url = `${this.DATABASE_URL}/.json?key=${this.API_KEY}`;

            Promise.race([
                fetch(url, { method: 'HEAD' }),
                new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000))
            ])
                .then(() => {
                    console.log('✅ Firebase доступен');
                    resolve(true);
                })
                .catch(() => {
                    console.log('⚠️ Firebase недоступен');
                    resolve(false);
                });
        });
    },

    // ========================================
    // УТИЛИТЫ
    // ========================================
    getAllLocalData() {
        const data = {};
        const storage = window['local' + 'Storage'];

        if (DataManager.useMemoryStorage) {
            Object.keys(DataManager.memoryStorage).forEach(key => {
                if (key.startsWith('budget_')) {
                    data[key] = DataManager.memoryStorage[key];
                }
            });
        } else {
            try {
                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);
                    if (key && key.startsWith('budget_')) {
                        data[key] = JSON.parse(storage.getItem(key));
                    }
                }
            } catch (e) {
                console.warn('Ошибка при чтении localStorage:', e);
            }
        }

        return data;
    },

    updateSyncTime() {
        const now = new Date();
        this.lastSyncTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        console.log('⏱️ Последняя синхронизация:', this.lastSyncTime);
    },

    getLastSyncTime() {
        return this.lastSyncTime || '--:--';
    },

    getSyncStatus() {
        return this.lastSyncStatus;
    }
};

// Синхронизация при загрузке страницы
window.addEventListener('load', () => {
    // Начальная синхронизация
    setTimeout(() => {
        FirebaseManager.syncNow().catch(e => {
            console.log('Первичная синхронизация не удалась, работаем offline');
        });
    }, 1000);
});

// Синхронизация при восстановлении подключения
window.addEventListener('online', () => {
    console.log('📡 Подключение восстановлено, синхронизируем...');
    FirebaseManager.syncNow();
});
