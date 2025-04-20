// src/calendar.js (コアCSS import削除版)

// ▼▼▼ 必要なモジュールとCSSを import ▼▼▼
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';

// CSS の import
// FullCalendar v6では、CSSは別途HTMLで読み込むか、Viteの設定で処理する必要があります
// ここではコメントアウトし、HTMLで読み込む方法に変更します
// import '@fullcalendar/core/index.css';
// import '@fullcalendar/daygrid/index.css';
// import '@fullcalendar/timegrid/index.css';
import './calendar.css'; // 自身のカスタムCSS
// ▲▲▲ import 文 ▲▲▲


document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');

    if (typeof Calendar === 'undefined') {
        console.error('FullCalendar has not been imported correctly.');
        alert('カレンダーライブラリの読み込みに失敗しました (import error)。');
        return;
    }

    // タスクの色と表示を決定する関数
    function getTaskDisplay(task) {
        // タスクの基本情報
        const priorityStars = '★'.repeat(task.priority || 0);
        const baseTitle = `${priorityStars} ${task.text}`;
        
        // 完了済みのタスクは常に灰色（優先度に関わらず）
        if (task.status === 'completed') { 
            return { 
                eventColor: '#adb5bd', // 灰色
                textColor: '#fff', 
                title: `✓ ${baseTitle}`, // 完了マーク
                borderColor: '#adb5bd' // ボーダーも灰色に
            };
        } 
        
        // 実行中のタスク
        if (task.status === 'in-progress') { 
            return { 
                eventColor: '#198754', // 緑色
                textColor: '#fff', 
                title: `⚡ ${baseTitle}`, // 実行中マーク
                borderColor: '#198754' // ボーダーも緑色に
            };
        } 
        
        // 未完了のタスク（期限切れまたは優先度による色付け）
        let eventColor = '#0d6efd'; // デフォルト：青
        let textColor = '#fff';
        
        try { 
            if (new Date(task.dueDate) < new Date()) { 
                eventColor = '#ffc107'; // 期限切れ：黄色
                textColor = '#000'; 
            } else {
                // 優先度に応じて色を変更
                switch(task.priority) {
                    case 3: eventColor = '#dc3545'; break; // 高優先度：赤
                    case 2: eventColor = '#ffc107'; textColor = '#000'; break; // 中優先度：黄
                    case 1: eventColor = '#0d6efd'; break; // 低優先度：青
                }
            }
        } catch(e) {} 
        
        return { 
            eventColor, 
            textColor, 
            title: baseTitle,
            borderColor: eventColor // ボーダーも同じ色に
        };
    }

    // カレンダーインスタンスを保持する変数
    let calendar;

    // 定期的にタスクの状態を更新する関数
    function updateCalendarEvents() {
        // localStorageから最新のタスクデータを取得
        let updatedTasks = [];
        try {
            updatedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        } catch (error) {
            console.error('Error loading updated tasks:', error);
            return;
        }

        // 現在のカレンダーイベントをすべて削除
        const currentEvents = calendar.getEvents();
        currentEvents.forEach(event => event.remove());

        // 更新されたタスクデータから新しいイベントを作成
        const updatedEvents = updatedTasks
            .filter(task => task.dueDate)
            .map(task => {
                const display = getTaskDisplay(task);
                
                return { 
                    title: display.title, 
                    start: task.dueDate, 
                    allDay: false, 
                    color: display.eventColor, 
                    textColor: display.textColor,
                    borderColor: display.borderColor,
                    className: getTaskClassName(task),
                    extendedProps: { 
                        completed: task.completed,
                        status: task.status,
                        priority: task.priority,
                        details: task.details,
                        originalText: task.text,
                        task: task // タスク全体を保存
                    } 
                };
            });

        // 新しいイベントをカレンダーに追加
        updatedEvents.forEach(event => calendar.addEvent(event));
    }

    // タスクを更新する関数
    function updateTask(oldTask, newTask) {
        // localStorageからタスクを取得
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        
        // 該当のタスクを探して更新
        const taskIndex = tasks.findIndex(task => 
            task.text === oldTask.text && 
            task.dueDate === oldTask.dueDate
        );
        
        if (taskIndex !== -1) {
            // タスクを更新
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                ...newTask
            };
            
            // localStorageに保存
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            // カレンダーを更新
            updateCalendarEvents();
        } else {
            console.error(`タスク "${oldTask.text}" が見つかりませんでした`);
        }
    }

    // タスクを編集する関数
    function editTask(task) {
        // 編集用のモーダルを作成
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'editTaskModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'editTaskModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        // モーダルの内容
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="editTaskModalLabel">タスクを編集</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editTaskForm">
                            <div class="mb-3">
                                <label for="editTaskText" class="form-label">タスク名</label>
                                <input type="text" class="form-control" id="editTaskText" value="${task.text}">
                            </div>
                            <div class="mb-3">
                                <label for="editTaskDueDate" class="form-label">期限</label>
                                <input type="datetime-local" class="form-control" id="editTaskDueDate" value="${task.dueDate ? task.dueDate.slice(0, 16) : ''}">
                            </div>
                            <div class="mb-3">
                                <label for="editTaskPriority" class="form-label">優先度</label>
                                <select class="form-select" id="editTaskPriority">
                                    <option value="0" ${task.priority === 0 ? 'selected' : ''}>低</option>
                                    <option value="1" ${task.priority === 1 ? 'selected' : ''}>中</option>
                                    <option value="2" ${task.priority === 2 ? 'selected' : ''}>高</option>
                                    <option value="3" ${task.priority === 3 ? 'selected' : ''}>最高</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="editTaskStatus" class="form-label">状態</label>
                                <select class="form-select" id="editTaskStatus">
                                    <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>未完了</option>
                                    <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>実行中</option>
                                    <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>完了済み</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="editTaskDetails" class="form-label">詳細</label>
                                <textarea class="form-control" id="editTaskDetails" rows="3">${task.details || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
                        <button type="button" class="btn btn-primary" id="saveTaskEdit">保存</button>
                    </div>
                </div>
            </div>
        `;
        
        // モーダルをDOMに追加
        document.body.appendChild(modal);
        
        // Bootstrapのモーダルを初期化
        const modalInstance = new bootstrap.Modal(modal);
        
        // 保存ボタンのイベントリスナー
        document.getElementById('saveTaskEdit').addEventListener('click', function() {
            // フォームから値を取得
            const updatedTask = {
                text: document.getElementById('editTaskText').value,
                dueDate: document.getElementById('editTaskDueDate').value,
                priority: parseInt(document.getElementById('editTaskPriority').value),
                status: document.getElementById('editTaskStatus').value,
                details: document.getElementById('editTaskDetails').value,
                createdAt: task.createdAt || new Date().toISOString()
            };
            
            // タスクを更新
            updateTask(task, updatedTask);
            
            // モーダルを閉じる
            modalInstance.hide();
            
            // モーダルを削除
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        });
        
        // モーダルが閉じられたときにDOMから削除
        modal.addEventListener('hidden.bs.modal', function() {
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        });
        
        // モーダルを表示
        modalInstance.show();
    }

    // 1. localStorageからタスクデータを読み込む
    let tasks = [];
    try {
        tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    } catch (error) {
        console.error('Error loading tasks:', error);
        alert('タスクデータの読み込みに失敗しました。');
    }

    // 2. FullCalendar用のイベントデータに変換
    const calendarEvents = tasks
        .filter(task => task.dueDate)
        .map(task => {
            const display = getTaskDisplay(task);
            
            return { 
                title: display.title, 
                start: task.dueDate, 
                allDay: false, 
                color: display.eventColor, 
                textColor: display.textColor,
                borderColor: display.borderColor,
                className: getTaskClassName(task),
                extendedProps: { 
                    completed: task.completed,
                    status: task.status,
                    priority: task.priority,
                    details: task.details,
                    originalText: task.text, // 元のテキストを保存
                    task: task // タスク全体を保存
                } 
            };
        });

    // 3. FullCalendarの初期化と描画
    if (calendarEl) {
        calendar = new Calendar(calendarEl, {
            plugins: [ dayGridPlugin, timeGridPlugin, interactionPlugin ],
            initialView: 'dayGridMonth',
            locale: jaLocale,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            buttonText: { today: '今日', month: '月', week: '週', day: '日' },
            events: calendarEvents,
            height: 'auto',
            contentHeight: 600,
            stickyHeaderDates: true,
            eventDisplay: 'block',
            dayMaxEventRows: true,
            dayMaxEvents: true,
            eventTimeFormat: { hour: 'numeric', minute: '2-digit', hour12: false },
            views: {
                dayGridMonth: {
                    dayMaxEventRows: 4,
                    eventMaxStack: 4
                },
                timeGridWeek: { 
                    eventTimeFormat: { hour: 'numeric', minute: '2-digit', hour12: false },
                    dayMaxEvents: 6
                },
                timeGridDay: { 
                    eventTimeFormat: { hour: 'numeric', minute: '2-digit', hour12: false },
                    dayMaxEvents: false
                }
            },
            eventClick: function(info) {
                const task = info.event.extendedProps.task;
                const status = task.status;
                let statusText = '未完了';
                if (status === 'completed') statusText = '完了済み';
                else if (status === 'in-progress') statusText = '実行中';

                const startTime = info.event.start ? info.event.start.toLocaleString('ja-JP', { hour: 'numeric', minute: '2-digit', hour12: false }) : '未設定';
                const details = task.details;
                
                // 編集オプションを表示
                const action = confirm(
                    `タスク: ${task.text}\n` +
                    `期限: ${info.event.start ? info.event.start.toLocaleDateString('ja-JP') : '未設定'} ${startTime}\n` +
                    `状態: ${statusText}\n\n` +
                    `操作を選択してください:\n` +
                    `OK - タスクを編集\n` +
                    `キャンセル - 詳細を表示`
                );
                
                if (action) {
                    // タスクを編集
                    editTask(task);
                } else {
                    // 詳細を表示
                    let message = `タスク: ${task.text}\n` +
                        `期限: ${info.event.start ? info.event.start.toLocaleDateString('ja-JP') : '未設定'} ${startTime}\n` +
                        `状態: ${statusText}`;

                    if (details) {
                        message += `\n\n詳細:\n${details}`;
                    }

                    alert(message);
                }
            },
            editable: true,
            droppable: true,
            eventDrop: function(info) {
                // ドラッグ＆ドロップ後の処理
                const newDate = info.event.start;
                const taskTitle = info.event.extendedProps.originalText;
                
                // localStorageからタスクを取得
                let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                
                // 該当のタスクを探して更新
                const taskIndex = tasks.findIndex(task => task.text === taskTitle);
                if (taskIndex !== -1) {
                    tasks[taskIndex].dueDate = newDate.toISOString();
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                }
            },
        });

        calendar.render();

        // 5秒ごとにタスクの状態を更新
        setInterval(updateCalendarEvents, 5000);

        // ページ読み込み時に一度更新を実行
        updateCalendarEvents();
    } else {
        console.error('Calendar element (#calendar) not found.');
        alert('カレンダーの表示エリアが見つかりません。');
    }
});

// タスクのクラス名を取得する関数を追加
function getTaskClassName(task) {
    const classes = [];
    
    // 状態に応じたクラス
    if (task.status === 'completed') {
        classes.push('task-completed');
    } else if (task.status === 'in-progress') {
        classes.push('task-in-progress');
    } else {
        // 優先度に応じたクラス
        switch(task.priority) {
            case 3:
                classes.push('task-high-priority');
                break;
            case 2:
                classes.push('task-medium-priority');
                break;
            case 1:
                classes.push('task-low-priority');
                break;
        }
    }
    
    return classes;
}

// 詳細セクションの作成
function createDetailsSection(task) {
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'task-details-container mt-2 collapse';
    detailsContainer.id = `details-${task.id}`;

    const detailsContent = document.createElement('div');
    detailsContent.className = 'task-details-content p-2';

    // URLを検出してリンクに変換する関数
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const formattedDetails = task.details.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary">${url}</a>`;
    });

    detailsContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <small class="text-muted">詳細情報</small>
            <button class="btn btn-sm btn-outline-secondary toggle-details" data-task-id="${task.id}">
                <i class="fas fa-chevron-down"></i>
            </button>
        </div>
        <div class="details-text">${formattedDetails}</div>
    `;

    detailsContainer.appendChild(detailsContent);
    return detailsContainer;
}