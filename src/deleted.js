import './style.css';

console.log('--- deleted.js module loaded ---');

// DOM要素取得
const deletedTasksList = document.getElementById('deleted-tasks-list');
const noDeletedTasks = document.getElementById('no-deleted-tasks');

// 削除確認モーダル関連
const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
const confirmDeleteButton = document.getElementById('confirm-delete-button');

// 現在削除対象のタスクID
let currentDeletingTaskId = null;

// 削除済みタスクを読み込む関数
function loadDeletedTasks() {
    console.log('[Debug] loadDeletedTasks called');
    try {
        const deletedTasks = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
        console.log('[Debug] Deleted tasks loaded:', deletedTasks);

        // リストをクリア
        if (deletedTasksList) {
            deletedTasksList.innerHTML = '';
        } else {
            console.error('Deleted tasks list element not found');
            return;
        }

        // 削除済みタスクがない場合
        if (deletedTasks.length === 0) {
            if (noDeletedTasks) {
                noDeletedTasks.classList.remove('d-none');
                noDeletedTasks.classList.add('text-muted');  // テキストを灰色に
            }
            return;
        }

        // 削除済みタスクがある場合
        if (noDeletedTasks) {
            noDeletedTasks.classList.add('d-none');
            noDeletedTasks.classList.remove('text-muted');  // クラスを削除（次回表示時のため）
        }

        // 削除日時の新しい順にソート
        deletedTasks.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

        // 削除済みタスクを表示
        deletedTasks.forEach(task => {
            createDeletedTaskItem(task);
        });

    } catch (error) {
        console.error('Error loading deleted tasks:', error);
    }
}

// 削除済みタスクアイテムを作成する関数
function createDeletedTaskItem(task) {
    console.log('[Debug] createDeletedTaskItem:', task);
    if (!deletedTasksList) return;

    const listItem = document.createElement('div');
    listItem.classList.add('list-group-item', 'd-flex', 'align-items-center');
    listItem.dataset.taskId = task.id;

    // 優先度表示
    const prioritySpan = document.createElement('span');
    prioritySpan.classList.add('priority-indicator');
    prioritySpan.textContent = '★'.repeat(task.priority || 3);
    listItem.appendChild(prioritySpan);

    // タスク内容
    const taskContent = document.createElement('div');
    taskContent.classList.add('flex-grow-1');
    
    const taskText = document.createElement('div');
    taskText.textContent = task.text;
    taskContent.appendChild(taskText);

    // 詳細情報ボタンを追加
    if (task.details) {
        const detailsButton = document.createElement('button');
        detailsButton.classList.add('btn', 'btn-link', 'btn-sm', 'p-0', 'ms-2');
        detailsButton.innerHTML = '<i class="fas fa-info-circle"></i>';
        detailsButton.title = '詳細を表示';
        detailsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showTaskDetails(task.text, task.details);
        });
        taskContent.appendChild(detailsButton);
    }

    // 削除日時
    if (task.deletedAt) {
        const deletedDate = document.createElement('div');
        deletedDate.classList.add('deleted-date');
        const date = new Date(task.deletedAt);
        deletedDate.textContent = `削除日時: ${date.toLocaleString('ja-JP')}`;
        taskContent.appendChild(deletedDate);
    }

    // 期限
    if (task.dueDate) {
        const dueDate = document.createElement('div');
        dueDate.classList.add('deleted-date');
        const date = new Date(task.dueDate);
        dueDate.textContent = `期限: ${date.toLocaleString('ja-JP')}`;
        taskContent.appendChild(dueDate);
    }

    listItem.appendChild(taskContent);

    // ボタングループ
    const buttonGroup = document.createElement('div');
    buttonGroup.classList.add('btn-group', 'ms-2');

    // 復元ボタン
    const restoreButton = document.createElement('button');
    restoreButton.classList.add('btn', 'btn-outline-success', 'btn-sm');
    restoreButton.innerHTML = '<i class="fas fa-undo"></i>';
    restoreButton.title = '復元';
    restoreButton.addEventListener('click', () => restoreTask(task.id));
    buttonGroup.appendChild(restoreButton);

    // 削除ボタン
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('btn', 'btn-outline-danger', 'btn-sm');
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.title = '完全に削除';
    deleteButton.addEventListener('click', () => confirmDelete(task.id));
    buttonGroup.appendChild(deleteButton);

    listItem.appendChild(buttonGroup);

    // アニメーション用クラスを追加
    listItem.classList.add('task-item-entering');
    requestAnimationFrame(() => {
        listItem.classList.remove('task-item-entering');
    });

    deletedTasksList.appendChild(listItem);
}

// タスクを復元する関数
function restoreTask(taskId) {
    console.log('[Debug] restoreTask:', taskId);
    try {
        const deletedTasks = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
        const taskIndex = deletedTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            const taskToRestore = deletedTasks[taskIndex];
            // 削除日時を削除
            delete taskToRestore.deletedAt;
            
            // タスクリストに追加
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            tasks.push({
                text: taskToRestore.text,
                completed: taskToRestore.completed,
                dueDate: taskToRestore.dueDate,
                priority: taskToRestore.priority
            });
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            // 削除済みリストから削除
            deletedTasks.splice(taskIndex, 1);
            localStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
            console.log('[Debug] Task restored:', taskToRestore);
            
            // 削除済みタスクリストを更新
            loadDeletedTasks();
            
            // 成功メッセージを表示
            alert('タスクを復元しました。タスクリストに戻ってください。');
        }
    } catch (error) {
        console.error('Error restoring task:', error);
        alert('タスクの復元中にエラーが発生しました。');
    }
}

// 削除確認モーダルを表示する関数
function confirmDelete(taskId) {
    console.log('[Debug] confirmDelete:', taskId);
    currentDeletingTaskId = taskId;

    // 既存のモーダルを取得
    const modalElement = document.getElementById('deleteConfirmModal');
    
    // モーダルの内容をダークモード対応に更新
    modalElement.innerHTML = `
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
                    <button type="button" class="btn btn-danger" id="confirm-delete-button">削除</button>
                </div>
            </div>
        </div>
    `;

    // 削除確認ボタンのイベントリスナーを再設定
    const confirmDeleteButton = modalElement.querySelector('#confirm-delete-button');
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', () => {
            if (currentDeletingTaskId) {
                deleteTask(currentDeletingTaskId);
                currentDeletingTaskId = null;
            }
        });
    }

    // モーダルを表示
    deleteConfirmModal.show();
}

// タスクを完全に削除する関数
function deleteTask(taskId) {
    console.log('[Debug] deleteTask:', taskId);
    try {
        const deletedTasks = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
        const taskIndex = deletedTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            deletedTasks.splice(taskIndex, 1);
            localStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
            console.log('[Debug] Task permanently deleted:', taskId);
            
            // 削除済みタスクリストを更新
            loadDeletedTasks();
        }
    } catch (error) {
        console.error('Error permanently deleting task:', error);
        alert('タスクの削除中にエラーが発生しました。');
    }
    deleteConfirmModal.hide();
}

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
                        ${details.replace(/\n/g, '<br>')}
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

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Debug] DOMContentLoaded event fired');
    loadDeletedTasks();
});

console.log('--- deleted.js finished executing ---'); 