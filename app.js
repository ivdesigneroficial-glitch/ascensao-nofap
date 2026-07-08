/* ===== Vício Zerø — lógica ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const DAY = 86400000;
const TOTAL_NIVEIS = NIVEIS.length; // 100

/* ---------- estado ---------- */
// Jornada iniciada em 06/07/2026 (dia 1). Em 08/07 = dia 3.
const START = new Date(2026, 6, 6, 0, 0, 0).getTime();
const DEFAULT = { inicio: START, recorde: 0, resets: 0, humores: {} };
let state = load();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem('vicioZero'));
    if (s && s.inicio) return Object.assign({}, DEFAULT, s);
  } catch (e) {}
  const fresh = Object.assign({}, DEFAULT, { inicio: START });
  localStorage.setItem('vicioZero', JSON.stringify(fresh));
  return fresh;
}
function save() { localStorage.setItem('vicioZero', JSON.stringify(state)); }

/* ---------- cálculos ---------- */
function msDecorridos() { return Date.now() - state.inicio; }
function diasCompletos() { return Math.floor(msDecorridos() / DAY); } // 0,1,2...
function diaAtual() { return diasCompletos() + 1; }                    // 1,2,3...

// dia sim, dia não: nível sobe a cada 2 dias. dia1->n1, dia3->n2, dia5->n3
function nivelIndex() {
  const idx = Math.floor(diasCompletos() / 2); // 0-based
  return Math.min(idx, TOTAL_NIVEIS - 1);
}
function nivelAtual() { return NIVEIS[nivelIndex()]; }
function niveisDesbloqueados() { return nivelIndex() + 1; }

/* ---------- render CONTADOR ---------- */
function fmt2(n) { return String(n).padStart(2, '0'); }

function renderContador() {
  const ms = msDecorridos();
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  $('#clock').textContent = `${fmt2(h)}:${fmt2(m)}:${fmt2(s)}`;

  // dia 1-indexado (voce esta NO dia X) + horas dentro do dia atual
  const totH = Math.floor((ms % DAY) / 3600000);
  const totM = Math.floor((ms % 3600000) / 60000);
  $('#totalTime').textContent = `${diaAtual()}d ${totH}h ${totM}m`;

  // progresso do dia atual (0-100)
  const dayProg = (ms % DAY) / DAY;
  $('#dayPct').textContent = Math.floor(dayProg * 100) + '%';
  const C = 565.48;
  $('#ringFg').style.strokeDashoffset = C * (1 - dayProg);

  $('#streakDays').textContent = diaAtual();

  const nv = nivelAtual();
  $('#rankImg').src = nv.img;
  $('#rankName').textContent = nv.titulo;
  $('#rankCat').textContent = `${nv.categoria} · Nível ${nv.nivel}/${TOTAL_NIVEIS}`;

  // próximo nível
  if (nv.nivel < TOTAL_NIVEIS) {
    const prox = NIVEIS[nv.nivel]; // próximo
    const diasRest = prox.diaDesbloqueio - diaAtual();
    const txt = diasRest <= 0
      ? `<b>${prox.titulo}</b> desbloqueia hoje!`
      : `Próximo nível <b>${prox.titulo}</b> em <b>${diasRest} dia${diasRest > 1 ? 's' : ''}</b>`;
    $('#nextLevel').innerHTML = txt;
  } else {
    $('#nextLevel').innerHTML = `🏆 <b>Nível máximo alcançado!</b> Você é Supremo Absoluto.`;
  }
}

/* ---------- render NÍVEIS ---------- */
function renderNiveis() {
  const desbloq = niveisDesbloqueados();
  const atualIdx = nivelIndex();
  $('#niveisSub').textContent = `${desbloq} de ${TOTAL_NIVEIS} desbloqueados`;
  $('#statDias').textContent = diaAtual();
  $('#statNiveis').textContent = desbloq;

  const nv = nivelAtual();
  $('#ccImg').src = nv.img;
  $('#ccName').textContent = nv.titulo;
  $('#ccSub').textContent = `${nv.categoria} · dia ${nv.diaDesbloqueio}`;

  // agrupar por categoria
  const groups = {};
  NIVEIS.forEach(n => { (groups[n.categoriaNum] ??= []).push(n); });

  let html = '';
  Object.values(groups).forEach(list => {
    const c = list[0];
    html += `<div class="cat-group"><div class="cat-head"><span class="cn">CATEGORIA ${c.categoriaNum}</span><h3>${c.categoria}</h3></div><div class="grid">`;
    list.forEach(n => {
      const done = n.nivel < desbloq;
      const cur = (n.nivel - 1) === atualIdx;
      const locked = n.nivel > desbloq;
      const cls = cur ? 'current' : (done ? 'done' : 'locked');
      const ic = cur ? '<div class="badge-ic cur">★</div>' : done ? '<div class="badge-ic ok">✓</div>' : '<div class="badge-ic lock">🔒</div>';
      const tag = cur ? '<div class="tag-atual">★ ATUAL</div>' : '';
      html += `<div class="node ${cls}">${tag}
        <div class="node-photo"><img src="${n.img}" alt="" loading="lazy">${ic}</div>
        <div class="node-day">DIA ${n.diaDesbloqueio}</div>
        <div class="node-name">${n.titulo}</div>
      </div>`;
    });
    html += '</div></div>';
  });
  $('#niveisList').innerHTML = html;
}

/* ---------- HUMOR ---------- */
const MOODS = ['😀', '🙂', '😐', '😣', '😤'];
function renderHumor() {
  const hoje = new Date().toISOString().slice(0, 10);
  $('#moodGrid').innerHTML = MOODS.map((e, i) =>
    `<button class="mood-btn ${state.humores[hoje] === i ? 'sel' : ''}" data-m="${i}">${e}</button>`).join('');
  $$('.mood-btn').forEach(b => b.onclick = () => {
    state.humores[hoje] = +b.dataset.m; save(); renderHumor();
  });
  const keys = Object.keys(state.humores).sort().reverse().slice(0, 14);
  $('#moodLog').innerHTML = keys.map(k => {
    const dt = k.split('-').reverse().join('/');
    return `<div class="mood-item"><span>${dt}</span><b>${MOODS[state.humores[k]]}</b></div>`;
  }).join('') || '<p style="color:var(--muted);text-align:center;padding:20px">Nenhum registro ainda.</p>';
}

/* ---------- MOTIVAÇÃO ---------- */
const FRASES = [
  'Cada urge vencido te fortalece. Respira e segue.',
  'O desconforto de hoje é o poder de amanhã.',
  'Você não é seus impulsos. Você é a disciplina que os domina.',
  'Recaída não é fracasso — é dado. Levanta e recomeça.',
  'Dia sim, dia não, você evolui. Confie no processo.',
  'A urge dura minutos. O orgulho dura pra sempre.',
  'Transmute a energia. Treine, crie, conquiste.',
  'O homem que você quer ser está do outro lado do "não".',
  'Foco. Cada nível desbloqueado é uma versão sua mais forte.',
  'Ninguém vai fazer por você. E é exatamente por isso que você vai.',
  'Disciplina é escolher o que você quer MAIS em vez do que quer AGORA.',
  'A dor da disciplina pesa gramas. A dor do arrependimento pesa toneladas.',
  'Toda vez que você resiste, seu cérebro se reconstrói mais forte.',
  'Você já foi mais fraco e sobreviveu. Agora você é o predador.',
  'Não negocie com a urge. Negociar já é meio caminho pra perder.',
  'Frio na barriga? Bom. É o corpo entendendo que você virou o jogo.',
  'Cabeça erguida, olhar de quem não deve nada pra ninguém.',
  'Enquanto uns cedem, você forja. Essa é a diferença.',
  'O topo é solitário porque poucos aguentam o preço. Você aguenta.',
  'Energia acumulada não some — vira músculo, foco e presença.',
  'Seja tão disciplinado que a preguiça tenha medo de você.',
  'Cada "não" hoje é um "sim" pro homem que você está construindo.',
  'Não é sobre nunca cair. É sobre nunca ficar caído.',
  'Você contra você. E você vai ganhar.',
  'Fecha os olhos, respira fundo, e lembra: você é mais forte que isso.',
  'O Supremo Absoluto começou exatamente onde você está agora.',
  'Guerreiro não foge da batalha interna. Ele a domina.',
  'Constância vence intensidade. Aparece todo santo dia.',
  'Sua palavra vale? Então prove pra única pessoa que importa: você.',
  'Mete braça. O amanhã é construído no que você faz hoje.'
];
function novaFrase() {
  $('#motivBox').textContent = FRASES[Math.floor(Math.random() * FRASES.length)];
}

/* ---------- PERFIL ---------- */
function renderPerfil() {
  const d = diaAtual();
  const recorde = Math.max(state.recorde, d);
  $('#pfInicio').textContent = new Date(state.inicio).toLocaleDateString('pt-BR');
  $('#pfStreak').textContent = 'Dia ' + d;
  $('#pfRecord').textContent = 'Dia ' + recorde;
  $('#pfResets').textContent = state.resets;
  $('#pfNivel').textContent = `${nivelAtual().nivel} / ${TOTAL_NIVEIS}`;
}

/* ---------- MODAL ---------- */
function modal({ title, body, ok, okLabel = 'Confirmar', danger = false, onOk }) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = body || '';
  const acts = $('#modalActions');
  acts.innerHTML = '';
  const cancel = document.createElement('button');
  cancel.className = 'btn-cancel'; cancel.textContent = 'Cancelar';
  cancel.onclick = closeModal;
  acts.appendChild(cancel);
  if (ok !== false) {
    const b = document.createElement('button');
    b.className = danger ? 'btn-danger' : 'btn-ok';
    b.textContent = okLabel;
    b.onclick = () => { onOk && onOk(); };
    acts.appendChild(b);
  }
  $('#modal').classList.add('show');
}
function closeModal() { $('#modal').classList.remove('show'); }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

/* ---------- AÇÕES ---------- */
$('#btnReset').onclick = () => modal({
  title: 'Confirmar reset?',
  body: 'Isso zera seu contador atual e conta como uma recaída. Sua sequência volta pro dia 0.',
  okLabel: 'Sim, resetar', danger: true,
  onOk: () => {
    state.recorde = Math.max(state.recorde, diaAtual());
    state.resets++;
    state.inicio = Date.now();
    save(); closeModal(); refreshAll();
  }
});

$('#btnConfig').onclick = () => modal({
  title: 'Ajuste seu tempo',
  body: 'Já está limpo há alguns dias? Informe há quantos <b>dias</b> você começou, e o app ajusta seu nível.<input id="inpDias" type="number" min="0" max="400" placeholder="Ex: 7">',
  okLabel: 'Ajustar',
  onOk: () => {
    const v = parseInt($('#inpDias').value, 10);
    if (!isNaN(v) && v >= 0) {
      state.inicio = Date.now() - v * DAY;
      save(); closeModal(); refreshAll();
    }
  }
});

$('#btnHardReset').onclick = () => modal({
  title: 'Zerar tudo?',
  body: 'Apaga TODO o progresso, recordes, humor e resets. Não dá pra desfazer.',
  okLabel: 'Apagar tudo', danger: true,
  onOk: () => {
    localStorage.removeItem('vicioZero');
    state = load(); closeModal(); refreshAll();
  }
});

$('#btnNiveis').onclick = () => go('niveis');
$('#btnComunidade').onclick = () => modal({
  title: 'Comunidade 🚧', body: 'Em breve: ranking e chat com outros guerreiros.', ok: false
});
$('#btnNovaFrase').onclick = novaFrase;

/* ---------- NAVEGAÇÃO ---------- */
function go(page) {
  $$('.tab-page').forEach(p => p.classList.toggle('active', p.dataset.page === page));
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.go === page));
  window.scrollTo(0, 0);
  refreshAll();
}
$$('.tab').forEach(t => t.onclick = () => go(t.dataset.go));

/* ---------- NOTIFICAÇÕES ---------- */
function notifTitulo() {
  const prox = nivelAtual().nivel < TOTAL_NIVEIS ? NIVEIS[nivelAtual().nivel] : null;
  const d = diaAtual();
  if (prox && prox.diaDesbloqueio === d) {
    return { title: '🔓 Novo nível hoje!', body: `Você desbloqueou "${prox.titulo}". Segue firme, guerreiro!` };
  }
  if (prox) {
    const falta = prox.diaDesbloqueio - d;
    return { title: '🔥 Continue firme!', body: `Dia ${d}. Faltam ${falta} dia${falta > 1 ? 's' : ''} pro nível "${prox.titulo}".` };
  }
  return { title: '👑 Supremo Absoluto', body: `Dia ${d}. Você chegou ao topo. Mantenha o reinado.` };
}

function dispararNotif() {
  const msg = notifTitulo();
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'notify', ...msg });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(msg.title, { body: msg.body, icon: 'assets/icon-192.png' });
  }
}

// lembra no máximo 1x por dia quando o app é aberto
function checarLembreteDiario() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const hoje = new Date().toISOString().slice(0, 10);
  if (state.ultimoLembrete === hoje) return;
  state.ultimoLembrete = hoje; save();
  setTimeout(dispararNotif, 1500);
}

function ativarNotificacoes() {
  if (!('Notification' in window)) {
    modal({ title: 'Sem suporte', body: 'Seu navegador não permite notificações. Instale o app na tela inicial e tente de novo.', ok: false });
    return;
  }
  Notification.requestPermission().then(p => {
    if (p === 'granted') {
      state.ultimoLembrete = null; save();
      dispararNotif();
      registrarSyncPeriodico();
      modal({ title: '🔔 Lembretes ativados!', body: 'Você vai receber um lembrete diário pra manter o foco e avisos quando subir de nível.', ok: false });
      atualizarBtnNotif();
    } else {
      modal({ title: 'Permissão negada', body: 'Ative as notificações nas configurações do navegador/app pra receber os lembretes.', ok: false });
    }
  });
}
function atualizarBtnNotif() {
  const b = $('#btnNotif'); if (!b) return;
  const on = ('Notification' in window) && Notification.permission === 'granted';
  b.textContent = on ? '🔔 Lembrete diário ativado ✓' : '🔔 Ativar lembrete diário';
}
$('#btnNotif').onclick = ativarNotificacoes;

function atualizarBtnSom() {
  const b = $('#btnSom'); if (!b) return;
  b.textContent = state.somOff ? '🔇 Som ao subir de nível: Desligado' : '🔊 Som ao subir de nível: Ligado';
}
$('#btnSom').onclick = () => {
  state.somOff = !state.somOff; save(); atualizarBtnSom();
  if (!state.somOff) tocarFanfarra(); // toca de amostra ao ligar
};

// notificacao automatica em segundo plano (Chrome/Android, best-effort)
async function registrarSyncPeriodico() {
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!('periodicSync' in reg)) return;
    const st = await navigator.permissions.query({ name: 'periodic-background-sync' });
    if (st.state === 'granted') {
      await reg.periodicSync.register('lembrete-diario', { minInterval: 12 * 60 * 60 * 1000 });
    }
  } catch (e) {}
}

/* ---------- SOM (fanfarra sintetizada) ---------- */
let audioCtx = null;
function tocarFanfarra() {
  if (state.somOff) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const notas = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6 — acorde ascendente
    notas.forEach((f, i) => {
      const t = now + i * 0.12;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(g).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.5);
    });
  } catch (e) {}
}

/* ---------- SUBIU DE NÍVEL ---------- */
function checarLevelUp() {
  const atual = nivelAtual().nivel;
  if (state.ultimoNivelVisto == null) { state.ultimoNivelVisto = atual; save(); return; }
  if (atual > state.ultimoNivelVisto) {
    state.ultimoNivelVisto = atual; save();
    celebrarNivel(nivelAtual());
  }
}
function celebrarNivel(nv) {
  tocarFanfarra();
  if (navigator.vibrate) navigator.vibrate([90, 50, 140]);
  refreshAll();
  modal({
    title: '🔓 NÍVEL DESBLOQUEADO!',
    body: `<div style="text-align:center">
      <img src="${nv.img}" style="width:130px;height:130px;border-radius:50%;object-fit:cover;border:3px solid var(--gold);margin:4px auto 14px;box-shadow:0 0 24px rgba(245,197,24,.5)">
      <div style="font-size:24px;font-weight:800;color:var(--gold)">${nv.titulo}</div>
      <div style="color:var(--muted);margin-top:4px">${nv.categoria} · Nível ${nv.nivel} de ${TOTAL_NIVEIS}</div>
      <div style="margin-top:14px;color:#fff">Você evoluiu, guerreiro. Mete braça! 🔥</div>
    </div>`, ok: false
  });
}

/* ---------- LOOP ---------- */
function refreshAll() {
  renderContador(); renderNiveis(); renderHumor(); renderPerfil();
}
refreshAll();
novaFrase();
atualizarBtnNotif();
atualizarBtnSom();
checarLembreteDiario();
checarLevelUp();
if ('Notification' in window && Notification.permission === 'granted') registrarSyncPeriodico();
setInterval(renderContador, 1000);
setInterval(checarLevelUp, 30000); // detecta virada de nível com o app aberto
