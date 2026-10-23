'use strict';

const LAGRING = 'mammas-promenader-v1';

const $ = id => document.getElementById(id);
const fmt = (n, dec = 1) => n.toLocaleString('sv-SE', { minimumFractionDigits: dec, maximumFractionDigits: dec });

// Den som bjuder på belöningarna
const GIVARE = 'Linus';
// Medaljerna är en enda stege efter total sträcka. Täta i början så att
// första veckan ger flera, sen längre mellan. Städerna är en låtsasresa
// från Umeå söderut längs E4, via Stockholm och Göteborg ner till Malmö.
// Sträckorna är ungefärliga bilvägsavstånd från Umeå.
// Belöningstrappan från GIVARE: åtta steg där avståndet mellan stegen
// växer med ungefär 20 procent varje gång. Sträcka i km och belöning.
const BELONINGAR = [
  { km: 100, beloning: 'en fika på stan' },
  { km: 220, beloning: 'en lunch ute' },
  { km: 360, beloning: 'en blombukett' },
  { km: 530, beloning: 'en biokväll' },
  { km: 740, beloning: 'en utflykt, du väljer vart' },
  { km: 990, beloning: 'en middag på restaurang' },
  { km: 1290, beloning: 'en spadag' },
  { km: 1650, beloning: 'en stor överraskning' },
];

const STADER = [
  { km: 1, namn: 'Första kilometern', ikon: '👟' },
  { km: 5, namn: 'Fem kilometer', ikon: '🌱' },
  { km: 10, namn: 'En hel mil', ikon: '🥾' },
  { km: 21.1, namn: 'Halvmaraton', ikon: '🏃‍♀️' },
  { km: 30, namn: 'Framme i Hörnefors', ikon: '🌲' },
  { km: 42.2, namn: 'Maraton', ikon: '🏅' },
  { km: 55, namn: 'Framme i Nordmaling', ikon: '🦌' },
  { km: 113, namn: 'Framme i Örnsköldsvik', ikon: '⛰️' },
  { km: 225, namn: 'Framme i Härnösand', ikon: '⛪' },
  { km: 275, namn: 'Framme i Sundsvall', ikon: '🌉' },
  { km: 350, namn: 'Framme i Hudiksvall', ikon: '🌊' },
  { km: 485, namn: 'Framme i Gävle', ikon: '🐐' },
  { km: 585, namn: 'Framme i Uppsala', ikon: '🏰' },
  { km: 655, namn: 'Framme i Stockholm', ikon: '👑' },
  { km: 975, namn: 'Framme i Jönköping', ikon: '🍬' },
  { km: 1125, namn: 'Framme i Göteborg', ikon: '⚓' },
  { km: 1270, namn: 'Framme i Halmstad', ikon: '🏖️' },
  { km: 1410, namn: 'Framme i Malmö', ikon: '🏙️' },
];

const MILSTENAR = BELONINGAR.map((b, i) => ({
  ...b,
  namn: b.km / 10 + ' mil',
  ikon: i === BELONINGAR.length - 1 ? '🏆' : i === 0 ? '💯' : '⭐',
}));

const MEDALJER = [...STADER, ...MILSTENAR].sort((a, b) => a.km - b.km).map(m => ({ ...m, valor: m.km < 50 ? 'brons' : m.km < 300 ? 'silver' : m.km < 1000 ? 'guld' : 'diamant' }));

const PEPP = [
  'Varje steg tar dig närmare nästa medalj.',
  'Sätt på ett avsnitt och kliv upp på bandet!',
  'Du är starkare än du tror.',
  'Ett avsnitt till, ett varv till.',
  'Benen kommer att tacka dig.',
  'Lite i taget blir väldigt mycket till slut.',
];

// ---------- Data ----------

function laddaData() {
  try {
    const d = JSON.parse(localStorage.getItem(LAGRING));
    if (d && Array.isArray(d.promenader)) return d;
  } catch (e) { /* tom eller trasig lagring */ }
  return { namn: 'Hjördis', veckomal: 10, promenader: [] };
}

function sparaData() {
  try { localStorage.setItem(LAGRING, JSON.stringify(data)); } catch (e) { /* t.ex. privat läge */ }
}

let data = laddaData();

// ---------- Datumhjälp ----------

function dagNyckel(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function veckoStart(d) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dag = (m.getDay() + 6) % 7; // måndag = 0
  m.setDate(m.getDate() - dag);
  return m;
}

function veckoNummer(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dag = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dag);
  const arStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - arStart) / 86400000 + 1) / 7);
}

// ---------- Statistik ----------

function berakna(p = data.promenader) {
  const totalKm = p.reduce((s, x) => s + x.km, 0);
  const totalMin = p.reduce((s, x) => s + x.min, 0);
  const langst = p.reduce((m, x) => Math.max(m, x.km), 0);

  const perVecka = new Map();
  for (const x of p) {
    const k = dagNyckel(veckoStart(new Date(x.datum)));
    perVecka.set(k, (perVecka.get(k) || 0) + x.km);
  }
  const dennaVecka = perVecka.get(dagNyckel(veckoStart(new Date()))) || 0;

  return { antal: p.length, totalKm, totalMin, langst, dennaVecka, perVecka };
}

const tagna = km => MEDALJER.filter(m => km >= m.km);
const nastaMedalj = km => MEDALJER.find(m => km < m.km);

// Vilken dag varje medalj togs, räknat ur historiken. Då stämmer det
// även om en promenad tas bort i efterhand.
function medaljDatum() {
  const sorterade = [...data.promenader].sort((a, b) => a.datum.localeCompare(b.datum));
  const datum = new Map();
  let km = 0;
  for (const x of sorterade) {
    km += x.km;
    for (const m of tagna(km)) if (!datum.has(m.km)) datum.set(m.km, x.datum);
  }
  return datum;
}

function medaljBild(m, stor = false) {
  const present = m.beloning ? '<span class="present" aria-label="Belöning">🎁</span>' : '';
  return `<span class="medalj-bild ${m.valor}${stor ? ' stor' : ''}"><span>${m.ikon}</span>${present}</span>`;
}

// ---------- Visning ----------

function rita() {
  const s = berakna();

  $('halsning').textContent = 'Hej ' + data.namn + '!';
  $('dagens-pepp').textContent = s.antal === 0
    ? 'Första medaljen är bara en kilometer bort.'
    : PEPP[new Date().getDate() % PEPP.length];

  // Nästa medalj
  const nasta = nastaMedalj(s.totalKm);
  const forra = tagna(s.totalKm).pop();
  if (nasta) {
    const fran = forra ? forra.km : 0;
    const andel = (s.totalKm - fran) / (nasta.km - fran);
    $('nasta-bild').innerHTML = medaljBild(nasta);
    $('nasta-namn').textContent = nasta.namn;
    $('nasta-fylld').style.width = (andel * 100) + '%';
    $('nasta-text').textContent = `${fmt(nasta.km - s.totalKm)} km kvar`;
    const present = MEDALJER.find(m => m.beloning && s.totalKm < m.km);
    $('nasta-beloning').textContent = nasta.beloning
      ? `🎁 Då bjuder ${GIVARE} på ${nasta.beloning}!`
      : present ? `🎁 ${fmt(present.km - s.totalKm)} km kvar till nästa belöning från ${GIVARE}.` : '';
  } else {
    $('nasta-bild').innerHTML = medaljBild(MEDALJER[MEDALJER.length - 1]);
    $('nasta-namn').textContent = 'Alla medaljer är dina!';
    $('nasta-fylld').style.width = '100%';
    $('nasta-text').textContent = `${fmt(s.totalKm)} km. Helt otroligt.`;
    $('nasta-beloning').textContent = '';
  }

  // Veckoring
  const andel = Math.min(1, s.dennaVecka / data.veckomal);
  const omkrets = 2 * Math.PI * 52;
  $('ring-fylld').style.strokeDasharray = omkrets;
  $('ring-fylld').style.strokeDashoffset = omkrets * (1 - andel);
  $('vecka-km').textContent = fmt(s.dennaVecka);
  $('vecka-mal').textContent = data.veckomal;
  const kvar = data.veckomal - s.dennaVecka;
  $('vecka-text').textContent = s.dennaVecka === 0
    ? 'Ny vecka, nya steg. Första promenaden väntar.'
    : kvar <= 0
      ? 'Veckomålet är klart! Allt du går nu är bonus.'
      : `${fmt(kvar)} km kvar till veckomålet. Det fixar du.`;

  // Siffror
  $('tot-km').textContent = fmt(s.totalKm);
  $('tot-ggr').textContent = s.antal;
  $('tot-tim').textContent = fmt(s.totalMin / 60);
  $('langst').textContent = fmt(s.langst);

  ritaDiagram(s);
  ritaBeloningar(s);
  ritaMedaljer(s);
  ritaHistorik();
}

function ritaDiagram(s) {
  const veckor = [];
  const start = veckoStart(new Date());
  for (let i = 7; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - i * 7);
    veckor.push({ d, km: s.perVecka.get(dagNyckel(d)) || 0, nu: i === 0 });
  }
  const max = Math.max(data.veckomal, ...veckor.map(v => v.km));
  $('diagram').innerHTML = veckor.map(v => `
    <div class="stapel${v.nu ? ' nu' : ''}">
      <span class="stapel-varde">${v.km ? fmt(v.km) : ''}</span>
      <div class="stapel-kropp" style="height:${(v.km / max) * 100}%"></div>
      <span class="stapel-namn">${v.nu ? 'Nu' : 'v' + veckoNummer(v.d)}</span>
    </div>`).join('');
}

// Belöningsstegen visar alla steg i ordning. Upplåsta och den närmaste
// syns i klartext, de som ligger längre fram är hemliga tills det är dags.
function ritaBeloningar(s) {
  const datum = medaljDatum();
  const alla = MEDALJER.filter(m => m.beloning);
  const nasta = alla.find(m => s.totalKm < m.km);
  const upplasta = alla.filter(m => s.totalKm >= m.km);
  const forra = upplasta[upplasta.length - 1];

  $('beloningar').innerHTML = alla.map(m => {
    if (s.totalKm >= m.km) {
      return `<li class="steg upplast">
        <span class="steg-ikon">✅</span>
        <div class="steg-info">
          <span class="steg-km">Vid ${m.km} km</span>
          <strong>${forsta(m.beloning)}</strong>
          <span class="mal-kvar">Upplåst ${new Date(datum.get(m.km)).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}</span>
        </div>
      </li>`;
    }
    if (m === nasta) {
      const fran = forra ? forra.km : 0;
      const andel = Math.max(0, (s.totalKm - fran) / (m.km - fran));
      return `<li class="steg nasta-steg">
        <span class="steg-ikon">🎁</span>
        <div class="steg-info">
          <span class="steg-km">Vid ${m.km} km</span>
          <strong>${forsta(m.beloning)}</strong>
          <div class="mal-bar"><div style="width:${Math.min(100, andel * 100)}%"></div></div>
          <span class="mal-kvar">${fmt(m.km - s.totalKm)} km kvar</span>
        </div>
      </li>`;
    }
    return `<li class="steg last-steg">
      <span class="steg-ikon">🔒</span>
      <div class="steg-info">
        <span class="steg-km">Vid ${m.km} km</span>
        <strong>Hemlig belöning</strong>
      </div>
    </li>`;
  }).join('');
  $('beloningar-antal').textContent = `${upplasta.length} av ${alla.length}`;
}

const forsta = t => t.charAt(0).toUpperCase() + t.slice(1);

let senasteDatum = new Map();

function ritaMedaljer(s) {
  senasteDatum = medaljDatum();
  $('medalj-antal').textContent = `${senasteDatum.size} av ${MEDALJER.length}`;
  // Visa tagna medaljer och de tre närmaste, resten är en överraskning
  const visas = MEDALJER.filter((m, i) => i < senasteDatum.size + 3);
  const gomda = MEDALJER.length - visas.length;
  $('medaljer').innerHTML = visas.map(m => `
    <button type="button" class="medalj${senasteDatum.has(m.km) ? '' : ' last'}" data-km="${m.km}">
      ${medaljBild(m)}<span class="namn">${m.namn}</span>
    </button>`).join('');
  $('medaljer-fler').textContent = gomda ? `…och ${gomda} till längre fram.` : '';
}

$('medaljer').addEventListener('click', e => {
  const knapp = e.target.closest('[data-km]');
  if (!knapp) return;
  const m = MEDALJER.find(x => String(x.km) === knapp.dataset.km);
  const tagen = senasteDatum.get(m.km);
  const kvar = m.km - berakna().totalKm;
  $('firande-emoji').innerHTML = `<span class="${tagen ? '' : 'last'}">${medaljBild(m, true)}</span>`;
  $('firande-rubrik').textContent = m.namn;
  $('firande-text').textContent = tagen
    ? `Du tog den när du hade gått ${fmt(m.km)} km, ${new Date(tagen).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}.`
    : `Den får du när du har gått ${fmt(m.km)} km totalt.\n${fmt(kvar)} km kvar.`;
  if (m.beloning) {
    // Belöningar längre fram än den närmaste är hemliga
    const nastaPresent = MEDALJER.find(x => x.beloning && berakna().totalKm < x.km);
    const synlig = tagen || m === nastaPresent;
    $('firande-text').textContent += synlig
      ? `\n\n🎁 Belöning: ${GIVARE} bjuder på ${m.beloning}.`
      : '\n\n🎁 Här väntar en hemlig belöning.';
  }
  $('firande-stang').textContent = 'Stäng';
  $('firande').hidden = false;
});

function ritaHistorik() {
  const lista = [...data.promenader].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 10);
  if (!lista.length) {
    $('historik').innerHTML = '<li class="tomt">Inga promenader än. Första gången är alltid störst.</li>';
    return;
  }
  $('historik').innerHTML = lista.map(x => {
    const d = new Date(x.datum);
    const datum = d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
    return `<li>
      <div><strong>${fmt(x.km)} km</strong> på ${x.min} min<br><span class="datum">${datum}</span></div>
      <button class="ta-bort" data-id="${x.id}" aria-label="Ta bort">✕</button>
    </li>`;
  }).join('');
}

// ---------- Inmatning ----------

const varden = { km: 2.0, min: 30 };

function visaVarden() {
  $('km-varde').textContent = fmt(varden.km);
  $('min-varde').textContent = varden.min;
}

document.querySelectorAll('[data-steg]').forEach(knapp => {
  let timer;
  const steg = () => {
    const typ = knapp.dataset.steg;
    const ny = Math.round((varden[typ] + Number(knapp.dataset.delta)) * 10) / 10;
    varden[typ] = typ === 'km' ? Math.max(0.1, ny) : Math.max(5, ny);
    visaVarden();
  };
  knapp.addEventListener('click', steg);
  // Håll inne knappen för att stega snabbt
  knapp.addEventListener('pointerdown', () => { timer = setTimeout(function upprepa() { steg(); timer = setTimeout(upprepa, 90); }, 450); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(h => knapp.addEventListener(h, () => clearTimeout(timer)));
});

$('spara').addEventListener('click', () => {
  const fore = berakna();

  data.promenader.push({
    id: Date.now().toString(36),
    datum: new Date().toISOString(),
    km: varden.km,
    min: varden.min,
  });
  sparaData();

  const efter = berakna();
  const nya = tagna(efter.totalKm).filter(m => fore.totalKm < m.km);
  fira(fore, efter, nya);
  rita();
});

function fira(fore, efter, nya) {
  const rader = [`${fmt(varden.km)} km på ${varden.min} minuter.`];
  let emoji = '🎉';

  if (fore.antal > 0 && varden.km > fore.langst) {
    rader.push('Nytt rekord! Din längsta promenad hittills.');
    emoji = '🏆';
  }
  if (fore.dennaVecka < data.veckomal && efter.dennaVecka >= data.veckomal) {
    rader.push('Veckomålet är klart!');
    emoji = '🎯';
  }
  rader.push(`Totalt ${fmt(efter.totalKm)} km nu.`);
  const nasta = nastaMedalj(efter.totalKm);
  if (nasta) rader.push(`\n${fmt(nasta.km - efter.totalKm)} km kvar till nästa medalj.`);

  // En ny medalj tar över hela rutan, det är det roligaste som kan hända
  $('firande-emoji').innerHTML = nya.length
    ? `<div class="firande-medaljer">${nya.map(m => medaljBild(m, true)).join('')}</div>`
    : emoji;
  $('firande-rubrik').textContent = nya.length
    ? `${nya.length === 1 ? 'Ny medalj' : nya.length + ' nya medaljer'}, ${data.namn}!`
    : `Bra jobbat, ${data.namn}!`;
  const presenter = nya.filter(m => m.beloning)
    .map(m => `🎁 Du har vunnit ${m.beloning}! Skicka ett sms till ${GIVARE} och säg till.`);
  $('firande-text').textContent = [...nya.map(m => m.namn), ...presenter, ...(nya.length ? [''] : []), ...rader].join('\n');
  $('firande-stang').textContent = 'Tack!';
  visaSms(efter, nya);
  $('firande').hidden = false;
  konfetti(nya.length ? 260 : 140);
}

// Färdigt sms till GIVARE efter varje pass. Numret skrivs in under
// Inställningar på telefonen och ligger aldrig i koden.
function visaSms(efter, nya) {
  const rader = [`Hej ${GIVARE}! Jag har gått ${fmt(varden.km)} km idag. Totalt ${fmt(efter.totalKm)} km nu.`];
  for (const m of nya) rader.push(`Jag tog medaljen "${m.namn}"!`);
  for (const m of nya.filter(x => x.beloning)) rader.push(`🎁 Och jag har vunnit ${m.beloning}!`);
  const present = MEDALJER.find(m => m.beloning && efter.totalKm < m.km);
  if (present) rader.push(`${fmt(present.km - efter.totalKm)} km kvar till nästa belöning.`);
  rader.push(`/${data.namn}`);
  const nummer = (data.telefon || '').replace(/[^\d+]/g, '');
  $('firande-sms').href = `sms:${nummer}?body=${encodeURIComponent(rader.join('\n'))}`;
  $('firande-sms').textContent = `💬 Berätta för ${GIVARE}`;
  $('firande-sms').hidden = false;
}

$('firande-stang').addEventListener('click', () => {
  $('firande').hidden = true;
  $('firande-sms').hidden = true;
});
$('firande-sms').addEventListener('click', () => {
  $('firande').hidden = true;
  $('firande-sms').hidden = true;
});

$('historik').addEventListener('click', e => {
  const knapp = e.target.closest('.ta-bort');
  if (!knapp) return;
  if (!confirm('Ta bort den här promenaden?')) return;
  data.promenader = data.promenader.filter(x => x.id !== knapp.dataset.id);
  sparaData();
  rita();
});

// ---------- Inställningar ----------

$('namn').value = data.namn;
$('mal').value = data.veckomal;
$('telefon').value = data.telefon || '';
function sparaInstallningar() {
  data.namn = $('namn').value.trim() || 'Hjördis';
  data.veckomal = Math.max(1, Number($('mal').value) || 10);
  data.telefon = $('telefon').value.trim();
  sparaData();
  rita();
}

// Fälten sparas även när man lämnar dem, men knappen gör det tydligt
['namn', 'mal', 'telefon'].forEach(id => $(id).addEventListener('change', sparaInstallningar));
let sparatTimer;
$('spara-installningar').addEventListener('click', () => {
  sparaInstallningar();
  document.activeElement.blur();
  $('sparat').hidden = false;
  clearTimeout(sparatTimer);
  sparatTimer = setTimeout(() => { $('sparat').hidden = true; }, 4000);
});

$('exportera').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'promenader-' + dagNyckel(new Date()) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('importera').addEventListener('change', async e => {
  const fil = e.target.files[0];
  if (!fil) return;
  try {
    const ny = JSON.parse(await fil.text());
    if (!Array.isArray(ny.promenader)) throw new Error();
    if (!confirm(`Läsa in ${ny.promenader.length} promenader? Det som finns nu ersätts.`)) return;
    data = ny;
    sparaData();
    $('namn').value = data.namn;
    $('mal').value = data.veckomal;
    $('telefon').value = data.telefon || '';
    rita();
  } catch {
    alert('Filen gick inte att läsa.');
  }
  e.target.value = '';
});

// ---------- Konfetti ----------

function konfetti(antal = 140) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('konfetti');
  const ctx = c.getContext('2d');
  c.width = innerWidth;
  c.height = innerHeight;
  const farger = ['#2f6f4f', '#e0a526', '#d9546a', '#4a90d9', '#8bc34a'];
  const bitar = Array.from({ length: antal }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5,
    vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2,
    f: farger[Math.floor(Math.random() * farger.length)],
  }));
  const slut = performance.now() + 3500;
  (function ram(t) {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const b of bitar) {
      b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
      ctx.fillStyle = b.f; ctx.fillRect(-5, -3, 10, 6);
      ctx.restore();
    }
    if (t < slut) requestAnimationFrame(ram);
    else ctx.clearRect(0, 0, c.width, c.height);
  })(performance.now());
}

// ---------- Startskärmen ----------

// Android/Chrome låter sidan öppna installationsrutan själv. iPhone gör
// det inte, där visar knappen i stället hur man gör i Safari.
let installation = null;
const arInstallerad = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const arIphone = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

$('installera').hidden = arInstallerad();

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installation = e;
});
window.addEventListener('appinstalled', () => { $('installera').hidden = true; });

function visaInstruktion(rubrik, steg) {
  $('firande-emoji').textContent = '📲';
  $('firande-rubrik').textContent = rubrik;
  $('firande-text').innerHTML = `<ol class="steg-lista">${steg.map(x => `<li>${x}</li>`).join('')}</ol>`;
  $('firande-stang').textContent = 'Okej';
  $('firande').hidden = false;
}

$('installera-knapp').addEventListener('click', async () => {
  if (installation) {
    installation.prompt();
    const { outcome } = await installation.userChoice;
    installation = null;
    if (outcome === 'accepted') $('installera').hidden = true;
    return;
  }
  if (arIphone) {
    visaInstruktion('Så gör du på iPhone', [
      'Öppna sidan i <strong>Safari</strong>.',
      'Tryck på dela-knappen <strong>⬆️</strong> längst ner (en ruta med en pil uppåt).',
      'Scrolla ner och tryck på <strong>Lägg till på hemskärmen</strong>.',
      'Tryck på <strong>Lägg till</strong> uppe till höger.',
    ]);
  } else {
    visaInstruktion('Så gör du', [
      'Tryck på menyn <strong>⋮</strong> uppe till höger i Chrome.',
      'Tryck på <strong>Lägg till på startskärmen</strong> eller <strong>Installera app</strong>.',
      'Tryck på <strong>Lägg till</strong>.',
    ]);
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

visaVarden();
rita();
