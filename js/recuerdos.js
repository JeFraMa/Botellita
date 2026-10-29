/* =====================================================
   recuerdos.js  ->  álbum de ella: foto + nota estilo instantánea (polaroid).
   Archivo NUEVO: no modifica app.js ni data.js. Se carga DESPUÉS de app.js.
   Lo que hace:
   1) Agrega un botón "📷 Mi álbum" y una pantalla con el formulario y el álbum.
   2) Guarda los recuerdos en este dispositivo (localStorage).
   3) Mete sus recuerdos al frasco: papelitos rosas dentro del vidrio y
      polaroids que también pueden salir al "Sacar un papelito".
   ===================================================== */
(() => {
  const KEY = 'frasco-recuerdos-v1';          // nombre con el que se guarda en el navegador
  const $ = s => document.querySelector(s);
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let lista = [];                              // todos sus recuerdos (el más nuevo primero)
  try { lista = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { lista = []; }
  let foto = null;                             // foto elegida (ya reducida) antes de guardar
  let nuevos = 0;                              // recuerdos agregados en esta visita

  /* ---------- Foto: se recorta cuadrada y se reduce para que quepan muchas ---------- */
  function reducir(archivo, lado = 640) {
    return new Promise((ok, mal) => {
      const url = URL.createObjectURL(archivo);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(img.width, img.height);
        const c = document.createElement('canvas');
        c.width = c.height = Math.min(lado, s);
        c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c.toDataURL('image/jpeg', .78));
      };
      img.onerror = () => { URL.revokeObjectURL(url); mal(); };
      img.src = url;
    });
  }

  /* ---------- Una polaroid en HTML (álbum y papelito comparten el mismo diseño) ---------- */
  const fechaTxt = f => new Date(f).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  const polaroid = (m, rot, borrar) =>
    `<figure class="pola" style="--r:${rot}deg">` +
    (borrar ? `<button class="rc-del" data-id="${m.id}" aria-label="Quitar recuerdo" title="Quitar">✕</button>` : '') +
    `<img class="ph" src="${esc(m.foto)}" alt="Recuerdo">` +
    `<figcaption class="cap">${esc(m.nota)}<small class="fecha">${fechaTxt(m.fecha)}</small></figcaption></figure>`;

  /* ---------- Pantalla y botón (se crean aquí, no hay que tocar index.html) ---------- */
  const opciones = '<option value="*">Aparece en cualquier emoción</option>' +
    EMOCIONES.map(e => `<option value="${esc(e.id)}">Solo en ${e.emoji} ${esc(e.nombre)}</option>`).join('');
  document.body.insertAdjacentHTML('beforeend', `
    <button id="rc-open" aria-label="Abrir mi álbum de recuerdos">
      <svg viewBox="0 0 32 32" aria-hidden="true"><g transform="rotate(-6 16 16)"><rect x="5" y="3.5" width="22" height="25" rx="2" fill="#fbfaf6" stroke="#c9b98f"/><rect x="8" y="6.5" width="16" height="14" rx="1" fill="#f59bb8"/><path d="M16 18.6C11.8 15.8 11.3 12.8 13.4 12c1.2-.4 2.2.2 2.6 1.1.4-.9 1.4-1.5 2.6-1.1 2.1.8 1.6 3.8-2.6 6.6z" fill="#fff"/></g></svg>
      Mi álbum<b id="rc-badge" hidden>0</b>
    </button>
    <div id="rc" role="dialog" aria-modal="true" aria-labelledby="rc-t">
      <button class="rc-close" id="rc-close" aria-label="Cerrar álbum">✕</button>
      <div class="rc-wrap">
        <h2 class="rc-title" id="rc-t">Mi álbum de recuerdos</h2>
        <p class="rc-sub">Elige una foto, escribe tu nota y pégala: se queda en la botellita con mis papelitos.</p>
        <form id="rc-form" class="pola" style="--r:-1.5deg" autocomplete="off">
          <label class="ph pick" id="rc-pick">📷<br>Toca para elegir una foto
            <input class="rc-file" id="rc-file" type="file" accept="image/*" aria-label="Elegir foto">
          </label>
          <textarea class="cap" id="rc-nota" rows="3" maxlength="220" placeholder="Escribe aquí tu nota…" aria-label="Tu nota"></textarea>
          <select id="rc-em" aria-label="¿Dónde aparece?">${opciones}</select>
          <button class="rc-btn" type="submit">Pegar en el álbum</button>
          <p class="rc-msg" id="rc-msg" role="status"></p>
        </form>
        <div class="rc-grid" id="rc-grid"></div>
      </div>
    </div>`);
  const msg = t => { $('#rc-msg').textContent = t; };

  /* ---------- Guardar en el navegador ---------- */
  function guardar(nueva) {
    try { localStorage.setItem(KEY, JSON.stringify(nueva)); lista = nueva; return true; }
    catch (e) { return false; }               // normalmente: ya no hay espacio
  }

  /* ---------- Álbum (cuadrícula de polaroids) ---------- */
  function pintarAlbum() {
    $('#rc-grid').innerHTML = lista.length
      ? lista.map(m => polaroid(m, m.r, true)).join('')
      : '<p class="rc-empty">Aquí se irán pegando tus recuerdos…</p>';
  }

  /* ---------- Frasco: un papelito rosa por recuerdo (máx. 10) en los dos frascos ---------- */
  function pintarFrascos() {
    document.querySelectorAll('.jar .notes').forEach(caja => {
      caja.querySelectorAll('.note-ella').forEach(n => n.remove());
      lista.slice(0, 10).forEach(m => {
        const n = document.createElement('i');
        n.className = 'note note-ella';
        n.style.cssText = `--nc:#f59bb8;--x:${m.id % 67}%;--y:${Math.floor(m.id / 67) % 72}%;--r:${m.r * 12}deg`;
        caja.append(n);
      });
    });
  }

  /* ---------- Sala: sus recuerdos entran al mazo de papelitos de cada emoción ---------- */
  function sincronizarContenido() {
    EMOCIONES.forEach(e => {
      const mazo = CONTENIDO[e.id];
      if (!Array.isArray(mazo)) return;
      mazo.splice(0, mazo.length, ...mazo.filter(x => x.tipo !== 'recuerdo'));   // quita los suyos viejos
      lista.forEach(m => { if (m.em === '*' || m.em === e.id) mazo.push({ tipo: 'recuerdo', ...m }); });
    });
  }
  // app.js dibuja cada papelito con htmlPapelito(); le enseñamos el tipo "recuerdo" sin editar app.js
  const base = window.htmlPapelito;
  window.htmlPapelito = it => it.tipo === 'recuerdo'
    ? `<p class="kind">Un recuerdo que tú guardaste 💗</p>${polaroid(it, 1.5)}`
    : base(it);

  function refrescar() {
    pintarAlbum(); pintarFrascos(); sincronizarContenido();
    const b = $('#rc-badge'); b.hidden = !lista.length; b.textContent = lista.length;   // cuántos recuerdos lleva
  }

  /* ---------- Abrir / cerrar ---------- */
  function abrir() {
    $('#rc').classList.add('open');
    document.body.style.overflow = 'hidden';
    $('#rc').scrollTop = 0;
    $('#rc-close').focus();
  }
  function cerrar() {
    $('#rc').classList.remove('open');
    document.body.style.overflow = '';
    if (nuevos) {                              // avisa que ya está dentro de la botellita
      nuevos = 0;
      if (typeof sacudir === 'function') sacudir($('#jar-home'));
      if (typeof toast === 'function') toast('Tu recuerdo ya está dentro de la botellita 💗');
    }
  }
  $('#rc-open').onclick = abrir;
  $('#rc-close').onclick = cerrar;
  addEventListener('keydown', e => { if (e.key === 'Escape' && $('#rc').classList.contains('open')) cerrar(); });

  /* ---------- Elegir foto ---------- */
  $('#rc-file').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      foto = await reducir(f);
      $('#rc-pick').style.backgroundImage = `url(${foto})`;
      $('#rc-pick').classList.add('has');
      msg('');
    } catch (err) { foto = null; msg('No pude leer esa foto, prueba con otra 🥲'); }
  });

  /* ---------- Pegar en el álbum ---------- */
  $('#rc-form').addEventListener('submit', e => {
    e.preventDefault();
    if (!foto) return msg('Primero elige una foto 📷');
    const m = { id: Date.now(), foto, nota: $('#rc-nota').value.trim(), em: $('#rc-em').value,
                fecha: new Date().toISOString(), r: +(Math.random() * 6 - 3).toFixed(1) };
    if (!guardar([m, ...lista])) return msg('Ya no hay espacio en este dispositivo. Quita algún recuerdo e intenta de nuevo.');
    foto = null; nuevos++;
    $('#rc-form').reset();
    $('#rc-pick').style.backgroundImage = '';
    $('#rc-pick').classList.remove('has');
    msg('¡Pegado en tu álbum! 💗');
    refrescar();
  });

  /* ---------- Quitar un recuerdo ---------- */
  $('#rc-grid').addEventListener('click', e => {
    const b = e.target.closest('.rc-del');
    if (!b || !confirm('¿Quitar este recuerdo del álbum y de la botellita?')) return;
    guardar(lista.filter(m => String(m.id) !== b.dataset.id));
    refrescar();
  });

  refrescar();
})();
