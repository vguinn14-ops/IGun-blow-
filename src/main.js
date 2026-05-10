const weapons = [
  { id: 'viper-9', name: 'Viper 9', className: 'Sidearm', caliber: '9×19mm', capacity: 17, fireRate: 640, damage: 38, accuracy: 78, recoil: 34, color: '#9ca3af', accent: '#22d3ee', body: 'compact', unlock: 'Starter issue' },
  { id: 'ranger-45', name: 'Ranger .45', className: 'Heavy Pistol', caliber: '.45 ACP', capacity: 8, fireRate: 390, damage: 58, accuracy: 71, recoil: 57, color: '#64748b', accent: '#f97316', body: 'classic', unlock: 'Score 250 points' },
  { id: 'storm-pdw', name: 'Storm PDW', className: 'SMG', caliber: '4.6×30mm', capacity: 30, fireRate: 920, damage: 31, accuracy: 65, recoil: 48, color: '#52525b', accent: '#a78bfa', body: 'pdw', unlock: 'Score 500 points' },
  { id: 'sentinel-m4', name: 'Sentinel M4', className: 'Carbine', caliber: '5.56 NATO', capacity: 30, fireRate: 780, damage: 47, accuracy: 82, recoil: 52, color: '#475569', accent: '#34d399', body: 'rifle', unlock: 'Score 900 points' },
  { id: 'hammer-12', name: 'Hammer 12', className: 'Shotgun', caliber: '12 gauge', capacity: 6, fireRate: 110, damage: 91, accuracy: 42, recoil: 83, color: '#713f12', accent: '#facc15', body: 'shotgun', unlock: 'Score 1,300 points' },
  { id: 'longwatch', name: 'Longwatch', className: 'Precision Rifle', caliber: '7.62 NATO', capacity: 5, fireRate: 55, damage: 96, accuracy: 96, recoil: 76, color: '#334155', accent: '#38bdf8', body: 'sniper', unlock: 'Score 1,800 points' },
];

const attachments = [
  { id: 'optic', label: 'Holo optic', stat: '+8 accuracy' },
  { id: 'brake', label: 'Comp brake', stat: '-9 recoil' },
  { id: 'laser', label: 'Tac laser', stat: '+5 accuracy' },
  { id: 'skin', label: 'Neon skin', stat: 'visual' },
];

const ranges = [
  { id: 'warehouse', name: 'Warehouse', distance: 18, wind: 'Still', bg: 'linear-gradient(135deg, #111827, #312e81)' },
  { id: 'desert', name: 'Desert Range', distance: 35, wind: 'Light', bg: 'linear-gradient(135deg, #431407, #92400e)' },
  { id: 'arctic', name: 'Arctic Bay', distance: 60, wind: 'Gusty', bg: 'linear-gradient(135deg, #082f49, #155e75)' },
];

const state = {
  selectedId: weapons[0].id,
  ammo: weapons[0].capacity,
  score: 0,
  shots: 0,
  hits: 0,
  firing: false,
  rangeId: ranges[0].id,
  equipped: ['optic'],
  log: ['Welcome to GunSim Pro Online. Pick a range and test your collection.'],
};

const root = document.getElementById('root');
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const icon = (name) => ({ shield: '🛡️', wrench: '🔧', zap: '⚡', reload: '↻', gauge: '◎', medal: '🏅', volume: '🔊', spark: '✨' }[name]);

function weapon() { return weapons.find((item) => item.id === state.selectedId); }
function range() { return ranges.find((item) => item.id === state.rangeId); }
function unlockedWeapons() { return weapons.filter((_, index) => index < 2 || state.score >= [0, 0, 500, 900, 1300, 1800][index]); }
function effectiveAccuracy(item = weapon(), place = range()) { return clamp(item.accuracy + (state.equipped.includes('optic') ? 8 : 0) + (state.equipped.includes('laser') ? 5 : 0) - place.distance / 3, 5, 98); }
function effectiveRecoil(item = weapon()) { return clamp(item.recoil - (state.equipped.includes('brake') ? 9 : 0), 5, 98); }

function tone(type, volume = 0.22) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);
  if (type === 'empty') {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } else if (type === 'reload') {
    [260, 190, 310].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const localGain = ctx.createGain();
      localGain.gain.setValueAtTime(0.001, ctx.currentTime + index * 0.09);
      localGain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + index * 0.09 + 0.01);
      localGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.09 + 0.08);
      osc.connect(localGain).connect(ctx.destination);
      osc.start(ctx.currentTime + index * 0.09);
      osc.stop(ctx.currentTime + index * 0.09 + 0.09);
    });
  } else {
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.16, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i += 1) output[i] = (Math.random() * 2 - 1) * (1 - i / output.length);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = type === 'shotgun' ? 180 : 520;
    noise.connect(filter).connect(gain);
    noise.start();
    noise.stop(ctx.currentTime + 0.16);
  }
}

function weaponSvg(item) {
  const neon = state.equipped.includes('skin');
  const optic = state.equipped.includes('optic');
  const laser = state.equipped.includes('laser');
  const brake = state.equipped.includes('brake');
  const stock = ['rifle', 'shotgun', 'sniper'].includes(item.body);
  const longBarrel = ['rifle', 'shotgun', 'sniper'].includes(item.body);
  const shotgun = item.body === 'shotgun';
  const muzzleX = longBarrel ? 680 : 518;
  return `<svg class="weapon-svg ${state.firing ? 'kick' : ''}" viewBox="0 0 760 330" role="img" aria-label="${item.name} simulator rendering">
    <defs><linearGradient id="metal" x1="0" x2="1"><stop offset="0" stop-color="#e5e7eb" stop-opacity="0.95"/><stop offset="0.45" stop-color="${item.color}"/><stop offset="1" stop-color="#111827"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    ${state.firing ? '<polygon points="705,117 758,88 736,124 760,151 704,137" fill="#fde68a" filter="url(#glow)" />' : ''}
    ${stock ? '<path d="M112 145 L30 118 Q14 144 34 177 L118 183 Z" fill="url(#metal)" stroke="#020617" stroke-width="8" />' : ''}
    <rect x="128" y="118" width="${longBarrel ? 360 : 230}" height="74" rx="18" fill="url(#metal)" stroke="#020617" stroke-width="8" />
    <rect x="188" y="88" width="${item.body === 'pdw' ? 170 : 250}" height="44" rx="12" fill="#111827" stroke="#020617" stroke-width="7" />
    <rect x="${longBarrel ? 486 : 356}" y="133" width="${longBarrel ? 205 : 165}" height="32" rx="12" fill="#0f172a" stroke="#020617" stroke-width="8" />
    ${brake ? `<rect x="${muzzleX}" y="124" width="42" height="50" rx="8" fill="#1e293b" stroke="${item.accent}" stroke-width="5" />` : ''}
    ${optic ? `<g><rect x="280" y="54" width="115" height="34" rx="12" fill="#0f172a" stroke="${item.accent}" stroke-width="6"/><circle cx="337" cy="71" r="15" fill="#0ea5e9" opacity="0.5" /></g>` : ''}
    <path d="M250 190 L302 280 L356 280 L325 190 Z" fill="#111827" stroke="#020617" stroke-width="8" />
    <path d="M150 190 Q142 246 194 257 L231 196 Z" fill="#1f2937" stroke="#020617" stroke-width="8" />
    <rect x="350" y="184" width="${shotgun ? 150 : 92}" height="34" rx="14" fill="${shotgun ? '#78350f' : '#111827'}" stroke="#020617" stroke-width="7" />
    ${laser ? '<line x1="540" y1="180" x2="742" y2="218" stroke="#ef4444" stroke-width="4" stroke-dasharray="12 9" opacity="0.8" />' : ''}
    <circle cx="175" cy="152" r="12" fill="${item.accent}" ${neon ? 'filter="url(#glow)"' : ''} />
    <path d="M142 142 H450" stroke="${neon ? item.accent : '#cbd5e1'}" stroke-width="5" opacity="0.55" />
    <text x="140" y="232" fill="#cbd5e1" font-size="22" font-weight="800">${item.caliber}</text>
  </svg>`;
}

function stat(label, value, invert = false) {
  const pct = invert ? 100 - value : value;
  return `<div class="stat"><span>${label}</span><b>${value}</b><i><em style="width:${clamp(pct, 0, 100)}%"></em></i></div>`;
}

function addLog(message) {
  state.log = [message, ...state.log].slice(0, 5);
}

function fire() {
  const item = weapon();
  const place = range();
  if (state.ammo <= 0) {
    tone('empty');
    addLog(`${item.name}: empty magazine. Reload to continue.`);
    render();
    return;
  }
  state.ammo -= 1;
  state.shots += 1;
  state.firing = true;
  tone(item.body === 'shotgun' ? 'shotgun' : 'fire');
  const hitChance = clamp(effectiveAccuracy(item, place) - effectiveRecoil(item) * 0.22, 8, 94);
  const didHit = Math.random() * 100 < hitChance;
  if (didHit) {
    const earned = Math.round(item.damage + effectiveAccuracy(item, place) / 3 + place.distance / 4);
    state.hits += 1;
    state.score += earned;
    addLog(`Hit at ${place.distance}m with ${item.name}. +${earned} score.`);
  } else {
    addLog(`Missed at ${place.distance}m. Control recoil and try again.`);
  }
  render();
  window.setTimeout(() => { state.firing = false; render(); }, 120);
}

function reload() {
  state.ammo = weapon().capacity;
  tone('reload');
  addLog(`${weapon().name} reloaded: ${weapon().capacity}/${weapon().capacity}.`);
  render();
}

function resetSession() {
  state.score = 0;
  state.shots = 0;
  state.hits = 0;
  state.log = ['Session reset.'];
  render();
}

function selectWeapon(id) {
  const item = weapons.find((entry) => entry.id === id);
  if (!unlockedWeapons().some((entry) => entry.id === id)) return;
  state.selectedId = id;
  state.ammo = item.capacity;
  addLog(`${item.name} equipped.`);
  render();
}

function toggleAttachment(id) {
  state.equipped = state.equipped.includes(id) ? state.equipped.filter((item) => item !== id) : [...state.equipped, id];
  render();
}

function render() {
  const item = weapon();
  const place = range();
  const unlocked = unlockedWeapons();
  const accuracy = state.shots ? Math.round((state.hits / state.shots) * 100) : 0;
  const achievements = [
    { name: 'First Sparks', done: state.shots > 0 },
    { name: 'Marksman', done: state.hits >= 10 },
    { name: 'Collector', done: unlocked.length >= 4 },
    { name: 'Range Master', done: state.score >= 2000 },
  ];
  root.innerHTML = `<main class="app">
    <section class="hero"><div><p class="eyebrow">${icon('spark')} Original online simulator</p><h1>GunSim Pro Online</h1><p class="lede">A browser-based, original firearm collection and range toy with interactive firing, reloads, synthetic audio, unlocks, attachments, achievements, and responsive controls.</p></div><div class="score-card"><span>Total score</span><strong>${state.score.toLocaleString()}</strong><small>${state.hits}/${state.shots} hits · ${accuracy}% accuracy</small></div></section>
    <section class="sim-grid">
      <aside class="panel arsenal"><h2>${icon('shield')} Arsenal</h2>${weapons.map((entry) => {
        const isUnlocked = unlocked.some((gun) => gun.id === entry.id);
        return `<button data-action="select" data-id="${entry.id}" class="weapon-card ${entry.id === item.id ? 'active' : ''}" ${isUnlocked ? '' : 'disabled'}><span><b>${entry.name}</b><small>${entry.className} · ${entry.caliber}</small></span><em>${isUnlocked ? `${entry.capacity} rnd` : entry.unlock}</em></button>`;
      }).join('')}</aside>
      <section class="range panel" style="--range-bg: ${place.bg}"><div class="range-top"><div><span>${place.name}</span><b>${item.name}</b></div><div class="ammo"><small>Ammo</small><strong>${state.ammo}/${item.capacity}</strong></div></div><div class="stage"><div class="target"><span>◎</span><small>${place.distance}m</small></div>${weaponSvg(item)}</div><div class="controls"><button class="primary" data-action="fire">${icon('zap')} Fire</button><button data-action="reload">${icon('reload')} Reload</button><button data-action="reset">${icon('gauge')} Reset</button></div></section>
      <aside class="panel details"><h2>${icon('wrench')} Tuning</h2><div class="range-picker">${ranges.map((entry) => `<button data-action="range" data-id="${entry.id}" class="${entry.id === place.id ? 'active' : ''}">${entry.name}<small>${entry.wind} wind</small></button>`).join('')}</div><div class="attachments">${attachments.map((entry) => `<button data-action="attachment" data-id="${entry.id}" class="${state.equipped.includes(entry.id) ? 'active' : ''}"><b>${entry.label}</b><small>${entry.stat}</small></button>`).join('')}</div>${stat('Damage', item.damage)}${stat('Accuracy', Math.round(effectiveAccuracy(item, place)))}${stat('Recoil', Math.round(effectiveRecoil(item)), true)}${stat('Fire rate', Math.round(item.fireRate / 10))}</aside>
    </section>
    <section class="lower-grid"><div class="panel"><h2>${icon('medal')} Achievements</h2><div class="badges">${achievements.map((entry) => `<span class="${entry.done ? 'done' : ''}">${entry.name}</span>`).join('')}</div></div><div class="panel"><h2>${icon('volume')} Range Log</h2><ul class="log">${state.log.map((entry) => `<li>${entry}</li>`).join('')}</ul></div></section>
    <footer>Fan-style simulator built with original names, visuals, and sounds; not affiliated with or copying any existing app assets.</footer>
  </main>`;
}

root.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === 'fire') fire();
  if (action === 'reload') reload();
  if (action === 'reset') resetSession();
  if (action === 'select') selectWeapon(id);
  if (action === 'range') { state.rangeId = id; addLog(`${range().name} selected.`); render(); }
  if (action === 'attachment') toggleAttachment(id);
});

render();
