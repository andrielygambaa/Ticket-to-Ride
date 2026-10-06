/* ================= DADOS DO JOGO ================= */
const CORES = ['vermelha','azul','verde','amarela','rosa','laranja','preta','branca'];
const PONTOS_ROTA = {1:1,2:2,3:4,4:7,5:10,6:15};

const CIDADES = {
  'Seattle':[90,90],'Portland':[70,180],'San Francisco':[60,300],'Los Angeles':[120,450],
  'Phoenix':[190,480],'El Paso':[350,545],'Salt Lake':[190,280],'Denver':[340,330],
  'Helena':[250,150],'Minneapolis':[480,140],'Kansas City':[500,360],'Oklahoma City':[500,445],
  'Dallas':[560,520],'Houston':[620,560],'Chicago':[620,220],'New Orleans':[665,555],
  'Atlanta':[770,430],'Miami':[830,550],'New York':[880,180]
};

const ROTAS = [
  ['Seattle','Portland','cinza',1],['Portland','San Francisco','cinza',2],
  ['San Francisco','Los Angeles','cinza',2],['Los Angeles','Phoenix','cinza',1],
  ['Phoenix','El Paso','cinza',2],['El Paso','Dallas','vermelha',3],
  ['Dallas','Houston','verde',1],['Houston','New Orleans','cinza',2],
  ['New Orleans','Atlanta','verde',3],['Atlanta','Miami','azul',3],
  ['Denver','Chicago','preta',5],['Denver','Kansas City','laranja',3],
  ['Kansas City','Chicago','azul',3],['Kansas City','Dallas','cinza',3],
  ['Kansas City','Oklahoma City','cinza',1],['Oklahoma City','Dallas','cinza',2],
  ['Helena','Minneapolis','verde',3],['Minneapolis','Chicago','azul',2],
  ['Minneapolis','Denver','vermelha',4],['Denver','Salt Lake','verde',3],
  ['Salt Lake','San Francisco','amarela',2],['Helena','Seattle','azul',2],
  ['Helena','Denver','cinza',2],['Helena','Portland','rosa',3],
  ['Denver','Los Angeles','cinza',4],['Chicago','New York','rosa',4],
  ['Chicago','Atlanta','vermelha',4],['Atlanta','New York','laranja',4],
  ['New York','Miami','vermelha',5]
].map((r,i)=>({id:i,a:r[0],b:r[1],cor:r[2],tam:r[3],dono:null}));

const BILHETES = [
  ['Seattle','New York',20],['San Francisco','New York',22],['Los Angeles','Miami',20],
  ['Portland','Chicago',15],['Denver','New York',15],['Helena','Atlanta',12],
  ['Seattle','Miami',22],['San Francisco','Chicago',15],['Los Angeles','Atlanta',17],
  ['Phoenix','New Orleans',14],['Portland','Miami',20]
];

const ROTA_CORES = {vermelha:'#ff6b6b',azul:'#4dabf7',verde:'#51cf66',amarela:'#ffd43b',rosa:'#f783ac',laranja:'#ffa94d',preta:'#495057',branca:'#f1f3f5',cinza:'#adb5bd'};
const AVATARES = ['😀','😎','🤠','🦊','🐼','🦁','🐸','🤖','🧙','🧛','🧝','👩‍🚀'];
let config = {qtd:2, avatares:['😀','😎','🤠','🦊','🐼','🦁']};
const COR_JOGADOR = ['#27ae60','#e74c3c','#3498db','#f39c12','#9b59b6','#795548'];

/* ================= ESTADO ================= */
let S = null; // estado da partida

function embaralhar(v){for(let i=v.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[v[i],v[j]]=[v[j],v[i]];}return v;}

// A lista base tem poucos bilhetes. Sem repetir, 5–6 jogadores esgotavam o baralho
// na distribuição inicial e recebiam `undefined` (quebrava o fim de jogo).
function montarBilhetes(qtd){
  const base = BILHETES.map(b=>({a:b[0],b:b[1],pontos:b[2]}));
  const deck = embaralhar([...base]);
  const minimo = qtd*2 + 12;            // mão inicial de todos + reserva para compras
  while(deck.length < minimo) deck.push(...embaralhar(base.map(b=>({a:b.a,b:b.b,pontos:b.pontos}))));
  return embaralhar(deck);
}

// Evita travamento: quando baralho e cartas abertas acabam, recicla o mercado.
function reciclarBaralho(){
  if(S.baralho.length || S.abertas.length) return false;
  S.baralho = embaralhar(S.abertas.splice(0));
  return true;
}

function novaPartida(){
  const baralho = [];
  CORES.forEach(c=>{for(let i=0;i<10;i++)baralho.push(c)});
  for(let i=0;i<14;i++)baralho.push('coringa');
  embaralhar(baralho);

  const bilhetes = montarBilhetes(config.qtd);

  const nomes = [];
  for(let i=0;i<config.qtd;i++) nomes.push(($('nome'+(i+1))?.value.trim())||`Player ${i+1}`);
  S = {
    jogadores:nomes.map((nome,i)=>({nome:nome.toUpperCase(),cor:'j'+(i+1),avatar:config.avatares[i],trens:20,pontos:0,mao:[],bilhetes:[]})),
    turno:0,
    rotas:JSON.parse(JSON.stringify(ROTAS)),
    baralho,
    abertas:baralho.splice(0,5),
    bilhetesDeck:bilhetes,
    desenhando:0,      // cartas que ainda pode comprar neste turno
    fimPendente:false,
    finalizada:false,   // placar já apurado (partida encerrada no servidor)
    turnosFinais:0
  };
  // mão inicial 4 cartas + 2 bilhetes
  S.jogadores.forEach(j=>{
    for(let i=0;i<4;i++)j.mao.push(S.baralho.pop());
    for(let i=0;i<2;i++){const b=S.bilhetesDeck.pop(); if(b) j.bilhetes.push(b);}
  });
  S.desenhando = 2;
  salvarLocal();
  mostrarTela('tela-jogo');
  renderTudo();
  mensagem('Distribuídas 4 cartas e 2 bilhetes a cada jogador. Boa sorte!');
}

/* ================= UTILITÁRIOS ================= */
const $ = id => document.getElementById(id);
const jog = () => S.jogadores[S.turno];
function mensagem(t){$('msg').textContent = t;}
function contar(mao,cor){return mao.filter(c=>c===cor).length;}
function corCss(c){return c==='cinza'?'cor-cinza':'cor-'+c;}

/* ================= MAPA ================= */
function renderMapa(){
  const svg = $('mapa');
  let h = '';
  // decoração de mapa
  h += `<text x="930" y="40" font-size="30">🧭</text>`;
  h += `<text x="480" y="60" font-size="18">🌲 🌲</text>`;
  h += `<text x="240" y="580" font-size="18">🌲</text>`;
  h += `<text x="740" y="130" font-size="18">⛰️</text>`;
  // trilhos
  S.rotas.forEach(r=>{
    const [x1,y1]=CIDADES[r.a],[x2,y2]=CIDADES[r.b];
    const dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy);
    const ux=dx/len, uy=dy/len, nx=-uy, ny=ux;
    // dormentes (perpendicular)
    const passos = Math.max(2, Math.floor(len/16));
    for(let i=1;i<passos;i++){
      const t=i/passos, px=x1+dx*t, py=y1+dy*t;
      h += `<line class="dormente" x1="${px-nx*6}" y1="${py-ny*6}" x2="${px+nx*6}" y2="${py+ny*6}"/>`;
    }
    // dois trilhos
    h += `<line class="trilho" x1="${x1+nx*3.5}" y1="${y1+ny*3.5}" x2="${x2+nx*3.5}" y2="${y2+ny*3.5}"/>`;
    h += `<line class="trilho" x1="${x1-nx*3.5}" y1="${y1-ny*3.5}" x2="${x2-nx*3.5}" y2="${y2-ny*3.5}"/>`;
    // hitbox clicável
    let cor = r.dono ? '' : ROTA_CORES[r.cor];
    const cls = r.dono ? 'tomada' : '';
    const dash = (!r.dono && r.cor==='cinza') ? 'stroke-dasharray:7 6;stroke-width:5;' : (!r.dono?'stroke-width:5;opacity:.85;':''); 
    if(!r.dono) h += `<line class="rota ${cls}" data-id="${r.id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${cor};${dash}"/>`;
    // vagões coloridos quando a rota for tomada
    if(r.dono){
      const idx = S.jogadores.findIndex(j=>j.cor===r.dono);
      const pc = COR_JOGADOR[idx]||'#333';
      const vagao = Math.max(8,(len-16)/r.tam - 4);
      h += `<line class="rota tomada" data-id="${r.id}" x1="${x1+ux*8}" y1="${y1+uy*8}" x2="${x2-ux*8}" y2="${y2-uy*8}" style="stroke:${pc};stroke-width:11;stroke-linecap:butt;stroke-dasharray:${vagao} 4;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4))"/>`;
    }
    const mx=(x1+x2)/2, my=(y1+y2)/2;
    h += `<text x="${mx}" y="${my-8}" text-anchor="middle">${r.tam}</text>`;
  });
  // cidades (estações)
  for(const [nome,[x,y]] of Object.entries(CIDADES)){
    h += `<circle class="cidade-anel" cx="${x}" cy="${y}" r="8"/><circle class="cidade" cx="${x}" cy="${y}" r="5"/><text x="${x+10}" y="${y-9}">${nome}</text>`;
  }
  svg.innerHTML = h;
  svg.querySelectorAll('.rota').forEach(l=>{
    l.addEventListener('click',()=>abrirRota(+l.dataset.id));
  });
}

/* ================= RENDER ================= */
function renderTudo(){
  if(!S)return;
  $('paineis').innerHTML = S.jogadores.map((j,i)=>`
    <div class="painel-jogador ${S.turno===i?'ativo':''}" style="--pc:${COR_JOGADOR[i]}">
      <div class="avatar-mini">${j.avatar}</div>
      <div>
        <b>${j.nome}</b>
        <div class="stats">🚂<span>${j.trens}</span> 🎫<span>${j.bilhetes.length}</span> 🏆<span>${j.pontos}</span></div>
      </div>
    </div>`).join('');
  $('turno-jogador').textContent = jog().nome;
  $('nome-atual').textContent = jog().nome;
  $('count-baralho').textContent = `(${S.baralho.length})`;

  // cartas abertas
  $('cartas-abertas').innerHTML = S.abertas.map((c,i)=>
    `<div class="carta cor-${c}" data-i="${i}">🚂${c==='coringa'?'★':''}<span class="n">${c}</span></div>`).join('');
  $('cartas-abertas').querySelectorAll('.carta').forEach(el=>
    el.addEventListener('click',()=>pegarCartaAberta(+el.dataset.i)));

  // mão
  $('mao').innerHTML = S.jogadores[S.turno].mao.map(c=>
    `<div class="carta cor-${c}">🚂<span class="n">${c}</span></div>`).join('');

  // bilhetes do jogador atual com status
  $('meus-bilhetes').innerHTML = S.jogadores[S.turno].bilhetes.map(b=>{
    const ok = conecta(S.jogadores[S.turno].cor,b.a,b.b);
    return `<div class="bilhete ${ok?'concluido':''}">🎫 ${b.a} ⇄ ${b.b} (${b.pontos})${ok?' ✓':''}</div>`;
  }).join('') || '—';

  renderMapa();
}

/* ================= COMPRAR CARTAS (ação do turno) ================= */
function fimDaAcaoCartas(){
  if(S.desenhando<=0){S.desenhando=2; proximoTurno();}
}

function pegarBaralho(){
  if(S.desenhando<=0){mensagem('Você já comprou cartas neste turno.');return;}
  reciclarBaralho();
  if(!S.baralho.length){mensagem('Baralho vazio.');return;}
  jog().mao.push(S.baralho.pop());
  S.desenhando--;
  mensagem(jog().nome+' comprou 1 carta do baralho.');
  renderTudo(); fimDaAcaoCartas();
}

function pegarCartaAberta(i){
  if(S.desenhando<=0){mensagem('Limite de compras neste turno atingido.');return;}
  reciclarBaralho();
  const c = S.abertas[i];
  if(c===undefined)return;
  jog().mao.push(c);
  // repõe carta aberta
  S.abertas.splice(i,1);
  if(S.baralho.length)S.abertas.push(S.baralho.pop());
  if(c==='coringa'){
    S.desenhando = 0; // coringa aberta encerra as compras do turno
    mensagem(jog().nome+' pegou um CORINGA (encerra as compras).');
  }else{
    S.desenhando--;
    mensagem(jog().nome+' pegou "'+c+'" das cartas abertas.');
  }
  renderTudo(); fimDaAcaoCartas();
}

/* ================= BILHETES ================= */
function comprarBilhetes(){
  if(S.desenhando<2){mensagem('Primeiro termine/encere as compras de cartas... (uma ação por turno)');return;}
  const oferta = [];
  for(let i=0;i<3&&S.bilhetesDeck.length;i++)oferta.push(S.bilhetesDeck.pop());
  if(!oferta.length){mensagem('Sem bilhetes no baralho.');return;}
  let html = '<h3>Escolha ao menos 1 bilhete:</h3>';
  oferta.forEach((b,i)=>{ html += `<label class="bilhete" style="display:block;margin:6px 0">
    <input type="checkbox" value="${i}" checked> 🎫 ${b.a} ⇄ ${b.b} — ${b.pontos} pts</label>`;});
  html += '<br><button class="btn verde" id="conf-bilhetes">CONFIRMAR</button>';
  abrirModal(html);
  $('conf-bilhetes').addEventListener('click',()=>{
    const marcados=[...document.querySelectorAll('#modal input:checked')].map(el=>+el.value);
    if(!marcados.length){alert('Escolha ao menos 1.');return;}
    marcados.forEach(i=>jog().bilhetes.push(oferta[i]));
    oferta.forEach((b,i)=>{if(!marcados.includes(i))S.bilhetesDeck.unshift(b);});
    $('modal-overlay').classList.remove('aberto');
    mensagem(jog().nome+` comprou ${marcados.length} bilhete(s).`);
    S.desenhando=2; proximoTurno();
  });
}

/* ================= REIVINDICAR ROTA ================= */
function abrirRota(id){
  const r = S.rotas[id];
  if(r.dono){const dono=S.jogadores.find(j=>j.cor===r.dono);mensagem(`Rota já pertence a ${dono?dono.nome:r.dono}.`);return;}
  const j = jog();
  const maoCor = c => j.mao.filter(m=>m===c).length;
  let info = `<h3>🛤️ ${r.a} ⇄ ${r.b}</h3>
    <p>Tamanho: ${r.tam} | Cor: <b>${r.cor}</b> | Pontos: ${PONTOS_ROTA[r.tam]}</p>
    <p>Seus trens: ${j.trens}</p>`;
  if(r.cor==='cinza'){
    info += `<select id="sel-cor" class="btn cinza" style="color:#fff">` + CORES.map(c=>`<option value="${c}">${c} (${maoCor(c)} + ${contar(j.mao,'coringa')} coringa)</option>`).join('') + `</select>`;
    info += `<br><button class="btn verde" id="conf-rota">REIVINDICAR</button>
    <button class="btn rosa" id="btn-voltar-modal">← VOLTAR</button>`;
    info += listaRotasLivres(id);
    abrirModal(info);
    $('conf-rota').addEventListener('click',()=>{
      const c = $('sel-cor').value;
      if(maoCor(c)+contar(j.mao,'coringa')<r.tam){alert('Cartas insuficientes.');return;}
      if(j.trens<r.tam){alert('Trens insuficientes.');return;}
      pagarRota(j,r,c);
    });
    $('btn-voltar-modal').addEventListener('click',()=>$('modal-overlay').classList.remove('aberto'));
    document.querySelectorAll('.rota-opcao button').forEach(b=>b.addEventListener('click',()=>abrirRota(+b.dataset.id)));
    return;
  }
  const tem = maoCor(r.cor), coringas = contar(j.mao,'coringa');
  const pode = tem + coringas >= r.tam && j.trens >= r.tam;
  info += `<p>Você tem: ${tem} de ${r.cor} + ${coringas} coringa.</p>`;
  info += `<button class="btn verde" id="conf-rota" ${pode?'':'disabled'}>REIVINDICAR</button>
  <button class="btn rosa" id="btn-voltar-modal">← VOLTAR</button>`;
  info += listaRotasLivres(id);
  abrirModal(info);
  const btn = $('conf-rota');
  if(pode)btn.addEventListener('click',()=>pagarRota(j,r,r.cor));
  $('btn-voltar-modal').addEventListener('click',()=>$('modal-overlay').classList.remove('aberto'));
  document.querySelectorAll('.rota-opcao button').forEach(b=>b.addEventListener('click',()=>abrirRota(+b.dataset.id)));
}

function listaRotasLivres(excluirId){
  const livres = S.rotas.filter(x=>!x.dono && x.id!==excluirId);
  if(!livres.length) return '<p>Nenhuma outra rota livre.</p>';
  let h = '<hr style="margin:10px 0;opacity:.3"><b>🗺️ Outras cidades/caminhos disponíveis:</b>';
  livres.slice(0,12).forEach(x=>{
    h += `<div class="rota-opcao"><span>${x.a} ⇄ ${x.b} — ${x.cor}, ${x.tam} vagões, ${PONTOS_ROTA[x.tam]} pts</span>
      <button class="btn azul" data-id="${x.id}">ESCOLHER</button></div>`;
  });
  return h;
}

function pagarRota(j,r,cor){
  // valida antes de descontar: a UI normalmente já bloqueia, mas não pode falhar
  if(contar(j.mao,cor) + contar(j.mao,'coringa') < r.tam || j.trens < r.tam){
    mensagem('Faltam cartas ou trens para reivindicar essa rota.');
    return;
  }
  let precisar = r.tam;
  for(let i=j.mao.length-1;i>=0 && precisar>0;i--){
    if(j.mao[i]===cor){j.mao.splice(i,1);precisar--;}
  }
  for(let i=j.mao.length-1;i>=0 && precisar>0;i--){
    if(j.mao[i]==='coringa'){j.mao.splice(i,1);precisar--;}
  }
  j.trens -= r.tam;
  r.dono = j.cor;
  j.pontos += PONTOS_ROTA[r.tam];
  $('modal-overlay').classList.remove('aberto');
  mensagem(`${j.nome} reivindicou ${r.a} ⇄ ${r.b} (+${PONTOS_ROTA[r.tam]} pts)!`);
  if(j.trens<=2 && !S.fimPendente){
    S.fimPendente = true;
    S.turnosFinais = S.jogadores.length - 1; // cada oponente tem mais um turno
    mensagem('⚠ '+j.nome+' tem poucos trens! Cada adversário terá mais um turno.');
  }
  S.desenhando=2; proximoTurno();
}

/* ================= CONECTIVIDADE (bilhetes) ================= */
function conecta(corJogador,a,b){
  const adj = {};
  S.rotas.forEach(r=>{
    if(r.dono!==corJogador)return;
    (adj[r.a]=adj[r.a]||[]).push(r.b);
    (adj[r.b]=adj[r.b]||[]).push(r.a);
  });
  const visto = new Set([a]); const fila=[a];
  while(fila.length){
    const c = fila.shift();
    if(c===b)return true;
    (adj[c]||[]).forEach(n=>{if(!visto.has(n)){visto.add(n);fila.push(n);}});
  }
  return false;
}

/* ================= TURNOS ================= */
function proximoTurno(){
  if(S.fimPendente){
    S.turnosFinais--;
    if(S.turnosFinais<0){renderTudo(); return fimDeJogo();}
  }
  S.turno = (S.turno+1)%S.jogadores.length;
  S.desenhando = 2;
  renderTudo(); salvarLocal(); salvarServidor();
}

function fimDeJogo(){
  S.finalizada = true;   // só agora a partida é considerada encerrada no servidor
  let html = '<h3>🏁 FIM DE JOGO 🏁</h3>';
  S.jogadores.forEach(j=>{
    let ganhoB=0,perdaB=0;
    j.bilhetes.forEach(b=>{conecta(j.cor,b.a,b.b)?ganhoB+=b.pontos:perdaB+=b.pontos;});
    const total = j.pontos + ganhoB - perdaB;
    j.pontos = total;
    html += `<p><b>${j.nome}</b>: rotas ${j.pontos-(ganhoB-perdaB)} | bilhetes +${ganhoB}/-${perdaB} | TOTAL: <b>${total}</b></p>`;
  });
  const max = Math.max(...S.jogadores.map(j=>j.pontos));
  const vencedores = S.jogadores.filter(j=>j.pontos===max);
  const vencedor = vencedores.length>1 ? 'EMPATE ENTRE '+vencedores.map(j=>j.nome).join(', ')+'!' : vencedores[0].nome+' VENCEU!';
  html += `<h3 style="color:#2e8b8b">${vencedor}</h3><button class="btn verde" id="btn-fim-ok">VOLTAR AO MENU</button>`;
  abrirModal(html);
  $('btn-fim-ok').addEventListener('click',()=>{S=null;mostrarTela('tela-menu');$('modal-overlay').classList.remove('aberto');});
  salvarLocal(); salvarServidor();   // guarda o placar final
  renderTudo();
}

/* ================= MODAL / TELAS ================= */
function abrirModal(html){$('modal').innerHTML = html;$('modal-overlay').classList.add('aberto');}
function mostrarTela(id){document.querySelectorAll('.tela').forEach(t=>t.classList.remove('ativa'));$(id).classList.add('ativa');}

$('btn-regras').addEventListener('click',()=>abrirModal(`<h3>🚂 COMO JOGAR — Guia da Estação</h3>
<h4>🎯 Objetivo</h4>
<p>Conectar cidades com suas rotas de trem e completar bilhetes para marcar mais pontos que os adversários.</p>
<h4>🔄 Seu turno — escolha UMA ação:</h4>
<ul style="margin-left:18px;line-height:1.7">
<li>🃏 <b>Comprar cartas de trem</b>: pegue 2 cartas (do baralho ou das 5 cartas abertas). Coringa aberto vale como compra única.</li>
<li>🎫 <b>Comprar bilhetes</b>: escolha ao menos 1 entre 3 bilhetes oferecidos.</li>
<li>🛤️ <b>Reivindicar uma rota</b>: pague o número de cartas da cor da rota (coringas valem de qualquer cor). Rotas cinzas aceitam qualquer cor uniforme.</li>
</ul>
<h4>🏆 Pontuação das rotas</h4>
<p>1 vagão → 1 pts • 2 → 2 • 3 → 4 • 4 → 7 • 5 → 10 • 6 → 15</p>
<h4>🎫 Bilhetes</h4>
<p>No fim do jogo, bilhetes completados (cidades ligadas pelos seus trilhos) somam pontos; os fracassados <b>subtraem</b>.</p>
<h4>🏁 Fim de jogo</h4>
<p>Quando um jogador fica com 2 trens ou menos, cada adversário joga mais um turno. Depois soma-se tudo: rotas + bilhetes concluídos − bilhetes perdidos.</p>
<h4>💡 Dicas</h4>
<ul style="margin-left:18px;line-height:1.7">
<li>Guarde coringas para rotas longas.</li>
<li>Rotas cinzas são flexíveis — deixe para depois!</li>
<li>Não deixe bilhetes difíceis demais na mão.</li>
</ul>
<button class="btn rosa" onclick="document.getElementById('modal-overlay').classList.remove('aberto')">← FECHAR</button>`));

$('btn-nova').addEventListener('click',()=>mostrarTela('tela-config'));
$('btn-voltar-menu').addEventListener('click',()=>mostrarTela('tela-menu'));
$('btn-comecar').addEventListener('click',novaPartida);
$('btn-voltar-jogo').addEventListener('click',()=>mostrarTela('tela-menu'));
$('btn-comprar-baralho').addEventListener('click',pegarBaralho);
$('btn-comprar-bilhetes').addEventListener('click',comprarBilhetes);
$('btn-salvar').addEventListener('click',async()=>{await salvarServidor(true); mensagem('Partida salva.');});
$('btn-carregar').addEventListener('click',carregarPartida);

// ===== TELA DE CONFIGURAÇÃO (2–6 jogadores) =====
const CORES_CARD = ['#27ae60','#e74c3c','#3498db','#f39c12','#9b59b6','#795548'];
const NOME_PADRAO = ['Andry','Nabila','Ana','Bia','Caio','Duda'];

function montarAvatares(elId, idx){
  const el = $(elId);
  el.innerHTML = AVATARES.map((a,i)=>`<button data-a="${a}" title="${a}">${a}</button>`).join('');
  el.querySelectorAll('button').forEach(b=>{
    if(b.dataset.a === config.avatares[idx]) b.classList.add('sel');
    b.addEventListener('click',()=>{
      el.querySelectorAll('button').forEach(x=>x.classList.remove('sel'));
      b.classList.add('sel');
      config.avatares[idx] = b.dataset.a;
    });
  });
}

function montarConfig(){
  $('config-grid').innerHTML = Array.from({length:config.qtd},(_,i)=>`
    <div class="config-card" style="--cor:${CORES_CARD[i]}">
      <h3>🚂 Jogador ${i+1}</h3>
      <input id="nome${i+1}" type="text" maxlength="14" value="${NOME_PADRAO[i]}" placeholder="Seu nome">
      <p>Escolha seu avatar:</p>
      <div class="avatares" id="av${i+1}"></div>
    </div>`).join('');
  for(let i=0;i<config.qtd;i++) montarAvatares('av'+(i+1), i);
  document.querySelectorAll('.qbtn').forEach(b=>b.classList.toggle('sel',+b.dataset.n===config.qtd));
}

document.querySelectorAll('.qbtn').forEach(b=>b.addEventListener('click',()=>{
  config.qtd = +b.dataset.n;
  montarConfig();
}));
montarConfig();

/* ================= PERSISTÊNCIA (AJAX → PHP, fallback localStorage) ================= */
const API = 'php/api.php';

async function salvarServidor(manual){
  try{
    const r = await fetch(API+'?acao=salvar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({estado:S})});
    const j = await r.json();
    if(j.ok){if(j.partida_id)S.partida_id=j.partida_id; salvarLocal(); if(manual)mensagem('Salvo no servidor ✓');}
    else if(manual)mensagem('Servidor recusou; salvo localmente.');
  }catch(e){ if(manual)mensagem('Sem servidor PHP — usando backup local.'); }
}
function salvarLocal(){try{localStorage.setItem('ttr_save',JSON.stringify(S));}catch(e){}}

async function carregarPartida(){
  // tenta servidor; senão local
  try{
    const r = await fetch(API+'?acao=carregar_ultimo');
    const j = await r.json();
    if(j.ok && j.estado){S=j.estado; mostrarTela('tela-jogo'); renderTudo(); mensagem('Partida carregada do servidor.'); return;}
  }catch(e){}
  const loc = localStorage.getItem('ttr_save');
  if(loc){S=JSON.parse(loc); mostrarTela('tela-jogo'); renderTudo(); mensagem('Partida carregada do backup local.');}
  else alert('Nenhuma partida salva encontrada.');
}
