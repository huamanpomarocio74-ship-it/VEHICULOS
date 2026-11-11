/**
 * @fileoverview Diccionario Digital Interactivo — Mi ciudad sobre ruedas
 *
 * FLUJO:  PORTADA (video inicial) → PALABRAS (una por una) → JUEGO → FINAL
 *
 * PORTADA → la video de presentación en assets/video/portada.mp4. Si no
 * existe, se muestra una portada provisional.
 *
 * LECCIÓN → un VIDEO por palabra (en bucle, SIN sonido) y su frase: primero qué es y
 * luego cómo la usamos. Entre palabras hay fundido cruzado. La voz lee la frase.
 *
 * JUEGO → los videos en recuadros, cada uno en bucle y de forma independiente;
 * se toca el video que responde a la pregunta.
 *
 * VIDEOS: cada palabra usa dos archivos en assets/video/ — uno 4:3 para la lección
 * (carro.mp4) y uno cuadrado y liviano para el juego (carro_card.mp4).
 * Si falta el video de una palabra, se omite automáticamente.
 *
 * @version 2.0.0
 */

'use strict';

/* ============================================================
   DATOS
   ============================================================ */

const VID = './assets/video/';
const IS_IMAGE = /^data:image\/|\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i;

/** Duración del fundido cruzado entre diapositivas (debe coincidir con el CSS: 1s). */
const TRANSITION_MS = 1000;

/** Pausa (ms) entre la palabra y su definición al leer la lección. */
const PAUSE_MS = 900;

/** Portada: video en bucle sin sonido (assets/video/portada.mp4). Si falla, se usa la imagen provisional. */
const COVER_CANDIDATES = [VID + 'portada.mp4'];
let COVER = null;

/** Portada provisional (SVG) mientras no exista el video de portada. */
const FALLBACK_COVER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
     <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#fdebc8"/></linearGradient></defs>
     <rect width="800" height="600" fill="url(#g)"/>
     <g font-size="130" text-anchor="middle">
       <text x="200" y="260">🚗</text><text x="400" y="230">🚌</text><text x="600" y="260">🚲</text>
       <text x="290" y="440">🛴</text><text x="510" y="440">🏍️</text>
     </g>
     <text x="400" y="545" font-family="Nunito,Segoe UI,sans-serif" font-weight="900"
           font-size="42" text-anchor="middle" fill="#4b2a99">MI CIUDAD SOBRE RUEDAS</text>
   </svg>`);


/** Las palabras. Si el archivo de video no existe, la palabra se omite. */
const ITEMS = [
  {
    id: 'carro', label: 'CARRO', icon: '🚗', color: '#e8423f',
    say:      'Carro.',                         // se dice primero (luego, pausa)
    def:      'Es un vehículo grande con cuatro llantas que se mueve por la pista.',   // se dice después de la pausa
    example:  'Viajo sentado en el carro con mi familia.',   // solo se dice al tocar el botón ORACIÓN
    question: '¿Dónde está el carro?',
    answer:   'Este es el carro.',
    video: VID + 'carro.mp4',                 // lección (4:3)
    card:  VID + 'carro_card.mp4',            // juego (cuadrado, liviano)
  },
  {
    id: 'bicicleta', label: 'BICICLETA', icon: '🚲', color: '#2f9bd6',
    say:      'Bicicleta.',                         // se dice primero (luego, pausa)
    def:      'Es un vehículo con dos ruedas que avanza pedaleando.',   // se dice después de la pausa
    example:  'Giro los pedales de mi bicicleta para pasear.',   // solo se dice al tocar el botón ORACIÓN
    question: '¿Dónde está la bicicleta?',
    answer:   'Esta es la bicicleta.',
    video: VID + 'bicicleta.mp4',                 // lección (4:3)
    card:  VID + 'bicicleta_card.mp4',            // juego (cuadrado, liviano)
  },
  {
    id: 'bus', label: 'BUS', icon: '🚌', color: '#f5a300',
    say:      'Bus.',                         // se dice primero (luego, pausa)
    def:      'Es un carro muy grande y largo que transporta a muchas personas a la vez.',   // se dice después de la pausa
    example:  'Subo al bus para ir de paseo.',   // solo se dice al tocar el botón ORACIÓN
    question: '¿Dónde está el bus?',
    answer:   'Este es el bus.',
    video: VID + 'bus.mp4',                 // lección (4:3)
    card:  VID + 'bus_card.mp4',            // juego (cuadrado, liviano)
  },
  {
    id: 'scuter', label: 'SCÚTER', icon: '🛴', color: '#4fae3f',
    say:      'Scúter.',                         // se dice primero (luego, pausa)
    def:      'Es una tablita con ruedas y un manubrio para pararse y avanzar.',   // se dice después de la pausa
    example:  'Empujo el suelo con mi pie para mover el scúter.',   // solo se dice al tocar el botón ORACIÓN
    question: '¿Dónde está el scúter?',
    answer:   'Este es el scúter.',
    video: VID + 'scuter.mp4',                 // lección (4:3)
    card:  VID + 'scuter_card.mp4',            // juego (cuadrado, liviano)
  },
  {
    id: 'moto', label: 'MOTO', icon: '🏍️', color: '#8a4bd6',
    say:      'Moto.',                         // se dice primero (luego, pausa)
    def:      'Es un vehículo rápido con dos ruedas y motor.',   // se dice después de la pausa
    example:  'Veo pasar la moto veloz por la calle.',   // solo se dice al tocar el botón ORACIÓN
    question: '¿Dónde está la moto?',
    answer:   'Esta es la moto.',
    video: VID + 'moto.mp4',                 // lección (4:3)
    card:  VID + 'moto_card.mp4',            // juego (cuadrado, liviano)
  },
];

/** Palabras con video disponible (se llena al iniciar). */
let ACTIVE = [];

/* ============================================================
   UTILIDADES
   ============================================================ */

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ============================================================
   VOZ VIRTUAL (SpeechSynthesis del navegador, sin archivos de audio)
   ============================================================ */

class VoiceManager {
  constructor() {
    this._synth  = 'speechSynthesis' in window ? window.speechSynthesis : null;
    this._voice  = null;
    this._muted  = false;
    this._timer  = 0;
    this._resolve = null;
    this._seq = 0;
    if (this._synth) {
      this._pickVoice();
      this._synth.addEventListener?.('voiceschanged', () => this._pickVoice());
    }
  }

  get muted()    { return this._muted; }
  get hasVoice() { return !!this._voice; }

  /** Elige la mejor voz en español disponible (prefiere es-PE / es-419 / es-US / es-MX). */
  _pickVoice() {
    const all = this._synth.getVoices();
    const es  = all.filter((v) => /^es([-_]|$)/i.test(v.lang));
    if (!es.length) { this._voice = null; return; }
    const rank = (v) => {
      const lang = v.lang.replace('_', '-').toLowerCase();
      const order = ['es-pe', 'es-419', 'es-us', 'es-mx', 'es-co', 'es-ar', 'es-es'];
      let s = order.indexOf(lang); s = s < 0 ? order.length : s;
      if (/google|natural|online|neural|premium|paulina|monica|sabina|helena|laura/i.test(v.name)) s -= 0.5;
      return s;
    };
    this._voice = es.sort((a, b) => rank(a) - rank(b))[0];
  }

  /** Lee el texto. Devuelve una promesa que se cumple al terminar (o al cancelarse). */
  speak(text) {
    this.stop();
    return this._say(text);
  }

  /** Dice un texto sin cancelar la secuencia en curso. */
  _say(text) {
    if (this._synth) this._synth.cancel();
    if (!this._synth || this._muted) return Promise.resolve();
    return new Promise((resolve) => {
      this._resolve = resolve;
      const u = new SpeechSynthesisUtterance(text);
      u.lang   = this._voice ? this._voice.lang : 'es-PE';
      if (this._voice) u.voice = this._voice;
      u.rate   = 0.9;     // un poco más lento para niños
      u.pitch  = 1.1;
      const done = () => { clearTimeout(this._timer); if (this._resolve === resolve) this._resolve = null; resolve(); };
      u.onend = done; u.onerror = done;
      // Respaldo: si el navegador nunca avisa que terminó
      this._timer = setTimeout(done, 1500 + text.length * 110);
      // Pequeño retraso: evita que cancel() + speak() seguidos se pierdan en Chrome
      setTimeout(() => { if (this._resolve === resolve) this._synth.speak(u); }, 60);
    });
  }

  /** Lee varias partes con una PAUSA entre cada una (ej.: CARRO. (pausa) es un vehículo...). */
  async speakSequence(parts, pauseMs = PAUSE_MS) {
    this.stop();
    const id = ++this._seq;
    for (let i = 0; i < parts.length; i++) {
      if (id !== this._seq) return;
      await this._say(parts[i]);
      if (id !== this._seq) return;
      if (i < parts.length - 1) await sleep(pauseMs);
    }
  }

  stop() {
    this._seq++;
    clearTimeout(this._timer);
    if (this._synth) this._synth.cancel();
    if (this._resolve) { const r = this._resolve; this._resolve = null; r(); }
  }

  toggleMute() {
    this._muted = !this._muted;
    if (this._muted) this.stop();
    return this._muted;
  }
}

/** Comprueba si una imagen existe/carga. */
function probeImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/** Comprueba si un video existe/carga. Solo se descarta si el navegador da error. */
function probeVideo(src) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    let finished = false;
    const done = (ok) => {
      if (finished) return;
      finished = true;
      v.onloadedmetadata = v.onerror = null;
      v.removeAttribute('src');
      resolve(ok);
    };
    v.onloadedmetadata = () => done(true);
    v.onerror = () => done(false);
    setTimeout(() => done(true), 4000);   // sin respuesta: se asume que existe
    v.src = src;
  });
}

/* ============================================================
   ESCENA (videos con fundido cruzado / tarjetas del juego)
   ============================================================ */

class SceneController {
  constructor(slidesEl, gridEl, stageEl) {
    this._slides  = slidesEl;
    this._grid    = gridEl;
    this._stage   = stageEl;
    this._layout  = stageEl.parentElement;   // .layout (se ensancha en el juego)
    this._current = null;
  }

  _makeSlide(src) {
    const slide = document.createElement('div');
    slide.className = 'slide';
    if (IS_IMAGE.test(src)) {
      slide.classList.add('is-cover');
      const img = document.createElement('img');
      img.className = 'slide-image';
      img.alt = 'Mi ciudad sobre ruedas';
      img.decoding = 'async';
      img.src = src;
      slide.appendChild(img);
      return slide;
    }
    if (src === COVER) slide.classList.add('is-cover');
    const v = document.createElement('video');
    v.className = 'slide-video';
    v.muted = true;                       // los videos van siempre sin sonido
    v.defaultMuted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.setAttribute('disablepictureinpicture', '');
    v.src = src;
    slide.appendChild(v);
    return slide;
  }

  _lastVideo() { return this._slides.lastElementChild?.querySelector('video') || null; }

  /**
   * Muestra el video de una acción con fundido cruzado: el nuevo aparece ENCIMA
   * del anterior (que sigue reproduciéndose debajo), así nunca hay un cuadro vacío.
   * Si ya es el video actual, sigue reproduciéndose sin reiniciar.
   */
  async show(src, instant = false) {
    this._stage.classList.remove('is-game');
    this._layout.classList.remove('is-game');
    this._grid.hidden   = true;
    this._slides.hidden = false;

    if (src === this._current) {
      const cur = this._lastVideo();
      if (cur && cur.paused) cur.play().catch(() => {});
      return;
    }
    this._current = src;

    const slide = this._makeSlide(src);
    const m = slide.firstChild;
    const isImg = m.tagName === 'IMG';
    this._slides.appendChild(slide);

    // Esperar a que haya imagen lista (o 1.5 s como máximo) antes de mostrarlo
    await new Promise((resolve) => {
      if (isImg ? m.complete : m.readyState >= 2) { resolve(); return; }
      m.addEventListener(isImg ? 'load' : 'loadeddata', resolve, { once: true });
      m.addEventListener('error', resolve, { once: true });
      setTimeout(resolve, 1500);
    });
    if (!isImg) m.play().catch(() => {});

    if (instant) slide.classList.add('instant');
    void slide.offsetWidth;
    slide.classList.add('in');

    // Al terminar el fundido, se quitan (y detienen) los videos anteriores
    const cleanup = () => {
      while (slide.parentNode === this._slides && this._slides.firstChild !== slide) {
        const old = this._slides.firstChild;
        old.querySelector('video')?.pause();
        this._slides.removeChild(old);
      }
    };
    if (instant) cleanup(); else setTimeout(cleanup, TRANSITION_MS + 80);
  }

  /** Reinicia el video actual desde el principio (al repetir). */
  replay() {
    const v = this._lastVideo();
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }

  /** Pantalla de inicio: la imagen de portada (o la portada provisional si falta). */
  showHome(instant = false) {
    if (COVER) return this.show(COVER, instant);
    return this.show(FALLBACK_COVER, instant);
  }

  /** Juego: pausa los videos de la lección y muestra las tarjetas. */
  showGame() {
    this._slides.querySelectorAll('video').forEach((v) => v.pause());
    this._slides.hidden = true;
    this._stage.classList.add('is-game');
    this._layout.classList.add('is-game');
    this._grid.hidden   = false;
  }
}

/* ============================================================
   ESTADO
   ============================================================ */

class StateManager {
  constructor() {
    this._mode  = 'welcome';
    this._epoch = 0;
  }
  get mode()  { return this._mode; }
  get epoch() { return this._epoch; }
  newEpoch()  { return ++this._epoch; }

  show(name) {
    this._mode = name;
    ['welcome', 'lesson', 'game', 'finish'].forEach((id) => { $(id).hidden = id !== name; });
    $('controls').hidden = name === 'welcome' || name === 'finish';
    $('prev').hidden     = name === 'game';
    $('next').hidden     = name === 'game';
  }

  updateProgress(current, total) {
    $('dots').innerHTML = Array.from({ length: total }, (_, n) => {
      const cls = n === current ? 'current' : n < current ? 'done' : '';
      return `<span class="dot ${cls}"></span>`;
    }).join('');
  }
}

/* ============================================================
   LECCIÓN
   ============================================================ */

class LessonMode {
  constructor(scene, state, voice) {
    this._scene = scene;
    this._state = state;
    this._voice = voice;
    this._index = 0;
  }

  get total() { return ACTIVE.length; }

  async goTo(i) {
    const token = this._reset();
    this._index = i;
    this._state.show('lesson');

    $('prev').disabled     = i === 0;
    $('next').textContent  = i === this.total - 1 ? 'JUGAR →' : 'SIGUIENTE →';
    $('count').textContent = `${i + 1} DE ${this.total}`;
    this._state.updateProgress(i, this.total);

    await this._play(i, token, false);
  }

  /** Muestra el texto y el video; la voz dice la acción y luego su texto. */
  async _play(i, token, restart) {
    const a = ACTIVE[i];
    $('word').textContent       = a.label;
    $('word').style.setProperty('--w', a.color);
    $('word').className         = a.label.length >= 11 ? 'xlong' : a.label.length >= 8 ? 'long' : '';
    $('phrase').textContent     = a.def + '\n' + a.example;
    $('lessonIcon').textContent = a.icon;
    $('lessonIcon').hidden      = false;

    // PALABRA (pausa) qué es. La oración NO se dice sola: solo con el botón ORACIÓN.
    this._voice.speakSequence([a.say, a.def]);
    await this._scene.show(a.video);
    if (restart) this._scene.replay();
  }

  /** Vuelve a mostrar el video desde el inicio y a decir la acción. */
  async repeat() {
    const token = this._reset();
    this._state.show('lesson');
    await this._play(this._index, token, true);
  }

  /** Botón ORACIÓN: recién aquí se lee la frase de ejemplo. */
  sentence() {
    const a = ACTIVE[this._index];
    if (a) this._voice.speak(a.example);
  }

  prev() { if (this._index > 0) this.goTo(this._index - 1); }

  next() {
    if (this._index < this.total - 1) { this.goTo(this._index + 1); return false; }
    return true; // → iniciar juego
  }

  _reset() {
    const token = this._state.newEpoch();
    this._voice.stop();
    $('celebration').hidden = true;
    $('stage').classList.remove('encourage');
    return token;
  }
}

/* ============================================================
   JUEGO
   ============================================================ */

class GameMode {
  constructor(scene, state, voice) {
    this._scene  = scene;
    this._state  = state;
    this._voice  = voice;
    this._queue  = [];
    this._turn   = 0;
    this._ready  = false;
    this._locked = false;
  }

  start() {
    this._scene.showGame();
    this._queue = shuffle(ACTIVE);
    this._turn  = 0;
    this._ask();
  }

  _ask() {
    const token = this._state.newEpoch();
    $('celebration').hidden = true;
    this._state.show('game');
    const cur = this._queue[this._turn];
    $('question').textContent  = cur.question;
    $('feedback').textContent  = '👆 TOCA EL VIDEO';
    $('gameCount').textContent = `${this._turn + 1} DE ${this._queue.length}`;

    // Todos los videos en recuadros, cada uno en bucle y por su cuenta.
    // Cambian de lugar en cada pregunta y empiezan en un punto distinto.
    const grid = $('gameGrid');
    grid.innerHTML = '';
    shuffle(ACTIVE).forEach((a, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'act-card';
      b.dataset.id = a.id;
      b.setAttribute('aria-label', `Video ${n + 1}`);
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto';
      v.setAttribute('disablepictureinpicture', '');
      v.addEventListener('loadedmetadata', () => {
        if (isFinite(v.duration)) v.currentTime = Math.random() * v.duration;
        v.play().catch(() => {});
      }, { once: true });
      v.src = a.card;
      b.appendChild(v);
      b.addEventListener('click', () => this.pick(b, token));
      grid.appendChild(b);
    });
    this._ready  = true;
    this._locked = false;
    this._voice.speak(cur.question);
  }

  repeatQuestion() {
    if (!this._locked && this._queue[this._turn]) this._voice.speak(this._queue[this._turn].question);
  }

  async pick(card, token) {
    if (!this._ready || this._locked || token !== this._state.epoch) return;
    this._locked = true;
    const cur = this._queue[this._turn];

    if (card.dataset.id === cur.id) {
      card.classList.add('correct');
      document.querySelectorAll('.act-card').forEach((c) => { c.disabled = true; if (c !== card) c.classList.add('dim'); });
      $('feedback').textContent = `¡MUY BIEN! ${cur.answer}`;
      $('celebration').hidden   = false;
      await Promise.all([sleep(2400), this._voice.speakSequence(['¡Muy bien!', cur.answer], 350)]);
      if (token !== this._state.epoch) return;
      this._turn++;
      if (this._turn < this._queue.length) this._ask();
      else this._finish();
    } else {
      card.classList.add('wrong', 'dim');
      card.disabled = true;
      $('feedback').textContent = '¡INTÉNTALO OTRA VEZ!';
      this._voice.speak('Inténtalo otra vez');
      await sleep(700);
      if (token !== this._state.epoch) return;
      card.classList.remove('wrong');
      $('feedback').textContent = '👆 TOCA EL VIDEO';
      this._locked = false;
    }
  }

  _finish() {
    this._state.newEpoch();
    $('celebration').hidden = true;
    this._state.show('finish');
    this._voice.speak('¡Excelente trabajo! ¡Ya conoces los vehículos de tu ciudad!');
  }
}

/* ============================================================
   APP
   ============================================================ */

class App {
  constructor() {
    this.scene  = new SceneController($('slides'), $('gameGrid'), $('stage'));
    this.voice  = new VoiceManager();
    this.state  = new StateManager();
    this.lesson = new LessonMode(this.scene, this.state, this.voice);
    this.game   = new GameMode(this.scene, this.state, this.voice);

    this.state.show('welcome');
    this._bind();
    this._voiceStatus();
    this._init();
  }

  /** Detecta la portada y qué videos existen, y muestra la pantalla de inicio. */
  async _init() {
    const [covers, ...found] = await Promise.all([
      Promise.all(COVER_CANDIDATES.map(probeVideo)),
      ...ITEMS.map((a) => probeVideo(a.video)),
    ]);
    const ci = covers.indexOf(true);
    COVER  = ci >= 0 ? COVER_CANDIDATES[ci] : null;
    ACTIVE = ITEMS.filter((_, i) => found[i]);
    this.scene.showHome(true);
    if (!ACTIVE.length) {
      $('status').textContent = 'AGREGA LOS VIDEOS EN LA CARPETA assets/video/ (carro.mp4, bicicleta.mp4, bus.mp4…).';
      $('start').disabled = true;
    }
  }

  /** Aviso si el dispositivo no tiene voz en español. */
  _voiceStatus() {
    const show = () => {
      if ($('start').disabled) return;
      $('status').textContent = ('speechSynthesis' in window && !this.voice.hasVoice)
        ? 'SI NO ESCUCHAS LA VOZ, INSTALA UNA VOZ EN ESPAÑOL EN TU DISPOSITIVO.' : '';
    };
    setTimeout(show, 1500);
    window.speechSynthesis?.addEventListener?.('voiceschanged', show);
  }

  _bind() {
    $('start').onclick      = () => this.lesson.goTo(0);
    $('prev').onclick       = () => { if (this.state.mode === 'lesson') this.lesson.prev(); };
    $('next').onclick       = () => {
      if (this.state.mode === 'lesson' && this.lesson.next()) this.game.start();
    };
    $('listen').onclick     = () => { if (this.state.mode === 'lesson') this.lesson.sentence(); };
    $('repeat').onclick     = () => {
      if (this.state.mode === 'lesson') this.lesson.repeat();
      else if (this.state.mode === 'game') this.game.repeatQuestion();
    };
    $('home').onclick       = () => {
      this.state.newEpoch();
      this.voice.stop();
      $('celebration').hidden = true;
      this.scene.showHome();
      this.state.show('welcome');
    };
    $('again').onclick      = () => this.game.start();
    $('dictionary').onclick = () => this.lesson.goTo(0);

    $('sound').onclick = () => {
      const muted = this.voice.toggleMute();
      $('sound').setAttribute('aria-label', muted ? 'Activar voz' : 'Desactivar voz');
      $('sound').setAttribute('aria-pressed', String(!muted));
      if (!muted) {
        if (this.state.mode === 'lesson') this.lesson.repeat();
        else if (this.state.mode === 'game') this.game.repeatQuestion();
      }
    };

    document.addEventListener('visibilitychange', () => { if (document.hidden) this.voice.stop(); });
  }
}

const app = new App();
