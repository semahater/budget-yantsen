# 💰 Семейный бюджет Янцен v2.1

## 📋 Описание
Progressive Web App для управления семейным бюджетом с синхронизацией через Google Sheets.

## ✨ Функции
- ✅ Учёт доходов и расходов
- ✅ 12 категорий расходов с лимитами
- ✅ Круговая диаграмма расходов
- ✅ Поиск и фильтрация транзакций
- ✅ Синхронизация с Google Sheets
- ✅ Offline режим (localStorage)
- ✅ PWA установка на iPhone
- ✅ Адаптивный дизайн

## 🚀 Развёртывание на GitHub Pages

### Шаг 1: Создать репозиторий
1. Зайти на [GitHub](https://github.com)
2. Создать новый репозиторий: `family-budget-yanzen`
3. Сделать его публичным

### Шаг 2: Загрузить файлы
Загрузить все файлы в репозиторий:
```
family-budget-yanzen/
├── index.html
├── manifest.json
├── service-worker.js
├── css/
│   └── styles.css
├── js/
│   ├── config.js
│   ├── storage.js
│   ├── sheets-sync.js
│   ├── ui.js
│   └── app.js
└── README.md
```

### Шаг 3: Включить GitHub Pages
1. Перейти в **Settings** → **Pages**
2. В разделе **Source** выбрать: `main` (или `master`) → `/root`
3. Нажать **Save**
4. Дождаться развёртывания (~2-3 минуты)

### Шаг 4: Открыть приложение
Ссылка: `https://ВАШ_USERNAME.github.io/family-budget-yanzen/`

### Шаг 5: Установить на iPhone
1. Открыть Safari на iPhone
2. Перейти по ссылке приложения
3. Нажать кнопку "Поделиться" (квадрат со стрелкой вверх)
4. Выбрать **"На экран «Домой»"**
5. Нажать **"Добавить"**

## 🔧 Технологии
- HTML5, CSS3, Vanilla JavaScript (ES6+)
- Chart.js для диаграмм
- Google Sheets API v4
- Service Worker для PWA
- localStorage для offline

## 📞 Поддержка
Версия: 2.1  
Дата: Ноябрь 2025
