const P = 'M50,0 C70,40 100,90 100,140 C100,180 80,210 50,210 C20,210 0,180 0,140 C0,90 30,40 50,0 Z';
const T = 'translate(5,10.5) scale(.9)';
let uid = 0;

// ---- DATA ----
let me = { type: 'none' }; // none | photo | live
const chats = [
  { name: 'Ann', msg: 'Wetin dey happen?', time: '11:40', ring: 'new', type: 'photo', src: 'images/ann.jpg' },
  { name: 'My Dera', msg: 'I don see am 😂', time: '10:12', ring: 'seen', type: 'photo', src: 'images/dera.jpg' },
  { name: 'Aki', msg: 'Live sticker profile', time: 'Yesterday', ring: 'none', type: 'live', src: 'stickers/aki.mp4' },
  { name: 'Pawpaw', msg: 'Hello', time: 'Yesterday', ring: 'none', type: 'none' }
];
const stickers = [
  { name: 'Aki', src: 'stickers/aki.mp4', e: '😎' },
  { name: 'Pawpaw', src: 'stickers/pawpaw.mp4', e: '🐶' }
];

// ---- DROPLET BUILDER ----
function droplet(o) {
  const n = ++uid;
  const ring = o.ring === 'new' ? 'ring-unwatched' : o.ring === 'seen' ? 'ring-watched' : '';
  const wrap = document.createElement('span');
  wrap.style.display = 'block';
  wrap.innerHTML = `
  <svg class="drop" viewBox="-6 -4 112 218" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rg${n}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff2f4d"/><stop offset="1" stop-color="#8a2be2"/>
      </linearGradient>
      <radialGradient id="gl${n}" cx=".4" cy=".6" r=".7">
        <stop offset="0" stop-color="#6aa0ff" stop-opacity=".06"/>
        <stop offset=".75" stop-color="#143070" stop-opacity=".10"/>
        <stop offset="1" stop-color="#9fd0ff" stop-opacity=".40"/>
      </radialGradient>
      <clipPath id="c${n}"><path d="${P}"/></clipPath>
    </defs>
    ${ring ? `<path class="${ring}" d="${P}" fill="none" stroke-width="${o.ring === 'new' ? 4.5 : 3}" ${o.ring === 'new' ? `style="stroke:url(#rg${n})"` : ''}/>` : ''}
    <g transform="${T}">
      <g clip-path="url(#c${n})" class="content"></g>
      <path d="${P}" fill="url(#gl${n})" stroke="rgba(255,255,255,.55)" stroke-width="1.4"/>
      <path d="M24,125 C20,100 36,64 47,32 C36,70 31,100 33,130 Z" fill="#fff" opacity=".32"/>
      <path d="M22,160 C28,190 48,200 70,196" fill="none" stroke="#bfe0ff" stroke-width="2" opacity=".45" stroke-linecap="round"/>
      <path d="M78,120 C84,140 82,160 74,176" fill="none" stroke="#fff" stroke-width="1.6" opacity=".25" stroke-linecap="round"/>
    </g>
  </svg>`;
  const content = wrap.querySelector('.content');
  if (o.type === 'photo' && o.src) {
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('href', o.src);
    img.setAttribute('x', 0); img.setAttribute('y', 0);
    img.setAttribute('width', 100); img.setAttribute('height', 210);
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    content.appendChild(img);
  } else if (o.type === 'live' && o.src) {
    content.innerHTML = `<foreignObject x="0" y="0" width="100" height="210"><video muted playsinline autoplay></video></foreignObject>`;
    const v = content.querySelector('video');
    v.muted = true; v.setAttribute('playsinline', ''); v.src = o.src;
    loopSeg(v, o.start || 0);
    v.play().catch(() => {});
  }
  return wrap;
}

// 7 sec seamless loop (checks every frame, restarts instantly)
function loopSeg(v, start) {
  const go = () => {
    if (!v.isConnected && !v.dataset.keep) { if (v.dataset.seen) return; }
    if (v.isConnected) v.dataset.seen = 1;
    const end = Math.min(start + 7, v.duration || start + 7);
    if (v.currentTime >= end - 0.04 || v.currentTime < start - 0.1) v.currentTime = start;
    if (v.paused && v.isConnected) v.play().catch(() => {});
    requestAnimationFrame(go);
  };
  v.addEventListener('loadedmetadata', () => { v.currentTime = start; });
  requestAnimationFrame(go);
}

// ---- UI HELPERS ----
const $ = s => document.querySelector(s);
const screen = $('#screen'), overlay = $('#overlay');
function toast(t) {
  const el = $('#toast'); el.textContent = t; el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2200);
}
function closeOverlay() { overlay.classList.add('hidden'); overlay.innerHTML = ''; overlay.classList.remove('sheet'); stopStream(); }
overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
function openSheet(html) {
  overlay.classList.add('sheet'); overlay.classList.remove('hidden');
  overlay.innerHTML = `<div class="sheetbox">${html}</div>`;
  return overlay.firstChild;
}

// ---- TABS ----
let tab = 'chat';
document.querySelectorAll('#nav button').forEach(b => b.onclick = () => {
  tab = b.dataset.tab;
  document.querySelectorAll('#nav button').forEach(x => x.classList.toggle('on', x === b));
  render();
});
function render() {
  $('#top').classList.remove('hidden'); $('#nav').classList.remove('hidden');
  screen.innerHTML = '';
  if (tab === 'chat') renderChat();
  if (tab === 'check') renderCheck();
  if (tab === 'call') renderCall();
}

function row(c, sub, time, onclick, ringOverride) {
  const r = document.createElement('div'); r.className = 'row';
  r.appendChild(droplet({ ...c, ring: ringOverride ?? c.ring }));
  const i = document.createElement('div'); i.className = 'info';
  i.innerHTML = `<div class="name">${c.name}</div><div class="sub">${sub}</div>`;
  r.appendChild(i);
  if (time) { const t = document.createElement('div'); t.className = 'time'; t.textContent = time; r.appendChild(t); }
  return r;
}

function renderChat() {
  // HERO: ONE droplet in center
  const h = document.createElement('div'); h.className = 'hero';
  const d = droplet(me);
  d.firstChild.parentElement.style.width = '150px';
  d.onclick = () => openPopup({ name: 'You', ...me, me: true });
  h.appendChild(d);
  h.insertAdjacentHTML('beforeend', `
    <div class="hero-label">${me.type === 'none' ? 'Empty droplet' : me.type === 'photo' ? 'Photo profile (stays still)' : 'Live sticker (7 sec loop)'}</div>
    <div class="hero-btns">
      <button id="addPhoto">Add photo</button>
      <button id="rmAny">Remove</button>
    </div>`);
  screen.appendChild(h);
  $('#addPhoto').onclick = () => {
    if (me.type === 'live') return toast('Remove live sticker first');
    $('#photoInput').click();
  };
  $('#rmAny').onclick = () => { me = { type: 'none' }; render(); };

  chats.forEach(c => {
    const r = row(c, c.msg, c.time);
    r.firstChild.onclick = e => { e.stopPropagation(); openPopup(c); };
    r.querySelector('.info').onclick = () => openChat(c);
    screen.appendChild(r);
  });
}

function renderCheck() {
  screen.insertAdjacentHTML('beforeend', '<div class="section">Recent Checks</div>');
  chats.filter(c => c.ring !== 'none').forEach(c => {
    const r = row(c, c.ring === 'new' ? 'New check' : 'Viewed', '', null);
    r.onclick = () => { c.ring = 'seen'; toast('Check viewed'); render(); };
    screen.appendChild(r);
  });
}
function renderCall() {
  screen.insertAdjacentHTML('beforeend', '<div class="section">Recent Calls</div>');
  chats.forEach(c => screen.appendChild(row(c, '↗ Today, 9:20', '📞', null, 'none')));
}

// ---- POPUP (small, tap outside closes) ----
function openPopup(c) {
  overlay.classList.remove('sheet'); overlay.classList.remove('hidden');
  overlay.innerHTML = `<div class="popup"><div id="pd"></div><div class="pname">${c.name}</div>
    <div class="icons"><button data-a="msg">💬</button><button data-a="aud">📞</button><button data-a="plus" class="plus">＋</button><button data-a="vid">🎥</button></div></div>`;
  $('#pd').appendChild(droplet({ ...c, ring: 'none' }));
  overlay.querySelectorAll('.icons button').forEach(b => b.onclick = () => {
    const a = b.dataset.a;
    if (a === 'msg') { closeOverlay(); c.me ? toast('This is you') : openChat(c); }
    if (a === 'aud') { closeOverlay(); toast('Voice call ' + c.name); }
    if (a === 'vid') { closeOverlay(); toast('Video call ' + c.name); }
    if (a === 'plus') plusMenu();
  });
}

// ---- PLUS ----
function plusMenu() {
  openSheet(`<h3>EVA Live Profile</h3>
    <button class="big" id="pRec">🎬 Record</button>
    <button class="big" id="pUp">⬆️ Upload</button>`);
  $('#pRec').onclick = () => guardPhoto(recordSheet);
  $('#pUp').onclick = uploadMenu;
}
function guardPhoto(next) {
  if (me.type === 'photo') {
    openSheet(`<h3>Remove photo first</h3><p class="small">You cannot have photo and live sticker at the same time.</p>
      <button class="big pri" id="rmPh">Remove photo</button>`);
    $('#rmPh').onclick = () => { me = { type: 'none' }; render(); next(); };
  } else next();
}
function uploadMenu() {
  openSheet(`<h3>Upload</h3>
    <button class="big" id="uGal">🖼️ Gallery</button>
    <button class="big" id="uSt">✨ Live Stickers</button>`);
  $('#uGal').onclick = () => guardPhoto(() => { closeOverlay(); $('#galleryInput').click(); });
  $('#uSt').onclick = () => guardPhoto(stickerSheet);
}
function setLive(src, start) { me = { type: 'live', src, start: start || 0 }; closeOverlay(); tab = 'chat'; render(); toast('Live sticker set ✔'); }

// Stickers
function stickerSheet() {
  openSheet(`<h3>Live Stickers</h3><p class="small">All max 7 sec, all loop</p><div class="grid">` +
    stickers.map((s, i) => `<button data-i="${i}"><b>${s.e}</b>${s.name}</button>`).join('') + `</div>`);
  overlay.querySelectorAll('.grid button').forEach(b => b.onclick = () => setLive(stickers[b.dataset.i].src, 0));
}

// Gallery + trim
$('#galleryInput').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const url = URL.createObjectURL(f);
  const t = document.createElement('video'); t.src = url; t.preload = 'metadata';
  t.onloadedmetadata = () => {
    if (t.duration <= 7.05) return setLive(url, 0);
    trimSheet(url, t.duration);
  };
  e.target.value = '';
};
function trimSheet(url, dur) {
  const max = +(dur - 7).toFixed(1);
  const box = openSheet(`<h3>Trim to 7 seconds</h3>
    <video class="vid" muted playsinline autoplay></video>
    <div class="small" id="tl">00:00 - 00:07</div>
    <input class="range" id="rg" type="range" min="0" max="${max}" step="0.1" value="0">
    <button class="big pri" id="upl">Upload</button>`);
  const v = box.querySelector('video'); v.src = url; v.dataset.keep = 1;
  let start = 0; loopSeg2(v, () => start);
  const fmt = s => '00:' + String(Math.floor(s)).padStart(2, '0');
  $('#rg').oninput = e => { start = +e.target.value; v.currentTime = start; $('#tl').textContent = fmt(start) + ' - ' + fmt(start + 7); };
  $('#upl').onclick = () => setLive(url, start);
}
function loopSeg2(v, getStart) {
  const go = () => {
    if (!v.isConnected) return;
    const s = getStart();
    if (v.currentTime >= s + 7 - 0.04 || v.currentTime < s - 0.1) v.currentTime = s;
    requestAnimationFrame(go);
  };
  requestAnimationFrame(go);
}

// Record (auto-stops at 7 sec)
let stream = null;
function stopStream() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }
async function recordSheet() {
  const box = openSheet(`<h3>Record (max 7 sec)</h3>
    <video class="vid" id="rv" muted playsinline autoplay></video>
    <div class="small" id="rt">Tap start</div>
    <button class="big pri" id="rs">● Start</button>
    <button class="big pri hidden" id="ru">Upload</button>`);
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true }); }
  catch (e) { $('#rt').textContent = 'Camera not allowed. Allow camera in browser settings.'; return; }
  const v = $('#rv'); v.srcObject = stream;
  $('#rs').onclick = () => {
    const chunks = []; const mr = new MediaRecorder(stream);
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: mr.mimeType });
      const url = URL.createObjectURL(blob);
      stopStream(); v.srcObject = null; v.src = url; v.muted = true; v.loop = true; v.play();
      $('#rt').textContent = 'Done (7 sec)'; $('#rs').classList.add('hidden');
      $('#ru').classList.remove('hidden'); $('#ru').onclick = () => setLive(url, 0);
    };
    mr.start(); $('#rs').disabled = true;
    let s = 7; $('#rt').textContent = 'Recording… ' + s;
    const iv = setInterval(() => { s--; $('#rt').textContent = 'Recording… ' + s; if (s <= 0) { clearInterval(iv); mr.stop(); } }, 1000);
  };
}

// Photo profile
$('#photoInput').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  me = { type: 'photo', src: URL.createObjectURL(f) }; e.target.value = ''; render();
};

// ---- INSIDE CHAT ----
function openChat(c) {
  $('#top').classList.add('hidden'); $('#nav').classList.add('hidden');
  screen.innerHTML = '';
  const h = document.createElement('div'); h.className = 'chathead';
  h.innerHTML = '<button class="back">←</button>';
  h.appendChild(droplet({ ...c, ring: 'none' }));
  h.insertAdjacentHTML('beforeend', `<div><b>${c.name}</b></div>`);
  h.querySelector('.back').onclick = render;
  screen.appendChild(h);
  const m = document.createElement('div'); m.className = 'msgs';
  m.innerHTML = `<div class="b in">Boss how far?<small>11:30</small></div>
    <div class="b out">I dey. Wetin dey?<small>11:31 ✓✓</small></div>
    <div class="b in">${c.msg}<small>${c.time}</small></div>`;
  screen.appendChild(m);
  const bar = document.createElement('div'); bar.className = 'bar';
  bar.innerHTML = `<button>😊</button><input placeholder="Message..."><button>📎</button><button>📷</button><button>🎤</button>`;
  screen.appendChild(bar);
}

render();
