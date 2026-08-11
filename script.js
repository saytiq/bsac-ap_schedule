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
    id: id++, day, period, weeks, name, type, teacher, subgroup: null, note: '', room: '—', ...extra
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
    syncId: null,
    nextId: 100,
  };
}

/* ================= STATE / STORAGE ================= */
let DATA = loadData();
migrateData();
let state = {
  week: currentAcademicWeek(),
  day: (new Date().getDay() + 6) % 7, // 0=Mon..6=Sun
  subgroup: localStorage.getItem('ap591_subgroup') || 'all',
  viewMode: 'day',
  isAdmin: false,
  adminTab: 'lessons',
  adminDayFilter: -1,
};
if (state.day > 5) state.day = 0; // Sunday -> show Monday

function migrateData(){
  let changed = false;
  DATA.lessons.forEach(l=>{
    if(l.room === undefined){ l.room = '—'; changed = true; }
  });
  DATA.announcements.forEach(a=>{
    if(a.important === undefined){ a.important = false; changed = true; }
    if(a.day === undefined){ a.day = null; changed = true; }
  });
  if(DATA.syncId === undefined){ DATA.syncId = null; changed = true; }
  // auto-remove announcements older than 14 days
  const cutoff = Date.now() - 14 * 86400000;
  const before = DATA.announcements.length;
  DATA.announcements = DATA.announcements.filter(a => a.ts >= cutoff);
  if(DATA.announcements.length !== before) changed = true;
  // pick up a shared sync code from the URL, e.g. index.html?sync=abc123
  const urlSync = new URLSearchParams(location.search).get('sync');
  if(urlSync && urlSync !== DATA.syncId){ DATA.syncId = urlSync; changed = true; }
  if(changed) save();
}

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
  $('#dayHeading').textContent = state.viewMode === 'day'
    ? `${DAYS[state.day]} · ${state.week}-я неделя${subgroupLabel}`
    : `Неделя ${state.week}${subgroupLabel}`;
  $('#viewToggle').textContent = state.viewMode === 'day' ? 'Неделя' : 'День';

  renderNowBanner();
  renderDayAnnounceBanner();

  const list = $('#scheduleList');
  list.innerHTML = '';

  if(state.viewMode === 'week'){
    list.appendChild(buildWeekView());
    return;
  }

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

function buildWeekView(){
  const wrap = document.createElement('div');
  wrap.className = 'week-view';
  DAYS.forEach((dayName, dayIdx)=>{
    const items = lessonsFor(dayIdx, state.week);
    const byPeriod = {};
    items.forEach(l => { (byPeriod[l.period] = byPeriod[l.period] || []).push(l); });
    const section = document.createElement('div');
    section.className = 'week-view-day';
    let rows = '';
    PERIODS.forEach(period=>{
      const here = byPeriod[period.n];
      if(!here || here.length === 0){
        rows += `<div class="week-view-row wv-empty"><span class="wv-period">№${period.n}</span><span class="wv-name">Пусто</span></div>`;
      } else {
        here.forEach(l=>{
          const sg = l.subgroup ? ` · подгр.${l.subgroup}` : '';
          rows += `<div class="week-view-row"><span class="wv-period">№${period.n}</span><span class="wv-name">${escapeHtml(l.name)}${l.type ? ' ('+escapeHtml(l.type)+')' : ''}${sg}</span></div>`;
        });
      }
    });
    section.innerHTML = `<h3>${dayName}</h3>${rows}`;
    wrap.appendChild(section);
  });
  return wrap;
}

function typeColorClass(type){
  const t = (type || '').toUpperCase();
  if(t.includes('ЛР')) return 'type-lr';
  if(t.includes('ЛК')) return 'type-lk';
  if(t.includes('ПЗ')) return 'type-pz';
  return 'type-other';
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
        ${l.type ? `<span class="ticket-type ${typeColorClass(l.type)}">${escapeHtml(l.type)}</span>` : ''}
      </div>
      <div class="ticket-teacher">${escapeHtml(l.teacher || '')}</div>
      <div class="ticket-room">Ауд.: ${escapeHtml(l.room || '—')}</div>
      <div class="ticket-meta-row">
        <span class="ticket-subgroup">${l.subgroup ? 'Подгруппа ' + l.subgroup : ''}</span>
        ${varies ? weekDotsHtml(l.weeks) : '<span></span>'}
      </div>
    </div>
  `;
  return card;
}

/* ================= NOW / NEXT BANNER ================= */
function parsePeriodStart(timeStr, base = new Date()){
  const [start] = timeStr.split('–');
  const [h, m] = start.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}
function parsePeriodEnd(timeStr, base = new Date()){
  const parts = timeStr.split('–');
  const [h, m] = parts[1].split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function renderNowBanner(){
  const banner = $('#nowBanner');
  const todayIdx = (new Date().getDay() + 6) % 7;
  const isRealToday = state.viewMode === 'day' && state.day === todayIdx && state.week === currentAcademicWeek() && todayIdx <= 5;
  if(!isRealToday){ banner.classList.add('hidden'); return; }

  const now = new Date();
  const items = lessonsFor(state.day, state.week);
  let current = null, next = null;
  for(const l of items){
    const period = PERIODS[l.period - 1];
    const start = parsePeriodStart(period.time, now);
    const end = parsePeriodEnd(period.time, now);
    if(now >= start && now <= end){ current = { l, period, end }; }
    else if(now < start && (!next || start < parsePeriodStart(PERIODS[next.l.period-1].time, now))){ next = { l, period, start }; }
  }

  if(current){
    const minsLeft = Math.max(0, Math.round((current.end - now) / 60000));
    banner.innerHTML = `<div><span class="now-title">Сейчас: ${escapeHtml(current.l.name)}</span>ауд. ${escapeHtml(current.l.room || '—')}</div><span class="now-time">до конца ${minsLeft} мин</span>`;
    banner.classList.remove('hidden');
  } else if(next){
    const minsTo = Math.max(0, Math.round((next.start - now) / 60000));
    const label = minsTo > 90 ? next.start.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}) : `через ${minsTo} мин`;
    banner.innerHTML = `<div><span class="now-title">Далее: ${escapeHtml(next.l.name)}</span>ауд. ${escapeHtml(next.l.room || '—')}</div><span class="now-time">${label}</span>`;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

/* ================= DAY-ATTACHED ANNOUNCEMENTS ================= */
function renderDayAnnounceBanner(){
  const banner = $('#dayAnnounceBanner');
  if(state.viewMode !== 'day'){ banner.classList.add('hidden'); return; }
  const relevant = DATA.announcements.filter(a => a.important && a.day === state.day);
  if(relevant.length === 0){ banner.classList.add('hidden'); return; }
  banner.innerHTML = relevant.map(a => `<b>⚠ Важно на ${DAY_SHORT[state.day]}</b>${escapeHtml(a.text)}`).join('<hr style="border:none;border-top:1px solid currentColor;opacity:.2;margin:8px 0;">');
  banner.classList.remove('hidden');
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
        <label class="field"><span>Аудитория</span>
          <input class="f-room" type="text" value="${escapeAttr(l.room)}" placeholder="—">
        </label>
      </div>
      <label class="field"><span>Примечание</span>
        <input class="f-note" type="text" value="${escapeAttr(l.note)}" placeholder="необязательно">
      </label>
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
  lesson.room = card.querySelector('.f-room').value.trim() || '—';
  lesson.note = card.querySelector('.f-note').value.trim();
  const sg = card.querySelector('.f-subgroup').value;
  lesson.subgroup = sg ? Number(sg) : null;
  lesson.weeks = weeks;
  save();
  renderLessonsEditor();
  renderSchedule();
  pushCloud();
  showToast('Пара сохранена');
}

function deleteLesson(id){
  if(!confirm('Удалить эту пару из расписания?')) return;
  DATA.lessons = DATA.lessons.filter(l=>l.id !== id);
  save();
  renderLessonsEditor();
  renderSchedule();
  pushCloud();
  showToast('Пара удалена');
}

$('#addLessonBtn').addEventListener('click', ()=>{
  const day = state.adminDayFilter >= 0 ? state.adminDayFilter : 0;
  const newLesson = {
    id: DATA.nextId++,
    day, period: 1, weeks: [...ALL_WEEKS],
    name: 'Новая пара', type: '', teacher: '', subgroup: null, note: '', room: '—'
  };
  DATA.lessons.push(newLesson);
  save();
  renderLessonsEditor();
  renderSchedule();
  pushCloud();
  showToast('Пара добавлена — отредактируйте её');
});

/* ================= ADMIN: ANNOUNCEMENTS ================= */
$('#addAnnounceBtn').addEventListener('click', ()=>{
  const ta = $('#newAnnounceText');
  const text = ta.value.trim();
  if(!text) return;
  const dayVal = $('#newAnnounceDay').value;
  const important = $('#newAnnounceImportant').checked;
  DATA.announcements.push({
    id: DATA.nextId++, text, ts: Date.now(),
    day: dayVal === '' ? null : Number(dayVal),
    important
  });
  ta.value = '';
  $('#newAnnounceDay').value = '';
  $('#newAnnounceImportant').checked = false;
  save();
  renderAdminAnnouncements();
  renderAnnouncements();
  renderDayAnnounceBanner();
  pushCloud();
  showToast('Объявление опубликовано');
});

function renderAdminAnnouncements(){
  const el = $('#adminAnnounceList');
  const items = [...DATA.announcements].sort((a,b)=> b.ts - a.ts);
  if(items.length === 0){ el.innerHTML = ''; return; }
  el.innerHTML = items.map(a => `
    <div class="admin-announce-item" data-id="${a.id}">
      <div>
        <time>${formatDate(a.ts)}${a.important ? ' · ⚠ важное' : ''}${a.day !== null && a.day !== undefined ? ' · ' + DAY_SHORT[a.day] : ''}</time>
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
      renderDayAnnounceBanner();
      pushCloud();
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
    const keepSyncId = DATA.syncId;
    DATA = parsed;
    if(DATA.syncId === undefined) DATA.syncId = keepSyncId;
    migrateData();
    save();
    renderAll();
    openAdmin();
    pushCloud();
    showToast('Данные импортированы');
  }catch(e){
    showToast('Не удалось прочитать JSON');
  }
});

$('#resetBtn').addEventListener('click', ()=>{
  if(!confirm('Вернуть исходное расписание? Все ваши изменения будут потеряны.')) return;
  const keepSyncId = DATA.syncId;
  const keepAuth = DATA.auth;
  DATA = defaultData();
  DATA.syncId = keepSyncId;
  DATA.auth = keepAuth;
  save();
  renderAll();
  openAdmin();
  pushCloud();
  showToast('Расписание сброшено к исходному');
});

/* ================= CLOUD SYNC (kvdb.io, no signup needed) ================= */
const SYNC_API = 'https://kvdb.io';
let syncPolling = null;

async function enableSync(){
  showToast('Включаю синхронизацию...');
  try{
    const res = await fetch(SYNC_API + '/', { method: 'POST' });
    if(!res.ok) throw new Error('bad response');
    const id = (await res.text()).trim();
    if(!id) throw new Error('empty id');
    DATA.syncId = id;
    save();
    await pushCloud();
    renderSyncSection();
    startSyncPolling();
    updateSyncIcon();
    showToast('Синхронизация включена');
  }catch(e){
    showToast('Не удалось включить синхронизацию — проверьте интернет');
  }
}

async function pushCloud(){
  if(!DATA.syncId) return;
  try{
    await fetch(`${SYNC_API}/${DATA.syncId}/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ lessons: DATA.lessons, announcements: DATA.announcements, updatedAt: Date.now() })
    });
  }catch(e){ /* silent — will retry on next edit */ }
}

async function pullCloud(silent){
  if(!DATA.syncId) return;
  try{
    const res = await fetch(`${SYNC_API}/${DATA.syncId}/schedule`);
    if(!res.ok) throw new Error('no data yet');
    const remote = await res.json();
    if(!remote || !remote.lessons) throw new Error('bad payload');
    DATA.lessons = remote.lessons;
    DATA.announcements = remote.announcements || [];
    save();
    renderAll();
    if(state.isAdmin && !$('#adminModal').classList.contains('hidden')){
      renderLessonsEditor();
      renderAdminAnnouncements();
    }
    if(!silent) showToast('Расписание обновлено из облака');
  }catch(e){
    if(!silent) showToast('Не удалось получить данные из облака');
  }
}

function disableSync(){
  DATA.syncId = null;
  save();
  stopSyncPolling();
  renderSyncSection();
  updateSyncIcon();
  showToast('Синхронизация отключена на этом устройстве');
}

function startSyncPolling(){
  stopSyncPolling();
  if(!DATA.syncId) return;
  syncPolling = setInterval(()=>{
    const adminEditing = state.isAdmin && !$('#adminModal').classList.contains('hidden');
    if(!adminEditing) pullCloud(true);
  }, 15000);
}
function stopSyncPolling(){
  if(syncPolling){ clearInterval(syncPolling); syncPolling = null; }
}

function updateSyncIcon(){
  $('#syncRefreshBtn').classList.toggle('hidden', !DATA.syncId);
}

function renderSyncSection(){
  const el = $('#syncSection');
  if(!el) return;
  if(!DATA.syncId){
    el.innerHTML = `
      <div class="sync-box">
        <div class="sync-status"><span class="sync-dot"></span>Синхронизация выключена</div>
        <button class="btn btn-primary btn-block" id="enableSyncBtn">Включить синхронизацию</button>
      </div>`;
    $('#enableSyncBtn').addEventListener('click', enableSync);
  } else {
    const link = `${location.origin}${location.pathname}?sync=${DATA.syncId}`;
    el.innerHTML = `
      <div class="sync-box">
        <div class="sync-status"><span class="sync-dot on"></span>Синхронизация включена</div>
        <p class="hint">Отправьте эту ссылку одногруппникам — у них будет то же расписание и объявления, автоматически.</p>
        <div class="sync-code-row">
          <input type="text" id="syncLinkInput" value="${escapeAttr(link)}" readonly>
          <button class="btn btn-ghost btn-small" id="copySyncBtn">Копировать</button>
        </div>
        <div class="settings-row">
          <button class="btn btn-ghost" id="pullNowBtn">Обновить сейчас</button>
          <button class="btn btn-danger" id="disableSyncBtn">Отключить</button>
        </div>
      </div>`;
    $('#copySyncBtn').addEventListener('click', ()=>{
      const input = $('#syncLinkInput');
      input.select();
      navigator.clipboard?.writeText(input.value).then(
        ()=> showToast('Ссылка скопирована'),
        ()=> document.execCommand('copy')
      );
    });
    $('#pullNowBtn').addEventListener('click', ()=> pullCloud(false));
    $('#disableSyncBtn').addEventListener('click', ()=>{
      if(confirm('Отключить синхронизацию на этом устройстве? Расписание останется локально.')) disableSync();
    });
  }
}

$('#syncRefreshBtn').addEventListener('click', ()=> pullCloud(false));

$('#joinSyncLink').addEventListener('click', ()=>{
  const code = prompt('Вставьте код синхронизации (его даёт староста в настройках админки):');
  if(!code) return;
  DATA.syncId = code.trim();
  save();
  updateSyncIcon();
  startSyncPolling();
  pullCloud(false);
});

/* ================= VIEW TOGGLE / SHARE ================= */
$('#viewToggle').addEventListener('click', ()=>{
  state.viewMode = state.viewMode === 'day' ? 'week' : 'day';
  renderSchedule();
});

function buildShareText(){
  const subgroupLabel = state.subgroup === 'all' ? '' : ` (подгруппа ${state.subgroup})`;
  const lines = [`${DAYS[state.day]}, ${state.week}-я неделя${subgroupLabel}`];
  const items = lessonsFor(state.day, state.week);
  const byPeriod = {};
  items.forEach(l => { (byPeriod[l.period] = byPeriod[l.period] || []).push(l); });
  PERIODS.forEach(period=>{
    const here = byPeriod[period.n];
    if(!here || here.length === 0) return;
    here.forEach(l=>{
      const sg = l.subgroup ? `, подгр. ${l.subgroup}` : '';
      lines.push(`№${period.n} ${period.time} — ${l.name}${l.type ? ' ('+l.type+')' : ''}, ${l.teacher || 'без преподавателя'}${sg}, ауд. ${l.room || '—'}`);
    });
  });
  if(lines.length === 1) lines.push('Пар нет');
  return lines.join('\n');
}

$('#shareBtn').addEventListener('click', async ()=>{
  const text = buildShareText();
  if(navigator.share){
    try{ await navigator.share({ title: 'Расписание АП591', text }); }catch(e){ /* cancelled */ }
  } else if(navigator.clipboard){
    await navigator.clipboard.writeText(text);
    showToast('Расписание скопировано в буфер обмена');
  } else {
    showToast('Не удалось поделиться на этом устройстве');
  }
});

/* ================= REMINDERS ================= */
let remindersInterval = null;
const notifiedToday = new Set();

function remindersEnabled(){ return localStorage.getItem('ap591_reminders') === '1'; }

function updateReminderIcon(){
  $('#reminderToggle').classList.toggle('on', remindersEnabled());
}

$('#reminderToggle').addEventListener('click', async ()=>{
  if(!('Notification' in window)){
    showToast('Браузер не поддерживает уведомления');
    return;
  }
  if(!remindersEnabled()){
    const perm = await Notification.requestPermission();
    if(perm !== 'granted'){
      showToast('Разрешите уведомления в браузере');
      return;
    }
    localStorage.setItem('ap591_reminders', '1');
    startReminders();
    showToast('Напоминания включены (за 15 минут до пары)');
  } else {
    localStorage.setItem('ap591_reminders', '0');
    stopReminders();
    showToast('Напоминания выключены');
  }
  updateReminderIcon();
});

function startReminders(){
  stopReminders();
  remindersInterval = setInterval(checkReminders, 20000);
  checkReminders();
}
function stopReminders(){
  if(remindersInterval){ clearInterval(remindersInterval); remindersInterval = null; }
}

function checkReminders(){
  if(!remindersEnabled() || Notification.permission !== 'granted') return;
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;
  if(todayIdx > 5) return;
  const week = currentAcademicWeek(now);
  const items = DATA.lessons.filter(l => l.day === todayIdx && l.weeks.includes(week) && matchesSubgroup(l));
  items.forEach(l=>{
    const period = PERIODS[l.period - 1];
    const start = parsePeriodStart(period.time, now);
    const msTo = start - now;
    const key = `${now.toDateString()}_${l.id}`;
    if(msTo > 0 && msTo <= 15 * 60000 && !notifiedToday.has(key)){
      notifiedToday.add(key);
      const sg = l.subgroup ? ` (подгруппа ${l.subgroup})` : '';
      new Notification(`Через 15 минут: ${l.name}${sg}`, {
        body: `№${period.n} · ${period.time} · ${l.teacher || ''} · ауд. ${l.room || '—'}`,
      });
    }
  });
}

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
updateSyncIcon();
updateReminderIcon();
if(remindersEnabled() && 'Notification' in window && Notification.permission === 'granted') startReminders();
if(DATA.syncId){ pullCloud(true); startSyncPolling(); }
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'visible' && DATA.syncId) pullCloud(true);
});