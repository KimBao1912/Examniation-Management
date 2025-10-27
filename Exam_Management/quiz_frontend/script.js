
// ===== Utilities =====
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function toast(msg){
  let t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.classList.add('show'), 10);
  setTimeout(()=> { t.classList.remove('show'); setTimeout(()=> t.remove(), 300); }, 2200);
}

function setTheme(mode){
  if(mode === 'dark'){ document.body.classList.add('dark'); }
  else{ document.body.classList.remove('dark'); }
  localStorage.setItem('theme', mode);
}
function initThemeToggle(){
  const btn = document.getElementById('themeToggle');
  if(!btn) return;
  const pref = localStorage.getItem('theme') || 'light';
  setTheme(pref);
  btn.textContent = (pref === 'dark') ? '☀️ Sáng' : '🌙 Tối';
  btn.addEventListener('click', ()=>{
    const now = document.body.classList.contains('dark') ? 'light' : 'dark';
    setTheme(now);
    btn.textContent = (now === 'dark') ? '☀️ Sáng' : '🌙 Tối';
  });
}

// ===== Storage =====
function getQuestions(){ const data = localStorage.getItem('questions'); return data ? JSON.parse(data) : []; }
function saveQuestions(qs){ localStorage.setItem('questions', JSON.stringify(qs)); }
function generateId(){ return Date.now(); }

// ===== Create Question Page =====
if (document.querySelector('.question-form')){
  initThemeToggle();
  const form = document.querySelector('.question-form');
  // Upgrade inputs with classes
  $all('input', form).forEach(i=> i.classList.add('input'));
  $all('select', form).forEach(s=> s.classList.add('select'));
  $all('textarea', form).forEach(tx=> tx.classList.add('textarea'));

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const content = form.querySelector('textarea').value.trim();
    const a = form.querySelectorAll('input')[0].value.trim();
    const b = form.querySelectorAll('input')[1].value.trim();
    const c = form.querySelectorAll('input')[2].value.trim();
    const d = form.querySelectorAll('input')[3].value.trim();
    const correct = form.querySelector('select').value;
    const topic = form.querySelectorAll('input')[4].value.trim();
    const level = parseInt(form.querySelectorAll('input')[5].value || '1', 10);

    if(!content || !a || !b || !c || !d){
      toast('⚠️ Vui lòng nhập đầy đủ nội dung và đáp án'); return;
    }
    const qs = getQuestions();
    qs.push({ id: generateId(), content, a,b,c,d, correct, topic, level });
    saveQuestions(qs);
    form.reset();
    toast('✅ Đã lưu câu hỏi!');
  });
}

// ===== Question Bank Page =====
if (document.getElementById('question-list')){
  initThemeToggle();
  const tbody = document.getElementById('question-list');
  const qs = getQuestions();

  // Toolbar
  const header = document.querySelector('header');
  const expBtn = document.createElement('button');
  expBtn.className = 'btn secondary';
  expBtn.textContent = '⤓ Export JSON';
  expBtn.style.position='absolute'; expBtn.style.right='90px'; expBtn.style.top='10px';
  header.appendChild(expBtn);

  expBtn.addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(qs, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download='question_bank.json'; a.click();
    URL.revokeObjectURL(url);
  });

  if (qs.length === 0){
    tbody.innerHTML = `<tr><td colspan="6" class="center muted" style="height:120px;">Chưa có câu hỏi nào — vào “Tạo câu hỏi mới” để thêm ✨</td></tr>`;
  } else {
    tbody.innerHTML = '';
    qs.forEach((q, i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${q.content}</td>
        <td>${q.topic || '-'}</td>
        <td>${q.level}</td>
        <td>${q.correct}</td>
        <td><button class="btn danger" data-id="${q.id}">Xóa</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('button[data-id]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const id = parseInt(e.currentTarget.dataset.id);
        if(confirm('Bạn có chắc muốn xóa câu hỏi này?')){
          const next = qs.filter(x=> x.id !== id);
          saveQuestions(next);
          location.reload();
        }
      });
    });
  }
}

// ===== Exam Page =====
if (document.querySelector('.exam')){
  initThemeToggle();
  const wrapper = document.querySelector('.question-box');
  const all = getQuestions();
  if (all.length < 10){
    wrapper.innerHTML = `<div class="card center" style="height:160px;">Không đủ câu hỏi để làm bài (cần ≥ 10)</div>`;
  } else {
    all.sort(()=> Math.random()-0.5);
    const examQuestions = all.slice(0, 10);
    let current = 0;
    const answers = {};
    const durationSec = 10 * 60; // 10 phút
    let remaining = durationSec;
    let timerId;

    function fmt(sec){
      const m = Math.floor(sec/60).toString().padStart(2,'0');
      const s = (sec%60).toString().padStart(2,'0');
      return `${m}:${s}`;
    }

    function startTimer(){
      timerId = setInterval(()=>{
        remaining--;
        updateMeta();
        if(remaining <= 0){
          clearInterval(timerId);
          submit();
        }
      }, 1000);
    }

    function updateProgress(){
      const answered = Object.keys(answers).length;
      const pct = Math.round((answered / examQuestions.length) * 100);
      $('.progress .bar', wrapper).style.width = pct + '%';
    }

    function updateNavigator(){
      const nav = $('.navigator', wrapper);
      nav.innerHTML = '';
      examQuestions.forEach((q, idx)=>{
        const b = document.createElement('button');
        b.className = 'navbtn' + (answers[q.id] ? ' answered':'') + (idx===current ? ' current':'');
        b.textContent = idx+1;
        b.addEventListener('click', ()=> { current = idx; render(); });
        nav.appendChild(b);
      });
    }

    function updateMeta(){
      $('.question-number', wrapper).textContent = `Câu ${current+1} / ${examQuestions.length}`;
      $('.timer', wrapper).textContent = fmt(Math.max(0, remaining));
    }

    function submit(){
      let score = 0;
      examQuestions.forEach(q=>{ if(answers[q.id] === q.correct) score++; });
      const percent = Math.round((score / examQuestions.length) * 100);
      wrapper.innerHTML = `
        <div class="card">
          <h2>Kết quả</h2>
          <p>Bạn đúng <b>${score}/${examQuestions.length}</b> câu (<b>${percent}%</b>)</p>
          <div class="progress" style="margin:12px 0;"><div class="bar" style="width:${percent}%"></div></div>
          <button class="btn" id="retry">Làm lại</button>
        </div>`;
      $('#retry', wrapper).addEventListener('click', ()=> location.reload());
      toast('📄 Bài làm đã nộp!');
    }

    function render(){
      const q = examQuestions[current];
      wrapper.innerHTML = `
        <div class="card">
          <div class="progress"><div class="bar"></div></div>
          <div class="exam-meta">
            <span class="badge question-number">Câu ${current+1} / ${examQuestions.length}</span>
            <span class="badge timer">--:--</span>
          </div>
          <h3 style="margin:6px 0 8px;">${q.content}</h3>
          <div class="options">
            ${['A','B','C','D'].map(c=>{
              const text = q[c.toLowerCase()];
              return `<button class="option-btn" data-choice="${c}">${c}. ${text}</button>`;
            }).join('')}
          </div>
          <div class="nav">
            <button class="btn secondary" id="prevBtn" ${current===0?'disabled':''}>← Trước</button>
            <div style="flex:1"></div>
            <button class="btn secondary" id="nextBtn" ${current===examQuestions.length-1?'disabled':''}>Tiếp →</button>
          </div>
          <div class="navigator"></div>
          <button class="btn" id="submitBtn" style="width:100%; margin-top:10px;">📝 Nộp bài</button>
        </div>`;

      // Selection
      $all('.option-btn', wrapper).forEach(btn=>{
        const choice = btn.dataset.choice;
        if (answers[q.id] === choice) btn.classList.add('selected');
        btn.addEventListener('click', ()=>{
          answers[q.id] = choice;
          render(); // re-render to reflect selection
        });
      });

      // Nav buttons
      $('#prevBtn', wrapper)?.addEventListener('click', ()=>{ current--; render(); });
      $('#nextBtn', wrapper)?.addEventListener('click', ()=>{ current++; render(); });

      $('#submitBtn', wrapper).addEventListener('click', ()=> submit());

      updateProgress();
      updateNavigator();
      updateMeta();
    }

    render();
    startTimer();
  }
}
