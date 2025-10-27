function setTheme(m){ if(m==='dark'){document.body.classList.add('dark');} else {document.body.classList.remove('dark');} localStorage.setItem('theme',m);} function updateThemeToggleLabel(){ const b=document.getElementById('themeToggle'); if(!b) return; const d=document.body.classList.contains('dark'); b.textContent=d?'☀️ Sáng':'🌙 Tối'; } function applyThemeFromStorage(){ const m=localStorage.getItem('theme')||'light'; setTheme(m); updateThemeToggleLabel(); } function initThemeToggle(){ const b=document.getElementById('themeToggle'); applyThemeFromStorage(); if(b && !b._bound){ b._bound=true; b.addEventListener('click', ()=>{ const next=document.body.classList.contains('dark')?'light':'dark'; localStorage.setItem('theme',next); applyThemeFromStorage(); window.dispatchEvent(new StorageEvent('storage',{key:'theme',newValue:next}));});}} window.addEventListener('storage',(e)=>{ if(e.key==='theme'){ applyThemeFromStorage(); }});
// script.js — logic chính cho toàn bộ ứng dụng
// Lưu dữ liệu cục bộ bằng localStorage
// Mỗi câu hỏi có cấu trúc: {id, content, a, b, c, d, correct, topic, level}

function getQuestions() {
  const data = localStorage.getItem("questions");
  return data ? JSON.parse(data) : [];
}

function saveQuestions(questions) {
  localStorage.setItem("questions", JSON.stringify(questions));
}

// Sinh ID tự động
function generateId() {
  return Date.now();
}

// ====== CREATE QUESTION PAGE ======
if (document.querySelector(".question-form")) {
  const form = document.querySelector(".question-form");
  form.addEventListener("submit", e => {
    e.preventDefault();

    const content = form.querySelector("textarea").value.trim();
    const a = form.querySelectorAll("input")[0].value.trim();
    const b = form.querySelectorAll("input")[1].value.trim();
    const c = form.querySelectorAll("input")[2].value.trim();
    const d = form.querySelectorAll("input")[3].value.trim();
    const correct = form.querySelector("select").value;
    const topic = form.querySelectorAll("input")[4].value.trim();
    const level = form.querySelectorAll("input")[5].value;

    if (!content || !a || !b || !c || !d) {
      alert("Vui lòng nhập đầy đủ nội dung và các đáp án!");
      return;
    }

    const questions = getQuestions();
    questions.push({
      id: generateId(),
      content, a, b, c, d, correct, topic, level: parseInt(level)
    });

    saveQuestions(questions);
    alert("Đã lưu câu hỏi!");
    form.reset();
  });
}

// ====== QUESTION BANK PAGE ======
if (document.getElementById("question-list")) {
  const tbody = document.getElementById("question-list");
  const questions = getQuestions();

  if (questions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Chưa có câu hỏi nào</td></tr>`;
  } else {
    tbody.innerHTML = "";
    questions.forEach((q, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${q.content}</td>
        <td>${q.topic || "-"}</td>
        <td>${q.level}</td>
        <td>${q.correct}</td>
        <td>
          <button class="delete" data-id="${q.id}">Xóa</button>
        </td>`;
      tbody.appendChild(tr);
    });

    // Nút xóa
    tbody.querySelectorAll(".delete").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = parseInt(e.target.dataset.id);
        if (confirm("Bạn có chắc muốn xóa câu hỏi này?")) {
          const newList = questions.filter(q => q.id !== id);
          saveQuestions(newList);
          location.reload();
        }
      });
    });
  }
}

// ====== EXAM PAGE ======
if (document.querySelector(".exam")) {
  const all = getQuestions();
  const questionBox = document.querySelector(".question-box");

  if (all.length < 10) {
    questionBox.innerHTML = "<p>Không đủ câu hỏi để làm bài (cần ≥ 10)</p>";
  } else {
    // Random 10 câu hỏi
    all.sort(() => Math.random() - 0.5);
    const examQuestions = all.slice(0, 10);
    let current = 0;
    const answers = {};

    function renderQuestion() {
      const q = examQuestions[current];
      questionBox.innerHTML = `
        <p class="question-number">Câu ${current + 1} / ${examQuestions.length}</p>
        <p class="question-text">${q.content}</p>
        <div class="options">
          <button data-choice="A">A. ${q.a}</button>
          <button data-choice="B">B. ${q.b}</button>
          <button data-choice="C">C. ${q.c}</button>
          <button data-choice="D">D. ${q.d}</button>
        </div>
        <div class="nav">
          <button id="prevBtn" ${current === 0 ? "disabled" : ""}>Trước</button>
          <button id="nextBtn" ${current === examQuestions.length - 1 ? "disabled" : ""}>Tiếp</button>
        </div>
        <button class="submit-btn">Nộp bài</button>
      `;

      // Gán sự kiện chọn đáp án
      questionBox.querySelectorAll(".options button").forEach(btn => {
        const choice = btn.dataset.choice;
        if (answers[q.id] === choice) btn.style.backgroundColor = "#c5cae9";
        btn.addEventListener("click", () => {
          answers[q.id] = choice;
          renderQuestion();
        });
      });

      // Nút điều hướng
      questionBox.querySelector("#prevBtn").addEventListener("click", () => {
        current--;
        renderQuestion();
      });
      questionBox.querySelector("#nextBtn").addEventListener("click", () => {
        current++;
        renderQuestion();
      });

      // Nộp bài
      questionBox.querySelector(".submit-btn").addEventListener("click", () => {
        let score = 0;
        examQuestions.forEach(q => {
          if (answers[q.id] === q.correct) score++;
        });
        const percent = Math.round((score / examQuestions.length) * 100);
        questionBox.innerHTML = `
          <h2>Kết quả</h2>
          <p>Bạn đúng ${score}/${examQuestions.length} câu (${percent}%)</p>
          <button class="btn" onclick="location.reload()">Làm lại</button>
        `;
      });
    }
    renderQuestion();
  }
}


document.addEventListener('DOMContentLoaded', ()=>{ try{ initThemeToggle(); }catch(e){} });
