(() => {
  const start = document.getElementById('start-tour');
  const frame = document.getElementById('virtual-frame');
  const status = document.getElementById('virtual-status');
  let resizeObserver;
  const fail = () => {
    status.textContent = 'No se ha podido cargar la visita. Comprueba la conexión y pulsa para intentarlo de nuevo.';
    start.disabled = false;
    document.getElementById('virtual-start').hidden = false;
  };
  start.addEventListener('click', () => {
    start.disabled = true;
    status.textContent = 'Cargando la visita virtual…';
    frame.hidden = false;
    frame.src = '/assets/visita-virtual/Clinica_Babio_v36_publica.html';
  });
  frame.addEventListener('error', fail);
  frame.addEventListener('load', () => {
    if (!frame.getAttribute('src')) return;
    try {
      const doc = frame.contentDocument;
      const scene = doc.getElementById('scene');
      const viewerMessage = doc.getElementById('error')?.textContent.trim();
      if (!scene || (viewerMessage && viewerMessage !== 'Modo compatible activo (sin WebGL).')) return fail();
      // Only adapt the surrounding controls; the approved geometry and renderer stay intact.
      const css = doc.createElement('style');
      css.textContent = `html{overflow-wrap:anywhere}body{margin:4px;color:#17343c}
        *{box-sizing:border-box}#clinica-inline .controls{gap:8px}
        button,select{min-height:44px;min-width:44px;font:inherit;max-width:100%;border:1px solid #687d87;border-radius:6px;background:#fff;color:#17343c;padding:8px}
        #clinica-inline .controls label{display:inline-flex;align-items:center;min-height:44px;gap:5px}
        #clinica-inline select{min-width:0}#clinica-inline canvas{height:clamp(260px,58vw,650px);min-height:0}
        :focus-visible{outline:3px solid #246a9a;outline-offset:2px}
        @media(max-width:480px){#room,#doorselect{flex-basis:100%;width:100%}}
        @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}`;
      doc.head.append(css);
      scene.tabIndex = 0;
      scene.setAttribute('aria-label', 'Modelo 3D de la clínica. Arrastra para girar, pellizca para ampliar. Con teclado: flechas para girar, más y menos para zoom.');
      // Preserve the original functions; keyboard is an additional input method.
      const keyboard = doc.createElement('script');
      keyboard.textContent = `document.getElementById('scene').addEventListener('keydown', e => {
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)) return;
        e.preventDefault();
        if(e.key==='ArrowLeft') az-=.1; if(e.key==='ArrowRight') az+=.1;
        if(e.key==='ArrowUp') el=Math.min(1.569,el+.1); if(e.key==='ArrowDown') el=Math.max(.1,el-.1);
        if(e.key==='+'||e.key==='=') zoom=Math.max(2,zoom*.8); if(e.key==='-') zoom=Math.min(30,zoom*1.2);
        draw();
      });`;
      doc.body.append(keyboard);
      const resize = () => { frame.style.height = Math.ceil(doc.body.getBoundingClientRect().height + 12) + 'px'; };
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(doc.body);
      resize();
      frame.contentWindow.dispatchEvent(new Event('resize'));
      document.getElementById('virtual-start').hidden = true;
      status.textContent = 'Visita lista. Selecciona una estancia o explora la clínica completa.';
      scene.focus({ preventScroll: true });
    } catch { fail(); }
  });
})();
