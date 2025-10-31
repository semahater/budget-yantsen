// SHEETS-SYNC.JS - ИСПРАВЛЕННАЯ ВЕРСИЯ с рабочей синхронизацией
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
    
    // ИСПРАВЛЕННАЯ СИНХРОНИЗАЦИЯ
    async sync() {
        if (!this.isOnline) {
            console.log('Оффлайн режим - синхронизация пропущена');
            return false;
        }
        
        try {
            console.log('🔄 Начало синхронизации...');
            this.updateSyncStatus(true, 'Синхронизация...');
            
            // Отправляем данные в Google Sheets
            await this.pushToSheets();
            
            // Получаем данные со второго iPhone
            await this.pullFromSheets();
            
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
    
    // ИСПРАВЛЕННАЯ ОТПРАВКА В GOOGLE SHEETS
    async pushToSheets() {
        const data = this.storage.getData();
        const transactions = data.transactions || [];
        
        if (!transactions || transactions.length === 0) {
            console.log('Нет новых транзакций для синхронизации');
            return;
        }
        
        console.log(`📤 Отправляем ${transactions.length} транзакций...`);
        
        try {
            // Используем Apps Script URL для записи
            const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'addTransactions',
                    data: transactions,
                    timestamp: new Date().toISOString()
                })
            });
            
            console.log('✅ Данные отправлены на Google Sheets');
            
        } catch (error) {
            console.error('❌ Ошибка при отправке:', error);
        }
    }
    
    // НОВАЯ ФУНКЦИЯ: Получение данных со второго iPhone
    async pullFromSheets() {
        if (!this.isOnline) return;
        
        try {
            console.log('📥 Получаем данные с Google Sheets...');
            
            // Читаем данные через Google Sheets API
            const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/Транзакции?key=${CONFIG.API_KEY}`;
            
            const response = await fetch(sheetUrl);
            if (!response.ok) {
                throw new Error('Ошибка при чтении Google Sheets');
            }
            
            const result = await response.json();
            console.log('✅ Данные получены с Google Sheets');
            
            // Парсим данные и обновляем localStorage
            if (result.values && result.values.length > 1) {
                this.mergeTransactions(result.values);
            }
            
        } catch (error) {
            console.error('❌ Ошибка при получении данных:', error);
        }
    }
    
    // НОВАЯ ФУНКЦИЯ: Объединение данных с двух iPhone
    mergeTransactions(sheetRows) {
        const data = this.storage.getData();
        const localTransactionIds = new Set(data.transactions.map(t => t.id));
        
        // Пропускаем заголовок (первая строка)
        for (let i = 1; i < sheetRows.length; i++) {
            const row = sheetRows[i];
            if (!row || row.length < 7) continue;
            
            const transaction = {
                id: row,
                month: row,
                date: row,
                name: row,
                amount: parseFloat(row),
                category: parseInt(row),
                type: row
            };
            
            // Если транзакции нет локально - добавляем её
            if (!localTransactionIds.has(transaction.id)) {
                data.transactions.push(transaction);
                console.log(`✅ Добавлена синхронизированная транзакция: ${transaction.name}`);
            }
        }
        
        this.storage.saveData(data);
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
