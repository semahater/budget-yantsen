// firebase-sync.js - Синхронизация через Firebase Realtime Database
class FirebaseSync {
    constructor(storage) {
        this.storage = storage;
        this.isOnline = navigator.onLine;
        this.syncTimer = null;
        this.db = null;
        
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
    
    async initializeFirebase() {
        if (!CONFIG.FIREBASE_DATABASE_URL || !CONFIG.FIREBASE_API_KEY) {
            console.error('❌ Firebase credentials не установлены');
            return false;
        }
        
        try {
            console.log('🔥 Инициализация Firebase...');
            this.db = CONFIG.FIREBASE_DATABASE_URL;
            console.log('✅ Firebase готов!');
            return true;
        } catch (error) {
            console.error('❌ Ошибка:', error);
            return false;
        }
    }
    
    startAutoSync() {
        if (this.syncTimer) clearInterval(this.syncTimer);
        
        if (this.isOnline) this.sync();
        
        this.syncTimer = setInterval(() => {
            if (this.isOnline) this.sync();
        }, 10000);
    }
    
    stopAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }
    
    async sync() {
        if (!this.isOnline || !this.db) return false;
        
        try {
            await this.pushToFirebase();
            await this.pullFromFirebase();
            
            const data = this.storage.getData();
            data.lastSync = new Date().toISOString();
            this.storage.saveData(data);
            
            this.updateSyncStatus(true, 'Синхронизировано');
            return true;
        } catch (error) {
            console.error('❌ Ошибка:', error);
            return false;
        }
    }
    
    async pushToFirebase() {
        const data = this.storage.getData();
        const transactions = data.transactions || [];
        
        if (!transactions || transactions.length === 0) return;
        
        try {
            const url = `${this.db}transactions.json?auth=${CONFIG.FIREBASE_API_KEY}`;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactions)
            });
            
            if (response.ok) {
                console.log(`✅ ${transactions.length} транзакций в Firebase`);
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка отправки:', error);
        }
    }
    
    async pullFromFirebase() {
        try {
            const url = `${this.db}transactions.json?auth=${CONFIG.FIREBASE_API_KEY}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Firebase ошибка');
            
            const firebaseData = await response.json();
            if (!firebaseData) return;
            
            if (Array.isArray(firebaseData)) {
                this.mergeTransactions(firebaseData);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка получения:', error);
        }
    }
    
    mergeTransactions(firebaseTransactions) {
        const data = this.storage.getData();
        const localIds = new Set(data.transactions.map(t => t.id));
        
        let newCount = 0;
        
        firebaseTransactions.forEach(ftrans => {
            if (ftrans && !localIds.has(ftrans.id)) {
                data.transactions.push(ftrans);
                newCount++;
            }
        });
        
        if (newCount > 0) {
            this.storage.saveData(data);
            console.log(`✅ Добавлено ${newCount} новых транзакций`);
            this.triggerUIUpdate();
        }
    }
    
    triggerUIUpdate() {
        if (window.budgetApp) {
            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen?.id === 'dashboard-screen') {
                window.budgetApp.renderDashboard();
            }
            if (activeScreen?.id === 'expenses-screen') {
                window.budgetApp.renderExpenses();
            }
        }
    }
    
    updateSyncStatus(online, message = '') {
        const statusEl = document.getElementById('sync-status');
        if (!statusEl) return;
        
        if (online) {
            statusEl.innerHTML = `<span style="color: #A6F5C8;">✅ Онлайн</span>`;
            if (message) statusEl.innerHTML += ` <span style="font-size: 12px;">${message}</span>`;
        } else {
            statusEl.innerHTML = '<span style="color: #F5A6A6;">❌ Оффлайн</span>';
        }
    }
    
    async forceSyncNow() {
        if (!this.isOnline) {
            alert('Нет интернета');
            return;
        }
        
        this.updateSyncStatus(true, 'Синхронизация...');
        const result = await this.sync();
        
        if (result) {
            alert('✅ Синхронизация завершена!');
        } else {
            alert('❌ Ошибка');
        }
    }
}
