'use strict';

const LAGRING = 'mammas-promenader-v1';

// Resan räknas i km från start. Byt gärna ut mot en rutt som passar mamma.
const RUTT = [
  { namn: 'Stockholm', km: 0 },
  { namn: 'Sollentuna', km: 15 },
  { namn: 'Arlanda', km: 40 },
  { namn: 'Uppsala', km: 70 },
  { namn: 'Gävle', km: 180 },
  { namn: 'Hudiksvall', km: 300 },
  { namn: 'Sundsvall', km: 395 },
  { namn: 'Örnsköldsvik', km: 510 },
  { namn: 'Umeå', km: 640 },
  { namn: 'Skellefteå', km: 775 },
  { namn: 'Luleå', km: 900 },
  { namn: 'Kiruna', km: 1250 },
];

const MEDALJER = [
  { ikon: '👟', namn: 'Första promenaden', klar: s => s.antal >= 1 },
  { ikon: '🥉', namn: 'Första milen', klar: s => s.totalKm >= 10 },
  { ikon: '🏃‍♀️', namn: 'Halvmaraton', klar: s => s.totalKm >= 21.1 },
  { ikon: '🏅', namn: 'Maraton', klar: s => s.totalKm >= 42.2 },
  { ikon: '💯', namn: '100 km', klar: s => s.totalKm >= 100 },
  { ikon: '🎯', namn: 'Veckomålet klart', klar: s => s.basstaVecka >= s.mal },
  { ikon: '🔥', namn: '3 dagar i rad', klar: s => s.langstaSvit >= 3 },
  { ikon: '⭐', namn: '7 dagar i rad', klar: s => s.langstaSvit >= 7 },
  { ikon: '🔟', namn: '10 promenader', klar: s => s.antal >= 10 },
  { ikon: '🏆', namn: '50 promenader', klar: s => s.antal >= 50 },
  { ikon: '⏱️', namn: '10 timmar', klar: s => s.totalMin >= 600 },
  { ikon: '🌟', namn: '5 km på en gång', klar: s => s.langst >= 5 },
];

const PEPP = [
  'Varje steg räknas.',
  'Dags för en avsnittspromenad?',
  'Benen tackar dig i morgon.',
  'Ett avsnitt till, ett varv till.',
  'Du är på god väg.',
  'Lite i taget blir mycket till slut.',
];

// ---------- Data ----------

function laddaData() {
  try {
    const d = JSON.parse(localStorage.getItem(LAGRING));
    if (d && Array.isArray(d.promenader)) return d;
  } catch (e) { /* tom eller trasig lagring */ }
  return { namn: 'Mamma', veckomal: 10, promenader: [] };
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

function berakna() {
  const p = data.promenader;
  const totalKm = p.reduce((s, x) => s + x.km, 0);
  const totalMin = p.reduce((s, x) => s + x.min, 0);
  const langst = p.reduce((m, x) => Math.max(m, x.km), 0);

  const perVecka = new Map();
  for (const x of p) {
    const k = dagNyckel(veckoStart(new Date(x.datum)));
    perVecka.set(k, (perVecka.get(k) || 0) + x.km);
  }
  const dennaVecka = perVecka.get(dagNyckel(veckoStart(new Date()))) || 0;
  const basstaVecka = Math.max(0, ...perVecka.values());

  const dagar = [...new Set(p.map(x => dagNyckel(new Date(x.datum))))].sort();
  let langstaSvit = 0, svit = 0, forra = null;
  for (const d of dagar) {
    const idag = new Date(d);
    svit = forra && (idag - forra) / 86400000 === 1 ? svit + 1 : 1;
    langstaSvit = Math.max(langstaSvit, svit);
    forra = idag;
  }
  // Pågående svit: räknas om senaste dagen är idag eller igår
  let nuvarandeSvit = 0;
  if (dagar.length) {
    const sista = new Date(dagar[dagar.length - 1]);
    const idag = new Date(dagNyckel(new Date()));
    if ((idag - sista) / 86400000 <= 1) nuvarandeSvit = svit;
  }

  return { antal: p.length, totalKm, totalMin, langst, dennaVecka, basstaVecka, perVecka,
           langstaSvit, nuvarandeSvit, mal: data.veckomal };
}

function resePosition(km) {
  for (let i = 0; i < RUTT.length - 1; i++) {
    if (km < RUTT[i + 1].km) return { fran: RUTT[i], till: RUTT[i + 1], klar: false };
  }
  return { fran: RUTT[RUTT.length - 2], till: RUTT[RUTT.length - 1], klar: true };
}

// ---------- Visning ----------

const $ = id => document.getElementById(id);
const fmt = (n, dec = 1) => n.toLocaleString('sv-SE', { minimumFractionDigits: dec, maximumFractionDigits: dec });

function rita() {
  const s = berakna();

  $('halsning').textContent = 'Hej ' + data.namn + '!';
  $('dagens-pepp').textContent = s.nuvarandeSvit >= 2
    ? `Du har gått ${s.nuvarandeSvit} dagar i rad. Snyggt!`
    : PEPP[new Date().getDate() % PEPP.length];

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

  // Resan
  const r = resePosition(s.totalKm);
  const del = r.klar ? 1 : (s.totalKm - r.fran.km) / (r.till.km - r.fran.km);
  $('resa-fylld').style.width = (del * 100) + '%';
  $('resa-figur').style.left = (del * 100) + '%';
  $('resa-fran').textContent = r.fran.namn;
  $('resa-till').textContent = r.till.namn;
  $('resa-text').textContent = r.klar
    ? `Du har gått hela vägen till ${r.till.namn}! ${fmt(s.totalKm)} km. Helt otroligt.`
    : s.totalKm === 0
      ? `Resan börjar i ${RUTT[0].namn}. Nästa stopp: ${r.till.namn}.`
      : `Du har lämnat ${r.fran.namn} och har ${fmt(r.till.km - s.totalKm)} km kvar till ${r.till.namn}.`;

  // Siffror
  $('tot-km').textContent = fmt(s.totalKm);
  $('tot-ggr').textContent = s.antal;
  $('tot-tim').textContent = fmt(s.totalMin / 60);
  $('langst').textContent = fmt(s.langst);

  ritaDiagram(s);
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

function ritaMedaljer(s) {
  $('medaljer').innerHTML = MEDALJER.map(m => `
    <div class="medalj${m.klar(s) ? '' : ' last'}">
      <span class="ikon">${m.ikon}</span><span class="namn">${m.namn}</span>
    </div>`).join('');
}

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
  const foreMedaljer = MEDALJER.filter(m => m.klar(fore)).map(m => m.namn);
  const foreResa = resePosition(fore.totalKm);

  data.promenader.push({
    id: Date.now().toString(36),
    datum: new Date().toISOString(),
    km: varden.km,
    min: varden.min,
  });
  sparaData();

  const efter = berakna();
  const nyaMedaljer = MEDALJER.filter(m => m.klar(efter) && !foreMedaljer.includes(m.namn));
  const efterResa = resePosition(efter.totalKm);

  fira(fore, efter, nyaMedaljer, foreResa, efterResa);
  rita();
});

function fira(fore, efter, nyaMedaljer, foreResa, efterResa) {
  const rader = [`${fmt(varden.km)} km på ${varden.min} minuter.`];
  let emoji = '🎉';
  let rubrik = 'Bra jobbat, ' + data.namn + '!';

  if (efterResa.fran.km > foreResa.fran.km) {
    rader.push(`Du har nått ${efterResa.fran.namn}! 📍`);
    emoji = '🗺️';
  }
  if (fore.antal > 0 && varden.km > fore.langst) {
    rader.push('Nytt rekord! Din längsta promenad hittills.');
    emoji = '🏆';
  }
  if (fore.dennaVecka < data.veckomal && efter.dennaVecka >= data.veckomal) {
    rader.push('Veckomålet är klart!');
    emoji = '🎯';
  }
  if (efter.nuvarandeSvit >= 2) rader.push(`${efter.nuvarandeSvit} dagar i rad.`);
  for (const m of nyaMedaljer) rader.push(`Ny medalj: ${m.ikon} ${m.namn}`);
  rader.push(`Totalt ${fmt(efter.totalKm)} km nu.`);

  $('firande-emoji').textContent = emoji;
  $('firande-rubrik').textContent = rubrik;
  $('firande-text').textContent = rader.join('\n');
  $('firande').hidden = false;
  konfetti();
}

$('firande-stang').addEventListener('click', () => { $('firande').hidden = true; });

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
$('namn').addEventListener('change', e => { data.namn = e.target.value.trim() || 'Mamma'; sparaData(); rita(); });
$('mal').addEventListener('change', e => { data.veckomal = Math.max(1, Number(e.target.value) || 10); sparaData(); rita(); });

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
    rita();
  } catch {
    alert('Filen gick inte att läsa.');
  }
  e.target.value = '';
});

// ---------- Konfetti ----------

function konfetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('konfetti');
  const ctx = c.getContext('2d');
  c.width = innerWidth;
  c.height = innerHeight;
  const farger = ['#2f6f4f', '#e0a526', '#d9546a', '#4a90d9', '#8bc34a'];
  const bitar = Array.from({ length: 140 }, () => ({
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

visaVarden();
rita();
