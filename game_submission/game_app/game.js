// Trash Tactics - Vanilla JS Drag-and-Drop Sorting Game

const menuScreen = document.getElementById('menu');
const playScreen = document.getElementById('play');
const resultsScreen = document.getElementById('results');

const btnStart = document.getElementById('btn-start');
const btnHow = document.getElementById('btn-how');
const btnCredits = document.getElementById('btn-credits');
const btnExit = document.getElementById('btn-exit');
const btnRestart = document.getElementById('btn-restart');

const menuModal = document.getElementById('menu-modal');
const menuModalBody = document.getElementById('menu-modal-body');

const itemEl = document.getElementById('item');
const bins = Array.from(document.querySelectorAll('.bin'));
const resultSummaryEl = document.getElementById('result-summary');
const announcerEl = document.getElementById('announcer');
const levelNameEl = document.getElementById('level-name');
const itemsLeftEl = document.getElementById('items-left');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const timerBarEl = document.getElementById('timer-bar');
const hintEl = document.getElementById('hint');
const btnSettings = document.getElementById('btn-settings');
const btnProfiles = document.getElementById('btn-profiles');
const settingsModal = document.getElementById('settings-modal');
const profilesModal = document.getElementById('profiles-modal');
const profilesUl = document.getElementById('profiles-ul');
const btnAddProfile = document.getElementById('btn-add-profile');
const btnDelProfile = document.getElementById('btn-del-profile');
const profileNameInput = document.getElementById('profile-name');
const avatarFileInput = document.getElementById('avatar-file');
const avatarThumb = document.getElementById('avatar-thumb');
const optSfx = document.getElementById('opt-sfx');
const optTimer = document.getElementById('opt-timer');
const optCb = document.getElementById('opt-cb');
const optVolume = document.getElementById('opt-volume');

const LEVELS = [
  {
    name: 'Home',
    items: [
      { label: 'Banana peel', cat: 'compost' },
      { label: 'Aluminium can', cat: 'recycle' },
      { label: 'Pizza box (greasy)', cat: 'compost' },
      { label: 'Glass bottle', cat: 'recycle' },
      { label: 'Soft plastic wrapper', cat: 'landfill' },
      { label: 'Paper towel', cat: 'compost' },
      { label: 'Tea leaves', cat: 'compost' },
      { label: 'Egg carton (paper)', cat: 'recycle' },
    ],
  },
  {
    name: 'Campus',
    items: [
      { label: 'Coffee cup (paper)', cat: 'landfill' },
      { label: 'Coffee cup lid (plastic)', cat: 'landfill' },
      { label: 'Clean paper', cat: 'recycle' },
      { label: 'Salad leftovers', cat: 'compost' },
      { label: 'Plastic cutlery', cat: 'landfill' },
      { label: 'Metal can', cat: 'recycle' },
      { label: 'Orange peels', cat: 'compost' },
      { label: 'Cardboard sleeve (clean)', cat: 'recycle' },
    ],
  },
  {
    name: 'Community',
    items: [
      { label: 'Styrofoam', cat: 'landfill' },
      { label: 'Yard trimmings', cat: 'compost' },
      { label: 'Plastic bottle (empty)', cat: 'recycle' },
      { label: 'Broken ceramics', cat: 'landfill' },
      { label: 'Newspaper', cat: 'recycle' },
      { label: 'Food scraps', cat: 'compost' },
      { label: 'Cling wrap', cat: 'landfill' },
      { label: 'Tin can', cat: 'recycle' },
    ],
  },
];

const state = {
  levelIndex: 0,
  queue: [],
  current: null,
  score: 0,
  gameOver: false,
  timerOn: false,
  time: 0, // ms elapsed
  timeLimit: 45000, // 45s default
  profile: null,
};

// High score
function loadProfiles() {
  try { return JSON.parse(localStorage.getItem('tt_profiles') || '[]'); } catch { return []; }
}
function saveProfiles(list) { localStorage.setItem('tt_profiles', JSON.stringify(list)); }
function getProfile(name) { return loadProfiles().find(p => p.name === name) || null; }
function upsertProfile(profile) {
  const list = loadProfiles();
  const idx = list.findIndex(p => p.name === profile.name);
  if (idx >= 0) list[idx] = profile; else list.push(profile);
  saveProfiles(list);
}
function deleteProfile(name) {
  const list = loadProfiles().filter(p => p.name !== name);
  saveProfiles(list);
}
function setActiveProfile(name) {
  state.profile = getProfile(name);
  if (state.profile) {
    localStorage.setItem('tt_active_profile', state.profile.name);
    highScoreEl.textContent = String(state.profile.highScore || 0);
    renderAvatarThumb();
  }
}
function initActiveProfile() {
  const active = localStorage.getItem('tt_active_profile');
  if (active && getProfile(active)) { setActiveProfile(active); }
  else { avatarThumb.removeAttribute('src'); }
}
function ensureProfile() {
  if (!state.profile) { profilesModal.classList.remove('hidden'); return false; }
  return true;
}

function getHighScore() { return state.profile ? (state.profile.highScore || 0) : 0; }
function setHighScore(v) {
  if (!state.profile) return;
  state.profile.highScore = v;
  upsertProfile(state.profile);
}
initActiveProfile();
highScoreEl.textContent = String(getHighScore());

// SFX via WebAudio
let audioCtx;
function beep(freq = 600, dur = 0.08, vol = 0.2) {
  if (!optSfx || !optSfx.checked) return;
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.value = (optVolume ? Number(optVolume.value) : vol) * vol;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  setTimeout(()=>{ o.stop(); }, dur*1000);
}

function showScreen(id) {
  [menuScreen, playScreen, resultsScreen].forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startLevel() {
  const level = LEVELS[state.levelIndex];
  state.queue = shuffle([...level.items]);
  state.current = null;
  levelNameEl.textContent = level.name;
  itemsLeftEl.textContent = String(state.queue.length);
  scoreEl.textContent = String(state.score);
  if (optTimer && optTimer.checked) { state.timerOn = true; state.time = 0; timerBarEl.style.width = '0%'; }
  spawnNext();
}

function spawnNext() {
  if (state.queue.length === 0) {
    // move to next level or finish
    if (state.levelIndex < LEVELS.length - 1) {
      state.levelIndex++;
      startLevel();
      return;
    } else {
      finishGame();
      return;
    }
  }
  state.current = state.queue.shift();
  itemEl.textContent = state.current.label;
  itemEl.setAttribute('data-cat', state.current.cat);
  itemEl.setAttribute('aria-label', `Item: ${state.current.label}`);
  itemsLeftEl.textContent = String(state.queue.length);
}

function handleDecision(category) {
  if (!state.current) return;
  const correct = state.current.cat === category;
  state.score += correct ? 1 : -2;
  scoreEl.textContent = String(state.score);
  scoreEl.parentElement.classList.add('score-bump');
  setTimeout(() => scoreEl.parentElement.classList.remove('score-bump'), 280);

  // Visual feedback on bins
  const bin = bins.find(b => b.getAttribute('data-category') === category);
  if (bin) {
    bin.classList.add('open');
    bin.classList.add(correct ? 'correct' : 'wrong');
    setTimeout(() => { bin.classList.remove('open'); bin.classList.remove('correct'); bin.classList.remove('wrong'); }, 450);
  }

  // ARIA announce
  announcerEl.textContent = correct ? 'Correct bin!' : 'Wrong bin!';
  hintEl.textContent = correct ? 'Nice! Keep going!' : `Tip: ${state.current.label} goes to ${state.current.cat}.`;

  // Simple confetti effect for correct
  if (correct) { triggerConfetti(); beep(820, 0.06); } else { beep(180, 0.1); }

  spawnNext();
}

// Drag & Drop
itemEl.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('text/plain', itemEl.getAttribute('data-cat') || '');
  itemEl.setAttribute('aria-grabbed', 'true');
});
itemEl.addEventListener('dragend', () => {
  itemEl.setAttribute('aria-grabbed', 'false');
});

bins.forEach(bin => {
  bin.addEventListener('dragover', (e) => { e.preventDefault(); bin.classList.add('dragover'); });
  bin.addEventListener('dragleave', () => bin.classList.remove('dragover'));
  bin.addEventListener('drop', (e) => {
    e.preventDefault();
    bin.classList.remove('dragover');
    const cat = bin.getAttribute('data-category');
    handleDecision(cat);
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (!playScreen.classList.contains('active') || state.gameOver) return;
  if (e.key === '1') handleDecision('recycle');
  if (e.key === '2') handleDecision('compost');
  if (e.key === '3') handleDecision('landfill');
});

// Touch/click fallback buttons
document.querySelectorAll('.touch-controls .choice').forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.getAttribute('data-category');
    handleDecision(cat);
  });
});

function triggerConfetti() {
  // Lightweight emoji confetti
  const emojis = ['♻️','🌿','✨'];
  const piece = document.createElement('div');
  piece.textContent = emojis[Math.floor(Math.random()*emojis.length)];
  piece.style.position = 'fixed';
  piece.style.left = (window.innerWidth/2 + (Math.random()*80-40)) + 'px';
  piece.style.top = '40%';
  piece.style.fontSize = '24px';
  piece.style.pointerEvents = 'none';
  piece.style.transition = 'transform 700ms ease, opacity 700ms ease';
  document.body.appendChild(piece);
  requestAnimationFrame(() => {
    piece.style.transform = `translate(${(Math.random()*120-60)}px, -100px) rotate(${(Math.random()*90-45)}deg)`;
    piece.style.opacity = '0';
  });
  setTimeout(() => piece.remove(), 720);
}

function finishGame() {
  state.gameOver = true;
  const targetText = '“Reduce total waste generated in Australia by 10 per person by 2030.” (DCCEEW, National Waste Policy Action Plan 2019)';
  const summary = [
    `Final Score: ${state.score}`,
    `Levels completed: ${LEVELS.length}`,
    '',
    targetText,
  ].join('\n');
  resultSummaryEl.textContent = summary;
  // Update high score
  const hs = getHighScore();
  if (state.score > hs) { setHighScore(state.score); highScoreEl.textContent = String(state.score); }
  showScreen('results');
}

function startGame() {
  if (!ensureProfile()) return; // force profile selection
  state.levelIndex = 0;
  state.score = 0;
  state.gameOver = false;
  if (optCb && optCb.checked) document.body.classList.add('cb'); else document.body.classList.remove('cb');
  showScreen('play');
  startLevel();
}

function setupMenu() {
  btnStart.onclick = startGame;
  btnHow.onclick = () => openMenuModal('How to Play', `\
Drag or assign each item to the correct bin: Recycle, Compost, or Landfill.\n\
• Scoring: +1 for correct, −2 for wrong.\n\
• Levels: Home → Campus → Community.\n\
Desktop: Drag-and-drop or press 1/2/3. Mobile: tap the buttons below the bins.`);
  btnCredits.onclick = () => openMenuModal('Credits', `\
Game: Trash Tactics\n\
Purpose: Teach correct recycling & composting practices to support Australia’s 2030 target to reduce total waste generated by 10 per person (DCCEEW, 2019).\n\
Built with vanilla HTML/CSS/JS.`);
  btnExit.onclick = () => showScreen('menu');
  btnRestart.onclick = () => { showScreen('menu'); };

  // Settings modal
  btnSettings.onclick = () => { settingsModal.classList.remove('hidden'); };
  settingsModal.querySelector('.close').onclick = () => settingsModal.classList.add('hidden');

  // Profiles modal
  btnProfiles.onclick = () => { refreshProfilesUI(); profilesModal.classList.remove('hidden'); };
  profilesModal.querySelector('.close').onclick = () => profilesModal.classList.add('hidden');
  btnAddProfile.onclick = () => {
    const name = (profileNameInput.value || '').trim();
    if (!name) return;
    if (getProfile(name)) { announcerEl.textContent = 'Profile exists'; return; }
    const profile = { name, highScore: 0, avatar: null };
    upsertProfile(profile);
    profileNameInput.value = '';
    refreshProfilesUI();
  };
  btnDelProfile.onclick = () => {
    const sel = profilesUl.querySelector('li[aria-selected="true"]');
    if (!sel) return;
    const name = sel.getAttribute('data-name');
    deleteProfile(name);
    if (state.profile && state.profile.name === name) { state.profile = null; highScoreEl.textContent = '0'; localStorage.removeItem('tt_active_profile'); }
    refreshProfilesUI();
  };
}

function openMenuModal(title, text) {
  menuModalBody.innerHTML = `<h3>${title}</h3><p style="white-space: pre-wrap;">${text}</p>`;
  menuModal.classList.remove('hidden');
  menuModal.querySelector('.close').onclick = () => menuModal.classList.add('hidden');
}

// Boot
setupMenu();
showScreen('menu');

// Timer loop
let lastTs = 0;
function loop(ts) {
  if (!lastTs) lastTs = ts;
  const dt = ts - lastTs; lastTs = ts;
  if (playScreen.classList.contains('active') && !state.gameOver && state.timerOn) {
    state.time += dt;
    const p = Math.min(1, state.time / state.timeLimit);
    timerBarEl.style.width = `${Math.floor(p*100)}%`;
    if (state.time >= state.timeLimit) {
      // penalize and move on
      hintEl.textContent = 'Time up! −2';
      state.score -= 2; scoreEl.textContent = String(state.score);
      spawnNext();
      state.time = 0;
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function refreshProfilesUI() {
  profilesUl.innerHTML = '';
  const list = loadProfiles();
  list.forEach(p => {
    const li = document.createElement('li');
    li.setAttribute('data-name', p.name);
    const left = document.createElement('div');
    left.className = 'li-left';
    if (p.avatar && p.avatar.startsWith('data:')) {
      const img = document.createElement('img'); img.src = p.avatar; img.alt = '';
      left.appendChild(img);
    } else if (p.avatar && p.avatar.startsWith('emoji:')) {
      const span = document.createElement('span'); span.textContent = p.avatar.slice(6);
      left.appendChild(span);
    }
    const nameSpan = document.createElement('span'); nameSpan.textContent = p.name; left.appendChild(nameSpan);
    const right = document.createElement('span'); right.textContent = `HS: ${p.highScore || 0}`;
    li.appendChild(left); li.appendChild(right);
    li.tabIndex = 0;
    if (state.profile && state.profile.name === p.name) li.setAttribute('aria-selected','true');
    li.onclick = () => {
      profilesUl.querySelectorAll('li').forEach(el => el.removeAttribute('aria-selected'));
      li.setAttribute('aria-selected','true');
      setActiveProfile(p.name);
    };
    li.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); } };
    profilesUl.appendChild(li);
  });
}

// Avatar handlers
document.querySelectorAll('.preset-avatars .preset').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!state.profile) { announcerEl.textContent = 'Select a profile first'; return; }
    const emoji = btn.getAttribute('data-emoji') || '🙂';
    state.profile.avatar = `emoji:${emoji}`;
    upsertProfile(state.profile);
    renderAvatarThumb();
    refreshProfilesUI();
  });
});

avatarFileInput.addEventListener('change', (e) => {
  if (!state.profile) { announcerEl.textContent = 'Select a profile first'; return; }
  const file = avatarFileInput.files && avatarFileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.profile.avatar = String(reader.result);
    upsertProfile(state.profile);
    renderAvatarThumb();
    refreshProfilesUI();
  };
  reader.readAsDataURL(file);
});

function renderAvatarThumb() {
  if (!state.profile || !state.profile.avatar) { avatarThumb.removeAttribute('src'); avatarThumb.style.display = 'none'; return; }
  if (state.profile.avatar.startsWith('data:')) {
    avatarThumb.src = state.profile.avatar; avatarThumb.style.display = 'block'; return;
  }
  if (state.profile.avatar.startsWith('emoji:')) {
    // Render emoji as data URL via canvas for consistency
    const emoji = state.profile.avatar.slice(6);
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,128,128);
    ctx.font = '96px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(emoji, 64, 72);
    avatarThumb.src = canvas.toDataURL('image/png'); avatarThumb.style.display = 'block';
  }
}
