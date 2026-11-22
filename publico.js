// Páginas públicas do Ultramacho. Lê a função `publico` (só dados públicos) e monta a tela com textContent (sem HTML do usuário).
var API = 'https://ivmgxraaofmmxvdkuahn.supabase.co/functions/v1/publico';
function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function get(url) { return fetch(url).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); }); }
function dur(s) { if (!s) return null; var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.round(s % 60); if (h) return h + ' h ' + String(m).padStart(2, '0') + ' min'; if (m) return m + ' min ' + String(x).padStart(2, '0') + ' s'; return x + ' s'; }
function km(m) { return m ? (m / 1000).toFixed(m >= 10000 ? 1 : 2).replace('.', ',') + ' km' : null; }
function ritmo(m, s) { if (!m || !s || m < 100) return null; var p = s / (m / 1000); return Math.floor(p / 60) + ':' + String(Math.round(p % 60)).padStart(2, '0') + ' /km'; }
function data(iso) { try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
function numeros(t) {
  if (!t) return [];
  var o = [];
  if (t.distancia_m) o.push(['Distância', km(t.distancia_m)]);
  if (t.distancia_m && t.duracao_s && (t.esporte_key === 'corrida' || t.esporte_key === 'trilha')) o.push(['Ritmo', ritmo(t.distancia_m, t.duracao_s)]);
  if (t.volume_kg) o.push(['Volume', t.volume_kg.toLocaleString('pt-BR') + ' kg']);
  if (t.duracao_s) o.push(['Tempo', dur(t.duracao_s)]);
  if (t.calorias) o.push(['Calorias', t.calorias + ' kcal']);
  return o.filter(function (n) { return n[1]; });
}
function avatar(nome, foto) { var a = el('div', 'avatar'); if (foto) { var i = el('img'); i.src = foto; i.alt = ''; a.appendChild(i); } else a.textContent = (nome || '?').trim().charAt(0).toUpperCase(); return a; }
function cta(root) {
  var c = el('div', 'card cta');
  c.appendChild(el('h2', null, 'Treine junto no Ultramacho'));
  c.appendChild(el('p', 'sub', 'A rede social dos atletas amadores: academia, CrossFit, corrida, trilha e ciclismo. O app está em teste fechado e chega às lojas em breve.'));
  var a = el('a', 'btn', 'Abrir no app'); a.href = 'ultramacho://'; c.appendChild(a);
  root.appendChild(c);
}
function erro(root, titulo, texto) { var c = el('div', 'card erro'); c.appendChild(el('h1', null, titulo)); c.appendChild(el('p', 'sub', texto)); root.appendChild(c); cta(root); }
function topo(root) {
  var l = el('img', 'logo light'); l.src = 'assets/lockup_light.png'; l.alt = 'Ultramacho';
  var d = el('img', 'logo dark'); d.src = 'assets/lockup_dark.png'; d.alt = 'Ultramacho';
  root.appendChild(l); root.appendChild(d);
}
function statsBox(t) {
  var n = numeros(t); if (!n.length) return null;
  var s = el('div', 'stats'); n.forEach(function (x) { var d = el('div'); d.appendChild(el('b', null, x[1])); d.appendChild(el('span', null, x[0])); s.appendChild(d); }); return s;
}

function paginaPerfil() {
  var root = document.getElementById('app'); topo(root);
  var u = (new URLSearchParams(location.search).get('u') || '').replace(/^@/, '');
  if (!u) return erro(root, 'Perfil não informado', 'Use o link compartilhado pelo atleta.');
  get(API + '?tipo=perfil&u=' + encodeURIComponent(u)).then(function (r) {
    if (!r.ok) return erro(root, 'Perfil não encontrado', 'Esse perfil não existe ou não é público.');
    var p = r.j.perfil; document.title = p.nome + ' (@' + p.usuario + ') · Ultramacho';
    var c = el('div', 'card'); var h = el('div', 'head'); h.appendChild(avatar(p.nome, p.foto));
    var w = el('div'); w.appendChild(el('h1', null, p.nome)); w.appendChild(el('p', 'sub', '@' + p.usuario)); h.appendChild(w); c.appendChild(h);
    if (p.bio) c.appendChild(el('p', null, p.bio));
    if (p.esportes && p.esportes.length) { var ch = el('div', 'chips'); p.esportes.forEach(function (e) { ch.appendChild(el('span', 'chip', e)); }); c.appendChild(ch); }
    var ct = el('div', 'counts'); [['Posts', p.posts], ['Seguidores', p.seguidores], ['Seguindo', p.seguindo]].forEach(function (x) { var d = el('div'); d.appendChild(el('b', null, String(x[1]))); d.appendChild(el('span', null, x[0])); ct.appendChild(d); }); c.appendChild(ct);
    root.appendChild(c);
    if (r.j.posts.length) {
      var g = el('div', 'card'); g.appendChild(el('h2', null, 'Últimos posts')); var grid = el('div', 'grid');
      r.j.posts.forEach(function (x) {
        var a = el('a', 'tile'); a.href = 'post.html?id=' + encodeURIComponent(x.id);
        if (x.midia && x.midia.tipo === 'imagem') { var i = el('img'); i.src = x.midia.url; i.alt = ''; i.loading = 'lazy'; a.appendChild(i); if (x.treino) a.appendChild(el('span', 'tag', x.treino.esporte)); }
        else a.appendChild(el('div', 'txt', (x.texto || (x.treino ? x.treino.esporte : 'Post')).slice(0, 110)));
        grid.appendChild(a);
      }); g.appendChild(grid); root.appendChild(g);
    }
    cta(root);
  }).catch(function () { erro(root, 'Sem conexão', 'Não deu para carregar agora. Tente de novo em instantes.'); });
}

function paginaPost() {
  var root = document.getElementById('app'); topo(root);
  var id = new URLSearchParams(location.search).get('id') || '';
  if (!id) return erro(root, 'Post não informado', 'Use o link compartilhado pelo atleta.');
  get(API + '?tipo=post&id=' + encodeURIComponent(id)).then(function (r) {
    if (!r.ok) return erro(root, 'Post não encontrado', 'Esse post não existe ou não é público.');
    var p = r.j.post, a = r.j.autor; document.title = a.nome + ' no Ultramacho';
    var c = el('div', 'card'); var h = el('div', 'head'); h.appendChild(avatar(a.nome, a.foto));
    var w = el('div'); var t = el('h1', null, a.nome); w.appendChild(t);
    var s = el('p', 'sub'); var l = el('a', null, '@' + a.usuario); l.href = 'perfil.html?u=' + encodeURIComponent(a.usuario); s.appendChild(l); s.appendChild(document.createTextNode(' · ' + data(p.criado_em))); w.appendChild(s); h.appendChild(w); c.appendChild(h);
    if (p.texto) c.appendChild(el('p', 'texto', p.texto));
    if (p.midia && p.midia.length) { var m = el('div', 'media'); p.midia.forEach(function (x) { if (x.tipo === 'video') { var v = el('video'); v.src = x.url; v.controls = true; v.playsInline = true; m.appendChild(v); } else { var i = el('img'); i.src = x.url; i.alt = 'Foto do post'; i.loading = 'lazy'; m.appendChild(i); } }); c.appendChild(m); }
    var sb = statsBox(p.treino); if (sb) c.appendChild(sb);
    c.appendChild(el('p', 'sub', p.curtidas + ' ' + (p.curtidas === 1 ? 'força' : 'forças') + ' · ' + p.comentarios + ' ' + (p.comentarios === 1 ? 'comentário' : 'comentários')));
    root.appendChild(c); cta(root);
  }).catch(function () { erro(root, 'Sem conexão', 'Não deu para carregar agora. Tente de novo em instantes.'); });
}
