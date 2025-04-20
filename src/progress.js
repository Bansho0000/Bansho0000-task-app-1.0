// タスクデータの取得と処理
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    return tasks;
}

// 週間データの集計
function getWeeklyData() {
    const tasks = loadTasks();
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyData = {
        labels: [],
        completed: [],
        total: []
    };

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
            return taskDate === dateStr;
        });

        weeklyData.labels.push(date.toLocaleDateString('ja-JP', { weekday: 'short' }));
        weeklyData.completed.push(dayTasks.filter(task => task.status === 'completed').length);
        weeklyData.total.push(dayTasks.length);
    }

    return weeklyData;
}

// 月間データの集計
function getMonthlyData() {
    const tasks = loadTasks();
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthlyData = {
        labels: [],
        completed: [],
        total: []
    };

    for (let i = 0; i < 30; i++) {
        const date = new Date(firstDayOfMonth.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
            return taskDate === dateStr;
        });

        monthlyData.labels.push(date.getDate().toString());
        monthlyData.completed.push(dayTasks.filter(task => task.status === 'completed').length);
        monthlyData.total.push(dayTasks.length);
    }

    return monthlyData;
}

// 達成率サマリーの更新
function updateSummary() {
    const tasks = loadTasks();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
}

// グラフの作成
function createCharts() {
    // 週間グラフ
    const weeklyData = getWeeklyData();
    const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
    new Chart(weeklyCtx, {
        type: 'bar',
        data: {
            labels: weeklyData.labels,
            datasets: [
                {
                    label: '完了タスク',
                    data: weeklyData.completed,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: '総タスク',
                    data: weeklyData.total,
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // 月間グラフ
    const monthlyData = getMonthlyData();
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: '完了タスク',
                    data: monthlyData.completed,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                },
                {
                    label: '総タスク',
                    data: monthlyData.total,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    updateSummary();
    createCharts();
}); 