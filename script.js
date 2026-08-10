/* ================= CONSTANTS ================= */
const DAYS = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const DAY_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб'];
const PERIODS = [
  {n:1, time:'8:00–9:40'},
  {n:2, time:'9:55–11:35'},
  {n:3, time:'12:15–13:55'},
  {n:4, time:'14:10–15:50'},
  {n:5, time:'16:20–18:00'},
  {n:6, time:'18:15–19:55'},
];
const ALL_WEEKS = [1,2,3,4];
const STORAGE_KEY = 'ap591_schedule_data_v1';

/* ================= DEFAULT DATA ================= */
function defaultLessons(){
  let id = 1;
  const L = (day, period, weeks, name, type, teacher, extra) => ({
    id: id++, day, period, weeks, name, type, teacher, subgroup: null, note: '', ...extra
  });
  return [
    // Понедельник (0)
    L(0,1,ALL_WEEKS,'Современная политэкономия','ЛК','Красюк В.Ф.'),
    L(0,2,[1,3],'Теоретическая механика','ПЗ','Фролов И.С.'),
    L(0,2,[2,4],'Современная политэкономия','ПЗ','Красюк В.Ф.'),
    L(0,3,ALL_WEEKS,'Теоретическая механика','ЛК','Фролов И.С.'),
    L(0,4,ALL_WEEKS,'Английский язык (технический перевод)','ПЗ','Старовойтова А.Г.',{note:'Ф'}),
    L(0,5,ALL_WEEKS,'Основы эколого-энергетической устойчивости','ЛК','Сухоцкий П.Г.'),
    // Вторник (1)
    L(1,2,ALL_WEEKS,'Физическая культура','','Колесникович В.П.'),
    L(1,3,ALL_WEEKS,'Базы данных и системы управления базами данных','ЛК/ПЗ','Карпук А.А.'),
    L(1,4,[2,4],'История науки и техники','ПЗ','Спартак А.А.'),
    // Среда (2)
    L(2,2,[1,3],'Управление персоналом и основы трудового законодательства','ЛК','Римарев И.М.'),
    L(2,3,ALL_WEEKS,'Прикладная механика','ЛК','Сухоцкий П.Г.'),
    L(2,4,[1,3],'Основы эколого-энергетической устойчивости','ПЗ','Сухоцкий П.Г.'),
    L(2,4,[2,4],'Управление персоналом и основы трудового законодательства','ПЗ','Римарев И.М.'),
    L(2,5,ALL_WEEKS,'Прикладная механика','ПЗ','Сухоцкий П.Г.'),
    // Четверг (3)
    L(3,2,ALL_WEEKS,'Физическая культура','','Колесникович В.П.'),
    L(3,3,ALL_WEEKS,'Высшая математика','ЛК','Алексеенко Н.А.'),
    L(3,4,ALL_WEEKS,'Высшая математика','ПЗ','Алексеенко Н.А.'),
    // Пятница (4)
    L(4,3,ALL_WEEKS,'Физические основы электроцепей','ПЗ','Кочергина О.В.'),
    L(4,4,[1,3],'Физические основы электроцепей','ЛК','Кочергина О.В.'),
    L(4,4,[2,4],'История науки и техники','ПЗ','Спартак А.А.'),
    L(4,5,[2,4],'История науки и техники','ЛК','Спартак А.А.'),
    // Суббота (5) — лабораторные по подгруппам
    L(5,3,[1],'Прикладная механика','ЛР','Сухоцкий П.Г.',{subgroup:1}),
    L(5,3,[2,3],'Базы данных и системы управления базами данных','ЛР','Карпук А.А.',{subgroup:1}),
    L(5,3,[1],'Базы данных и системы управления базами данных','ЛР','Карпук А.А.',{subgroup:2}),
    L(5,3,[3],'Прикладная механика','ЛР','Сухоцкий П.Г.',{subgroup:2}),
    L(5,3,[4],'Базы данных и системы управления базами данных','ЛР','Карпук А.А.',{subgroup:2}),
    L(5,4,[1],'Прикладная механика','ЛР','Сухоцкий П.Г.',{subgroup:1}),
    L(5,4,[2,3],'Базы данных и системы управления базами данных','ЛР','Карпук А.А.',{subgroup:1}),
    L(5,4,[1],'Базы данных и системы управления базами данных','ЛР','Карпук А.А.',{subgroup:2}),
    L(5,4,[3],'Прикладная механика','ЛР','Сухоцкий П.Г.',{subgroup:2}),
    L(5,4,[4],'Базы данных и системы управления базами данных','ЛР','Карпук А.А.',{subgroup:2}),
  ];
}

function defaultData(){
  return {
    lessons: defaultLessons(),
    announcements: [],
    auth: { login: 'admin', pass: 'ap591admin2026' },
    nextId: 100,
  };
}

/* ================= STATE / STORAGE ================= */
let DATA = loadData();
let state = {
  week: currentAcademicWeek(),
  day: (new Date().getDay() + 6) % 7, // 0=Mon..6=Sun
  subgroup: localStorage.getItem('ap591_subgroup') || 'all',
  isAdmin: false,
  adminTab: 'lessons',
  adminDayFilter: -1,
};
if (state.day > 5) state.day = 0; // Sunday -> show Monday

function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) { const d = defaultData(); save(d); return d; }
    const parsed = JSON.parse(raw);
    if(!parsed.lessons || !parsed.auth) throw new Error('bad shape');
    return parsed;
  }catch(e){
    const d = defaultData();
    save(d);
    return d;
  }
}
function save(d = DATA){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

/* ================= WEEK CALCULATION ================= */
// 1 сентября — первая неделя. Недели считаются от понедельника той недели,
// в которую попадает 1 сентября текущего учебного года, и циклически идут 1→2→3→4→1...
function currentAcademicWeek(date = new Date()){
  const y = date.getFullYear();
  let sept1 = new Date(y, 8, 1);
  if (date < sept1) sept1 = new Date(y - 1, 8, 1);
  // понедельник той недели, где лежит 1 сентября
  const sept1Day = (sept1.getDay() + 6) % 7; // 0=Mon
  const weekStart = new Date(sept1);
  weekStart.setDate(sept1.getDate() - sept1Day);
  const diffDays = Math.floor((stripTime(date) - stripTime(weekStart)) / 86400000);
  const weeksElapsed = Math.floor(diffDays / 7);
  const w = ((weeksElapsed % 4) + 4) % 4;
  return w + 1;
}
function stripTime(d){
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/* ================= RENDER: SCHEDULE ================= */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function renderWeekSwitch(){
  const el = $('#weekSwitch');
  el.querySelectorAll('button').forEach(btn=>{
    const w = Number(btn.dataset.week);
    btn.classList.toggle('active', w === state.week);
    btn.classList.toggle('is-current', w === currentAcademicWeek());
  });
}

function renderDaySwitch(){
  const el = $('#daySwitch');
  el.innerHTML = '';
  const todayIdx = (new Date().getDay() + 6) % 7;
  DAY_SHORT.forEach((label, i)=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.dataset.day = i;
    if (i === state.day) btn.classList.add('active');
    if (i === todayIdx) btn.classList.add('is-today');
    btn.addEventListener('click', ()=>{ state.day = i; renderDaySwitch(); renderSchedule(); });
    el.appendChild(btn);
  });
}

function matchesSubgroup(lesson){
  if(state.subgroup === 'all') return true;
  if(!lesson.subgroup) return true; // lesson for whole group is shown to every subgroup
  return lesson.subgroup === Number(state.subgroup);
}

function lessonsFor(day, week){
  return DATA.lessons
    .filter(l => l.day === day && l.weeks.includes(week) && matchesSubgroup(l))
    .sort((a,b)=> a.period - b.period || (a.subgroup||0) - (b.subgroup||0));
}

function renderSchedule(){
  const subgroupLabel = state.subgroup === 'all' ? '' : ` · подгруппа ${state.subgroup}`;
  $('#dayHeading').textContent = `${DAYS[state.day]} · ${state.week}-я неделя${subgroupLabel}`;
  const list = $('#scheduleList');
  list.innerHTML = '';
  const items = lessonsFor(state.day, state.week);
  const byPeriod = {};
  items.forEach(l => { (byPeriod[l.period] = byPeriod[l.period] || []).push(l); });

  PERIODS.forEach(period=>{
    const lessonsHere = byPeriod[period.n];
    if(!lessonsHere || lessonsHere.length === 0){
      list.appendChild(buildEmptyTicket(period));
    } else {
      lessonsHere.forEach(l => list.appendChild(buildLessonTicket(l, period)));
    }
  });
}

function buildEmptyTicket(period){
  const card = document.createElement('div');
  card.className = 'ticket empty-ticket';
  card.innerHTML = `
    <div class="ticket-stub">
      <span class="ticket-period">№${period.n}</span>
      <span class="ticket-time">${period.time.replace('–','–<br>')}</span>
    </div>
    <div class="ticket-main">
      <span class="ticket-empty-label">Пусто</span>
    </div>
  `;
  return card;
}

function buildLessonTicket(l, period){
  const varies = l.weeks.length < 4;
  const card = document.createElement('div');
  card.className = 'ticket';
  card.innerHTML = `
    <div class="ticket-stub">
      <span class="ticket-period">№${period.n}</span>
      <span class="ticket-time">${period.time.replace('–','–<br>')}</span>
    </div>
    <div class="ticket-main">
      <div class="ticket-top">
        <div class="ticket-name">${escapeHtml(l.name)}${l.note ? ` <span style="color:var(--ink-faint);font-weight:500;">(${escapeHtml(l.note)})</span>` : ''}</div>
        ${l.type ? `<span class="ticket-type">${escapeHtml(l.type)}</span>` : ''}
      </div>
      <div class="ticket-teacher">${escapeHtml(l.teacher || '')}</div>
      <div class="ticket-meta-row">
        <span class="ticket-subgroup">${l.subgroup ? 'Подгруппа ' + l.subgroup : ''}</span>
        ${varies ? weekDotsHtml(l.weeks) : '<span></span>'}
      </div>
    </div>
  `;
  return card;
}

function weekDotsHtml(weeks){
  return `<div class="week-dots">` + ALL_WEEKS.map(w=>
    `<span class="week-dot ${weeks.includes(w) ? 'on' : ''}">${w}</span>`
  ).join('') + `</div>`;
}

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

/* ================= RENDER: ANNOUNCEMENTS ================= */
function renderAnnouncements(){
  const el = $('#announceList');
  const items = [...DATA.announcements].sort((a,b)=> b.ts - a.ts);
  if(items.length === 0){
    el.innerHTML = `<div class="announce-empty">Пока пусто</div>`;
    return;
  }
  el.innerHTML = items.map(a => `
    <div class="announce-card">
      <span class="announce-date">${formatDate(a.ts)}</span>
      ${escapeHtml(a.text)}
    </div>
  `).join('');
}
function formatDate(ts){
  const d = new Date(ts);
  return d.toLocaleDateString('ru-RU', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
}

/* ================= THEME ================= */
function initTheme(){
  const saved = localStorage.getItem('ap591_theme');
  const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}
$('#themeToggle').addEventListener('click', ()=>{
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ap591_theme', next);
});

/* ================= WEEK SWITCH EVENTS ================= */
$('#weekSwitch').addEventListener('click', e=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  state.week = Number(btn.dataset.week);
  renderWeekSwitch();
  renderSchedule();
});

function renderSubgroupSwitch(){
  $$('#subgroupSwitch button').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.subgroup === String(state.subgroup));
  });
}
$('#subgroupSwitch').addEventListener('click', e=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  state.subgroup = btn.dataset.subgroup === 'all' ? 'all' : Number(btn.dataset.subgroup);
  localStorage.setItem('ap591_subgroup', state.subgroup);
  renderSubgroupSwitch();
  renderSchedule();
});

/* ================= TOAST ================= */
let toastTimer;
function showToast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.add('hidden'), 2200);
}

/* ================= MODALS ================= */
function openModal(id){ $('#' + id).classList.remove('hidden'); }
function closeModal(id){ $('#' + id).classList.add('hidden'); }
$$('[data-close]').forEach(btn=>{
  btn.addEventListener('click', ()=> closeModal(btn.dataset.close));
});
$$('.modal-backdrop').forEach(bd=>{
  bd.addEventListener('click', e=>{ if(e.target === bd) bd.classList.add('hidden'); });
});

/* ================= LOGIN ================= */
$('#adminFab').addEventListener('click', ()=>{
  if(state.isAdmin){ openAdmin(); }
  else { $('#loginError').classList.add('hidden'); openModal('loginModal'); }
});
$('#loginSubmit').addEventListener('click', doLogin);
$('#loginPass').addEventListener('keydown', e=>{ if(e.key === 'Enter') doLogin(); });

function doLogin(){
  const u = $('#loginUser').value.trim();
  const p = $('#loginPass').value;
  if(u === DATA.auth.login && p === DATA.auth.pass){
    state.isAdmin = true;
    closeModal('loginModal');
    $('#loginUser').value = ''; $('#loginPass').value = '';
    openAdmin();
  } else {
    $('#loginError').classList.remove('hidden');
  }
}

$('#logoutBtn').addEventListener('click', ()=>{
  state.isAdmin = false;
  closeModal('adminModal');
  showToast('Вы вышли из админки');
});

/* ================= ADMIN: TABS ================= */
function openAdmin(){
  renderAdminDayFilter();
  renderLessonsEditor();
  renderAdminAnnouncements();
  openModal('adminModal');
}
$$('.admin-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    $$('.admin-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    state.adminTab = tab.dataset.tab;
    $$('.admin-panel').forEach(p=>p.classList.add('hidden'));
    $('#panel-' + state.adminTab).classList.remove('hidden');
  });
});

/* ================= ADMIN: LESSONS ================= */
function renderAdminDayFilter(){
  const el = $('#adminDayFilter');
  el.innerHTML = '';
  const opts = [{i:-1,l:'Все'}, ...DAY_SHORT.map((l,i)=>({i,l}))];
  opts.forEach(o=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = o.l;
    if(o.i === state.adminDayFilter) btn.classList.add('active');
    btn.addEventListener('click', ()=>{
      state.adminDayFilter = o.i;
      renderAdminDayFilter();
      renderLessonsEditor();
    });
    el.appendChild(btn);
  });
}

function dayOptionsHtml(selected){
  return DAYS.map((d,i)=>`<option value="${i}" ${i===selected?'selected':''}>${d}</option>`).join('');
}
function periodOptionsHtml(selected){
  return PERIODS.map(p=>`<option value="${p.n}" ${p.n===selected?'selected':''}>№${p.n} · ${p.time}</option>`).join('');
}
function subgroupOptionsHtml(selected){
  return `
    <option value="" ${!selected?'selected':''}>Вся группа</option>
    <option value="1" ${selected===1?'selected':''}>Подгруппа 1</option>
    <option value="2" ${selected===2?'selected':''}>Подгруппа 2</option>`;
}

function renderLessonsEditor(){
  const el = $('#lessonsEditList');
  el.innerHTML = '';
  let items = [...DATA.lessons];
  if(state.adminDayFilter >= 0) items = items.filter(l=>l.day === state.adminDayFilter);
  items.sort((a,b)=> a.day - b.day || a.period - b.period);

  if(items.length === 0){
    el.innerHTML = `<div class="announce-empty">Пар нет — добавьте новую ниже</div>`;
    return;
  }

  items.forEach(l=>{
    const card = document.createElement('div');
    card.className = 'lesson-edit-card';
    card.dataset.id = l.id;
    card.innerHTML = `
      <div class="lesson-edit-grid">
        <label class="field"><span>День</span>
          <select class="f-day">${dayOptionsHtml(l.day)}</select>
        </label>
        <label class="field"><span>Пара</span>
          <select class="f-period">${periodOptionsHtml(l.period)}</select>
        </label>
      </div>
      <label class="field"><span>Название</span>
        <input class="f-name" type="text" value="${escapeAttr(l.name)}">
      </label>
      <div class="lesson-edit-grid">
        <label class="field"><span>Тип (ЛК/ПЗ/ЛР...)</span>
          <input class="f-type" type="text" value="${escapeAttr(l.type)}">
        </label>
        <label class="field"><span>Преподаватель</span>
          <input class="f-teacher" type="text" value="${escapeAttr(l.teacher)}">
        </label>
      </div>
      <div class="lesson-edit-grid">
        <label class="field"><span>Подгруппа</span>
          <select class="f-subgroup">${subgroupOptionsHtml(l.subgroup)}</select>
        </label>
        <label class="field"><span>Примечание</span>
          <input class="f-note" type="text" value="${escapeAttr(l.note)}" placeholder="необязательно">
        </label>
      </div>
      <div class="lesson-edit-weeks">
        <span>Недели:</span>
        <div class="week-check">
          ${ALL_WEEKS.map(w=>`
            <label><input type="checkbox" class="f-week" value="${w}" ${l.weeks.includes(w)?'checked':''}><span>${w}</span></label>
          `).join('')}
        </div>
      </div>
      <div class="lesson-edit-foot">
        <button class="btn btn-primary btn-small f-save">Сохранить</button>
        <button class="btn btn-danger btn-small f-delete">Удалить</button>
      </div>
    `;
    card.querySelector('.f-save').addEventListener('click', ()=> saveLessonCard(card, l.id));
    card.querySelector('.f-delete').addEventListener('click', ()=> deleteLesson(l.id));
    el.appendChild(card);
  });
}

function escapeAttr(str){
  return escapeHtml(str).replace(/"/g,'&quot;');
}

function saveLessonCard(card, id){
  const lesson = DATA.lessons.find(l=>l.id === id);
  if(!lesson) return;
  const weeks = Array.from(card.querySelectorAll('.f-week:checked')).map(cb=>Number(cb.value));
  if(weeks.length === 0){
    showToast('Выберите хотя бы одну неделю');
    return;
  }
  lesson.day = Number(card.querySelector('.f-day').value);
  lesson.period = Number(card.querySelector('.f-period').value);
  lesson.name = card.querySelector('.f-name').value.trim();
  lesson.type = card.querySelector('.f-type').value.trim();
  lesson.teacher = card.querySelector('.f-teacher').value.trim();
  lesson.note = card.querySelector('.f-note').value.trim();
  const sg = card.querySelector('.f-subgroup').value;
  lesson.subgroup = sg ? Number(sg) : null;
  lesson.weeks = weeks;
  save();
  renderLessonsEditor();
  renderSchedule();
  showToast('Пара сохранена');
}

function deleteLesson(id){
  if(!confirm('Удалить эту пару из расписания?')) return;
  DATA.lessons = DATA.lessons.filter(l=>l.id !== id);
  save();
  renderLessonsEditor();
  renderSchedule();
  showToast('Пара удалена');
}

$('#addLessonBtn').addEventListener('click', ()=>{
  const day = state.adminDayFilter >= 0 ? state.adminDayFilter : 0;
  const newLesson = {
    id: DATA.nextId++,
    day, period: 1, weeks: [...ALL_WEEKS],
    name: 'Новая пара', type: '', teacher: '', subgroup: null, note: ''
  };
  DATA.lessons.push(newLesson);
  save();
  renderLessonsEditor();
  renderSchedule();
  showToast('Пара добавлена — отредактируйте её');
});

/* ================= ADMIN: ANNOUNCEMENTS ================= */
$('#addAnnounceBtn').addEventListener('click', ()=>{
  const ta = $('#newAnnounceText');
  const text = ta.value.trim();
  if(!text) return;
  DATA.announcements.push({ id: DATA.nextId++, text, ts: Date.now() });
  ta.value = '';
  save();
  renderAdminAnnouncements();
  renderAnnouncements();
  showToast('Объявление опубликовано');
});

function renderAdminAnnouncements(){
  const el = $('#adminAnnounceList');
  const items = [...DATA.announcements].sort((a,b)=> b.ts - a.ts);
  if(items.length === 0){ el.innerHTML = ''; return; }
  el.innerHTML = items.map(a => `
    <div class="admin-announce-item" data-id="${a.id}">
      <div>
        <time>${formatDate(a.ts)}</time>
        <p>${escapeHtml(a.text)}</p>
      </div>
      <button class="btn btn-danger btn-small" data-del-announce="${a.id}">✕</button>
    </div>
  `).join('');
  el.querySelectorAll('[data-del-announce]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.delAnnounce);
      DATA.announcements = DATA.announcements.filter(a=>a.id !== id);
      save();
      renderAdminAnnouncements();
      renderAnnouncements();
    });
  });
}

/* ================= ADMIN: SETTINGS ================= */
$('#saveCredsBtn').addEventListener('click', ()=>{
  const login = $('#newLogin').value.trim();
  const pass = $('#newPass').value;
  if(!login || !pass){ showToast('Заполните оба поля'); return; }
  DATA.auth.login = login;
  DATA.auth.pass = pass;
  save();
  $('#newLogin').value = ''; $('#newPass').value = '';
  showToast('Логин и пароль обновлены');
});

$('#exportBtn').addEventListener('click', ()=>{
  const area = $('#backupArea');
  area.classList.remove('hidden');
  area.value = JSON.stringify(DATA, null, 2);
  area.select();
});
$('#importBtn').addEventListener('click', ()=>{
  const area = $('#backupArea');
  if(area.classList.contains('hidden')){
    area.classList.remove('hidden');
    area.value = '';
    area.focus();
    showToast('Вставьте JSON и нажмите «Импорт JSON» ещё раз');
    return;
  }
  try{
    const parsed = JSON.parse(area.value);
    if(!parsed.lessons || !parsed.auth) throw new Error('bad shape');
    DATA = parsed;
    save();
    renderAll();
    openAdmin();
    showToast('Данные импортированы');
  }catch(e){
    showToast('Не удалось прочитать JSON');
  }
});

$('#resetBtn').addEventListener('click', ()=>{
  if(!confirm('Вернуть исходное расписание? Все ваши изменения будут потеряны.')) return;
  DATA = defaultData();
  save();
  renderAll();
  openAdmin();
  showToast('Расписание сброшено к исходному');
});

/* ================= INIT ================= */
function renderAll(){
  renderWeekSwitch();
  renderDaySwitch();
  renderSubgroupSwitch();
  renderSchedule();
  renderAnnouncements();
}

initTheme();
renderAll();