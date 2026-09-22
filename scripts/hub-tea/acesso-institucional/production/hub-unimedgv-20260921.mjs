var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
var DOMAIN = "https://hub.unimedgv.com";
var FAVICON_TAGS = `
<link rel="icon" type="image/x-icon" href="/_assets/favicons/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/_assets/favicons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/_assets/favicons/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/_assets/favicons/apple-touch-icon.png">
`;
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
__name(json, "json");
function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...extraHeaders }
  });
}
__name(html, "html");
function getContentType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const map = {
    html: "text/html; charset=utf-8",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    ico: "image/x-icon",
    pdf: "application/pdf",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    mp4: "video/mp4",
    webm: "video/webm"
  };
  return map[ext] || "application/octet-stream";
}
__name(getContentType, "getContentType");
async function verifyAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return false;
  const stored = await env.PAGES_KV.get("config:admin_token");
  return stored && token === stored;
}
__name(verifyAuth, "verifyAuth");
function buildOgTags(meta) {
  const title = meta.title || "Hub Unimed GV";
  const desc = meta.description || "";
  const url = meta.public_url || DOMAIN;
  const image = meta.og_image || "";
  let tags = `
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">`;
  if (image) {
    tags += `
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">`;
  }
  tags += `
<meta property="og:site_name" content="Hub \u2014 Unimed Governador Valadares">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">`;
  if (image) {
    tags += `
<meta name="twitter:image" content="${image}">`;
  }
  return tags;
}
__name(buildOgTags, "buildOgTags");
function injectHeadTags(response, extraTags) {
  return new HTMLRewriter().on("head", {
    element(element) {
      element.prepend(FAVICON_TAGS + extraTags, { html: true });
    }
  }).transform(response);
}
__name(injectHeadTags, "injectHeadTags");
function errorPage(title, message, status = 404) {
  const body = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} \u2014 Unimed GV</title>
${FAVICON_TAGS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
background:#f8faf8;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#1a1a1a}
.card{background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,60,30,.08);
padding:48px;max-width:480px;text-align:center;border-top:4px solid #00995D}
h1{font-size:1.5rem;color:#00995D;margin-bottom:12px}
p{font-size:0.95rem;color:#64748b;line-height:1.6}
.badge{display:inline-block;margin-top:24px;padding:6px 16px;border-radius:20px;
font-size:0.8rem;font-weight:600;background:#e8f5e9;color:#00995D}
</style>
</head>
<body>
<div class="card">
<h1>${title}</h1>
<p>${message}</p>
<span class="badge">hub.unimedgv.com</span>
</div>
</body>
</html>`;
  return html(body, status);
}
__name(errorPage, "errorPage");
async function serveSharedAsset(env, assetPath) {
  const object = await env.PAGES_R2.get(assetPath);
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }
  const headers = new Headers();
  headers.set("Content-Type", getContentType(assetPath));
  headers.set("Cache-Control", "public, max-age=86400");
  object.writeHttpMetadata(headers);
  return new Response(object.body, { headers });
}
__name(serveSharedAsset, "serveSharedAsset");
async function handlePublicRequest(request, env, slug, subpath) {
  const meta = await env.PAGES_KV.get(`page:${slug}`, "json");
  if (!meta) {
    return errorPage(
      "Pagina nao encontrada",
      "O conteudo solicitado nao existe ou foi removido."
    );
  }
  if (meta.status !== "active") {
    return errorPage(
      "Conteudo indisponivel",
      "Esta pagina foi temporariamente desativada pelo administrador."
    );
  }
  const key = subpath ? `${slug}/${subpath}` : `${slug}/index.html`;
  const object = await env.PAGES_R2.get(key);
  if (!object) {
    if (!subpath) {
      return errorPage(
        "Pagina nao encontrada",
        "O arquivo principal desta pagina nao foi encontrado."
      );
    }
    return new Response("Not Found", { status: 404 });
  }
  const contentType = getContentType(key);
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "public, max-age=300");
  object.writeHttpMetadata(headers);
  if (contentType.startsWith("text/html")) {
    const ogTags = buildOgTags(meta);
    const baseResponse = new Response(object.body, { headers });
    return injectHeadTags(baseResponse, ogTags);
  }
  return new Response(object.body, { headers });
}
__name(handlePublicRequest, "handlePublicRequest");
async function apiPublicList(env) {
  const list = await env.PAGES_KV.list({ prefix: "page:" });
  const pages = [];
  for (const key of list.keys) {
    const meta = await env.PAGES_KV.get(key.name, "json");
    if (meta && meta.status === "active") {
      pages.push({
        slug: meta.slug,
        title: meta.title,
        public_url: meta.public_url
      });
    }
  }
  return json({ pages });
}
__name(apiPublicList, "apiPublicList");
async function apiListPages(env) {
  const list = await env.PAGES_KV.list({ prefix: "page:" });
  const pages = [];
  for (const key of list.keys) {
    const meta = await env.PAGES_KV.get(key.name, "json");
    if (meta) pages.push(meta);
  }
  return json({ pages });
}
__name(apiListPages, "apiListPages");
async function apiToggle(request, env) {
  const body = await request.json();
  const { slug } = body;
  if (!slug) return json({ error: "slug e obrigatorio" }, 400);
  const meta = await env.PAGES_KV.get(`page:${slug}`, "json");
  if (!meta) return json({ error: "Pagina nao encontrada" }, 404);
  meta.status = meta.status === "active" ? "inactive" : "active";
  meta.updated_at = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  await env.PAGES_KV.put(`page:${slug}`, JSON.stringify(meta));
  return json({ success: true, slug, status: meta.status });
}
__name(apiToggle, "apiToggle");
async function apiUpload(request, env) {
  const formData = await request.formData();
  const slug = formData.get("slug");
  const title = formData.get("title") || slug;
  const description = formData.get("description") || "";
  if (!slug) return json({ error: "slug e obrigatorio" }, 400);
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length > 2) {
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return json({ error: "slug invalido (use apenas a-z, 0-9, hifen)" }, 400);
    }
  }
  const files = formData.getAll("files");
  if (!files || files.length === 0) {
    return json({ error: "Nenhum arquivo enviado" }, 400);
  }
  let htmlCount = 0;
  let firstHtmlName = null;
  for (const file of files) {
    const filename = file.name;
    const key = `${slug}/${filename}`;
    const arrayBuffer = await file.arrayBuffer();
    const contentType = file.type || getContentType(filename);
    await env.PAGES_R2.put(key, arrayBuffer, {
      httpMetadata: { contentType }
    });
    if (filename.endsWith(".html")) {
      htmlCount++;
      if (!firstHtmlName) firstHtmlName = filename;
    }
  }
  if (htmlCount === 1 && firstHtmlName && firstHtmlName !== "index.html") {
    const original = await env.PAGES_R2.get(`${slug}/${firstHtmlName}`);
    if (original) {
      await env.PAGES_R2.put(`${slug}/index.html`, await original.arrayBuffer(), {
        httpMetadata: { contentType: "text/html; charset=utf-8" }
      });
    }
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const meta = {
    slug,
    title,
    description,
    status: "active",
    created_at: today,
    updated_at: today,
    public_url: `${DOMAIN}/${slug}/`,
    file_count: files.length
  };
  await env.PAGES_KV.put(`page:${slug}`, JSON.stringify(meta));
  return json(meta);
}
__name(apiUpload, "apiUpload");
async function apiDelete(request, env) {
  const body = await request.json();
  const { slug } = body;
  if (!slug) return json({ error: "slug e obrigatorio" }, 400);
  const meta = await env.PAGES_KV.get(`page:${slug}`, "json");
  if (!meta) return json({ error: "Pagina nao encontrada" }, 404);
  const listed = await env.PAGES_R2.list({ prefix: `${slug}/` });
  for (const obj of listed.objects) {
    await env.PAGES_R2.delete(obj.key);
  }
  await env.PAGES_KV.delete(`page:${slug}`);
  return json({ success: true, slug, message: "Pagina removida" });
}
__name(apiDelete, "apiDelete");
async function apiChangePassword(request, env) {
  const body = await request.json();
  const { new_password } = body;
  if (!new_password || new_password.length < 4) {
    return json({ error: "Senha deve ter pelo menos 4 caracteres" }, 400);
  }
  await env.PAGES_KV.put("config:admin_token", new_password);
  return json({ success: true, message: "Senha alterada com sucesso." });
}
__name(apiChangePassword, "apiChangePassword");
function serveAdmin(env) {
  const adminHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin \u2014 Hub Unimed GV</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',-apple-system,sans-serif;background:#f8faf8;color:#1a1a1a;padding:24px}
.container{max-width:900px;margin:0 auto}
h1{color:#00995D;margin-bottom:24px;font-size:1.5rem}
.login{max-width:360px;margin:80px auto;text-align:center}
.login input{width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;margin:12px 0;font-size:1rem}
.login button,.btn{background:#00995D;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600}
.login button:hover,.btn:hover{background:#007a4a}
table{width:100%;border-collapse:collapse;margin-top:16px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.05)}
th,td{padding:12px 16px;text-align:left;border-bottom:1px solid #f0f0f0}
th{background:#f8faf8;font-weight:600;color:#333}
.status-active{color:#00995D;font-weight:600}
.status-inactive{color:#999}
.actions button{margin-right:8px;padding:6px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:0.8rem}
.actions button:hover{background:#f0f0f0}
.upload-area{margin:24px 0;padding:24px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.05)}
.upload-area input,.upload-area textarea{width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;margin:8px 0;font-size:0.9rem}
.upload-area label{font-weight:600;font-size:0.85rem;color:#555}
</style>
</head>
<body>
<div class="container" id="app">
<div class="login" id="loginPanel">
<h1>Hub Unimed GV</h1>
<p style="color:#666;margin-bottom:16px">Painel administrativo</p>
<input type="password" id="pwd" placeholder="Senha de acesso" onkeydown="if(event.key==='Enter')login()">
<br><button onclick="login()">Entrar</button>
</div>
<div id="mainPanel" style="display:none">
<h1>Hub Unimed GV \u2014 Admin</h1>
<div class="upload-area">
<h3 style="margin-bottom:12px">Publicar nova pagina</h3>
<label>Slug (URL)</label>
<input type="text" id="slug" placeholder="ex: cuidado-coordenado">
<label>Titulo</label>
<input type="text" id="title" placeholder="Titulo da pagina">
<label>Descricao</label>
<textarea id="desc" rows="2" placeholder="Descricao curta"></textarea>
<label>Arquivos</label>
<input type="file" id="files" multiple>
<br><button class="btn" onclick="upload()" style="margin-top:12px">Publicar</button>
</div>
<table>
<thead><tr><th>Slug</th><th>Titulo</th><th>Status</th><th>Acoes</th></tr></thead>
<tbody id="pagesList"></tbody>
</table>
</div>
</div>
<script>
let token='';
function api(path,opts={}){
  return fetch('/api/'+path,{...opts,headers:{...opts.headers,'Authorization':'Bearer '+token,'Content-Type':'application/json'}});
}
function login(){
  token=document.getElementById('pwd').value;
  sessionStorage.setItem('t',token);
  api('pages').then(r=>{if(r.ok){document.getElementById('loginPanel').style.display='none';document.getElementById('mainPanel').style.display='block';loadPages();}else{alert('Senha incorreta');}});
}
function loadPages(){
  api('pages').then(r=>r.json()).then(d=>{
    const tbody=document.getElementById('pagesList');
    tbody.innerHTML=d.pages.map(p=>'<tr><td><a href="/'+p.slug+'/" target="_blank">'+p.slug+'</a></td><td>'+p.title+'</td><td class="status-'+(p.status||'active')+'">'+(p.status||'active')+'</td><td class="actions"><button onclick="toggle(\\''+p.slug+'\\')">Toggle</button><button onclick="del(\\''+p.slug+'\\')">Excluir</button></td></tr>').join('');
  });
}
function toggle(slug){api('toggle',{method:'POST',body:JSON.stringify({slug})}).then(()=>loadPages());}
function del(slug){if(confirm('Excluir '+slug+'?'))api('delete',{method:'POST',body:JSON.stringify({slug})}).then(()=>loadPages());}
function upload(){
  const fd=new FormData();
  fd.append('slug',document.getElementById('slug').value);
  fd.append('title',document.getElementById('title').value);
  fd.append('description',document.getElementById('desc').value);
  const f=document.getElementById('files').files;
  for(let i=0;i<f.length;i++)fd.append('files',f[i]);
  fetch('/api/upload',{method:'POST',headers:{'Authorization':'Bearer '+token},body:fd}).then(r=>r.json()).then(d=>{if(d.success!==false){alert('Publicado!');loadPages();}else{alert(d.error);}});
}
if(sessionStorage.getItem('t')){token=sessionStorage.getItem('t');document.getElementById('loginPanel').style.display='none';document.getElementById('mainPanel').style.display='block';loadPages();}
<\/script>
</body>
</html>`;
  return html(adminHtml);
}
__name(serveAdmin, "serveAdmin");
function handleHealth() {
  return json({
    status: "ok",
    service: "hub-unimedgv",
    domain: DOMAIN,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
__name(handleHealth, "handleHealth");
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (path === "/health") return handleHealth();
    if (path.startsWith("/_assets/")) {
      const assetPath = path.replace(/^\//, "");
      return serveSharedAsset(env, assetPath);
    }
    if (path === "/_admin" || path === "/_admin/") {
      return serveAdmin(env);
    }
    if (path === "/api/public-list" && method === "GET") {
      return apiPublicList(env);
    }
    if (path.startsWith("/api/")) {
      if (!await verifyAuth(request, env)) {
        return json({ error: "Nao autorizado" }, 401);
      }
      if (path === "/api/pages" && method === "GET")
        return apiListPages(env);
      if (path === "/api/toggle" && method === "POST")
        return apiToggle(request, env);
      if (path === "/api/upload" && method === "POST")
        return apiUpload(request, env);
      if (path === "/api/delete" && method === "POST")
        return apiDelete(request, env);
      if (path === "/api/change-password" && method === "POST")
        return apiChangePassword(request, env);
      return json({ error: "Rota nao encontrada" }, 404);
    }
    if (path === "/" || path === "") {
      return errorPage(
        "Hub \u2014 Unimed Governador Valadares",
        "Portal de conteudos da Unimed Governador Valadares. Acesse o link especifico do conteudo desejado.",
        200
      );
    }
    const parts = path.replace(/^\//, "").replace(/\/$/, "").split("/");
    const slug = parts[0];
    const subpath = parts.slice(1).join("/") || null;
    if (!subpath && !path.endsWith("/")) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = `/${slug}/`;
      return Response.redirect(redirectUrl.toString(), 301);
    }
    if (slug.startsWith("_") || slug.startsWith(".")) {
      return errorPage("Acesso negado", "Rota reservada.", 403);
    }
    return handlePublicRequest(request, env, slug, subpath);
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
