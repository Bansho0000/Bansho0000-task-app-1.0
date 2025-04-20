// src/calendar.js (Vite対応版)

// ▼▼▼ 必要なモジュールとCSSを import ▼▼▼
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';

// npmパッケージのCSS import
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
// ▼▼▼ 自身のカスタムCSSのimportパスを修正 ▼▼▼
import './calendar.css';
// ▲▲▲ 自身のカスタムCSSのimportパスを修正 ▲▲▲

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Calendar] DOMContentLoaded event fired.');
    const calendarEl = document.getElementById('calendar');

    // FullCalendar オブジェクトが import できているか確認
    if (typeof Calendar === 'undefined') { /* ... */ }

    // 1. localStorageからタスクデータを読み込む (変更なし)
    let tasks = [];
    try { /* ... */ } catch (error) { /* ... */ }

    // 2. FullCalendar用のイベントデータに変換 (変更なし)
    const calendarEvents = tasks.filter(task => task.dueDate).map(task => { /* ... */ });
    console.log('[Calendar] Processed events:', calendarEvents);

    // 3. FullCalendarの初期化と描画 (変更なし)
    if (calendarEl) {
        const calendar = new Calendar(calendarEl, {
            plugins: [ dayGridPlugin, timeGridPlugin, interactionPlugin ],
            initialView: 'dayGridMonth',
            locale: jaLocale,
            headerToolbar: { /* ... */ },
            events: calendarEvents,
            height: 'auto',
            contentHeight: 600,
            stickyHeaderDates: true,
            eventDisplay: 'block',
            dayMaxEventRows: true,
            views: { /* ... */ },
            eventClick: function(info) { /* ... */ },
        });
        calendar.render();
        console.log('[Calendar] FullCalendar rendered.');
    } else { /* ... */ }
});