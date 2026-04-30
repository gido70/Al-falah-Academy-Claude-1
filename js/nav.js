/**
 * ═══════════════════════════════════════════════
 *  FALAH PLATFORM v7 — المكتبة المشتركة
 *  nav.js — شريط التنقل + نظام الحفظ + رفع الملفات
 * ═══════════════════════════════════════════════
 */

// ══════════════════════════════════════
//  1. شريط التنقل الدائم (يُضاف لكل صفحة)
// ══════════════════════════════════════
function injectNav(activePage) {
  const links = [
    { id:'home',        href:'/',                    icon:'🏠', label:'الرئيسية' },
    { id:'evaluation',  href:'/evaluation/',          icon:'📋', label:'التقييم' },
    { id:'schedule',    href:'/schedule/',            icon:'🗓️', label:'جدول الدوام' },
    { id:'admin-report',href:'/admin-report/',        icon:'📤', label:'تقرير الإدارة' },
    { id:'compare',     href:'/compare/',             icon:'📊', label:'المقارنة' },
    { id:'ai-eval',     href:'/ai-eval/',             icon:'🤖', label:'تقييم AI' },
  ];

  // Detect repo base path for GitHub Pages
  const base = getBasePath();

  const nav = document.createElement('div');
  nav.id = 'falah-topnav';
  nav.style.cssText = `
    position:fixed; top:0; right:0; left:0; z-index:9999;
    background:linear-gradient(90deg,#0c447c,#185fa5,#0f6e56);
    display:flex; align-items:center; gap:2px; padding:0 12px;
    box-shadow:0 3px 16px rgba(12,68,124,.4); height:48px;
    font-family:Cairo,sans-serif; direction:rtl;
  `;

  links.forEach(link => {
    const a = document.createElement('a');
    a.href = base + link.href.replace(/^\//,'');
    a.style.cssText = `
      display:inline-flex; align-items:center; gap:5px; padding:6px 12px;
      border-radius:8px; font-size:13px; font-weight:700; text-decoration:none;
      transition:all .18s; white-space:nowrap; color:rgba(255,255,255,.85);
      border-bottom:3px solid transparent;
    `;
    if(link.id === activePage){
      a.style.background = 'rgba(255,255,255,.18)';
      a.style.color = '#ffe07a';
      a.style.borderBottomColor = '#f0a500';
    }
    if(link.id === 'home'){
      a.style.background = 'rgba(255,255,255,.15)';
      a.style.border = '1.5px solid rgba(255,255,255,.35)';
      a.style.borderRadius = '20px';
      a.style.color = '#fff';
      a.style.fontWeight = '900';
    }
    a.onmouseover = () => { if(link.id !== activePage) a.style.background='rgba(255,255,255,.1)'; };
    a.onmouseout  = () => { if(link.id !== activePage) a.style.background=''; };
    a.innerHTML = `<span>${link.icon}</span><span>${link.label}</span>`;
    nav.appendChild(a);
  });

  // Clock
  const clock = document.createElement('div');
  clock.id = 'nav-clock';
  clock.style.cssText = 'margin-right:auto;color:rgba(255,255,255,.8);font-size:12px;font-weight:700;font-family:Cairo,sans-serif;';
  nav.appendChild(clock);
  setInterval(()=>{
    clock.textContent = new Date().toLocaleString('ar-AE',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  }, 1000);

  document.body.insertBefore(nav, document.body.firstChild);

  // Push content down
  const pusher = document.createElement('div');
  pusher.style.height = '48px';
  document.body.insertBefore(pusher, nav.nextSibling);
}

// ══════════════════════════════════════
//  2. تحديد المسار الأساسي (GitHub Pages)
// ══════════════════════════════════════
function getBasePath() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  // If on GitHub Pages: username.github.io/repo-name/...
  if(window.location.hostname.includes('github.io') && parts.length >= 1) {
    return '/' + parts[0] + '/';
  }
  return '/';
}

// ══════════════════════════════════════
//  3. نظام الحفظ المدمج (محلي + GitHub)
// ══════════════════════════════════════
const FalahStorage = {
  getConfig() {
    return {
      token: localStorage.getItem('gh_token') || '',
      owner: localStorage.getItem('gh_owner') || '',
      repo:  localStorage.getItem('gh_repo')  || '',
    };
  },
  isConfigured() {
    const c = this.getConfig();
    return !!(c.token && c.owner && c.repo);
  },
  apiBase() {
    const c = this.getConfig();
    return `https://api.github.com/repos/${c.owner}/${c.repo}/contents/data`;
  },
  headers() {
    return {
      'Authorization': `Bearer ${this.getConfig().token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  },

  // حفظ JSON
  async save(path, data) {
    const json = JSON.stringify(data, null, 2);
    localStorage.setItem('ls_' + path, json);
    if (!this.isConfigured()) return { ok:false, local:true };
    try {
      const sha = localStorage.getItem('sha_' + path);
      const res = await fetch(`${this.apiBase()}/${path}`, {
        method:'PUT', headers: this.headers(),
        body: JSON.stringify({
          message: `حفظ: ${path} — ${new Date().toLocaleString('ar-AE')}`,
          content: btoa(unescape(encodeURIComponent(json))),
          ...(sha ? {sha} : {})
        })
      });
      if(res.ok) {
        const r = await res.json();
        localStorage.setItem('sha_' + path, r.content.sha);
        return {ok:true};
      }
      if(res.status===409||res.status===422){
        localStorage.removeItem('sha_'+path);
        return this.save(path, data);
      }
      return {ok:false, local:true};
    } catch(e) { return {ok:false, local:true}; }
  },

  // تحميل JSON
  async load(path) {
    if(this.isConfigured()) {
      try {
        const res = await fetch(`${this.apiBase()}/${path}`, {headers:this.headers()});
        if(res.ok) {
          const f = await res.json();
          const data = JSON.parse(decodeURIComponent(escape(atob(f.content.replace(/\n/g,'')))));
          localStorage.setItem('ls_'+path, JSON.stringify(data));
          localStorage.setItem('sha_'+path, f.sha);
          return data;
        }
      } catch(e) {}
    }
    try { const r = localStorage.getItem('ls_'+path); return r ? JSON.parse(r) : null; }
    catch(e) { return null; }
  },

  // رفع ملف (صورة أو PDF أو أي ملف)
  async uploadFile(path, base64Content, filename) {
    // دائماً احفظ محلياً
    const key = 'file_' + path;
    const existing = JSON.parse(localStorage.getItem(key)||'[]');
    existing.push({ name:filename, content:base64Content, uploadedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing));

    if(!this.isConfigured()) return {ok:false, local:true};

    try {
      const sha = localStorage.getItem('sha_file_'+path+'_'+filename);
      const res = await fetch(`${this.apiBase()}/${path}/${filename}`, {
        method:'PUT', headers:this.headers(),
        body: JSON.stringify({
          message: `رفع ملف: ${filename}`,
          content: base64Content,
          ...(sha ? {sha} : {})
        })
      });
      if(res.ok) {
        const r = await res.json();
        localStorage.setItem('sha_file_'+path+'_'+filename, r.content.sha);
        return {ok:true, url: r.content.download_url};
      }
      return {ok:false, local:true};
    } catch(e) { return {ok:false, local:true}; }
  },

  // تحميل قائمة الملفات المرفوعة
  getLocalFiles(path) {
    try { return JSON.parse(localStorage.getItem('file_'+path)||'[]'); }
    catch(e) { return []; }
  },

  deleteLocalFile(path, filename) {
    const existing = this.getLocalFiles(path);
    const updated = existing.filter(f => f.name !== filename);
    localStorage.setItem('file_'+path, JSON.stringify(updated));
  },
};

// ══════════════════════════════════════
//  4. مكوّن رفع الملفات (يُستخدم في صفحات المدارس)
// ══════════════════════════════════════
function createFileUploader(containerId, storagePath, options={}) {
  const {
    accept = '*/*',
    maxFiles = 10,
    label = 'ملفات',
    icon = '📁',
    allowedTypes = null, // e.g. ['image/jpeg','image/png']
  } = options;

  const container = document.getElementById(containerId);
  if(!container) return;

  const files = FalahStorage.getLocalFiles(storagePath);

  container.innerHTML = `
    <div class="uploader-box" id="ubox-${containerId}">
      <div class="uploader-header">
        <span style="font-size:20px">${icon}</span>
        <div>
          <div class="uh-title">${label}</div>
          <div class="uh-sub">حتى ${maxFiles} ملفات — ${files.length} مرفوع حالياً</div>
        </div>
        <label class="upload-btn" for="file-inp-${containerId}">
          ➕ إضافة ملف
          <input type="file" id="file-inp-${containerId}" accept="${accept}" multiple style="display:none" onchange="handleUpload('${containerId}','${storagePath}',event,${maxFiles})">
        </label>
      </div>
      <div class="drop-zone" id="drop-${containerId}" 
           ondragover="event.preventDefault();this.classList.add('drag-over')"
           ondragleave="this.classList.remove('drag-over')"
           ondrop="handleDrop('${containerId}','${storagePath}',event,${maxFiles})">
        <div style="font-size:32px;margin-bottom:8px">${icon}</div>
        <div style="font-size:13px;font-weight:700;color:var(--muted)">اسحب الملفات هنا أو اضغط ➕ إضافة</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">الحد الأقصى: ${maxFiles} ملفات</div>
      </div>
      <div class="files-grid" id="fgrid-${containerId}"></div>
      <div class="upload-progress" id="uprog-${containerId}" style="display:none">
        <div class="prog-bar"><div class="prog-fill" id="pfill-${containerId}"></div></div>
        <div class="prog-text" id="ptext-${containerId}">جاري الرفع...</div>
      </div>
    </div>`;

  renderFiles(containerId, storagePath);
}

function renderFiles(containerId, storagePath) {
  const grid = document.getElementById('fgrid-'+containerId);
  if(!grid) return;
  const files = FalahStorage.getLocalFiles(storagePath);
  const sub = document.querySelector(`#ubox-${containerId} .uh-sub`);
  if(sub) sub.textContent = `حتى 10 ملفات — ${files.length} مرفوع حالياً`;

  if(files.length === 0) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = files.map((f,i) => {
    const isImg = f.content && (f.content.startsWith('data:image') || f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i));
    const isPDF = f.name.match(/\.pdf$/i);
    const preview = isImg
      ? `<img src="${f.content}" style="width:100%;height:100px;object-fit:cover;border-radius:8px 8px 0 0">`
      : `<div style="height:100px;display:flex;align-items:center;justify-content:center;font-size:36px;background:#f5faff;border-radius:8px 8px 0 0">${isPDF?'📄':'📎'}</div>`;
    const date = f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString('ar-AE') : '—';
    return `
    <div class="file-card" id="fcard-${containerId}-${i}">
      ${preview}
      <div style="padding:8px">
        <div style="font-size:11px;font-weight:700;color:var(--navy);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${f.name}">${f.name}</div>
        <div style="font-size:10px;color:var(--muted)">${date}</div>
        <div style="display:flex;gap:4px;margin-top:6px">
          ${isImg ? `<button onclick="viewFile('${containerId}',${i})" class="fc-btn fc-view">👁️ عرض</button>` : ''}
          <button onclick="deleteFile('${containerId}','${storagePath}',${i})" class="fc-btn fc-del">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function handleUpload(containerId, storagePath, event, maxFiles) {
  const files = Array.from(event.target.files);
  await processFiles(containerId, storagePath, files, maxFiles);
  event.target.value = '';
}

async function handleDrop(containerId, storagePath, event, maxFiles) {
  event.preventDefault();
  document.getElementById('drop-'+containerId)?.classList.remove('drag-over');
  const files = Array.from(event.dataTransfer.files);
  await processFiles(containerId, storagePath, files, maxFiles);
}

async function processFiles(containerId, storagePath, files, maxFiles) {
  const existing = FalahStorage.getLocalFiles(storagePath);
  if(existing.length + files.length > maxFiles) {
    showUploadStatus(containerId, `⚠️ الحد الأقصى ${maxFiles} ملفات. لديك ${existing.length} مرفوع.`, 'warn');
    files = files.slice(0, maxFiles - existing.length);
  }

  const prog = document.getElementById('uprog-'+containerId);
  const pfill = document.getElementById('pfill-'+containerId);
  const ptext = document.getElementById('ptext-'+containerId);
  if(prog) prog.style.display = 'block';

  for(let i=0; i<files.length; i++) {
    const file = files[i];
    if(ptext) ptext.textContent = `جاري رفع: ${file.name} (${i+1}/${files.length})`;
    if(pfill) pfill.style.width = Math.round((i+1)/files.length*100) + '%';

    const base64 = await readFileAsBase64(file);
    await FalahStorage.uploadFile(storagePath, base64, file.name);
    renderFiles(containerId, storagePath);
  }

  if(prog) prog.style.display = 'none';
  showUploadStatus(containerId, `✅ تم رفع ${files.length} ملف بنجاح`, 'ok');
}

function readFileAsBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function viewFile(containerId, index) {
  const storagePath = document.getElementById('ubox-'+containerId)?.dataset?.path;
  // Find path from the grid data
  const files = FalahStorage.getLocalFiles(
    document.querySelector(`[data-uploader="${containerId}"]`)?.dataset?.path || ''
  );
  // Simple lightbox
  const f = files[index];
  if(!f) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
  overlay.onclick = () => document.body.removeChild(overlay);
  overlay.innerHTML = `<img src="${f.content}" style="max-width:92vw;max-height:90vh;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.5)">`;
  document.body.appendChild(overlay);
}

function deleteFile(containerId, storagePath, index) {
  const files = FalahStorage.getLocalFiles(storagePath);
  if(!files[index]) return;
  if(!confirm(`هل تريد حذف "${files[index].name}"؟`)) return;
  files.splice(index, 1);
  localStorage.setItem('file_'+storagePath, JSON.stringify(files));
  renderFiles(containerId, storagePath);
}

function showUploadStatus(containerId, msg, type) {
  let bar = document.getElementById('ustatus-'+containerId);
  if(!bar) {
    bar = document.createElement('div');
    bar.id = 'ustatus-'+containerId;
    bar.style.cssText = 'margin-top:8px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:700;font-family:Cairo,sans-serif;';
    document.getElementById('ubox-'+containerId)?.appendChild(bar);
  }
  bar.style.background = type==='ok' ? '#e1f5ee' : '#faeeda';
  bar.style.color = type==='ok' ? '#085041' : '#633806';
  bar.textContent = msg;
  setTimeout(()=>{ bar.style.display='none'; }, 4000);
  bar.style.display = 'block';
}

// ══════════════════════════════════════
//  5. حالة الحفظ (شريط السفلي)
// ══════════════════════════════════════
function showSaveStatus(msg, type='ok') {
  let bar = document.getElementById('global-save-bar');
  if(!bar) {
    bar = document.createElement('div');
    bar.id = 'global-save-bar';
    bar.style.cssText = `
      position:fixed; bottom:16px; left:50%; transform:translateX(-50%);
      padding:9px 22px; border-radius:22px; font-family:Cairo,sans-serif;
      font-size:13px; font-weight:700; z-index:9998; direction:rtl;
      box-shadow:0 4px 18px rgba(0,0,0,.2); transition:opacity .3s;
    `;
    document.body.appendChild(bar);
  }
  bar.style.background = type==='ok' ? '#0c447c' : type==='warn' ? '#ba7517' : '#c0392b';
  bar.style.color = '#fff';
  bar.style.opacity = '1';
  bar.textContent = msg;
  clearTimeout(bar._t);
  bar._t = setTimeout(()=>{ bar.style.opacity='0'; }, 3500);
}
