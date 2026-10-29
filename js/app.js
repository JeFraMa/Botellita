/* =====================================================
   app.js  ->  lógica. Normalmente NO necesitas tocarlo.
   ===================================================== */
const $ = s => document.querySelector(s);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ---------- Mensajitos (toast) ---------- */
let toastTimer;
function toast(texto) {
  const t = $('#toast');
  t.textContent = texto;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 5500);
}

/* ---------- Partículas de fondo (hojas, luciérnagas, etc.) ---------- */
const bg = $('#fx-bg'), g = bg.getContext('2d');
let particulas = [];
let W = innerWidth, H = innerHeight;
function ajustarCanvas() {                       // nítido en pantallas retina (iPhone/iPad)
  const d = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  for (const c of [bg, $('#fx-confetti')]) { c.width = W * d; c.height = H * d; c.getContext('2d').setTransform(d, 0, 0, d, 0, 0); }
}
addEventListener('resize', ajustarCanvas);
ajustarCanvas();

function nueva(lista, inicial) {
  return { x: Math.random() * W, y: inicial ? Math.random() * H : -30,
           s: 14 + Math.random() * 16, v: .25 + Math.random() * .6,
           w: Math.random() * 6, a: Math.random() * 6, ch: pick(lista) };
}
function setParticulas(lista) {
  particulas = reduce ? [] : Array.from({ length: 26 }, () => nueva(lista, true));
  particulas.lista = lista;
}
function animarFondo() {
  g.clearRect(0, 0, W, H);
  g.globalAlpha = .5;
  for (const p of particulas) {
    p.y += p.v; p.w += .01; p.a += .006; p.x += Math.sin(p.w) * .6;
    if (p.y > H + 30) Object.assign(p, nueva(particulas.lista, false));
    g.save();
    g.translate(p.x, p.y);
    g.rotate(Math.sin(p.a) * .8);
    g.font = p.s + 'px serif';
    g.fillText(p.ch, 0, 0);
    g.restore();
  }
  requestAnimationFrame(animarFondo);
}

/* ---------- Confeti ---------- */
const cf = $('#fx-confetti'), h = cf.getContext('2d');
let piezas = [], confetiActivo = false;
function confeti(x, y, colores, n = 90) {
  if (reduce) return;
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * 6.28, vel = 4 + Math.random() * 9;
    piezas.push({ x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 6,
                  r: Math.random() * 6, vr: Math.random() * .3 - .15,
                  w: 6 + Math.random() * 6, c: pick(colores), vida: 90 + Math.random() * 60 });
  }
  if (!confetiActivo) { confetiActivo = true; tickConfeti(); }
}
function tickConfeti() {
  h.clearRect(0, 0, W, H);
  piezas = piezas.filter(p => p.vida-- > 0);
  for (const p of piezas) {
    p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
    h.save();
    h.translate(p.x, p.y); h.rotate(p.r);
    h.globalAlpha = Math.min(1, p.vida / 30);
    h.fillStyle = p.c;
    h.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2);
    h.restore();
  }
  if (piezas.length) requestAnimationFrame(tickConfeti); else confetiActivo = false;
}

/* ---------- Frasco (se dibuja por JS en las dos vistas) ---------- */
function armarFrasco(el) {
  el.innerHTML = '<div class="lid" title="¿Qué habrá aquí?"></div><div class="glass"><div class="notes"></div></div>';
  const notas = el.querySelector('.notes');
  for (let i = 0; i < 16; i++) {
    const n = document.createElement('i');
    n.className = 'note';
    n.style.cssText = `--nc:${EMOCIONES[i % EMOCIONES.length].color};--x:${Math.random() * 70}%;` +
                      `--y:${(i % 5) * 17 + Math.random() * 6}%;--r:${Math.random() * 80 - 40}deg`;
    notas.append(n);
  }
  // Easter egg: 5 toques en la tapa
  let toques = 0;
  el.querySelector('.lid').addEventListener('click', e => {
    sacudir(el);
    if (++toques === 5) {
      toques = 0;
      toast(pick(HUEVOS));
      confeti(e.clientX, e.clientY, ['#f2c35b', '#ffffff', '#8fd18a', '#f59bb8'], 70);
    }
  });
}
function sacudir(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

/* ---------- Transición circular entre vistas ---------- */
let enTransicion = false;
function transicion(color, x, y, cambio) {
  if (enTransicion) return;                      // evita toques dobles mientras anima
  enTransicion = true;
  const c = $('#curtain');
  c.getAnimations().forEach(an => an.cancel());  // limpia la animación anterior (si no, la cortina salía invisible)
  c.style.background = color;
  c.style.display = 'block';
  const dur = reduce ? 1 : 650;
  c.animate([{ clipPath: `circle(0 at ${x}px ${y}px)` }, { clipPath: `circle(150% at ${x}px ${y}px)` }],
            { duration: dur, easing: 'ease-in', fill: 'forwards' }).finished.then(() => {
    cambio();
    window.scrollTo(0, 0);
    c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce ? 1 : 600, fill: 'forwards' })
      .finished.then(() => { c.style.display = 'none'; c.getAnimations().forEach(an => an.cancel()); enTransicion = false; });
  });
}
function aplicarTema(t) {
  root.style.setProperty('--bg1', t.bg1);
  root.style.setProperty('--bg2', t.bg2);
  root.style.setProperty('--c', t.color);
  setParticulas(t.particulas);
}
function mostrar(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id));
}

/* ---------- Entrar a una emoción / volver ---------- */
let actual = null, mazo = [];
function entrar(em, x, y) {
  transicion(em.color, x, y, () => {
    actual = em; mazo = [];
    aplicarTema({ bg1: em.bg1, bg2: em.bg2, color: em.color, particulas: em.particulas });
    $('#room-title').textContent = em.emoji + ' ' + em.nombre;
    $('#room-intro').textContent = em.intro;
    $('#paper').hidden = true;
    mostrar('room');
  });
}
function volver(e) {
  transicion('#0f2a26', e.clientX, e.clientY, () => {
    actual = null;
    aplicarTema(TEMA_HOME);
    mostrar('home');
  });
}

/* ---------- Papelito al azar ---------- */
function sacar(e) {
  if (!mazo.length) mazo = shuffle([...CONTENIDO[actual.id]]);   // sin repetir hasta agotar
  const it = mazo.pop();
  sacudir($('#jar-room'));
  const p = $('#paper');
  p.hidden = false;
  p.classList.remove('out');
  p.style.setProperty('--pr', (Math.random() * 4 - 2).toFixed(1) + 'deg');
  p.innerHTML = htmlPapelito(it);
  void p.offsetWidth;
  p.classList.add('out');
  const r = $('#jar-room').getBoundingClientRect();
  confeti(r.left + r.width / 2, r.top, [actual.color, '#ffffff', '#f2c35b'], 80);
  conectar(it, p);
}
function htmlPapelito(it) {
  if (it.tipo === 'frase')  return `<p class="kind">${it.fuente ? 'De nuestras pelis · ' + it.fuente : 'Un papelito para ti 💌'}</p><p class="txt">${it.texto}</p>`;
  if (it.tipo === 'animal') return `<p class="kind">🐾 Dato de animalitos</p><p class="txt">${it.texto}</p>`;
  if (it.tipo === 'pide')   return `<p class="kind">Pídeme…</p><p class="txt">${it.texto}</p><button class="done">Pedido enviado ✓</button>`;
  return `<p class="kind">Adivina la película</p><p class="big">${it.q}</p>
          <div class="opts">${it.opciones.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div>`;
}
function conectar(it, p) {
  if (it.tipo === 'pide') {
    p.querySelector('.done').onclick = ev => {
      ev.target.textContent = '¡Qué rico! 💚'; ev.target.disabled = true;
      confeti(ev.clientX, ev.clientY, ['#f59bb8', '#ffffff', actual.color], 50);
    };
  }
  if (it.tipo === 'juego') {
    p.querySelectorAll('.opt').forEach(b => b.onclick = ev => {
      const ok = +b.dataset.i === it.correcta;
      p.querySelectorAll('.opt').forEach(x => { x.disabled = true; });
      b.classList.add(ok ? 'ok' : 'no');
      p.querySelector(`[data-i="${it.correcta}"]`).classList.add('ok');
      p.insertAdjacentHTML('beforeend', `<p class="extra">${ok ? '¡Sí! ' : 'Era ' + it.opciones[it.correcta] + '. '}${it.extra}</p>`);
      if (ok) confeti(ev.clientX, ev.clientY, [actual.color, '#ffffff', '#f2c35b'], 90);
    });
  }
}

/* ---------- Música: UNA lista aleatoria que suena siempre (en todas las pantallas) ---------- */
const audio = new Audio();
audio.preload = 'auto';
let orden = [], pos = -1, fallos = 0, pausaManual = false;
function barajar(arr) { return shuffle(arr); }
function siguiente() {
  if (!PLAYLIST.length) return;
  if (++pos >= orden.length) {                   // fin de la ronda: mezcla de nuevo sin repetir la última
    const ultima = orden[orden.length - 1];
    orden = barajar([...PLAYLIST]);
    if (orden.length > 1 && orden[0] === ultima) orden.push(orden.shift());
    pos = 0;
  }
  const m = orden[pos];
  audio.src = m.archivo;
  $('#pl-name').textContent = m.titulo;
  if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: m.titulo, artist: 'Mi botellita de emociones' });
  if (!pausaManual) audio.play().catch(() => {});
}
function sincronizarBoton() { $('#pl-btn').textContent = audio.paused ? '▶' : '⏸'; }
audio.addEventListener('play', () => { fallos = 0; sincronizarBoton(); });
audio.addEventListener('pause', sincronizarBoton);
audio.addEventListener('ended', siguiente);
audio.addEventListener('error', () => {          // archivo que no existe: salta a la siguiente
  if (++fallos <= 3) setTimeout(siguiente, 400);   // si fallan 3 seguidas, algo está mal con la ruta: avisa y se detiene
  else $('#pl-name').textContent = 'No encuentro los audios: deben estar en audio/Home/';
});
$('#pl-btn').onclick = () => {
  if (audio.paused) { pausaManual = false; audio.play().catch(() => {}); } else { pausaManual = true; audio.pause(); }
};
$('#pl-next').onclick = () => { pausaManual = false; siguiente(); };
$('#pl-vol').oninput = e => { audio.volume = +e.target.value; };
audio.volume = .5;
if (audio.volume !== .5) $('#pl-vol').hidden = true;   // iPhone/iPad no permiten cambiar el volumen por código
if ('mediaSession' in navigator) {                      // controles en la pantalla de bloqueo
  navigator.mediaSession.setActionHandler('play', () => { pausaManual = false; audio.play(); });
  navigator.mediaSession.setActionHandler('pause', () => { pausaManual = true; audio.pause(); });
  navigator.mediaSession.setActionHandler('nexttrack', () => { pausaManual = false; siguiente(); });
}
// El navegador (sobre todo en iPhone) bloquea el audio hasta el primer toque: al primer gesto, arranca
const GESTOS = ['pointerup', 'touchend', 'keydown'];
function desbloquear(e) {
  if (e.target.closest && e.target.closest('#player')) return;
  if (audio.paused && !pausaManual && audio.src) audio.play().catch(() => {});
  GESTOS.forEach(t => removeEventListener(t, desbloquear));
}
GESTOS.forEach(t => addEventListener(t, desbloquear));

/* ---------- Inicio ---------- */
armarFrasco($('#jar-home'));
armarFrasco($('#jar-room'));
EMOCIONES.forEach((em, i) => {
  const ang = -Math.PI / 2 + i * 2 * Math.PI / EMOCIONES.length;   // reparte en círculo
  const b = document.createElement('button');
  b.className = 'tag';
  b.style.cssText = `--cx:${Math.cos(ang).toFixed(3)};--cy:${Math.sin(ang).toFixed(3)};` +
                    `--tc:${em.color};--d:${(-i * .8).toFixed(1)}s;--tr:${i % 2 ? 3 : -3}deg`;
  b.innerHTML = `<span>${em.emoji} ${em.nombre}</span>`;
  b.onclick = e => entrar(em, e.clientX, e.clientY);
  $('#tags').append(b);
});
$('#back').onclick = volver;
$('#draw').onclick = sacar;
$('#bug').onclick = e => {
  toast(ESCARABAJO);
  confeti(e.clientX, e.clientY, ['#8fd18a', '#f2c35b'], 40);
};

aplicarTema(TEMA_HOME);
siguiente();
animarFondo();

/* ---------- Más sorpresas escondidas (los mensajes están en data.js → SORPRESAS) ---------- */
function lluvia(emojis, n = 24) {                // llovizna de emojis que cae por toda la pantalla
  if (reduce) return;
  for (let i = 0; i < n; i++) {
    const d = document.createElement('span');
    d.className = 'drop';
    d.textContent = pick(emojis);
    d.style.cssText = `left:${Math.random() * 100}vw;--t:${3 + Math.random() * 2.5}s;--s:${1.2 + Math.random() * 1.4}rem;--g:${Math.random() * 400 - 200}deg;animation-delay:${Math.random() * 1.2}s`;
    document.body.append(d);
    d.addEventListener('animationend', () => d.remove());
  }
}
const CORAZONES = ['💚', '💗', '💛', '🤍', '💖'];

// 1) Tocar 7 veces seguidas el título
let tt = 0, ttT;
$('h1').addEventListener('click', () => {
  clearTimeout(ttT); ttT = setTimeout(() => { tt = 0; }, 1500);
  if (++tt >= 7) { tt = 0; lluvia(CORAZONES, 30); toast(pick(SORPRESAS.titulo)); }
});

// 2) Mantener presionado el frasco (sin soltar)
const jh = $('#jar-home');
let lp;
jh.addEventListener('pointerdown', () => {
  lp = setTimeout(() => {
    jh.classList.add('glow'); setTimeout(() => jh.classList.remove('glow'), 4500);
    lluvia(['✨', '🌟', '🫧'], 18); toast(SORPRESAS.frasco);
    if (navigator.vibrate) navigator.vibrate(30);
  }, 1300);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(t => jh.addEventListener(t, () => clearTimeout(lp)));

// 3) Un bichito que cruza volando la pantalla de vez en cuando: ¡hay que atraparlo!
function visitante() {
  if (!reduce && !document.hidden) {
    const v = document.createElement('button');
    v.className = 'fly';
    v.textContent = pick(['🦋', '🐝', '🐞', '🐛']);
    v.setAttribute('aria-label', 'Un visitante');
    v.style.cssText = `top:${15 + Math.random() * 55}vh;--t:${10 + Math.random() * 4}s`;
    v.onclick = e => { toast(pick(SORPRESAS.visitante)); confeti(e.clientX, e.clientY, ['#f59bb8', '#f2c35b', '#ffffff'], 45); v.remove(); };
    v.addEventListener('animationend', () => v.remove());
    document.body.append(v);
  }
  setTimeout(visitante, 30000 + Math.random() * 40000);
}
setTimeout(visitante, 18000);

// 4) Saludo según la hora (una vez por visita)
setTimeout(() => {
  try { if (sessionStorage.getItem('saludo')) return; sessionStorage.setItem('saludo', '1'); } catch (e) {}
  const hr = new Date().getHours();
  toast(hr < 5 ? SORPRESAS.madrugada : hr < 12 ? SORPRESAS.manana : hr < 19 ? SORPRESAS.tarde : SORPRESAS.noche);
}, 2500);

// 5) En el teclado (PC): escribir "teamo"
let tecla = '';
addEventListener('keydown', e => {
  if (e.key.length !== 1 || e.target.matches('input,textarea,select')) return;
  tecla = (tecla + e.key.toLowerCase()).slice(-5);
  if (tecla === 'teamo') { tecla = ''; lluvia(CORAZONES, 36); toast(SORPRESAS.teamo); }
});
