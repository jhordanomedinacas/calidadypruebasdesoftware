(function(){
  if(window.AccessibilityWidget) return;
  const LS_KEY='ca_acc_settings_v1';

  try{
    const s=JSON.parse(localStorage.getItem(LS_KEY)||'{}');
    if(s.position==='hidden'){s.position='free';localStorage.setItem(LS_KEY,JSON.stringify(s));}
  }catch{}

  const LS_POS='ca_acc_fab_pos_v1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  /* ─── Paleta Corredor Azul ─── */
  const css=`
  :root{--ca-primary:#1a3a8f;--ca-accent:#2366CE;--ca-light:#dce8ff;--ca-bg:#f0f4fb}
  #caAccFab{position:fixed;bottom:20px;left:20px;width:56px;height:56px;border-radius:999px;background:#1a3a8f;color:#fff;display:flex;align-items:center;justify-content:center;border:none;box-shadow:0 10px 25px rgba(0,0,0,.18),0 4px 10px rgba(35,102,206,.25);z-index:10050;cursor:grab;transition:box-shadow .2s ease,transform .15s ease;touch-action:none;user-select:none;}
  #caAccFab:hover{box-shadow:0 12px 30px rgba(35,102,206,.35),0 6px 12px rgba(0,0,0,.12);transform:scale(1.05);}
  #caAccFab.dragging{cursor:grabbing;box-shadow:0 20px 50px rgba(0,0,0,.3);transform:scale(1.1);transition:box-shadow .1s,transform .1s}
  #caAccFab.hidden{display:none}
  #caAccFab.narrator-on::before{content:'';position:absolute;top:-3px;right:-3px;width:14px;height:14px;border-radius:999px;background:#2366CE;border:2px solid #fff;}
  #caAccFabHint{position:fixed;background:rgba(0,0,0,.75);color:#fff;font-size:11px;padding:4px 8px;border-radius:6px;pointer-events:none;white-space:nowrap;opacity:0;transition:opacity .3s;z-index:10049}
  #caAccFabHint.show{opacity:1}
  #caAccPanelOverlay{position:fixed;inset:0;background:rgba(10,20,60,.55);display:none;z-index:10040;}
  #caAccPanelOverlay.open{display:block;}
  #caAccPanel{position:fixed;top:50%;left:50%;transform:translate(-50%,-48%);width:610px;max-width:calc(100% - 40px);background:#fff;color:#1c1917;border-radius:18px;box-shadow:0 20px 50px rgba(26,58,143,.22);z-index:10060;display:none;font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial;opacity:0;transition:transform .28s cubic-bezier(.34,1.56,.64,1),opacity .2s ease}
  #caAccPanel.open{display:block;opacity:1;transform:translate(-50%,-50%)}
  #caAccPanel header{padding:16px 20px;background:linear-gradient(135deg,#1a3a8f 0%,#2366CE 100%);display:flex;align-items:center;justify-content:space-between;border-top-left-radius:18px;border-top-right-radius:18px;color:#fff}
  #caAccPanel header h3{margin:0;font-size:18px;font-weight:700;display:flex;align-items:center;gap:10px}
  #caAccPanel header button{border:none;background:transparent;color:#fff;font-size:20px;cursor:pointer;padding:4px 9px;border-radius:6px;transition:background .2s;font-family:inherit}
  #caAccPanel header button:hover{background:rgba(255,255,255,.18)}
  #caAccPanel .ca-body{padding:20px;max-height:74vh;overflow-y:auto;overflow-x:hidden}
  .ca-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px}
  .ca-tile{position:relative;border:2px solid #e5e7eb;border-radius:14px;background:#f9fafb;min-height:108px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:12px 10px;gap:6px;font-size:13px;cursor:pointer;user-select:none;transition:border-color .2s,box-shadow .2s,background .2s;font-family:'Inter',system-ui,sans-serif}
  .ca-tile .ico{font-size:22px;line-height:1;color:#1a3a8f}
  .ca-tile .ico svg{width:22px;height:22px;stroke:#1a3a8f;fill:none;stroke-width:1.5}
  .ca-tile:hover{background:#fff;border-color:#2366CE;box-shadow:0 2px 12px rgba(35,102,206,.12)}
  .ca-tile[aria-pressed="true"]{border:2px solid #2366CE;background:#dce8ff;box-shadow:0 0 0 2px #2366CE inset}
  .ca-tile[aria-pressed="true"]::after{content:"✓";position:absolute;top:8px;right:8px;width:20px;height:20px;border-radius:999px;background:#2366CE;color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center;font-weight:bold}
  .ca-tile input[type="range"]{width:100%;accent-color:#2366CE}
  .ca-section{margin:16px 2px 9px;font-weight:700;font-size:12px;color:#1a3a8f;text-transform:uppercase;letter-spacing:1.2px;border-bottom:1px solid #e5e7eb;padding-bottom:5px}
  .ca-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .ca-footer{display:flex;justify-content:space-between;align-items:center;margin-top:18px;padding-top:14px;border-top:1px solid #e5e7eb}
  .ca-btn{padding:9px 13px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-size:13px;transition:all .2s;font-family:'Inter',inherit}
  .ca-btn:hover{background:#f0f4fb;border-color:#2366CE}
  .ca-note{font-size:11px;color:#78716c;line-height:1.3}
  .ca-segmented{display:flex;gap:5px;width:100%;justify-content:center;flex-wrap:wrap;margin-top:4px}
  .ca-segmented .ca-seg{flex:1 1 auto;padding:6px 8px;border:1px solid #e5e7eb;border-radius:999px;background:#fff;cursor:pointer;font-size:11px;white-space:nowrap;transition:all .2s;font-family:'Inter',inherit}
  .ca-segmented .ca-seg:hover{background:#f0f4fb}
  .ca-segmented .ca-seg.active{border:2px solid #2366CE;background:#dce8ff;color:#1a3a8f;font-weight:600}

  /* ─── Efectos sobre la página ─── */
  html.ca-contrast-light{filter:contrast(1.15) saturate(1.05)}
  html.ca-contrast-smart{filter:contrast(1.1) saturate(1.2) brightness(1.02)}
  html.ca-contrast-dark{filter:invert(1) hue-rotate(180deg)}
  html.ca-daltonic-protanopia{filter:url('#ca-protanopia')}
  html.ca-daltonic-deuteranopia{filter:url('#ca-deuteranopia')}
  html.ca-daltonic-tritanopia{filter:url('#ca-tritanopia')}
  html.ca-highlight-links a,html.ca-highlight-links [role="link"]{outline:2px dashed #2366CE!important;text-decoration:underline!important;outline-offset:2px!important}
  html.ca-no-anim *,html.ca-no-anim *::before,html.ca-no-anim *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  html.ca-hide-images img,html.ca-hide-images picture,html.ca-hide-images video{visibility:hidden!important}
  html.ca-big-cursor,html.ca-big-cursor *{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M8 4L8 32L16 24L22 36L26 34L20 22L32 22Z' fill='%231a3a8f' stroke='white' stroke-width='2'/%3E%3C/svg%3E") 4 4,auto!important}
  html.ca-text-contrast *:not(#caAccPanel):not(#caAccPanel *):not(#caAccFab):not(#caAccNarratorToast):not(#caAccOutlinePanel):not(#caAccOutlinePanel *){color:#000!important;background-color:#fff!important;border-color:#000!important;text-shadow:none!important}
  html.ca-text-contrast img,html.ca-text-contrast video{filter:none!important}
  @font-face{font-family:"OpenDyslexic";src:local("OpenDyslexic Regular"),local("OpenDyslexic");font-display:swap}
  @font-face{font-family:"Atkinson Hyperlegible";src:local("Atkinson Hyperlegible Regular"),local("Atkinson Hyperlegible");font-display:swap}
  html.ca-dys-dys *{font-family:"OpenDyslexic",Arial,Verdana,system-ui,sans-serif!important}
  html.ca-dys-dys body{background:#f9f7f1!important;color:#111!important}
  html.ca-dys-hyper *{font-family:"Atkinson Hyperlegible",system-ui,Segoe UI,Arial,sans-serif!important}
  html.ca-dys-hyper body{background:#f7fbff!important;color:#111!important}
  html.ca-align-left *{text-align:left!important}
  html.ca-align-center *{text-align:center!important}
  html.ca-align-right *{text-align:right!important}
  html.ca-saturate-low{filter:saturate(.6)}
  html.ca-saturate-high{filter:saturate(1.8)}
  html.ca-desaturate{filter:saturate(0)}
  html.ca-zoom-110{zoom:1.1}
  html.ca-zoom-125{zoom:1.25}
  html.ca-zoom-150{zoom:1.5}
  html.ca-spacing-plus p,html.ca-spacing-plus li,html.ca-spacing-plus td,html.ca-spacing-plus div{margin-bottom:1.3em!important;word-spacing:.16em!important}
  html.ca-ctl *{font-size:var(--ca-font-scale,100%);letter-spacing:var(--ca-letter-spacing,0px);line-height:var(--ca-line-height,normal)}
  #caAccPanel,#caAccPanel *{font-size:min(var(--ca-font-scale,100%),120%)!important;letter-spacing:min(var(--ca-letter-spacing,0px),2px)!important;line-height:min(var(--ca-line-height,normal),1.6)!important;}

  /* ─── Panel de estructura lateral ─── */
  #caAccOutlinePanel{
    position:fixed;top:0;right:-340px;width:320px;height:100vh;
    background:#fff;border-left:1px solid #e5e7eb;
    box-shadow:-8px 0 32px rgba(26,58,143,.12);
    z-index:10070;display:flex;flex-direction:column;
    font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial;
    transition:right .3s cubic-bezier(.4,0,.2,1);
  }
  #caAccOutlinePanel.open{right:0}
  #caAccOutlinePanel .ca-op-header{
    padding:16px 18px 14px;background:linear-gradient(135deg,#1a3a8f 0%,#2366CE 100%);color:#fff;
    display:flex;align-items:center;justify-content:space-between;flex-shrink:0;
  }
  #caAccOutlinePanel .ca-op-header h4{margin:0;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px}
  #caAccOutlinePanel .ca-op-header button{border:none;background:transparent;color:#fff;cursor:pointer;font-size:18px;padding:3px 7px;border-radius:5px;transition:background .2s;font-family:inherit}
  #caAccOutlinePanel .ca-op-header button:hover{background:rgba(255,255,255,.15)}
  #caAccOutlinePanel .ca-op-search{padding:12px 16px 8px;flex-shrink:0;border-bottom:1px solid #f0f0f0}
  #caAccOutlinePanel .ca-op-search input{
    width:100%;padding:8px 12px;border:1.5px solid #e5e7eb;border-radius:9px;
    font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;
    transition:border-color .2s;background:#f9fafb;color:#1c1917;
  }
  #caAccOutlinePanel .ca-op-search input:focus{border-color:#2366CE;background:#fff}
  #caAccOutlinePanel .ca-op-stats{padding:8px 16px;font-size:11.5px;color:#78716c;flex-shrink:0;display:flex;gap:12px;border-bottom:1px solid #f0f0f0}
  #caAccOutlinePanel .ca-op-list{flex:1;overflow-y:auto;padding:8px 10px 16px}
  #caAccOutlinePanel .ca-op-empty{padding:24px 16px;text-align:center;color:#78716c;font-size:13px}
  .ca-op-item{display:flex;align-items:flex-start;gap:0;margin:1px 0}
  .ca-op-item a{
    display:flex;align-items:center;gap:8px;width:100%;
    text-decoration:none;padding:7px 10px;border-radius:8px;
    font-size:13px;color:#1c1917;transition:background .15s,color .15s;
    line-height:1.35;word-break:break-word;
  }
  .ca-op-item a:hover{background:#f0f4fb;color:#1a3a8f}
  .ca-op-item a.current{background:#dce8ff;color:#1a3a8f;font-weight:600}
  .ca-op-item .ca-op-badge{
    flex-shrink:0;width:22px;height:18px;border-radius:4px;
    background:#1a3a8f;color:#fff;font-size:10px;font-weight:700;
    display:flex;align-items:center;justify-content:center;
    font-family:'Inter',system-ui;letter-spacing:.5px;
  }
  .ca-op-item.lv-1{margin-left:0}
  .ca-op-item.lv-1 .ca-op-badge{background:#1a3a8f}
  .ca-op-item.lv-2{margin-left:12px}
  .ca-op-item.lv-2 .ca-op-badge{background:#2366CE;font-size:9.5px}
  .ca-op-item.lv-3{margin-left:24px}
  .ca-op-item.lv-3 .ca-op-badge{background:#dce8ff;color:#1a3a8f;font-size:9px}
  .ca-op-item.lv-4,.ca-op-item.lv-5,.ca-op-item.lv-6{margin-left:34px}
  .ca-op-item.lv-4 .ca-op-badge,.ca-op-item.lv-5 .ca-op-badge,.ca-op-item.lv-6 .ca-op-badge{background:#e5e7eb;color:#6b7280;font-size:9px}
  .ca-op-item.hidden-filter{display:none}
  #caAccOutlineOverlay{position:fixed;inset:0;z-index:10069;display:none}
  #caAccOutlineOverlay.open{display:block}

  /* Cursor ring */
  #caAccCursorRing{position:fixed;top:0;left:0;width:44px;height:44px;border:3px solid #2366CE;border-radius:999px;pointer-events:none;transform:translate(-200px,-200px);opacity:0;transition:opacity .2s;z-index:10080}
  #caAccCursorRing.on{opacity:.75}
  /* Regla de lectura */
  #caAccReadingRuler{position:fixed;left:0;right:0;height:38px;background:rgba(35,102,206,.12);border-top:2px solid rgba(35,102,206,.4);border-bottom:2px solid rgba(35,102,206,.4);pointer-events:none;z-index:10045;display:none;transform:translateY(-50%)}
  #caAccReadingRuler.on{display:block}
  /* Toast narrador */
  #caAccNarratorToast{position:fixed;bottom:84px;left:16px;background:rgba(26,58,143,.92);color:#fff;font-size:12.5px;padding:9px 14px;border-radius:11px;pointer-events:none;opacity:0;transform:translateY(8px) scale(.97);transition:opacity .22s,transform .22s;z-index:10200;max-width:290px;line-height:1.45;backdrop-filter:blur(6px);box-shadow:0 4px 16px rgba(0,0,0,.25)}
  #caAccNarratorToast.show{opacity:1;transform:translateY(0) scale(1)}

  /* ── MÓVIL ── */
  @media(max-width:700px){
    #caAccFab{width:62px;height:62px;bottom:16px;left:16px;}
    #caAccPanel{
      top:auto !important;bottom:0 !important;left:0 !important;right:0 !important;
      width:100% !important;max-width:100% !important;
      transform:translateY(100%) !important;
      border-radius:20px 20px 0 0 !important;
      max-height:92vh !important;opacity:1 !important;
      transition:transform .32s cubic-bezier(.4,0,.2,1) !important;
    }
    #caAccPanel.open{transform:translateY(0) !important;display:flex !important;flex-direction:column !important;}
    #caAccPanel header::before{content:'';display:block;position:absolute;top:8px;left:50%;transform:translateX(-50%);width:40px;height:4px;border-radius:2px;background:rgba(255,255,255,.35);}
    #caAccPanel header{position:relative;border-radius:20px 20px 0 0;}
    #caAccPanel .ca-body{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:16px 14px 32px;max-height:none !important;}
    .ca-grid{grid-template-columns:repeat(2,1fr);gap:10px;}
    .ca-tile{min-height:96px;padding:14px 10px;gap:7px;font-size:14px;}
    .ca-tile .ico svg{width:24px;height:24px;}
    .ca-segmented .ca-seg{padding:9px 10px;font-size:12px;}
    .ca-btn{padding:11px 14px;font-size:14px;}
    .ca-section-pos,.ca-row-pos{display:none !important;}
    .ca-footer{flex-direction:column;gap:8px;text-align:center;}
    #caAccNarratorToast{bottom:90px;left:12px;right:12px;max-width:none;font-size:13.5px;}
    #caAccOutlinePanel{width:100vw !important;right:-100vw !important;top:0 !important;height:100vh !important;height:100dvh !important;}
    #caAccOutlinePanel.open{right:0 !important;}
    #caAccOutlinePanel .ca-op-search input{font-size:16px;}
    .ca-op-item a{padding:11px 10px;font-size:14px;}
    .ca-op-item .ca-op-badge{width:26px;height:22px;font-size:11px;}
    #caAccReadingRuler{display:none !important;}
    html.ca-big-cursor,html.ca-big-cursor *{cursor:auto !important;}
  }
  @media(max-width:380px){
    .ca-grid{grid-template-columns:repeat(2,1fr);}
    .ca-tile{min-height:88px;font-size:13px;}
    #caAccPanel header h3{font-size:16px;}
  }
  `;

  const defaults={
    contrast:null,daltonic:null,highlightLinks:false,
    stopAnimations:false,hideImages:false,dyslexiaMode:null,
    align:null,saturation:null,fontScale:100,letterSpacing:0,
    lineHeight:140,position:'free',voiceFeedback:false,
    readingRuler:false,bigCursor:false,zoomLevel:null,
    spacingPlus:false,textContrast:false
  };

  let settings=load();
  if(settings.position==='left'||settings.position==='right') settings.position='free';
  if(settings.position==='hidden') settings.position='free';
  save();

  function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(LS_KEY)||'{}'))}catch{return{...defaults}}}
  function save(){localStorage.setItem(LS_KEY,JSON.stringify(settings))}
  function loadFabPos(){try{return JSON.parse(localStorage.getItem(LS_POS)||'null')}catch{return null}}
  function saveFabPos(x,y){localStorage.setItem(LS_POS,JSON.stringify({x,y}))}

  /* ─── VOZ ─── */
  let preferredVoice=null;
  function loadVoices(){
    const voices=window.speechSynthesis?window.speechSynthesis.getVoices():[];
    const prio=[
      v=>v.lang.startsWith('es')&&v.name.toLowerCase().includes('google'),
      v=>v.lang.startsWith('es')&&['paulina','monica','mónica','lucia','lucía','elena','laura','conchita','raquel','rocio','rocío'].some(n=>v.name.toLowerCase().includes(n)),
      v=>v.lang.startsWith('es')&&!v.name.toLowerCase().includes('male'),
      v=>v.lang.startsWith('es'),
      v=>v.lang.startsWith('en')&&v.name.toLowerCase().includes('google'),
      v=>true
    ];
    for(const t of prio){const f=voices.find(t);if(f){preferredVoice=f;break;}}
  }
  if(window.speechSynthesis){loadVoices();window.speechSynthesis.onvoiceschanged=loadVoices;}

  function speak(text,interrupt=false){
    if(!window.speechSynthesis||!text) return;
    if(interrupt) window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text.trim().slice(0,220));
    if(preferredVoice) u.voice=preferredVoice;
    u.lang=preferredVoice?.lang||'es-ES';u.rate=1.08;u.pitch=1.05;u.volume=1;
    window.speechSynthesis.speak(u);
  }

  /* ─── TOAST ─── */
  let narratorToast=null,narratorTimer=null;
  function showToast(msg,icon=''){
    if(!narratorToast) return;
    narratorToast.textContent=(icon?icon+' ':'')+msg;
    narratorToast.classList.add('show');
    clearTimeout(narratorTimer);
    narratorTimer=setTimeout(()=>narratorToast.classList.remove('show'),2800);
  }

  /* ─── NARRADOR ─── */
  function getLabel(el){
    if(!el||el===document.body||el===document.documentElement) return '';
    const lbl=(el.getAttribute('aria-label')||el.getAttribute('title')||'').trim();
    if(lbl) return lbl.slice(0,90);
    if(el.placeholder) return el.placeholder.slice(0,90);
    if(el.tagName==='IMG') return el.alt?el.alt.slice(0,90):'imagen';
    if(el.tagName==='SELECT'){const o=el.options[el.selectedIndex];return o?o.text.slice(0,90):'';}
    const txt=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
    if(txt) return txt.slice(0,90);
    const map={A:'enlace',BUTTON:'botón',INPUT:'campo',TEXTAREA:'área de texto',SELECT:'selector',NAV:'navegación',HEADER:'encabezado',FOOTER:'pie de página',MAIN:'contenido principal',SECTION:'sección',ARTICLE:'artículo'};
    return map[el.tagName]||'';
  }
  function narratorClick(e){
    const el=e.target;const lbl=getLabel(el);if(!lbl) return;
    if(el.closest('#caAccPanel,#caAccFab,#caAccPanelOverlay,#caAccNarratorToast,#caAccOutlinePanel,#caAccOutlineOverlay')) return;
    const tag=el.tagName.toUpperCase();let msg='';
    if(tag==='A') msg='Enlace: '+lbl;
    else if(tag==='BUTTON'||el.getAttribute('role')==='button') msg='Botón: '+lbl;
    else if(tag==='INPUT'){
      const t=el.type||'text';
      if(t==='checkbox') msg=lbl+': '+(el.checked?'activado':'desactivado');
      else if(t==='radio') msg='Opción seleccionada: '+lbl;
      else if(t==='submit'||t==='button') msg='Botón: '+lbl;
      else msg='Campo de texto: '+lbl;
    } else if(tag==='SELECT') msg='Selector: '+lbl;
    else if(tag==='IMG') msg='Imagen: '+lbl;
    else msg=lbl;
    if(msg){showToast(msg);speak(msg,true);}
  }
  function narratorFocus(e){
    const el=e.target;if(!el||el===document.body) return;
    if(el.closest('#caAccPanel,#caAccFab,#caAccOutlinePanel')) return;
    const interactive=['A','BUTTON','INPUT','SELECT','TEXTAREA'];
    if(!interactive.includes(el.tagName)&&!el.getAttribute('role')) return;
    const lbl=getLabel(el);if(!lbl) return;
    const msg='Enfocado: '+lbl;showToast(msg);speak(msg,false);
  }
  let narratorActive=false;
  function enableNarrator(){
    if(narratorActive) return;narratorActive=true;
    document.addEventListener('click',narratorClick,true);
    document.addEventListener('focusin',narratorFocus,true);
    const fab=$('#caAccFab');if(fab) fab.classList.add('narrator-on');
    speak('Narrador activado. Toca cualquier elemento para escuchar su descripción.',true);
    showToast('Narrador activado — funciona en toda la web');
  }
  function disableNarrator(){
    if(!narratorActive) return;narratorActive=false;
    document.removeEventListener('click',narratorClick,true);
    document.removeEventListener('focusin',narratorFocus,true);
    const fab=$('#caAccFab');if(fab) fab.classList.remove('narrator-on');
    if(narratorToast) narratorToast.classList.remove('show');
    window.speechSynthesis&&window.speechSynthesis.cancel();
  }

  /* ─── TTS ─── */
  let reading=false,paused=false;
  function ttsReadAll(){
    try{window.speechSynthesis.cancel()}catch{}
    const root=document.querySelector('main')||document.querySelector('[role="main"]')||document.body;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode(n){
        return n.parentElement.closest('#caAccPanel,#caAccFab,#caAccNarratorToast,#caAccOutlinePanel,script,style,noscript')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
      }
    });
    let text='';while(walker.nextNode()) text+=' '+walker.currentNode.nodeValue;
    text=text.replace(/\s+/g,' ').trim();if(!text) return;
    const u=new SpeechSynthesisUtterance(text.slice(0,250000));
    if(preferredVoice) u.voice=preferredVoice;
    u.lang=preferredVoice?.lang||'es-ES';u.rate=1.05;u.pitch=1;
    u.onend=()=>{reading=false;paused=false;syncTTS();};
    reading=true;paused=false;syncTTS();
    window.speechSynthesis.speak(u);
  }
  function ttsPause(){try{window.speechSynthesis.pause();paused=true;syncTTS();}catch{}}
  function ttsResume(){try{window.speechSynthesis.resume();paused=false;syncTTS();}catch{}}
  function ttsStop(){try{window.speechSynthesis.cancel();reading=false;paused=false;syncTTS();}catch{}}
  function syncTTS(){
    const p=$('#caTtsPlay'),a=$('#caTtsPause'),r=$('#caTtsResume'),s=$('#caTtsStop');
    if(!p) return;
    p.disabled=reading;a.disabled=!reading||paused;r.disabled=!paused;s.disabled=!reading;
  }

  /* ─── PANEL DE ESTRUCTURA ─── */
  let outlinePanel=null,outlineOverlay=null;

  function buildOutlinePanel(){
    if($('#caAccOutlinePanel')) return;
    outlineOverlay=document.createElement('div');
    outlineOverlay.id='caAccOutlineOverlay';
    outlineOverlay.addEventListener('click',closeOutline);
    document.body.appendChild(outlineOverlay);

    outlinePanel=document.createElement('div');
    outlinePanel.id='caAccOutlinePanel';
    outlinePanel.setAttribute('role','navigation');
    outlinePanel.setAttribute('aria-label','Estructura de la página');
    outlinePanel.innerHTML=`
      <div class="ca-op-header">
        <h4>
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
          Estructura de la página
        </h4>
        <button id="caAccOutClose" aria-label="Cerrar">✕</button>
      </div>
      <div class="ca-op-search">
        <input type="text" id="caAccOutSearch" placeholder="Buscar sección..." autocomplete="off" spellcheck="false">
      </div>
      <div class="ca-op-stats" id="caAccOutStats"></div>
      <div class="ca-op-list" id="caAccOutList"></div>
    `;
    document.body.appendChild(outlinePanel);
    $('#caAccOutClose',outlinePanel).addEventListener('click',closeOutline);
    $('#caAccOutSearch',outlinePanel).addEventListener('input',filterOutline);
  }

  function openOutline(){
    buildOutlinePanel();
    populateOutline();
    outlineOverlay.classList.add('open');
    requestAnimationFrame(()=>requestAnimationFrame(()=>outlinePanel.classList.add('open')));
    const search=$('#caAccOutSearch');if(search) search.value='';
    filterOutline();
  }
  function closeOutline(){
    if(outlinePanel) outlinePanel.classList.remove('open');
    if(outlineOverlay) outlineOverlay.classList.remove('open');
  }

  const WIDGET_IDS=['caAccPanel','caAccFab','caAccPanelOverlay','caAccOutlinePanel','caAccOutlineOverlay','caAccNarratorToast','caAccCursorRing','caAccReadingRuler','caAccFabHint','ca-acc-styles','ca-svg-filters'];
  function isWidgetEl(el){return WIDGET_IDS.some(id=>el.id===id||el.closest('#'+id));}

  function populateOutline(){
    const list=$('#caAccOutList');const stats=$('#caAccOutStats');
    if(!list||!stats) return;
    const allH=Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
    const headings=allH.filter(h=>!isWidgetEl(h));
    const counts={h1:0,h2:0,h3:0};
    headings.forEach(h=>{const lv=h.tagName.toLowerCase();if(counts[lv]!==undefined) counts[lv]++;});
    stats.innerHTML=`
      <span>&#128196; ${headings.length} título${headings.length!==1?'s':''}</span>
      ${counts.h1?`<span>H1: ${counts.h1}</span>`:''}
      ${counts.h2?`<span>H2: ${counts.h2}</span>`:''}
      ${counts.h3?`<span>H3+: ${headings.length-counts.h1-counts.h2}</span>`:''}
    `;
    if(!headings.length){
      list.innerHTML=`<div class="ca-op-empty">No se encontraron secciones en esta página.</div>`;return;
    }
    list.innerHTML='';
    headings.forEach(h=>{
      const level=parseInt(h.tagName[1]);
      const txt=(h.textContent||'').replace(/\s+/g,' ').trim();
      if(!txt) return;
      const item=document.createElement('div');
      item.className=`ca-op-item lv-${level}`;
      item.dataset.text=txt.toLowerCase();
      const a=document.createElement('a');a.href='#';
      const badge=document.createElement('span');badge.className='ca-op-badge';badge.textContent='H'+level;
      const label=document.createElement('span');label.textContent=txt.slice(0,80)+(txt.length>80?'…':'');label.style.flex='1';
      a.appendChild(badge);a.appendChild(label);
      a.addEventListener('click',e=>{
        e.preventDefault();
        $$('.ca-op-item a.current',outlinePanel).forEach(el=>el.classList.remove('current'));
        a.classList.add('current');
        h.scrollIntoView({behavior:'smooth',block:'center'});
        const prev=h.style.outline;const prevOff=h.style.outlineOffset;
        h.style.outline='3px solid #2366CE';h.style.outlineOffset='5px';
        setTimeout(()=>{h.style.outline=prev;h.style.outlineOffset=prevOff;},1800);
        if(narratorActive) speak('Navegando a: '+txt,true);
      });
      item.appendChild(a);list.appendChild(item);
    });
  }

  function filterOutline(){
    const q=($('#caAccOutSearch')?.value||'').toLowerCase().trim();
    $$('.ca-op-item',outlinePanel||document).forEach(item=>{
      if(!q){item.classList.remove('hidden-filter');return;}
      item.classList.toggle('hidden-filter',!item.dataset.text.includes(q));
    });
  }

  /* ─── APPLY ─── */
  function apply(){
    const html=document.documentElement;
    html.classList.remove(
      'ca-contrast-light','ca-contrast-smart','ca-contrast-dark',
      'ca-daltonic-protanopia','ca-daltonic-deuteranopia','ca-daltonic-tritanopia',
      'ca-saturate-low','ca-saturate-high','ca-desaturate',
      'ca-highlight-links','ca-no-anim','ca-hide-images',
      'ca-dys-dys','ca-dys-hyper',
      'ca-align-left','ca-align-center','ca-align-right',
      'ca-big-cursor','ca-spacing-plus','ca-text-contrast',
      'ca-zoom-110','ca-zoom-125','ca-zoom-150'
    );
    if(settings.contrast==='light') html.classList.add('ca-contrast-light');
    if(settings.contrast==='smart') html.classList.add('ca-contrast-smart');
    if(settings.contrast==='dark') html.classList.add('ca-contrast-dark');
    if(settings.daltonic==='protanopia') html.classList.add('ca-daltonic-protanopia');
    if(settings.daltonic==='deuteranopia') html.classList.add('ca-daltonic-deuteranopia');
    if(settings.daltonic==='tritanopia') html.classList.add('ca-daltonic-tritanopia');
    if(settings.saturation==='low') html.classList.add('ca-saturate-low');
    if(settings.saturation==='high') html.classList.add('ca-saturate-high');
    if(settings.saturation==='desaturate') html.classList.add('ca-desaturate');
    if(settings.highlightLinks) html.classList.add('ca-highlight-links');
    if(settings.stopAnimations) html.classList.add('ca-no-anim');
    if(settings.hideImages) html.classList.add('ca-hide-images');
    if(settings.bigCursor) html.classList.add('ca-big-cursor');
    if(settings.spacingPlus) html.classList.add('ca-spacing-plus');
    if(settings.textContrast) html.classList.add('ca-text-contrast');
    if(settings.zoomLevel) html.classList.add('ca-zoom-'+settings.zoomLevel);
    if(settings.dyslexiaMode==='dys') html.classList.add('ca-dys-dys');
    if(settings.dyslexiaMode==='hyper') html.classList.add('ca-dys-hyper');
    if(settings.align==='left') html.classList.add('ca-align-left');
    else if(settings.align==='center') html.classList.add('ca-align-center');
    else if(settings.align==='right') html.classList.add('ca-align-right');

    let sc=settings.fontScale,lt=settings.letterSpacing,ln=settings.lineHeight;
    if(settings.dyslexiaMode==='dys'){lt=Math.max(lt,1.2);ln=Math.max(ln,170);}
    if(settings.dyslexiaMode==='hyper'){lt=Math.max(lt,.6);ln=Math.max(ln,160);}
    html.style.setProperty('--ca-font-scale',`${clamp(sc,80,200)}%`);
    html.style.setProperty('--ca-letter-spacing',`${clamp(lt,0,5)}px`);
    html.style.setProperty('--ca-line-height',ln?(ln/100).toFixed(2):'normal');
    html.classList.toggle('ca-ctl',sc!==100||lt!==0||ln!==140);

    const fab=$('#caAccFab');
    if(fab){
      const hs=sessionStorage.getItem('ca_acc_hidden')==='1';
      fab.classList.toggle('hidden',settings.position==='hidden'&&hs);
      if(!hs&&settings.position==='hidden') settings.position='free';
    }
    const ruler=$('#caAccReadingRuler');
    if(ruler) ruler.classList.toggle('on',settings.readingRuler);
    save();
  }

  /* ─── DOM HELPERS ─── */
  function ensureRing(){
    if($('#caAccCursorRing')) return;
    const r=document.createElement('div');r.id='caAccCursorRing';document.body.appendChild(r);
    window.addEventListener('mousemove',e=>{
      const rr=$('#caAccCursorRing');if(!rr||!rr.classList.contains('on')) return;
      rr.style.transform=`translate(${e.clientX-22}px,${e.clientY-22}px)`;
    },{passive:true});
  }
  function initReadingRuler(){
    if($('#caAccReadingRuler')) return;
    const r=document.createElement('div');r.id='caAccReadingRuler';document.body.appendChild(r);
    window.addEventListener('mousemove',e=>{if(settings.readingRuler) r.style.top=e.clientY+'px';},{passive:true});
  }
  function initNarratorToast(){
    if($('#caAccNarratorToast')) return;
    narratorToast=document.createElement('div');narratorToast.id='caAccNarratorToast';
    document.body.appendChild(narratorToast);
  }

  /* ─── FAB DRAG ─── */
  function initDraggableFab(fab){
    let drag=false,sx,sy,il,it,moved=false;
    const isMobile=()=>window.innerWidth<=700||('ontouchstart' in window);
    const sp=loadFabPos();
    if(sp){
      const maxX=window.innerWidth-66,maxY=window.innerHeight-66;
      fab.style.left=clamp(sp.x,8,maxX)+'px';fab.style.top=clamp(sp.y,8,maxY)+'px';
      fab.style.bottom='auto';fab.style.right='auto';
    }
    function onS(e){
      const t=e.touches?e.touches[0]:e;
      drag=true;moved=false;sx=t.clientX;sy=t.clientY;
      const r=fab.getBoundingClientRect();il=r.left;it=r.top;
      fab.classList.add('dragging');fab.style.transition='none';
    }
    function onM(e){
      if(!drag) return;
      const t=e.touches?e.touches[0]:e;
      const dx=t.clientX-sx,dy=t.clientY-sy;
      if(Math.abs(dx)>8||Math.abs(dy)>8){moved=true;e.preventDefault();}
      if(!moved) return;
      const maxX=window.innerWidth-(isMobile()?66:60);
      const maxY=window.innerHeight-(isMobile()?66:60);
      fab.style.left=clamp(il+dx,8,maxX)+'px';fab.style.top=clamp(it+dy,8,maxY)+'px';
      fab.style.bottom='auto';fab.style.right='auto';
    }
    function onE(e){
      if(!drag) return;drag=false;
      fab.classList.remove('dragging');fab.style.transition='box-shadow .2s ease,transform .15s ease';
      if(moved){
        if(isMobile()){
          const r=fab.getBoundingClientRect();
          const cx=r.left+r.width/2;
          const snapX=cx<window.innerWidth/2?8:window.innerWidth-r.width-8;
          fab.style.left=snapX+'px';saveFabPos(snapX,r.top);
        } else {
          const r=fab.getBoundingClientRect();saveFabPos(r.left,r.top);
        }
        fab._wd=true;e.preventDefault();e.stopPropagation();
      } else fab._wd=false;
    }
    fab.addEventListener('mousedown',onS);
    window.addEventListener('mousemove',onM,{passive:false});
    window.addEventListener('mouseup',onE);
    fab.addEventListener('touchstart',onS,{passive:true});
    window.addEventListener('touchmove',onM,{passive:false});
    window.addEventListener('touchend',onE);
    window.addEventListener('resize',()=>{
      const r=fab.getBoundingClientRect();
      const maxX=window.innerWidth-66,maxY=window.innerHeight-66;
      if(r.left>maxX) fab.style.left=maxX+'px';
      if(r.top>maxY) fab.style.top=maxY+'px';
    });
    if(!localStorage.getItem('ca_acc_fab_hint')){
      const h=document.createElement('div');h.id='caAccFabHint';
      h.textContent=isMobile()?'Mantén presionado para mover':'Arrastra donde quieras';
      h.style.cssText='position:fixed;background:rgba(0,0,0,.75);color:#fff;font-size:11px;padding:4px 8px;border-radius:6px;pointer-events:none;white-space:nowrap;opacity:0;transition:opacity .3s;z-index:10049';
      document.body.appendChild(h);
      const r=fab.getBoundingClientRect();
      h.style.left=(r.right+8)+'px';h.style.top=r.top+'px';
      setTimeout(()=>h.style.opacity='1',500);
      setTimeout(()=>{h.style.opacity='0';setTimeout(()=>h.remove(),400);},3500);
      localStorage.setItem('ca_acc_fab_hint','1');
    }
  }

  /* ─── SVG ICON (ícono universal de accesibilidad) ─── */
  const fabIcon=`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="5" r="1.5" fill="white" stroke="none"/>
    <path d="M5 9h14M12 9v5m0 0l-2 5m2-5l2 5"/>
    <path d="M8.5 14.5C9 16.5 10.4 18 12 18s3-1.5 3.5-3.5" stroke-dasharray="0"/>
  </svg>`;

  /* ─── BUILD UI ─── */
  function buildUI(){
    if(!$('#ca-acc-styles')){const s=document.createElement('style');s.id='ca-acc-styles';s.textContent=css;document.head.appendChild(s);}
    if(!$('#ca-svg-filters')){
      const w=document.createElement('div');w.id='ca-svg-filters';w.style.cssText='display:none;position:absolute;width:0;height:0;overflow:hidden';
      w.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg"><defs>
        <filter id="ca-protanopia"><feColorMatrix type="matrix" values="0.567,0.433,0,0,0,0.558,0.442,0,0,0,0,0.242,0.758,0,0,0,0,0,1,0"/></filter>
        <filter id="ca-deuteranopia"><feColorMatrix type="matrix" values="0.625,0.375,0,0,0,0.7,0.3,0,0,0,0,0.3,0.7,0,0,0,0,0,1,0"/></filter>
        <filter id="ca-tritanopia"><feColorMatrix type="matrix" values="0.95,0.05,0,0,0,0,0.433,0.567,0,0,0,0,0.475,0.525,0,0,0,0,0,1,0"/></filter>
      </defs></svg>`;
      document.body.appendChild(w);
    }

    const fab=document.createElement('button');
    fab.id='caAccFab';
    fab.setAttribute('aria-label','Abrir menú de accesibilidad');
    fab.title='Opciones de accesibilidad (Ctrl+U)';
    fab.innerHTML=fabIcon;
    document.body.appendChild(fab);
    initDraggableFab(fab);

    const overlay=document.createElement('div');overlay.id='caAccPanelOverlay';
    const panel=document.createElement('div');panel.id='caAccPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Menú de accesibilidad');

    panel.innerHTML=`
    <header>
      <h3>
        <svg width="20" height="20" fill="none" stroke="white" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="1.5" fill="white" stroke="none"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 9h14M12 9v5m0 0l-2 5m2-5l2 5"/>
        </svg>
        Accesibilidad
      </h3>
      <button id="caAccClose" aria-label="Cerrar menú de accesibilidad">✕</button>
    </header>
    <div class="ca-body">

      <div class="ca-section">Visión y color</div>
      <div class="ca-grid">
        <button class="ca-tile" id="caContrastLight" aria-pressed="false">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg></div>
          <div>Contraste suave</div>
        </button>
        <button class="ca-tile" id="caContrastSmart" aria-pressed="false">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/></svg></div>
          <div>Contraste inteligente</div>
        </button>
        <button class="ca-tile" id="caContrastDark" aria-pressed="false">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg></div>
          <div>Modo oscuro</div>
        </button>
        <button class="ca-tile" id="caTextContrast" aria-pressed="false">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg></div>
          <div>Alto contraste texto</div>
          <div class="ca-note">Negro sobre blanco</div>
        </button>
        <button class="ca-tile" id="caHighlight" aria-pressed="false">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg></div>
          <div>Resaltar enlaces</div>
        </button>
        <button class="ca-tile" id="caHideImg" aria-pressed="false">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
          <div>Ocultar imágenes</div>
        </button>
        <div class="ca-tile" id="caTileSaturation" style="cursor:default">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/></svg></div>
          <div>Saturación</div>
          <div class="ca-segmented">
            <button type="button" class="ca-seg" data-saturate="low">Baja</button>
            <button type="button" class="ca-seg" data-saturate="high">Alta</button>
            <button type="button" class="ca-seg" data-saturate="desaturate">Sin color</button>
            <button type="button" class="ca-seg" data-saturate="off">✕</button>
          </div>
        </div>
        <div class="ca-tile" id="caTileDaltonic" style="cursor:default;grid-column:span 2">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88"/></svg></div>
          <div>Modo daltónico</div>
          <div class="ca-segmented">
            <button type="button" class="ca-seg" data-mode="protanopia">Protanopia</button>
            <button type="button" class="ca-seg" data-mode="deuteranopia">Deuteranopia</button>
            <button type="button" class="ca-seg" data-mode="tritanopia">Tritanopia</button>
            <button type="button" class="ca-seg" data-mode="off">✕ Desactivar</button>
          </div>
        </div>
      </div>

      <div class="ca-section">Navegación y movilidad</div>
      <div class="ca-grid">
        <button class="ca-tile" id="caNoAnim" aria-pressed="false">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5"/></svg></div>
          <div>Detener animaciones</div>
        </button>
        <button class="ca-tile" id="caCursor" aria-pressed="false">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 6.186-3.286.018zm-6.51-2.225L2.25 6.75l12 2.25-4.5 4.5m-6.75 0L2.25 21l9.75-9.75"/></svg></div>
          <div>Cursor grande</div>
        </button>
        <button class="ca-tile" id="caReadingRuler" aria-pressed="false">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg></div>
          <div>Regla de lectura</div>
        </button>
        <button class="ca-tile" id="caOutlineBtn">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg></div>
          <div>Estructura de página</div>
          <div class="ca-note">Índice de secciones</div>
        </button>
        <div class="ca-tile" id="caTileZoom" style="cursor:default;grid-column:span 2">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/></svg></div>
          <div>Zoom de página</div>
          <div class="ca-segmented">
            <button type="button" class="ca-seg" data-zoom="110">110%</button>
            <button type="button" class="ca-seg" data-zoom="125">125%</button>
            <button type="button" class="ca-seg" data-zoom="150">150%</button>
            <button type="button" class="ca-seg" data-zoom="off">✕ Normal</button>
          </div>
        </div>
      </div>

      <div class="ca-section">Texto y lectura</div>
      <div class="ca-grid">
        <button class="ca-tile" id="caSpacingPlus" aria-pressed="false">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"/></svg></div>
          <div>Más espacio entre párrafos</div>
        </button>
        <div class="ca-tile" id="caTileDys" style="cursor:default;grid-column:span 2">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg></div>
          <div>Fuente para dislexia</div>
          <div class="ca-segmented">
            <button type="button" class="ca-seg" data-mode="dys">OpenDyslexic</button>
            <button type="button" class="ca-seg" data-mode="hyper">Alta legibilidad</button>
            <button type="button" class="ca-seg" data-mode="off">✕ Normal</button>
          </div>
        </div>
        <div class="ca-tile" style="cursor:default">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
          <div>Tamaño de texto</div>
          <input type="range" id="caRngFont" min="80" max="200" step="1">
          <div class="ca-note" id="caValFont">100%</div>
        </div>
        <div class="ca-tile" style="cursor:default">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M3.75 12h16.5"/></svg></div>
          <div>Espaciado letras</div>
          <input type="range" id="caRngLetter" min="0" max="5" step="0.1">
          <div class="ca-note" id="caValLetter">0 px</div>
        </div>
        <div class="ca-tile" style="cursor:default">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5"/></svg></div>
          <div id="caLblLine">Altura de línea</div>
          <input type="range" id="caRngLine" min="100" max="250" step="5">
          <div class="ca-note" id="caValLine">140%</div>
        </div>
        <div class="ca-tile" id="caTileAlign" style="cursor:default;grid-column:span 3">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/></svg></div>
          <div>Alineación del texto</div>
          <div class="ca-segmented">
            <button type="button" class="ca-seg" data-align="left">Izquierda</button>
            <button type="button" class="ca-seg" data-align="center">Centrado</button>
            <button type="button" class="ca-seg" data-align="right">Derecha</button>
            <button type="button" class="ca-seg" data-align="off">✕ Normal</button>
          </div>
        </div>
      </div>

      <div class="ca-section">Voz y narración</div>
      <div class="ca-grid">
        <div class="ca-tile" style="grid-column:span 2;cursor:default">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/></svg></div>
          <div>Leer página en voz alta</div>
          <div class="ca-row" style="justify-content:center;margin-top:5px">
            <button class="ca-btn" id="caTtsPlay">&#9654; Leer</button>
            <button class="ca-btn" id="caTtsPause">&#9646;&#9646; Pausa</button>
            <button class="ca-btn" id="caTtsResume">&#9654; Reanudar</button>
            <button class="ca-btn" id="caTtsStop">&#9726; Detener</button>
          </div>
        </div>
        <button class="ca-tile" id="caNarrador" aria-pressed="false">
          <div class="ico"><svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg></div>
          <div>Narrador de acciones</div>
          <div class="ca-note">Voz — toda la app</div>
        </button>
      </div>

      <div class="ca-section ca-section-pos">Posición del botón</div>
      <div class="ca-row ca-row-pos" style="gap:7px;flex-wrap:wrap;margin-bottom:4px">
        <button class="ca-btn" id="caSnapTL">&#8598; Sup. izq.</button>
        <button class="ca-btn" id="caSnapTR">&#8599; Sup. der.</button>
        <button class="ca-btn" id="caSnapBL">&#8601; Inf. izq.</button>
        <button class="ca-btn" id="caSnapBR">&#8600; Inf. der.</button>
        <button class="ca-btn" id="caSnapHide">Ocultar</button>
        <button class="ca-btn" id="caSnapShow">Mostrar</button>
      </div>

      <div class="ca-footer">
        <button class="ca-btn" id="caAccReset">&#8635; Restablecer todo</button>
        <span class="ca-note">Configuración guardada · Ctrl+U para abrir</span>
      </div>
    </div>`;

    document.body.appendChild(overlay);document.body.appendChild(panel);

    /* Abrir / Cerrar */
    const isMobile=()=>window.innerWidth<=700;
    const openPanel=()=>{
      overlay.classList.add('open');
      panel.style.display=isMobile()?'flex':'block';
      panel.getBoundingClientRect();
      panel.classList.add('open');
    };
    const closePanel=()=>{
      overlay.classList.remove('open');
      panel.classList.remove('open');
      panel.addEventListener('transitionend',()=>{if(!panel.classList.contains('open')) panel.style.display='none';},{once:true});
    };

    /* Swipe abajo para cerrar en móvil */
    let swipeY=0,swipeOn=false;
    panel.addEventListener('touchstart',e=>{
      const b=panel.querySelector('.ca-body');
      if(b&&b.scrollTop>0) return;
      swipeY=e.touches[0].clientY;swipeOn=true;
    },{passive:true});
    panel.addEventListener('touchmove',e=>{
      if(!swipeOn) return;
      if(e.touches[0].clientY-swipeY>60){closePanel();swipeOn=false;}
    },{passive:true});
    panel.addEventListener('touchend',()=>{swipeOn=false;},{passive:true});

    fab.addEventListener('click',()=>{if(fab._wd){fab._wd=false;return;}openPanel();});
    fab.addEventListener('touchend',e=>{if(!fab._wd){e.preventDefault();openPanel();}fab._wd=false;},{passive:false});
    fab.addEventListener('mousedown',()=>{fab._wd=false;});
    window.addEventListener('mousemove',()=>{if(fab.classList.contains('dragging')) fab._wd=true;},{passive:true});
    overlay.addEventListener('click',closePanel);
    $('#caAccClose').addEventListener('click',closePanel);
    document.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&(e.key==='u'||e.key==='U')){e.preventDefault();openPanel();}
      if(e.key==='Escape'){closePanel();closeOutline();}
    });

    /* Snaps */
    function snapFab(x,y){fab.style.left=x+'px';fab.style.top=y+'px';fab.style.bottom='auto';fab.style.right='auto';fab.classList.remove('hidden');settings.position='free';saveFabPos(x,y);apply();}
    $('#caSnapTL').addEventListener('click',()=>snapFab(20,20));
    $('#caSnapTR').addEventListener('click',()=>snapFab(window.innerWidth-76,20));
    $('#caSnapBL').addEventListener('click',()=>snapFab(20,window.innerHeight-76));
    $('#caSnapBR').addEventListener('click',()=>snapFab(window.innerWidth-76,window.innerHeight-76));
    $('#caSnapHide').addEventListener('click',()=>{settings.position='hidden';sessionStorage.setItem('ca_acc_hidden','1');apply();});
    $('#caSnapShow').addEventListener('click',()=>{settings.position='free';sessionStorage.removeItem('ca_acc_hidden');fab.classList.remove('hidden');apply();});

    /* Sliders */
    const f=$('#caRngFont'),fv=$('#caValFont'),ls=$('#caRngLetter'),lsv=$('#caValLetter'),ln=$('#caRngLine'),lnv=$('#caValLine'),lblLine=$('#caLblLine');
    f.addEventListener('input',()=>{settings.fontScale=+f.value;fv.textContent=settings.fontScale+'%';apply();});
    ls.addEventListener('input',()=>{settings.letterSpacing=+ls.value;lsv.textContent=settings.letterSpacing+' px';apply();});
    ln.addEventListener('input',()=>{settings.lineHeight=+ln.value;lnv.textContent=settings.lineHeight+'%';lblLine.textContent='Altura de línea ('+(settings.lineHeight/100).toFixed(2)+'x)';apply();});

    /* Tiles toggle */
    function tile(id,fn){const el=$(id);if(!el) return;el.addEventListener('click',()=>{fn();syncTiles();apply();});}
    tile('#caContrastLight',()=>settings.contrast=settings.contrast==='light'?null:'light');
    tile('#caContrastSmart',()=>settings.contrast=settings.contrast==='smart'?null:'smart');
    tile('#caContrastDark',()=>settings.contrast=settings.contrast==='dark'?null:'dark');
    tile('#caTextContrast',()=>{settings.textContrast=!settings.textContrast;if(settings.textContrast) speak('Texto en alto contraste activado.');});
    tile('#caHighlight',()=>settings.highlightLinks=!settings.highlightLinks);
    tile('#caNoAnim',()=>settings.stopAnimations=!settings.stopAnimations);
    tile('#caHideImg',()=>settings.hideImages=!settings.hideImages);
    tile('#caSpacingPlus',()=>settings.spacingPlus=!settings.spacingPlus);
    tile('#caReadingRuler',()=>settings.readingRuler=!settings.readingRuler);
    tile('#caCursor',()=>{settings.bigCursor=!settings.bigCursor;const ring=$('#caAccCursorRing');if(!ring) ensureRing();$('#caAccCursorRing').classList.toggle('on',settings.bigCursor);});
    $('#caOutlineBtn').addEventListener('click',()=>openOutline());

    /* Segmentados */
    $$('#caTileDys .ca-seg').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.mode;settings.dyslexiaMode=(m==='off'||settings.dyslexiaMode===m)?null:m;syncTiles();apply();}));
    $$('#caTileDaltonic .ca-seg').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.mode;settings.daltonic=(m==='off'||settings.daltonic===m)?null:m;syncTiles();apply();}));
    $$('#caTileAlign .ca-seg').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.align;settings.align=(a==='off'||settings.align===a)?null:a;syncTiles();apply();}));
    $$('#caTileSaturation .ca-seg').forEach(b=>b.addEventListener('click',()=>{const s=b.dataset.saturate;settings.saturation=(s==='off'||settings.saturation===s)?null:s;syncTiles();apply();}));
    $$('#caTileZoom .ca-seg').forEach(b=>b.addEventListener('click',()=>{const z=b.dataset.zoom;settings.zoomLevel=(z==='off'||settings.zoomLevel===z)?null:z;syncTiles();apply();if(settings.zoomLevel) speak('Zoom al '+settings.zoomLevel+' por ciento');}));

    /* Narrador */
    $('#caNarrador').addEventListener('click',()=>{settings.voiceFeedback=!settings.voiceFeedback;syncTiles();save();if(settings.voiceFeedback) enableNarrator();else disableNarrator();});

    /* TTS */
    $('#caTtsPlay').addEventListener('click',ttsReadAll);
    $('#caTtsPause').addEventListener('click',ttsPause);
    $('#caTtsResume').addEventListener('click',ttsResume);
    $('#caTtsStop').addEventListener('click',ttsStop);
    syncTTS();

    /* Reset */
    $('#caAccReset').addEventListener('click',()=>{
      settings={...defaults};sessionStorage.removeItem('ca_acc_hidden');localStorage.removeItem(LS_POS);
      disableNarrator();
      fab.style.left='20px';fab.style.top='';fab.style.bottom='20px';fab.style.right='auto';
      syncAll();apply();
      speak('Configuración restablecida.',true);showToast('Configuración restablecida ✓');
    });

    /* Sync helpers */
    function sT(id,on){const el=$(id);if(el) el.setAttribute('aria-pressed',String(!!on));}
    function syncTiles(){
      sT('#caContrastLight',settings.contrast==='light');sT('#caContrastSmart',settings.contrast==='smart');sT('#caContrastDark',settings.contrast==='dark');
      sT('#caTextContrast',settings.textContrast);sT('#caHighlight',settings.highlightLinks);
      sT('#caNoAnim',settings.stopAnimations);sT('#caHideImg',settings.hideImages);
      sT('#caSpacingPlus',settings.spacingPlus);sT('#caReadingRuler',settings.readingRuler);
      sT('#caCursor',settings.bigCursor);sT('#caNarrador',settings.voiceFeedback);
      sT('#caTileDys',settings.dyslexiaMode!==null);$$('#caTileDys .ca-seg').forEach(b=>b.classList.toggle('active',b.dataset.mode===settings.dyslexiaMode));
      sT('#caTileDaltonic',settings.daltonic!==null);$$('#caTileDaltonic .ca-seg').forEach(b=>b.classList.toggle('active',b.dataset.mode===settings.daltonic));
      sT('#caTileAlign',settings.align!==null);$$('#caTileAlign .ca-seg').forEach(b=>b.classList.toggle('active',b.dataset.align===settings.align));
      sT('#caTileSaturation',settings.saturation!==null);$$('#caTileSaturation .ca-seg').forEach(b=>b.classList.toggle('active',b.dataset.saturate===settings.saturation));
      sT('#caTileZoom',settings.zoomLevel!==null);$$('#caTileZoom .ca-seg').forEach(b=>b.classList.toggle('active',b.dataset.zoom===settings.zoomLevel));
    }
    function syncSliders(){
      f.value=settings.fontScale;fv.textContent=settings.fontScale+'%';
      ls.value=settings.letterSpacing;lsv.textContent=settings.letterSpacing+' px';
      ln.value=settings.lineHeight;lnv.textContent=settings.lineHeight+'%';
      lblLine.textContent='Altura de línea ('+(settings.lineHeight/100).toFixed(2)+'x)';
    }
    function syncAll(){syncTiles();syncSliders();}

    ensureRing();initReadingRuler();initNarratorToast();
    if(settings.voiceFeedback) enableNarrator();
    syncAll();apply();
  }

  window.AccessibilityWidget={init(){buildUI()}};
  if(document.readyState!=='loading') window.AccessibilityWidget.init();
  else document.addEventListener('DOMContentLoaded',()=>window.AccessibilityWidget.init());
})();
