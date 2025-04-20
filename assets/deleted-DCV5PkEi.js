import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css              */console.log("--- deleted.js module loaded ---");const u=document.getElementById("deleted-tasks-list"),n=document.getElementById("no-deleted-tasks"),g=new bootstrap.Modal(document.getElementById("deleteConfirmModal"));document.getElementById("confirm-delete-button");let m=null;function b(){console.log("[Debug] loadDeletedTasks called");try{const e=JSON.parse(localStorage.getItem("deletedTasks")||"[]");if(console.log("[Debug] Deleted tasks loaded:",e),u)u.innerHTML="";else{console.error("Deleted tasks list element not found");return}if(e.length===0){n&&(n.classList.remove("d-none"),n.classList.add("text-muted"));return}n&&(n.classList.add("d-none"),n.classList.remove("text-muted")),e.sort((t,d)=>new Date(d.deletedAt)-new Date(t.deletedAt)),e.forEach(t=>{p(t)})}catch(e){console.error("Error loading deleted tasks:",e)}}function p(e){if(console.log("[Debug] createDeletedTaskItem:",e),!u)return;const t=document.createElement("div");t.classList.add("list-group-item","d-flex","align-items-center"),t.dataset.taskId=e.id;const d=document.createElement("span");d.classList.add("priority-indicator"),d.textContent="★".repeat(e.priority||3),t.appendChild(d);const s=document.createElement("div");s.classList.add("flex-grow-1");const a=document.createElement("div");if(a.textContent=e.text,s.appendChild(a),e.details){const o=document.createElement("button");o.classList.add("btn","btn-link","btn-sm","p-0","ms-2"),o.innerHTML='<i class="fas fa-info-circle"></i>',o.title="詳細を表示",o.addEventListener("click",c=>{c.stopPropagation(),L(e.text,e.details)}),s.appendChild(o)}if(e.deletedAt){const o=document.createElement("div");o.classList.add("deleted-date");const c=new Date(e.deletedAt);o.textContent=`削除日時: ${c.toLocaleString("ja-JP")}`,s.appendChild(o)}if(e.dueDate){const o=document.createElement("div");o.classList.add("deleted-date");const c=new Date(e.dueDate);o.textContent=`期限: ${c.toLocaleString("ja-JP")}`,s.appendChild(o)}t.appendChild(s);const r=document.createElement("div");r.classList.add("btn-group","ms-2");const l=document.createElement("button");l.classList.add("btn","btn-outline-success","btn-sm"),l.innerHTML='<i class="fas fa-undo"></i>',l.title="復元",l.addEventListener("click",()=>f(e.id)),r.appendChild(l);const i=document.createElement("button");i.classList.add("btn","btn-outline-danger","btn-sm"),i.innerHTML='<i class="fas fa-trash-alt"></i>',i.title="完全に削除",i.addEventListener("click",()=>v(e.id)),r.appendChild(i),t.appendChild(r),t.classList.add("task-item-entering"),requestAnimationFrame(()=>{t.classList.remove("task-item-entering")}),u.appendChild(t)}function f(e){console.log("[Debug] restoreTask:",e);try{const t=JSON.parse(localStorage.getItem("deletedTasks")||"[]"),d=t.findIndex(s=>s.id===e);if(d!==-1){const s=t[d];delete s.deletedAt;const a=JSON.parse(localStorage.getItem("tasks")||"[]");a.push({text:s.text,completed:s.completed,dueDate:s.dueDate,priority:s.priority}),localStorage.setItem("tasks",JSON.stringify(a)),t.splice(d,1),localStorage.setItem("deletedTasks",JSON.stringify(t)),console.log("[Debug] Task restored:",s),b(),alert("タスクを復元しました。タスクリストに戻ってください。")}}catch(t){console.error("Error restoring task:",t),alert("タスクの復元中にエラーが発生しました。")}}function v(e){console.log("[Debug] confirmDelete:",e),m=e;const t=document.getElementById("deleteConfirmModal");t.innerHTML=`
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
    `;const d=t.querySelector("#confirm-delete-button");d&&d.addEventListener("click",()=>{m&&(D(m),m=null)}),g.show()}function D(e){console.log("[Debug] deleteTask:",e);try{const t=JSON.parse(localStorage.getItem("deletedTasks")||"[]"),d=t.findIndex(s=>s.id===e);d!==-1&&(t.splice(d,1),localStorage.setItem("deletedTasks",JSON.stringify(t)),console.log("[Debug] Task permanently deleted:",e),b())}catch(t){console.error("Error permanently deleting task:",t),alert("タスクの削除中にエラーが発生しました。")}g.hide()}function L(e,t){const d=document.createElement("div");d.classList.add("modal","fade"),d.id="taskDetailsModal",d.setAttribute("tabindex","-1"),d.setAttribute("aria-labelledby","taskDetailsModalLabel"),d.setAttribute("aria-hidden","true"),d.innerHTML=`
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="taskDetailsModalLabel">${e}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="task-details-content">
                        ${t.replace(/\n/g,"<br>")}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">閉じる</button>
                </div>
            </div>
        </div>
    `,document.body.appendChild(d);const s=new bootstrap.Modal(d);d.addEventListener("hidden.bs.modal",()=>{document.body.removeChild(d)}),s.show()}document.addEventListener("DOMContentLoaded",()=>{console.log("[Debug] DOMContentLoaded event fired"),b()});console.log("--- deleted.js finished executing ---");
