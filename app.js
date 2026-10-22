'use strict';

const LAGRING = 'mammas-promenader-v1';

const $ = id => document.getElementById(id);
const fmt = (n, dec = 1) => n.toLocaleString('sv-SE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtTal = n => n.toLocaleString('sv-SE', { maximumFractionDigits: 1 });

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

// Varje kategori är en trappa av mål. De första stegen är lätta så att
// medaljerna kommer tätt i början, sen glesnar de ut.
const KATEGORIER = [
  { id: 'km', rubrik: 'Sträcka', ikon: '👣', varde: s => s.totalKm,
    steg: [1, 5, 10, 21.1, 42.2, 70, 100, 200, 300, 500, 1000],
    namn: m => ({ 10: 'Första milen', 21.1: 'Halvmaraton', 42.2: 'Maraton' }[m] || fmtTal(m) + ' km'),
    text: m => `Gå ${fmtTal(m)} km totalt`, kvar: k => fmt(k) + ' km' },
  { id: 'antal', rubrik: 'Promenader', ikon: '👟', varde: s => s.antal,
    steg: [1, 5, 10, 25, 50, 75, 100, 150, 200, 365],
    namn: m => m === 1 ? 'Första promenaden' : m + ' promenader',
    text: m => m === 1 ? 'Gå din första promenad' : `Gå ${m} promenader`,
    kvar: k => Math.ceil(k) + (Math.ceil(k) === 1 ? ' promenad' : ' promenader') },
  { id: 'tid', rubrik: 'Tid', ikon: '⏱️', varde: s => s.totalMin / 60,
    steg: [1, 5, 10, 25, 50, 100, 200],
    namn: m => m === 1 ? 'Första timmen' : m + ' timmar',
    text: m => `Gå ${m} ${m === 1 ? 'timme' : 'timmar'} totalt`, kvar: k => Math.ceil(k * 60) + ' min' },
  { id: 'langst', rubrik: 'Långpass', ikon: '🌟', varde: s => s.langst,
    steg: [2, 3, 4, 5, 6, 8, 10],
    namn: m => m + ' km på en gång', text: m => `Gå ${m} km i ett och samma pass`,
    kvar: k => fmt(k) + ' km längre' },
  { id: 'svit', rubrik: 'Dagar i rad', ikon: '🔥', varde: s => s.langstaSvit,
    steg: [2, 3, 5, 7, 14, 21, 30],
    namn: m => m + ' dagar i rad', text: m => `Gå ${m} dagar i rad`,
    kvar: k => Math.ceil(k) + (Math.ceil(k) === 1 ? ' dag till' : ' dagar till'), nu: s => s.nuvarandeSvit },
  { id: 'veckor', rubrik: 'Veckomål', ikon: '🎯', varde: s => s.veckorMedMal,
    steg: [1, 4, 8, 12, 26, 52],
    namn: m => m === 1 ? 'Första veckomålet' : m + ' veckomål',
    text: m => m === 1 ? 'Klara veckomålet en vecka' : `Klara veckomålet ${m} veckor`,
    kvar: k => Math.ceil(k) + (Math.ceil(k) === 1 ? ' vecka till' : ' veckor till') },
  { id: 'veckosvit', rubrik: 'Veckor i rad', ikon: '📅', varde: s => s.langstaVeckoSvit,
    steg: [2, 4, 8, 13, 26],
    namn: m => m + ' veckor i rad', text: m => `Klara veckomålet ${m} veckor i rad`,
    kvar: k => Math.ceil(k) + (Math.ceil(k) === 1 ? ' vecka till' : ' veckor till'), nu: s => s.nuvarandeVeckoSvit },
];

const VALORER = ['brons', 'silver', 'guld', 'diamant'];

function valorFor(i, antal) {
  if (i === antal - 1 && antal >= 5) return 'diamant';
  return VALORER[Math.min(2, Math.floor((i / antal) * 3))];
}

const MEDALJER = [
  ...KATEGORIER.flatMap(k => k.steg.map((m, i) => ({
    id: k.id + '-' + m, kategori: k.id, ikon: k.ikon, mal: m, valor: valorFor(i, k.steg.length),
    namn: k.namn(m), text: k.text(m), varde: k.varde, kvar: k.kvar,
  }))),
  // En medalj för varje stad längs resan
  ...RUTT.slice(1).map((stad, i, alla) => ({
    id: 'stad-' + stad.namn, kategori: 'resa', ikon: '📍', mal: stad.km,
    valor: i === alla.length - 1 ? 'diamant' : valorFor(i, alla.length - 1),
    namn: 'Framme i ' + stad.namn, text: `Gå hela vägen till ${stad.namn} (${stad.km} km)`,
    varde: s => s.totalKm, kvar: k => fmt(k) + ' km',
  })),
];

const KATEGORI_NAMN = Object.fromEntries([...KATEGORIER.map(k => [k.id, k.rubrik]), ['resa', 'Resan']]);

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
  const basstaVecka = Math.max(0, ...perVecka.values());

  // Veckor där veckomålet nåddes, och längsta följden av sådana veckor
  const malVeckor = [...perVecka].filter(([, km]) => km >= data.veckomal).map(([k]) => k).sort();
  let langstaVeckoSvit = 0, veckoSvit = 0, forraVecka = null;
  for (const k of malVeckor) {
    const v = new Date(k);
    veckoSvit = forraVecka && Math.round((v - forraVecka) / 86400000) === 7 ? veckoSvit + 1 : 1;
    langstaVeckoSvit = Math.max(langstaVeckoSvit, veckoSvit);
    forraVecka = v;
  }
  // Pågående veckosvit: räknas om förra eller denna vecka nådde målet
  const sistaMal = malVeckor.length ? new Date(malVeckor[malVeckor.length - 1]) : null;
  const dennaMandag = new Date(dagNyckel(veckoStart(new Date())));
  const nuvarandeVeckoSvit = sistaMal && Math.round((dennaMandag - sistaMal) / 86400000) <= 7 ? veckoSvit : 0;

  const dagar = [...new Set(p.map(x => dagNyckel(new Date(x.datum))))].sort();
  let langstaSvit = 0, svit = 0, forra = null;
  for (const d of dagar) {
    const idag = new Date(d);
    svit = forra && Math.round((idag - forra) / 86400000) === 1 ? svit + 1 : 1;
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
           langstaSvit, nuvarandeSvit, veckorMedMal: malVeckor.length, langstaVeckoSvit, nuvarandeVeckoSvit };
}

function resePosition(km) {
  for (let i = 0; i < RUTT.length - 1; i++) {
    if (km < RUTT[i + 1].km) return { fran: RUTT[i], till: RUTT[i + 1], klar: false };
  }
  return { fran: RUTT[RUTT.length - 2], till: RUTT[RUTT.length - 1], klar: true };
}

// ---------- Visning ----------

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
  ritaNastaMal(s);
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

const VALOR_NAMN = { brons: 'brons', silver: 'silver', guld: 'guld', diamant: 'diamant' };

function medaljBild(m, stor = false) {
  return `<span class="medalj-bild ${m.valor}${stor ? ' stor' : ''}"><span>${m.ikon}</span></span>`;
}

// Spelar upp alla promenader i tur och ordning för att se vilken dag
// varje medalj togs. Då stämmer datumen även om en promenad tas bort.
function medaljDatum() {
  const sorterade = [...data.promenader].sort((a, b) => a.datum.localeCompare(b.datum));
  const datum = new Map();
  for (let i = 0; i < sorterade.length; i++) {
    const s = berakna(sorterade.slice(0, i + 1));
    for (const m of MEDALJER) {
      if (!datum.has(m.id) && m.varde(s) >= m.mal) datum.set(m.id, sorterade[i].datum);
    }
  }
  return datum;
}

// Det första ej tagna målet i varje kategori, närmast först
function nastaMal(s) {
  const kandidater = [];
  for (const kat of Object.keys(KATEGORI_NAMN)) {
    const m = MEDALJER.find(x => x.kategori === kat && x.varde(s) < x.mal);
    if (!m) continue;
    const nu = m.nu ? m.nu(s) : m.varde(s);
    kandidater.push({ ...m, andel: Math.max(0, nu / m.mal), kvarText: m.kvar(m.mal - nu) });
  }
  return kandidater.sort((a, b) => b.andel - a.andel);
}

function ritaNastaMal(s) {
  $('nasta-mal').innerHTML = nastaMal(s).slice(0, 3).map(m => `
    <li>
      ${medaljBild(m)}
      <div class="mal-info">
        <strong>${m.namn}</strong>
        <div class="mal-bar"><div style="width:${Math.min(100, m.andel * 100)}%"></div></div>
        <span class="mal-kvar">${m.kvarText} kvar</span>
      </div>
    </li>`).join('');
}

let senasteDatum = new Map();

function ritaMedaljer(s) {
  senasteDatum = medaljDatum();
  $('medalj-antal').textContent = `${senasteDatum.size} av ${MEDALJER.length}`;
  $('medaljer').innerHTML = Object.entries(KATEGORI_NAMN).map(([kat, rubrik]) => {
    const lista = MEDALJER.filter(m => m.kategori === kat);
    const tagna = lista.filter(m => senasteDatum.has(m.id)).length;
    return `<h3>${rubrik} <span>${tagna}/${lista.length}</span></h3>
      <div class="medalj-rad">${lista.filter((m, i) => i < tagna + 2).map(m => `
        <button type="button" class="medalj${senasteDatum.has(m.id) ? '' : ' last'}" data-medalj="${m.id}">
          ${medaljBild(m)}<span class="namn">${m.namn}</span>
        </button>`).join('')}
      </div>${lista.length > tagna + 2 ? `<p class="fler">…och ${lista.length - tagna - 2} till att låsa upp</p>` : ''}`;
  }).join('');
}

$('medaljer').addEventListener('click', e => {
  const knapp = e.target.closest('[data-medalj]');
  if (!knapp) return;
  const m = MEDALJER.find(x => x.id === knapp.dataset.medalj);
  const s = berakna();
  const tagen = senasteDatum.get(m.id);
  $('firande-emoji').innerHTML = `<span class="${tagen ? '' : 'last'}">${medaljBild(m, true)}</span>`;
  $('firande-rubrik').textContent = m.namn;
  $('firande-stang').textContent = 'Stäng';
  const nu = m.nu ? m.nu(s) : m.varde(s);
  $('firande-text').textContent = tagen
    ? `${m.text}.\n\nDu tog den här medaljen i ${VALOR_NAMN[m.valor]} ${new Date(tagen).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}.`
    : `${m.text}.\n\n${m.kvar(m.mal - nu)} kvar. Det här är en medalj i ${VALOR_NAMN[m.valor]}.`;
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
  const foreDatum = medaljDatum();

  data.promenader.push({
    id: Date.now().toString(36),
    datum: new Date().toISOString(),
    km: varden.km,
    min: varden.min,
  });
  sparaData();

  const efter = berakna();
  const nyaMedaljer = MEDALJER.filter(m => m.varde(efter) >= m.mal && !foreDatum.has(m.id));

  fira(fore, efter, nyaMedaljer);
  rita();
});

function fira(fore, efter, nyaMedaljer) {
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
  if (efter.nuvarandeSvit >= 2) rader.push(`${efter.nuvarandeSvit} dagar i rad.`);
  rader.push(`Totalt ${fmt(efter.totalKm)} km nu.`);

  const nasta = nastaMal(efter)[0];
  if (nasta) rader.push(`\nNästa medalj: ${nasta.namn}. ${nasta.kvarText} kvar.`);

  // Nya medaljer tar över hela rutan, de är det roligaste som kan hända
  const visas = nyaMedaljer.slice(0, 3);
  $('firande-emoji').innerHTML = visas.length
    ? `<div class="firande-medaljer">${visas.map(m => medaljBild(m, true)).join('')}</div>`
    : emoji;
  $('firande-rubrik').textContent = nyaMedaljer.length === 1
    ? `Ny medalj, ${data.namn}!`
    : nyaMedaljer.length > 1
      ? `${nyaMedaljer.length} nya medaljer, ${data.namn}!`
      : `Bra jobbat, ${data.namn}!`;
  const medaljRader = nyaMedaljer.map(m => `${m.namn} (${VALOR_NAMN[m.valor]})`);
  $('firande-text').textContent = [...medaljRader, ...(medaljRader.length ? [''] : []), ...rader].join('\n');
  $('firande-stang').textContent = 'Tack!';
  $('firande').hidden = false;
  konfetti(nyaMedaljer.length ? 260 : 140);
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
$('namn').addEventListener('change', e => { data.namn = e.target.value.trim() || 'Hjördis'; sparaData(); rita(); });
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

visaVarden();
rita();
