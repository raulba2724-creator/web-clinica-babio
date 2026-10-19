(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cards = [...document.querySelectorAll('#grid .card')];
  const treatments = [...document.querySelectorAll('.treatment')];
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  let filter = 'Todos';
  let current = -1;
  let previous = -1;
  const draw = () => {
    const query = normalize($('search').value);
    let count = 0;
    for (const card of cards) {
      card.hidden = !(filter === 'Todos' || card.dataset.category === filter) || !normalize(card.textContent).includes(query);
      if (!card.hidden) count++;
    }
    $('count').textContent = `${count} ${count === 1 ? 'tratamiento' : 'tratamientos'}`;
    $('empty').hidden = count !== 0;
  };
  for (const category of ['Todos', ...new Set(cards.map(c => c.dataset.category))]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category;
    button.classList.toggle('active', category === filter);
    button.setAttribute('aria-pressed', String(category === filter));
    button.addEventListener('click', () => {
      filter = category;
      for (const other of $('filters').children) {
        other.classList.toggle('active', other === button);
        other.setAttribute('aria-pressed', String(other === button));
      }
      draw();
    });
    $('filters').append(button);
  }
  $('filters').hidden = false;
  $('search-label').hidden = false;
  $('search').addEventListener('input', draw);
  function route(focus = false) {
    const match = location.hash.match(/^#tratamiento-(\d+)$/);
    const candidate = match ? Number(match[1]) - 1 : -1;
    current = candidate >= 0 && candidate < treatments.length ? candidate : -1;
    const reading = current !== -1;
    $('home').hidden = reading;
    $('reader').hidden = !reading;
    $('reader-controls').hidden = !reading;
    $('sequence-nav').hidden = !reading;
    $('reader-hint').hidden = !reading;
    document.body.classList.toggle('reading', reading);
    for (const [i, treatment] of treatments.entries()) {
      treatment.hidden = i !== current;
      treatment.querySelector('.pages').classList.remove('enlarged');
    }
    $('zoom').textContent = 'Ampliar imágenes';
    $('zoom').setAttribute('aria-pressed', 'false');
    if (reading) {
      const active = treatments[current];
      $('category').textContent = active.dataset.category;
      $('position').textContent = `${current + 1} de ${treatments.length} tratamientos`;
      $('prev').disabled = current === 0;
      $('next').disabled = current === treatments.length - 1;
      document.title = `${active.querySelector('h2').textContent} | Guía visual · Clínica Babío`;
      if (focus) active.querySelector('h2').focus({preventScroll:true});
      window.scrollTo(0, 0);
      previous = current;
    } else {
      document.title = 'Guía visual de tratamientos | Clínica Dental Doctor Babío';
      if (focus) {
        const target = previous >= 0 && !cards[previous].hidden ? cards[previous] : document.querySelector('#indice h2');
        target.focus({preventScroll:true});
        target.scrollIntoView({block:'center'});
      }
    }
  }
  $('prev').addEventListener('click', () => { if (current > 0) location.hash = `tratamiento-${current}`; });
  $('next').addEventListener('click', () => { if (current < treatments.length - 1) location.hash = `tratamiento-${current + 2}`; });
  $('zoom').addEventListener('click', () => {
    if (current < 0) return;
    const expanded = treatments[current].querySelector('.pages').classList.toggle('enlarged');
    $('zoom').textContent = expanded ? 'Ajustar imágenes' : 'Ampliar imágenes';
    $('zoom').setAttribute('aria-pressed', String(expanded));
  });
  window.addEventListener('hashchange', () => route(true));
  draw();
  route();
})();
