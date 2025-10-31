// SHEETS-SYNC.JS - Синхронизация с Google Sheets
class GoogleSheetSync {
    constructor(storage) {
        this.storage = storage;
        this.isOnline = navigator.onLine;
        this.syncTimer = null;

        // Слушаем изменения статуса сети
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateSyncStatus(true);
            this.sync();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateSyncStatus(false);
        });
    }

    // Запуск автосинхронизации
    startAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        this.syncTimer = setInterval(() => {
            if (this.isOnline) {
                this.sync();
            }
        }, CONFIG.SYNC_INTERVAL);

        // Первая синхронизация сразу
        if (this.isOnline) {
            this.sync();
        }
    }

    // Остановка автосинхронизации
    stopAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    // Синхронизация
    async sync() {
        if (!this.isOnline) {
            console.log('Оффлайн режим - синхронизация пропущена');
            return false;
        }

        try {
            console.log('Начало синхронизации...');
            this.updateSyncStatus(true, 'Синхронизация...');

            // Отправляем данные в Google Sheets
            await this.pushToSheets();

            // Обновляем время последней синхронизации
            const data = this.storage.getData();
            data.lastSync = new Date().toISOString();
            this.storage.saveData(data);

            this.updateSyncStatus(true, 'Синхронизировано');
            console.log('✅ Синхронизация завершена');
            return true;

        } catch (error) {
            console.error('Ошибка синхронизации:', error);
            this.updateSyncStatus(true, 'Ошибка синхронизации');
            return false;
        }
    }

    // Отправка данных в Google Sheets
    async pushToSheets() {
        const data = this.storage.getData();
        const transactions = data.transactions;

        if (!transactions || transactions.length === 0) {
            console.log('Нет транзакций для синхронизации');
            return;
        }

        // Подготавливаем данные для отправки
        const payload = {
            action: 'sync',
            transactions: transactions
        };

        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Для Apps Script
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('Данные отправлены в Google Sheets');
    }

    // Обновление UI статуса синхронизации
    updateSyncStatus(online, message = '') {
        const statusEl = document.getElementById('sync-status');
        if (!statusEl) return;

        if (online) {
            statusEl.innerHTML = `<span style="color: #A6F5C8;">✅ Онлайн</span>`;
            if (message) {
                statusEl.innerHTML += ` <span style="font-size: 12px;">${message}</span>`;
            }
        } else {
            statusEl.innerHTML = '<span style="color: #F5A6A6;">❌ Оффлайн</span>';
        }
    }

    // Принудительная синхронизация (кнопка)
    async forceSyncNow() {
        if (!this.isOnline) {
            alert('Нет подключения к интернету');
            return;
        }

        const result = await this.sync();
        if (result) {
            alert('Синхронизация завершена');
        } else {
            alert('Ошибка синхронизации');
        }
    }
}
