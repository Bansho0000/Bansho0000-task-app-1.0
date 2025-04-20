// src/script.js (Vite対応版 - 完全版)

// ▼▼▼ CSSファイルのimportパスを修正 ▼▼▼
import './style.css';
// ▲▲▲ CSSファイルのimportパスを修正 ▲▲▲

console.log('--- script.js module loaded ---');

// --- DOM要素取得 ---
const taskInput = document.getElementById('task-input');
const taskDetails = document.getElementById('task-details');
const dueDateInput = document.getElementById('task-due-date'); // ★日時入力欄を取得★
const addButton = document.getElementById('add-button');
const taskList = document.getElementById('task-list'); // 未完了リストのUL要素
const inProgressTaskList = document.getElementById('in-progress-task-list');
const completedTaskList = document.getElementById('completed-task-list'); // 完了リストのUL要素

// 編集モーダル関連の要素
const editTaskModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
const editTaskText = document.getElementById('edit-task-text');
const editTaskDetails = document.getElementById('edit-task-details');
const editTaskDueDate = document.getElementById('edit-task-due-date');
const editTaskPriority = document.getElementById('edit-task-priority');
const saveEditButton = document.getElementById('save-edit-button');

// 現在編集中のタスクアイテムを保持する変数
let currentEditingItem = null;

// 優先度選択用のセレクトボックスを追加
const prioritySelect = document.createElement('select');
prioritySelect.id = 'task-priority';
prioritySelect.className = 'form-select';
prioritySelect.style.maxWidth = '100px';
prioritySelect.innerHTML = `
    <option value="0">なし</option>
    <option value="1">★</option>
    <option value="2">★★</option>
    <option value="3">★★★</option>
`;
document.getElementById('input-area').insertBefore(prioritySelect, addButton);

if (!taskInput || !dueDateInput || !addButton || !taskList || !completedTaskList) { // dueDateInputもチェック
    console.error('Error: Required DOM element not found.');
} else {
    console.log('DOM elements obtained successfully.');
}

// --- ヘルパー関数: 日時フォーマット ---
function formatDate(dateString) {
    if (!dateString) return ''; // 日時がなければ空
    try {
        const date = new Date(dateString);
        // 例: '2025/04/18 01:30' のような形式
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
        return date.toLocaleString('ja-JP', options);
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString; // エラー時は元の文字列
    }
}

// --- ヘルパー関数: 残り時間計算＆フォーマット ---
function calculateRemainingTime(dueDateString) {
    if (!dueDateString) return { text: '', className: '' }; // 期限未設定

    try {
        const dueDate = new Date(dueDateString);
        const now = new Date(); // 現在時刻
        const diffMs = dueDate.getTime() - now.getTime(); // 残り時間 (ミリ秒)

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs < 0) {
            return { text: '期限切れ', className: 'overdue' };
        } else if (diffMinutes < 1) {
             return { text: 'あとわずか', className: '' };
        } else if (diffMinutes < 60) {
            return { text: `あと ${diffMinutes} 分`, className: '' };
        } else if (diffHours < 24) {
             return { text: `あと ${diffHours} 時間`, className: '' };
        } else {
            return { text: `あと ${diffDays} 日`, className: 'far' };
        }
    } catch (e) {
        console.error("Error calculating remaining time:", dueDateString, e);
        return { text: '(日時エラー)', className: 'overdue' };
    }
}

// --- ヘルパー関数: 全タスクの残り時間表示を更新 ---
function updateRemainingTimes() {
    console.log('[Debug] updateRemainingTimes called');
    document.querySelectorAll('.list-group-item').forEach(item => {
        const remainingTimeSpan = item.querySelector('.remaining-time');
        const dueDate = item.dataset.dueDate;
        const isCompleted = completedTaskList.contains(item);

        if (!isCompleted && remainingTimeSpan && dueDate) {
            const remaining = calculateRemainingTime(dueDate);
            remainingTimeSpan.textContent = remaining.text;
            remainingTimeSpan.className = 'remaining-time';
            if (remaining.className) {
                remainingTimeSpan.classList.add(remaining.className);
            }
        } else if (remainingTimeSpan) {
             remainingTimeSpan.textContent = '';
             remainingTimeSpan.className = 'remaining-time';
        }
    });
}


// --- ローカルストレージ関連 ---
function loadTasks() {
    console.log('[Debug] loadTasks called');
    try {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const deletedTasks = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
        console.log('[Debug] Tasks loaded from localStorage:', tasks);
        console.log('[Debug] Deleted tasks loaded from localStorage:', deletedTasks);
        if(taskList) taskList.innerHTML = ''; else console.error("taskList not found for clearing");
        if(completedTaskList) completedTaskList.innerHTML = ''; else console.error("completedTaskList not found for clearing");

        tasks.forEach(task => {
            createTaskItem(
                task.text, 
                task.status || (task.completed ? 'completed' : 'pending'), 
                task.dueDate, 
                false, 
                task.priority, 
                task.details,
                task.createdAt
            );
        });
        console.log('[Debug] Tasks rendered from localStorage.');
        updateRemainingTimes(); // ★ 読み込み完了後にも残り時間を更新 ★
    } catch (error) {
        console.error('Error loading or parsing tasks from localStorage:', error);
    }
}

function saveTasks() {
    console.log('[Debug] saveTasks called');
    try {
        const tasks = [];
        document.querySelectorAll('#task-list .list-group-item, #in-progress-task-list .list-group-item, #completed-task-list .list-group-item').forEach(item => {
            const span = item.querySelector('.task-text');
            const status = item.dataset.status;
            const dueDate = item.dataset.dueDate || '';
            const priority = parseInt(item.dataset.priority) || 0;
            const details = item.dataset.details || '';
            const createdAt = item.dataset.createdAt || new Date().toISOString();
            if (span && span.textContent) {
                tasks.push({ 
                    text: span.textContent, 
                    status: status, 
                    dueDate: dueDate, 
                    priority: priority, 
                    details: details,
                    createdAt: createdAt
                });
            } else { console.warn('[Debug] Item without span or text found:', item); }
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log('[Debug] Tasks saved to localStorage:', tasks);
    } catch (error) { console.error('Error saving tasks to localStorage:', error); }
}

// 削除したタスクを保存する関数
function saveDeletedTask(task) {
    console.log('[Debug] saveDeletedTask called');
    try {
        const deletedTasks = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
        // 削除日時を追加
        task.deletedAt = new Date().toISOString();
        deletedTasks.push(task);
        localStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
        console.log('[Debug] Deleted task saved to localStorage:', task);
    } catch (error) { console.error('Error saving deleted task to localStorage:', error); }
}

// 削除したタスクを復元する関数
function restoreDeletedTask(taskId) {
    console.log('[Debug] restoreDeletedTask called');
    try {
        const deletedTasks = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
        const taskIndex = deletedTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            const taskToRestore = deletedTasks[taskIndex];
            // 削除日時を削除
            delete taskToRestore.deletedAt;
            
            // タスクリストに追加
            createTaskItem(
                taskToRestore.text, 
                taskToRestore.status, 
                taskToRestore.dueDate, 
                true, 
                taskToRestore.priority,
                taskToRestore.details
            );
            
            // 削除済みリストから削除
            deletedTasks.splice(taskIndex, 1);
            localStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
            console.log('[Debug] Task restored:', taskToRestore);
            
            // 削除済みタスクリストを更新
            if (window.location.pathname.includes('deleted.html')) {
                loadDeletedTasks();
            }
        }
    } catch (error) { console.error('Error restoring deleted task:', error); }
}

// 削除したタスクを完全に削除する関数
function permanentlyDeleteTask(taskId) {
    console.log('[Debug] permanentlyDeleteTask called');
    try {
        const deletedTasks = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
        const taskIndex = deletedTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            deletedTasks.splice(taskIndex, 1);
            localStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
            console.log('[Debug] Task permanently deleted:', taskId);
            
            // 削除済みタスクリストを更新
            if (window.location.pathname.includes('deleted.html')) {
                loadDeletedTasks();
            }
        }
    } catch (error) { console.error('Error permanently deleting task:', error); }
}
// --- ここまでローカルストレージ関連 ---

// --- イベントリスナー設定 ---
if (addButton && taskInput && dueDateInput) {
    addButton.addEventListener('click', addTask);
    console.log('[Debug] Add button click listener added.');
} else { console.error('Required elements for adding task not found, cannot add click listener.'); }

if (taskInput) {
    taskInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') { event.preventDefault(); addTask(); }
    });
    console.log('[Debug] Task input keypress listener added.');
} else { console.error('Task input not found, cannot add keypress listener.'); }


// --- タスク操作関数 ---
function addTask() {
    console.log('[Debug] addTask called');
    if (!taskInput || !dueDateInput) { console.error('Input elements missing!'); return; }
    const taskText = taskInput.value.trim();
    const taskDetailsText = taskDetails.value.trim();
    const taskDueDate = dueDateInput.value;
    const priority = parseInt(document.getElementById('task-priority').value);
    console.log('[Debug] Task text:', `"${taskText}"`, 'Due Date:', `"${taskDueDate}"`, 'Priority:', priority);
    if (taskText !== '') {
        createTaskItem(taskText, 'pending', taskDueDate, true, priority, taskDetailsText, new Date().toISOString());
        taskInput.value = '';
        taskDetails.value = '';
        dueDateInput.value = '';
        document.getElementById('task-priority').value = '0';
        taskInput.focus();
        console.log('[Debug] Task potentially added.');
    } else {
        alert('タスクを入力してください.');
        console.log('[Debug] Task text was empty.');
    }
}

function createTaskItem(taskText, status = 'pending', dueDate, isSaving = true, priority = 0, details = '', createdAt = null) {
    console.log(`[Debug] createTaskItem: text='${taskText}', status=${status}, dueDate='${dueDate}', saving=${isSaving}, priority=${priority}, details='${details}'`);
    if (!taskList || !inProgressTaskList || !completedTaskList) { 
        console.error('Task list elements not found!'); 
        return; 
    }

    try {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'bg-transparent', 'border-dark');
        if (dueDate) { listItem.dataset.dueDate = dueDate; }
        listItem.dataset.priority = priority;
        if (details) { listItem.dataset.details = details; }
        listItem.dataset.createdAt = createdAt || new Date().toISOString();
        listItem.dataset.status = status;

        console.log(`[Debug] Created list item with status: ${status}, classList: ${listItem.classList}`);

        // メインコンテンツ（チェックボックス、タスク内容、ボタン）を含むdiv
        const mainContent = document.createElement('div');
        mainContent.classList.add('d-flex', 'align-items-center', 'bg-transparent');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('form-check-input', 'me-2');
        checkbox.checked = status === 'completed';
        checkbox.addEventListener('change', toggleTask);

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('task-content-wrapper');

        // 優先度表示を追加
        const prioritySpan = document.createElement('span');
        prioritySpan.classList.add('priority-indicator');
        prioritySpan.textContent = '★'.repeat(priority);
        contentWrapper.appendChild(prioritySpan);

        const taskSpan = document.createElement('span');
        taskSpan.classList.add('task-text');
        taskSpan.textContent = taskText;
        contentWrapper.appendChild(taskSpan);

        // 期限と残り時間の表示
        if (dueDate && status !== 'completed') {
            const dueDateSpan = document.createElement('span');
            dueDateSpan.classList.add('due-date');
            dueDateSpan.textContent = `期限: ${formatDate(dueDate)}`;
            contentWrapper.appendChild(dueDateSpan);

            const remainingTimeSpan = document.createElement('span');
            remainingTimeSpan.classList.add('remaining-time');
            const remaining = calculateRemainingTime(dueDate);
            remainingTimeSpan.textContent = remaining.text;
            if (remaining.className) { remainingTimeSpan.classList.add(remaining.className); }
            contentWrapper.appendChild(remainingTimeSpan);
        }

        // 詳細情報があれば折りたたみボタンを追加
        if (details) {
            console.log('[Debug] Creating details section for task with details:', details);
            
            const toggleButton = document.createElement('button');
            toggleButton.classList.add('btn', 'btn-link', 'btn-sm', 'p-0', 'ms-2', 'toggle-details');
            toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
            toggleButton.title = '詳細を表示/非表示';
            contentWrapper.appendChild(toggleButton);

            // 詳細情報の折りたたみコンテナ
            const detailsContainer = document.createElement('div');
            detailsContainer.classList.add('task-details-container', 'collapse');
            
            // URLを検出してリンクに変換する関数
            const convertUrlsToLinks = (text) => {
                // URLを検出する正規表現
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                return text.replace(urlRegex, (url) => {
                    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary">${url}</a>`;
                });
            };

            // 詳細情報の内容を作成
            const detailsContent = document.createElement('div');
            detailsContent.classList.add('task-details-content', 'mt-2', 'p-2');
            detailsContent.innerHTML = convertUrlsToLinks(details.replace(/\n/g, '<br>'));
            detailsContainer.appendChild(detailsContent);

            // 折りたたみの切り替え処理
            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('[Debug] Toggle details clicked. Current state:', detailsContainer.classList.contains('show'));
                detailsContainer.classList.toggle('show');
                const icon = toggleButton.querySelector('i');
                icon.classList.toggle('fa-chevron-up');
                icon.classList.toggle('fa-chevron-down');
                console.log('[Debug] Details container classes after toggle:', detailsContainer.classList);
            });

            // 詳細コンテナをリストアイテムに追加
            listItem.appendChild(mainContent);
            listItem.appendChild(detailsContainer);
            console.log('[Debug] Details container added to list item');
        } else {
            listItem.appendChild(mainContent);
        }

        // 編集ボタンを追加
        const editButton = document.createElement('button');
        editButton.classList.add('btn', 'btn-outline-primary', 'btn-sm', 'me-2');
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.addEventListener('click', () => openEditModal(listItem));

        // Start!ボタンを追加（未完了タスクの場合のみ）
        if (status === 'pending') {
            const startButton = document.createElement('button');
            startButton.classList.add('btn', 'btn-success', 'btn-sm', 'me-2');
            startButton.innerHTML = '<i class="fas fa-play me-1"></i>Start!';
            startButton.addEventListener('click', () => startTask(listItem));
            mainContent.appendChild(startButton);
        }

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteButton.addEventListener('click', deleteTask);

        if (status === 'completed') { 
            console.log('[Debug] Task is completed, adding completed styles');
            console.log('[Debug] Before style application - taskSpan classList:', taskSpan.classList);
            console.log('[Debug] Before style application - listItem classList:', listItem.classList);
            
            // text-mutedクラスを削除し、completedクラスのみを使用
            taskSpan.classList.add('text-decoration-line-through');
            listItem.classList.add('completed');
            
            // 背景色を確実に適用
            listItem.classList.remove('bg-transparent');
            mainContent.classList.remove('bg-transparent');
            
            // スタイルを直接適用
            listItem.style.backgroundColor = 'var(--completed-bg)';
            mainContent.style.backgroundColor = 'var(--completed-bg)';
            
            // テキストカラーを確実に適用
            taskSpan.style.color = 'var(--completed-text)';
            contentWrapper.style.color = 'var(--completed-text)';
            prioritySpan.style.color = 'var(--completed-text)';
            
            if (details) {
                const detailsContainer = listItem.querySelector('.task-details-container');
                if (detailsContainer) {
                    detailsContainer.classList.remove('bg-transparent');
                    detailsContainer.style.backgroundColor = 'var(--completed-bg)';
                    const detailsContent = detailsContainer.querySelector('.task-details-content');
                    if (detailsContent) {
                        detailsContent.style.color = 'var(--completed-text)';
                    }
                }
            }
            
            console.log('[Debug] After style application - taskSpan classList:', taskSpan.classList);
            console.log('[Debug] After style application - listItem classList:', listItem.classList);
            console.log('[Debug] After style application - taskSpan style:', taskSpan.style.cssText);
            console.log('[Debug] After style application - listItem style:', listItem.style.cssText);
            console.log('[Debug] After style application - contentWrapper style:', contentWrapper.style.cssText);
        }

        mainContent.appendChild(checkbox);
        mainContent.appendChild(contentWrapper);
        mainContent.appendChild(editButton);
        mainContent.appendChild(deleteButton);

        // 適切なリストに追加
        if (status === 'completed') {
            console.log('[Debug] Adding task to completed list');
            completedTaskList.appendChild(listItem);
        } else if (status === 'in-progress') {
            console.log('[Debug] Adding task to in-progress list');
            inProgressTaskList.appendChild(listItem);
        } else {
            console.log('[Debug] Adding task to pending list');
            taskList.appendChild(listItem);
        }

        listItem.classList.add('task-item-entering');
        requestAnimationFrame(() => { listItem.classList.remove('task-item-entering'); });

        if (isSaving) { saveTasks(); }

        return listItem;
    } catch(error) { console.error('Error in createTaskItem:', error); }
}

function toggleTask(event) {
    console.log('[Debug] toggleTask called');
    try {
        const checkbox = event.target;
        const listItem = checkbox.closest('li');
        if (!listItem) { console.error('Parent li not found'); return; }
        const taskSpan = listItem.querySelector('.task-text');
        if (!taskSpan) { console.error('Span not found'); return; }

        const taskText = taskSpan.textContent;
        const isNowCompleted = checkbox.checked;
        const dueDate = listItem.dataset.dueDate || '';
        const priority = parseInt(listItem.dataset.priority) || 3;
        const details = listItem.dataset.details || '';

        console.log(`[Debug] Toggling task '${taskText}' to completed=${isNowCompleted}, dueDate='${dueDate}', priority=${priority}, details='${details}'`);
        console.log(`[Debug] Current task classList before toggle: ${listItem.classList}`);

        listItem.remove();
        const newListItem = createTaskItem(taskText, isNowCompleted ? 'completed' : 'pending', dueDate, true, priority, details);
        console.log(`[Debug] New task classList after toggle: ${newListItem.classList}`);
        console.log('[Debug] toggleTask finished.');
        updateRemainingTimes(); // 表示を即時更新
    } catch (error) { console.error('Error in toggleTask:', error); }
}

function deleteTask(event) {
    console.log('[Debug] deleteTask called');
    try {
        const button = event.target.closest('button');
         if (!button) { console.warn('Delete button not found'); return; }
        const listItem = button.closest('li');
         if (!listItem) { console.error('Parent li not found'); return; }

        // 削除するタスクの情報を取得
        const taskText = listItem.querySelector('.task-text').textContent;
        const isCompleted = completedTaskList.contains(listItem);
        const dueDate = listItem.dataset.dueDate || '';
        const priority = parseInt(listItem.dataset.priority) || 3;
        const details = listItem.dataset.details || '';
        
        // 削除するタスクを保存
        saveDeletedTask({
            id: Date.now().toString(), // 一意のIDを生成
            text: taskText,
            status: isCompleted ? 'completed' : 'pending',
            dueDate: dueDate,
            priority: priority,
            details: details
        });

        console.log('[Debug] Applying leaving animation');
        listItem.classList.add('task-item-leaving');

        listItem.addEventListener('transitionend', () => {
            console.log('[Debug] Transition ended, removing and saving');
            if(listItem.parentNode) {
                listItem.remove();
                console.log('[Debug] List item removed.');
                saveTasks(); // 保存
            } else { console.warn('Item already removed?'); }
            console.log('[Debug] deleteTask (after transition) finished.');
        }, { once: true });
    } catch (error) { console.error('Error in deleteTask:', error); }
}

// --- ドラッグ＆ドロップ初期化関数 ---
function initializeDragAndDrop() {
    console.log('[Debug] Initializing drag and drop');
    if (typeof Sortable === 'undefined') { console.error('Sortable library not loaded.'); return; } // Sortable の存在確認
    if (taskList) {
        new Sortable(taskList, {
            animation: 150, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag', handle: '.list-group-item',
            onEnd: function (evt) {
                console.log('[Debug] Drag ended, saving order.');
                saveTasks();
            },
        });
        console.log('[Debug] SortableJS initialized for active list.');
    } else { console.error('Cannot init SortableJS: taskList missing.'); }
}
// --- ▲▲▲ ドラッグ＆ドロップ初期化関数 ▲▲▲ ---

// --- タスクをソートする関数
function sortTasks(sortType = 'priority') {
    const tasks = Array.from(taskList.children);
    tasks.sort((a, b) => {
        if (sortType === 'priority') {
            const priorityA = parseInt(a.dataset.priority) || 0;
            const priorityB = parseInt(b.dataset.priority) || 0;
            return priorityB - priorityA; // 優先度の高い順にソート
        } else if (sortType === 'date-asc') {
            const dateA = new Date(a.dataset.createdAt || 0);
            const dateB = new Date(b.dataset.createdAt || 0);
            return dateA - dateB; // 古い順
        } else if (sortType === 'date-desc') {
            const dateA = new Date(a.dataset.createdAt || 0);
            const dateB = new Date(b.dataset.createdAt || 0);
            return dateB - dateA; // 新しい順
        }
    });

    // DOMを更新
    tasks.forEach(task => taskList.appendChild(task));
    saveTasks();
}

// ソートボタンを追加する関数
function addSortButtons() {
    const taskListArea = document.getElementById('task-list-area');
    const header = taskListArea.querySelector('.card-header');
    
    // 既存のソートボタングループがあれば削除
    const existingGroup = header.querySelector('.sort-button-group');
    if (existingGroup) {
        existingGroup.remove();
    }

    // ソートボタングループを作成
    const buttonGroup = document.createElement('div');
    buttonGroup.classList.add('sort-button-group', 'btn-group');

    // 優先度ソートボタン
    const priorityButton = document.createElement('button');
    priorityButton.classList.add('btn', 'btn-outline-primary', 'btn-sm', 'sort-button');
    priorityButton.innerHTML = '<i class="fas fa-star me-1"></i>優先度';
    priorityButton.addEventListener('click', () => sortTasks('priority'));

    // 追加日時ソートボタン（新しい順）
    const dateDescButton = document.createElement('button');
    dateDescButton.classList.add('btn', 'btn-outline-primary', 'btn-sm', 'sort-button');
    dateDescButton.innerHTML = '<i class="fas fa-clock me-1"></i>新しい順';
    dateDescButton.addEventListener('click', () => sortTasks('date-desc'));

    // 追加日時ソートボタン（古い順）
    const dateAscButton = document.createElement('button');
    dateAscButton.classList.add('btn', 'btn-outline-primary', 'btn-sm', 'sort-button');
    dateAscButton.innerHTML = '<i class="fas fa-clock me-1"></i>古い順';
    dateAscButton.addEventListener('click', () => sortTasks('date-asc'));

    // ボタンをグループに追加
    buttonGroup.appendChild(priorityButton);
    buttonGroup.appendChild(dateDescButton);
    buttonGroup.appendChild(dateAscButton);

    // ヘッダーに追加
    header.appendChild(buttonGroup);
}

// --- 初期化処理 ---
window.addEventListener('load', () => {
    console.log('[Debug] Window load event fired');
    if (taskInput && dueDateInput && addButton && taskList && completedTaskList) {
        if (typeof loadTasks === 'function') { loadTasks(); }
        else { console.error('loadTasks not found'); }

        if (typeof initializeDragAndDrop === 'function') { initializeDragAndDrop(); }
        else { console.error('initializeDragAndDrop not found'); }

        if (typeof updateRemainingTimes === 'function') {
            setInterval(updateRemainingTimes, 60000);
            console.log('[Debug] Remaining time updater initialized.');
        } else { console.error('updateRemainingTimes function not found'); }

        // ソートボタンを追加
        addSortButtons();

    } else { console.error('Cannot run initialization: essential elements missing.'); }
});

// タスクの詳細情報を表示する関数
function showTaskDetails(taskText, details) {
    // 詳細情報を表示するモーダルを作成
    const detailsModal = document.createElement('div');
    detailsModal.classList.add('modal', 'fade');
    detailsModal.id = 'taskDetailsModal';
    detailsModal.setAttribute('tabindex', '-1');
    detailsModal.setAttribute('aria-labelledby', 'taskDetailsModalLabel');
    detailsModal.setAttribute('aria-hidden', 'true');
    
    detailsModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="taskDetailsModalLabel">${taskText}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="task-details-content">
                        ${details.split('\n').map(line => 
                            `<div class="details-line">${line}</div>`
                        ).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">閉じる</button>
                </div>
            </div>
        </div>
    `;
    
    // モーダルをDOMに追加
    document.body.appendChild(detailsModal);
    
    // Bootstrapモーダルとして初期化
    const modal = new bootstrap.Modal(detailsModal);
    
    // モーダルが閉じられたら削除
    detailsModal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(detailsModal);
    });
    
    // モーダルを表示
    modal.show();
}

// 編集モーダルを開く関数
function openEditModal(listItem) {
    currentEditingItem = listItem;
    const taskText = listItem.querySelector('.task-text').textContent;
    const dueDate = listItem.dataset.dueDate || '';
    const priority = parseInt(listItem.dataset.priority) || 3;
    const details = listItem.dataset.details || '';

    editTaskText.value = taskText;
    editTaskDueDate.value = dueDate ? dueDate.slice(0, 16) : ''; // YYYY-MM-DDThh:mm 形式に変換
    editTaskPriority.value = priority;
    editTaskDetails.value = details;

    editTaskModal.show();
}

// 編集を保存する関数
function saveEdit() {
    if (!currentEditingItem) return;

    const newText = editTaskText.value.trim();
    const newDueDate = editTaskDueDate.value;
    const newPriority = parseInt(editTaskPriority.value);
    const newDetails = editTaskDetails.value;

    if (newText) {
        const isCompleted = completedTaskList.contains(currentEditingItem);
        currentEditingItem.remove();
        createTaskItem(newText, isCompleted ? 'completed' : 'pending', newDueDate, true, newPriority, newDetails);
        editTaskModal.hide();
        currentEditingItem = null;
    } else {
        alert('タスク内容を入力してください。');
    }
}

// 保存ボタンのイベントリスナーを設定
if (saveEditButton) {
    saveEditButton.addEventListener('click', saveEdit);
}

// タスクを開始する関数
function startTask(listItem) {
    const taskText = listItem.querySelector('.task-text').textContent;
    const dueDate = listItem.dataset.dueDate;
    const priority = parseInt(listItem.dataset.priority) || 0;
    const details = listItem.dataset.details || '';
    const createdAt = listItem.dataset.createdAt;

    // 既存のタスクを削除
    listItem.remove();

    // 実行中のタスクとして再作成
    createTaskItem(taskText, 'in-progress', dueDate, true, priority, details, createdAt);
}

console.log('--- script.js finished executing ---');

function showDeleteConfirmation(taskId) {
    const confirmModal = document.createElement('div');
    confirmModal.classList.add('modal', 'fade');
    confirmModal.id = 'deleteConfirmModal';
    confirmModal.setAttribute('tabindex', '-1');
    confirmModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content bg-dark text-white border-secondary">
                <div class="modal-header border-secondary">
                    <h5 class="modal-title">削除の確認</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    このタスクを完全に削除しますか？この操作は取り消せません。
                </div>
                <div class="modal-footer border-secondary">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">削除</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmModal);
    
    const modal = new bootstrap.Modal(confirmModal);
    
    // 削除ボタンのイベントリスナー
    confirmModal.querySelector('#confirmDeleteBtn').addEventListener('click', () => {
        permanentlyDeleteTask(taskId);
        modal.hide();
    });
    
    // モーダルが閉じられたときの処理
    confirmModal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(confirmModal);
    });
    
    modal.show();
}