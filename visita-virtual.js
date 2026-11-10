(() => {
  const frame = document.getElementById('virtual-frame');
  const status = document.getElementById('virtual-status');
  // One iframe document owns the original animation loop. View changes never reload it.
  if (frame.dataset.initialized) return;
  frame.dataset.initialized = 'true';
  frame.addEventListener('error', () => { status.textContent = 'No se ha podido cargar la visita. Recarga la página para intentarlo de nuevo.'; });
  frame.addEventListener('load', () => {
    if (!frame.getAttribute('src')) return;
    const doc = frame.contentDocument;
    const scene = doc?.querySelector('#simulacion-babio canvas');
    const state = doc?.getElementById('estado');
    if (!scene || !state) { status.textContent = 'No se ha podido cargar la simulación. Recarga la página para intentarlo de nuevo.'; return; }
    const css = doc.createElement('style');
    css.textContent = `html{overflow-wrap:anywhere}body{margin:0;padding:4px;display:flow-root}
      *{box-sizing:border-box}#simulacion-babio .controls{gap:10px;flex-wrap:wrap}
      #simulacion-babio select{min-height:44px;min-width:0;max-width:100%;font:inherit}
      #simulacion-babio label{min-height:44px;display:inline-flex;align-items:center;gap:6px}
      #simulacion-babio canvas{height:clamp(300px,58vw,650px);min-height:0}
      :focus-visible{outline:3px solid #246a9a;outline-offset:2px}
      @media(max-width:480px){#simulacion-babio #view{flex:1 1 180px}}`;
    doc.body.append(css);
    const resize = () => { frame.style.height = Math.ceil(doc.body.getBoundingClientRect().height + 12) + 'px'; };
    const sizing = new ResizeObserver(resize);
    sizing.observe(doc.body); resize();
    const ready = () => {
      const message = state.textContent.trim();
      if (!message) { status.textContent = ''; initialization.disconnect(); }
      else if (/Error|No se han podido/.test(message)) { status.textContent = message; initialization.disconnect(); }
    };
    const initialization = new MutationObserver(ready);
    initialization.observe(state, {childList:true,subtree:true,characterData:true});
    ready();

    // Add two-finger zoom through the original wheel handler. No geometry, timing or doors change.
    const fingers = new Map();
    let distance = 0;
    const span = () => { const p = [...fingers.values()]; return Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]); };
    scene.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') return;
      fingers.set(e.pointerId,[e.clientX,e.clientY]);
      if (fingers.size > 1) {
        e.stopImmediatePropagation();
        scene.onpointercancel?.(e);
        scene.setPointerCapture(e.pointerId);
        distance = span();
      }
    }, true);
    scene.addEventListener('pointermove', e => {
      if (!fingers.has(e.pointerId)) return;
      fingers.set(e.pointerId,[e.clientX,e.clientY]);
      if (fingers.size < 2) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const next = span();
      if (distance > 0 && next > 0) scene.dispatchEvent(new frame.contentWindow.WheelEvent('wheel', {deltaY:Math.log(distance/next)*1000,cancelable:true}));
      distance = next;
    }, {capture:true,passive:false});
    for (const type of ['pointerup','pointercancel','lostpointercapture']) scene.addEventListener(type,e => { fingers.delete(e.pointerId); distance = 0; },true);
    // Observers and event listeners belong to this document; a reload destroys its single loop.
  });
  frame.src = '/assets/visita-virtual/Clinica_Babio_simulacion_v04.html';
})();
