// ========================================
// APP.JS - ПОЛНАЯ ПЕРЕРАБОТКА
// Добавлены: доходы в категориях, экспорт CSV, выбор месяцев
// ========================================

const UI = {
    currentScreen: 'dashboard',
    chart: null,
    exportMonths: [], // Для экспорта

    init() {
        DataManager.init();
        FirebaseManager.init();
        this.initNavigation();
        this.initDashboard();
        this.initTransactions();
        this.initCategories();
        this.initSettings();
        this.initModals();
        this.refreshAll();
    },

    // ========================================
    // НАВИГАЦИЯ
    // ========================================
    initNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    const screen = btn.dataset.screen;
                    this.switchScreen(screen);
                });
            }
        });
    },

    switchScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(`screen-${screenName}`);
        if (screen) screen.classList.add('active');

        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-screen="${screenName}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        this.currentScreen = screenName;

        if (screenName === 'dashboard') {
            this.updateDashboard();
        } else if (screenName === 'transactions') {
            this.updateTransactions();
        } else if (screenName === 'categories') {
            this.updateCategories();
        } else if (screenName === 'settings') {
            this.updateSettings();
        }
    },

    // ========================================
    // DASHBOARD
    // ========================================
    initDashboard() {
        const btnPrevMonth = document.getElementById('btn-prev-month');
        if (btnPrevMonth) {
            btnPrevMonth.addEventListener('click', () => {
                DataManager.prevMonth();
                this.refreshAll();
            });
        }

        const btnNextMonth = document.getElementById('btn-next-month');
        if (btnNextMonth) {
            btnNextMonth.addEventListener('click', () => {
                DataManager.nextMonth();
                this.refreshAll();
            });
        }

        const btnAddExpense = document.getElementById('btn-add-expense');
        if (btnAddExpense) {
            btnAddExpense.addEventListener('click', () => {
                this.openExpenseModal();
            });
        }

        const btnAddIncome = document.getElementById('btn-add-income');
        if (btnAddIncome) {
            btnAddIncome.addEventListener('click', () => {
                this.openIncomeModal();
            });
        }
    },

    updateDashboard() {
        const monthLabel = document.getElementById('current-month-label');
        if (monthLabel) monthLabel.textContent = DataManager.getMonthName();

        const stats = DataManager.getMonthStats();
        
        const statIncome = document.getElementById('stat-income');
        if (statIncome) statIncome.textContent = `${DataManager.formatNumber(stats.income)} ₽`;

        const statExpense = document.getElementById('stat-expense');
        if (statExpense) statExpense.textContent = `${DataManager.formatNumber(stats.expense)} ₽`;

        const statBalance = document.getElementById('stat-balance');
        if (statBalance) statBalance.textContent = `${DataManager.formatNumber(stats.balance)} ₽`;

        this.updateChart();
    },

    updateChart() {
        const expenses = DataManager.getExpensesByCategory();
        const canvas = document.getElementById('expenses-chart');
        const emptyMessage = document.getElementById('chart-empty');
        const legendContainer = document.getElementById('chart-legend');

        if (!canvas || !emptyMessage || !legendContainer) return;

        if (expenses.length === 0) {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            canvas.style.display = 'none';
            emptyMessage.style.display = 'block';
            legendContainer.innerHTML = '';
            return;
        }

        canvas.style.display = 'block';
        emptyMessage.style.display = 'none';

        const labels = expenses.map(e => e.name);
        const data = expenses.map(e => e.sum);
        const colors = expenses.map(e => e.color);
        const total = data.reduce((a, b) => a + b, 0);

        if (this.chart) {
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = data;
            this.chart.data.datasets[0].backgroundColor = colors;
            this.chart.update();
        } else {
            this.chart = new Chart(canvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#FFFFFF'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed;
                                    const percent = ((value / total) * 100).toFixed(1);
                                    return `${context.label}: ${DataManager.formatNumber(value)} ₽ (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        legendContainer.innerHTML = '';
        expenses.forEach(exp => {
            const percent = ((exp.sum / total) * 100).toFixed(1);
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                padding: 8px;
            `;
            item.innerHTML = `
                <div style="width: 12px; height: 12px; background: ${exp.color}; border-radius: 2px;"></div>
                <span style="flex: 1;">${exp.emoji} ${exp.name}</span>
                <span style="font-weight: 600;">${DataManager.formatNumber(exp.sum)} ₽</span>
            `;
            legendContainer.appendChild(item);
        });
    },

    // ========================================
    // ТРАНЗАКЦИИ
    // ========================================
    initTransactions() {
    },

    updateTransactions() {
        const transactions = DataManager.getTransactions();
        const container = document.getElementById('transactions-list');

        if (!container) return;

        container.innerHTML = '';

        if (transactions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px 20px;">Нет операций за этот месяц</p>';
            return;
        }

        transactions.forEach(tx => {
            const category = DataManager.getCategory(tx.category);
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #eee;
                background: white;
                margin-bottom: 8px;
                border-radius: 8px;
            `;

            const categoryEmoji = category ? category.emoji : '📌';
            const categoryName = category ? category.name : 'Неизвестная';
            const typeLabel = tx.type === 'income' ? '+' : '−';
            const typeColor = tx.type === 'income' ? '#10B981' : '#EF4444';

            item.innerHTML = `
                <div>
                    <div style="font-weight: 600;">${categoryEmoji} ${categoryName}</div>
                    <div style="font-size: 12px; color: #999;">${tx.description || 'Без описания'}</div>
                    <div style="font-size: 11px; color: #999;">${DataManager.formatDate(tx.date)}</div>
                </div>
                <div style="font-weight: 700; color: ${typeColor}; font-size: 16px;">
                    ${typeLabel}${DataManager.formatNumber(tx.sum)} ₽
                </div>
            `;

            container.appendChild(item);
        });
    },

    // ========================================
    // КАТЕГОРИИ (С ДОХОДАМИ СВЕРХУ)
    // ========================================
    initCategories() {
        const btnAddCategory = document.getElementById('btn-add-category');
        if (btnAddCategory) {
            btnAddCategory.addEventListener('click', () => {
                this.openCategoryModal();
            });
        }
    },

    updateCategories() {
        const categories = DataManager.getCategories();
        const container = document.getElementById('categories-list');

        if (!container) return;

        container.innerHTML = '';

        // ========== ДОХОДЫ СВЕРХУ ==========
        const allTransactions = DataManager.getTransactions();
        const incomeTransactions = allTransactions.filter(tx => tx.type === 'income');
        const totalIncome = incomeTransactions.reduce((sum, tx) => sum + tx.sum, 0);

        const incomeItem = document.createElement('div');
        incomeItem.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid #eee;
            background: white;
            margin-bottom: 8px;
            border-radius: 8px;
        `;

        incomeItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <span style="font-size: 24px;">💵</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #1F2937;">Доходы</div>
                    <div style="font-size: 12px; color: #999;">Получено: ${DataManager.formatNumber(totalIncome)} ₽</div>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn-view-income" style="background: none; border: 1px solid #ddd; padding: 6px 10px; border-radius: 4px; cursor: pointer;">👁️</button>
            </div>
        `;

        container.appendChild(incomeItem);

        // Слушатель на кнопку просмотра доходов
        const viewIncomeBtn = incomeItem.querySelector('.btn-view-income');
        if (viewIncomeBtn) {
            viewIncomeBtn.addEventListener('click', () => {
                this.openIncomeDetails();
            });
        }

        // ========== РАСХОДЫ (КАТЕГОРИИ) ==========
        Object.entries(categories).forEach(([catId, category]) => {
            const spent = DataManager.getCategorySpent(catId);
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #eee;
                background: white;
                margin-bottom: 8px;
                border-radius: 8px;
            `;

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <span style="font-size: 24px;">${category.emoji}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1F2937;">${category.name}</div>
                        <div style="font-size: 12px; color: #999;">Потрачено: ${DataManager.formatNumber(spent)} ₽</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-view-category" data-id="${catId}" style="background: none; border: 1px solid #ddd; padding: 6px 10px; border-radius: 4px; cursor: pointer;">👁️</button>
                    <button class="btn-edit-category" data-id="${catId}" style="background: none; border: 1px solid #ddd; padding: 6px 10px; border-radius: 4px; cursor: pointer;">✏️</button>
                    <button class="btn-delete-category" data-id="${catId}" style="background: none; border: 1px solid #ddd; padding: 6px 10px; border-radius: 4px; cursor: pointer;">🗑️</button>
                </div>
            `;

            container.appendChild(item);

            const viewBtn = item.querySelector('.btn-view-category');
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openCategoryDetails(catId);
                });
            }

            const editBtn = item.querySelector('.btn-edit-category');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    DataManager.editingCategoryId = catId;
                    this.openCategoryModal();
                });
            }

            const deleteBtn = item.querySelector('.btn-delete-category');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Удалить категорию?')) {
                        DataManager.deleteCategory(catId);
                        this.refreshAll();
                    }
                });
            }
        });
    },

    // ========================================
    // ДЕТАЛИ ДОХОДОВ
    // ========================================
    openIncomeDetails() {
        const transactions = DataManager.getTransactions().filter(tx => tx.type === 'income');
        
        const modal = document.getElementById('modal-category-details');
        if (!modal) return;
        
        const categoryName = document.getElementById('category-details-name');
        const categoryEmoji = document.getElementById('category-details-emoji');
        const categoryTotal = document.getElementById('category-details-total');
        const transactionsList = document.getElementById('category-transactions-list');
        
        if (categoryName) categoryName.textContent = 'Доходы';
        if (categoryEmoji) categoryEmoji.textContent = '💵';
        
        let total = 0;
        if (transactionsList) {
            transactionsList.innerHTML = '';
            
            if (transactions.length === 0) {
                transactionsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Нет доходов в этом месяце</div>';
            } else {
                transactions.forEach(tx => {
                    total += tx.sum;
                    const item = document.createElement('div');
                    item.style.cssText = `
                        display: flex;
                        justify-content: space-between;
                        padding: 12px;
                        border-bottom: 1px solid #eee;
                    `;
                    item.innerHTML = `
                        <div>
                            <div style="font-weight: 600;">${tx.description || 'Источник дохода'}</div>
                            <div style="font-size: 12px; color: #999;">${DataManager.formatDate(tx.date)}</div>
                        </div>
                        <div style="font-weight: 600;">${DataManager.formatNumber(tx.sum)} ₽</div>
                    `;
                    transactionsList.appendChild(item);
                });
            }
        }
        
        if (categoryTotal) categoryTotal.textContent = `${DataManager.formatNumber(total)} ₽`;
        
        modal.style.display = 'flex';
    },

    // ========================================
    // ДЕТАЛИ КАТЕГОРИИ
    // ========================================
    openCategoryDetails(categoryId) {
        const category = DataManager.getCategory(categoryId);
        if (!category) return;

        const transactions = DataManager.getTransactionsByCategory(categoryId);
        
        const modal = document.getElementById('modal-category-details');
        if (!modal) return;
        
        const categoryName = document.getElementById('category-details-name');
        const categoryEmoji = document.getElementById('category-details-emoji');
        const categoryTotal = document.getElementById('category-details-total');
        const transactionsList = document.getElementById('category-transactions-list');
        
        if (categoryName) categoryName.textContent = category.name;
        if (categoryEmoji) categoryEmoji.textContent = category.emoji;
        
        let total = 0;
        if (transactionsList) {
            transactionsList.innerHTML = '';
            
            if (transactions.length === 0) {
                transactionsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Нет транзакций в этой категории</div>';
            } else {
                transactions.forEach(tx => {
                    total += tx.sum;
                    const item = document.createElement('div');
                    item.style.cssText = `
                        display: flex;
                        justify-content: space-between;
                        padding: 12px;
                        border-bottom: 1px solid #eee;
                    `;
                    item.innerHTML = `
                        <div>
                            <div style="font-weight: 600;">${tx.description || 'Без описания'}</div>
                            <div style="font-size: 12px; color: #999;">${DataManager.formatDate(tx.date)}</div>
                        </div>
                        <div style="font-weight: 600;">${DataManager.formatNumber(tx.sum)} ₽</div>
                    `;
                    transactionsList.appendChild(item);
                });
            }
        }
        
        if (categoryTotal) categoryTotal.textContent = `${DataManager.formatNumber(total)} ₽`;
        
        modal.style.display = 'flex';
    },

    closeCategoryDetails() {
        const modal = document.getElementById('modal-category-details');
        if (modal) modal.style.display = 'none';
    },

    // ========================================
    // ПАРАМЕТРЫ
    // ========================================
    initSettings() {
        const btnSync = document.getElementById('btn-sync-now');
        if (btnSync) {
            btnSync.addEventListener('click', () => {
                FirebaseManager.syncNow();
            });
        }

        const btnExport = document.getElementById('btn-export-data');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                this.openExportModal();
            });
        }
    },

    updateSettings() {
        const allTimeStats = DataManager.getAllTimeStats();
        
        const totalIncome = document.getElementById('stat-all-time-income');
        if (totalIncome) totalIncome.textContent = `${DataManager.formatNumber(allTimeStats.totalIncome)} ₽`;

        const totalExpense = document.getElementById('stat-all-time-expense');
        if (totalExpense) totalExpense.textContent = `${DataManager.formatNumber(allTimeStats.totalExpense)} ₽`;

        const avgIncome = document.getElementById('stat-avg-income');
        if (avgIncome) avgIncome.textContent = `${DataManager.formatNumber(allTimeStats.avgIncome)} ₽`;

        const avgExpense = document.getElementById('stat-avg-expense');
        if (avgExpense) avgExpense.textContent = `${DataManager.formatNumber(allTimeStats.avgExpense)} ₽`;

        const deviceId = document.getElementById('device-id');
        if (deviceId) deviceId.textContent = DataManager.getDeviceId();
    },

    // ========================================
    // ЭКСПОРТ CSV
    // ========================================
    openExportModal() {
        const modal = document.getElementById('modal-export');
        if (!modal) return;

        const exportPeriod = document.getElementById('export-period');
        if (exportPeriod) {
            exportPeriod.value = 'current';
            exportPeriod.addEventListener('change', () => {
                this.updateMonthsList();
            });
        }

        this.updateMonthsList();
        modal.style.display = 'flex';
    },

    closeExportModal() {
        const modal = document.getElementById('modal-export');
        if (modal) modal.style.display = 'none';
    },

    updateMonthsList() {
        const exportPeriod = document.getElementById('export-period');
        const monthsList = document.getElementById('export-months-list');

        if (!exportPeriod || !monthsList) return;

        if (exportPeriod.value === 'all') {
            monthsList.style.display = 'block';
            this.fillMonthsCheckboxes();
        } else {
            monthsList.style.display = 'none';
        }
    },

    fillMonthsCheckboxes() {
        const months = this.getAvailableMonths();
        const container = document.getElementById('months-checkboxes');

        if (!container) return;
        
        container.innerHTML = '';
        this.exportMonths = []; // Сброс выбора

        months.forEach(monthKey => {
            const label = document.createElement('label');
            label.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px;
                cursor: pointer;
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = monthKey;
            checkbox.checked = true;
            checkbox.style.marginRight = '8px';

            checkbox.addEventListener('change', () => {
                if (checkbox.checked && !this.exportMonths.includes(monthKey)) {
                    this.exportMonths.push(monthKey);
                } else {
                    this.exportMonths = this.exportMonths.filter(m => m !== monthKey);
                }
            });

            this.exportMonths.push(monthKey);

            const text = document.createElement('span');
            const [year, month] = monthKey.split('-');
            const months_names = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                                 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
            text.textContent = `${months_names[parseInt(month) - 1]} ${year}`;

            label.appendChild(checkbox);
            label.appendChild(text);
            container.appendChild(label);
        });
    },

    getAvailableMonths() {
        const months = [];
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const storage = window.localStorage;
                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);
                    if (key && key.startsWith('budget_')) {
                        const monthKey = key.replace('budget_', '');
                        const data = JSON.parse(storage.getItem(key));
                        if (data && data.transactions && Object.keys(data.transactions).length > 0) {
                            months.push(monthKey);
                        }
                    }
                }
            } catch (e) {
                console.warn('Ошибка при чтении месяцев:', e);
            }
        }
        return months.sort().reverse();
    },

    exportData() {
        const exportPeriod = document.getElementById('export-period');
        if (!exportPeriod) return;

        let monthsToExport = [];
        
        if (exportPeriod.value === 'current') {
            monthsToExport = [`${DataManager.currentYear}-${DataManager.currentMonth}`];
        } else {
            monthsToExport = this.exportMonths.length > 0 ? this.exportMonths : this.getAvailableMonths();
        }

        let csvContent = 'Месяц,Дата,Тип,Описание,Категория,Сумма (₽)\n';

        monthsToExport.forEach(monthKey => {
            try {
                const storage = window.localStorage;
                const data = JSON.parse(storage.getItem(`budget_${monthKey}`));

                if (data && data.transactions) {
                    const [year, month] = monthKey.split('-');
                    const months_names = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                                         'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
                    const monthName = `${months_names[parseInt(month) - 1]} ${year}`;

                    // Сортируем транзакции по дате
                    const transactions = Object.values(data.transactions).sort((a, b) => 
                        new Date(b.date) - new Date(a.date)
                    );

                    transactions.forEach(tx => {
                        const category = data.categories[tx.category] || { name: 'Неизвестная' };
                        const typeLabel = tx.type === 'income' ? 'Доход' : 'Расход';
                        const description = (tx.description || '').replace(/,/g, ';'); // Экранируем запятые
                        
                        csvContent += `"${monthName}","${tx.date}","${typeLabel}","${description}","${category.name}",${tx.sum}\n`;
                    });
                }
            } catch (e) {
                console.warn('Ошибка при экспорте месяца:', monthKey, e);
            }
        });

        // Скачиваем файл
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const [year, month] = monthsToExport[0].split('-');
        const filename = `Budget_${year}-${month}_yanzen.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.closeExportModal();
    },

    // ========================================
    // МОДАЛИ
    // ========================================
    openExpenseModal() {
        const modal = document.getElementById('modal-expense');
        if (!modal) return;

        modal.style.display = 'flex';
        
        const categorySelect = document.getElementById('modal-expense-category');
        if (categorySelect) {
            categorySelect.innerHTML = '';
            Object.entries(DataManager.getCategories()).forEach(([catId, cat]) => {
                const option = document.createElement('option');
                option.value = catId;
                option.textContent = `${cat.emoji} ${cat.name}`;
                categorySelect.appendChild(option);
            });
        }

        const dateInput = document.getElementById('modal-expense-date');
        if (dateInput) dateInput.value = DataManager.getCurrentDate();
    },

    closeExpenseModal() {
        const modal = document.getElementById('modal-expense');
        if (modal) modal.style.display = 'none';
    },

    saveExpense() {
        const sumInput = document.getElementById('modal-expense-sum');
        const categorySelect = document.getElementById('modal-expense-category');
        const descriptionInput = document.getElementById('modal-expense-description');
        const dateInput = document.getElementById('modal-expense-date');

        if (!sumInput || !categorySelect || !dateInput) return;

        const sum = sumInput.value;
        const category = categorySelect.value;
        const description = descriptionInput ? descriptionInput.value : '';
        const date = dateInput.value;

        if (!sum || !category || !date) {
            alert('Заполни все обязательные поля');
            return;
        }

        DataManager.addTransaction('expense', sum, category, description, date);
        this.refreshAll();
        this.closeExpenseModal();

        if (sumInput) sumInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
    },

    openIncomeModal() {
        const modal = document.getElementById('modal-income');
        if (modal) modal.style.display = 'flex';
        
        const dateInput = document.getElementById('modal-income-date');
        if (dateInput) dateInput.value = DataManager.getCurrentDate();
    },

    closeIncomeModal() {
        const modal = document.getElementById('modal-income');
        if (modal) modal.style.display = 'none';
    },

    saveIncome() {
        const sumInput = document.getElementById('modal-income-sum');
        const descriptionInput = document.getElementById('modal-income-description');
        const dateInput = document.getElementById('modal-income-date');

        if (!sumInput || !dateInput) return;

        const sum = sumInput.value;
        const description = descriptionInput ? descriptionInput.value : '';
        const date = dateInput.value;

        if (!sum || !date) {
            alert('Заполни все обязательные поля');
            return;
        }

        DataManager.addTransaction('income', sum, 'income', description, date);
        this.refreshAll();
        this.closeIncomeModal();

        if (sumInput) sumInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
    },

    openCategoryModal() {
        const modal = document.getElementById('modal-category');
        if (modal) modal.style.display = 'flex';
    },

    closeCategoryModal() {
        const modal = document.getElementById('modal-category');
        if (modal) modal.style.display = 'none';
        DataManager.editingCategoryId = null;
    },

    saveCategory() {
        const nameInput = document.getElementById('modal-category-name');
        const emojiInput = document.getElementById('modal-category-emoji');
        const colorInput = document.getElementById('modal-category-color');
        const limitInput = document.getElementById('modal-category-limit');

        if (!nameInput) return;

        const name = nameInput.value;
        const emoji = emojiInput ? emojiInput.value : '📌';
        const color = colorInput ? colorInput.value : '#6B7280';
        const limit = limitInput ? limitInput.value : 0;

        if (!name) {
            alert('Введи название категории');
            return;
        }

        if (DataManager.editingCategoryId) {
            DataManager.updateCategory(DataManager.editingCategoryId, name, emoji, color, limit);
            DataManager.editingCategoryId = null;
        } else {
            DataManager.addCategory(name, emoji, color, limit);
        }

        this.refreshAll();
        this.closeCategoryModal();

        if (nameInput) nameInput.value = '';
        if (emojiInput) emojiInput.value = '📌';
        if (limitInput) limitInput.value = 0;
    },

    // ========================================
    // ОБЩИЕ
    // ========================================
    refreshAll() {
        this.updateDashboard();
        this.updateTransactions();
        this.updateCategories();
        this.updateSettings();
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
