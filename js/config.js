// CONFIG.JS - Все константы приложения
const CONFIG = {
    API_KEY: 'AIzaSyBSmhDwMK9qfsiyLYPCqddoZ957WIx1qt8',
    SHEET_ID: '1Nsrf4fJVEVRQ7d09tvnPv0yFzBP7TsoSBO8b4D2sHSg',
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyhUZfbJBg4RoUJw3LgNzDTK9waDIUkSUecz1FDbz27QkdgYimHchAOocRHejVKQHs9/exec',
    SYNC_INTERVAL: 30000, // 30 секунд
    VERSION: '2.1',

    CATEGORIES: [
        { id: 1, name: 'Дом, коммуналка, связь', limit: 56000, color: '#B8D4E3' },
        { id: 2, name: 'Долги/возвраты', limit: 5000, color: '#C8E8C4' },
        { id: 3, name: 'Чай, ВБ, Озон', limit: 2500, color: '#E8D4B8' },
        { id: 4, name: 'Уход и медицина', limit: 2600, color: '#D8D8D8' },
        { id: 5, name: 'Рассрочки и кредиты', limit: 18000, color: '#B8D4E3' },
        { id: 6, name: 'Транспорт', limit: 20000, color: '#C8E8C4' },
        { id: 7, name: 'Тима', limit: 3000, color: '#E8D4B8' },
        { id: 8, name: 'Подарки', limit: 2000, color: '#D8D8D8' },
        { id: 9, name: 'Продукты, магазины', limit: 40000, color: '#B8D4E3' },
        { id: 10, name: 'Развлечения, рестики, доставки', limit: 15000, color: '#C8E8C4' },
        { id: 11, name: 'Алкоголь и сигареты', limit: 0, color: '#F5A6A6' },
        { id: 12, name: 'Прочее', limit: 0, color: '#D8D8D8' }
    ],

    MONTHS: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
             'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
};
