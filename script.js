const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("is-open", !expanded);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    });
  });
}

const setupSlideshow = (slideSelector, dotSelector, intervalMs = 4000) => {
  const slides = Array.from(document.querySelectorAll(slideSelector));
  const dots = Array.from(document.querySelectorAll(dotSelector));

  if (slides.length === 0 || dots.length !== slides.length) {
    return;
  }

  let activeSlideIndex = 0;
  let slideIntervalId = null;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  const container = slides[0].parentElement;
  const pauseButton = document.createElement('button');
  pauseButton.type = 'button';
  pauseButton.className = 'slideshow-toggle';
  container.append(pauseButton);
  const updatePauseLabel = () => {
    pauseButton.textContent = paused ? 'Reanudar imágenes' : 'Pausar imágenes';
    pauseButton.setAttribute('aria-pressed', String(paused));
  };
  const loadSlide = (slide) => {
    slide.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      delete img.dataset.src;
      delete img.dataset.srcset;
    });
  };

  const showSlide = (index) => {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
      slide.setAttribute('aria-hidden', String(slideIndex !== index));
      if (slideIndex === index) loadSlide(slide);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
      dot.setAttribute('aria-pressed', String(dotIndex === index));
    });

    activeSlideIndex = index;
  };

  const startSlideshow = () => {
    if (slideIntervalId !== null) window.clearInterval(slideIntervalId);
    if (paused || document.hidden) return;
    slideIntervalId = window.setInterval(() => {
      const nextIndex = (activeSlideIndex + 1) % slides.length;
      showSlide(nextIndex);
    }, intervalMs);
  };

  pauseButton.addEventListener('click', () => {
    paused = !paused;
    updatePauseLabel();
    restartSlideshow();
  });
  motion.addEventListener('change', () => {
    paused = motion.matches;
    updatePauseLabel();
    restartSlideshow();
  });

  const restartSlideshow = () => {
    if (slideIntervalId !== null) {
      window.clearInterval(slideIntervalId);
    }

    startSlideshow();
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      restartSlideshow();
    });
  });

  showSlide(0);
  updatePauseLabel();
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      startSlideshow();
      observer.disconnect();
    }
  });

  document.addEventListener('visibilitychange', restartSlideshow);
  observer.observe(container);
};

setupSlideshow(".hero-slide", ".hero-dot");
setupSlideshow(".facilities-slide", ".facilities-dot", 4500);

document.querySelectorAll(".service-card-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const controlledId = toggle.getAttribute("aria-controls");
    const content = controlledId ? document.getElementById(controlledId) : null;

    if (!content) {
      return;
    }

    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    content.hidden = expanded;
    content.parentElement?.classList.toggle("is-open", !expanded);
  });
});

document.querySelectorAll(".map-load-button").forEach((button) => {
  button.addEventListener("click", () => {
    const mapSrc = button.getAttribute("data-map-src");
    const mapContainer = button.closest(".mini-map");

    if (!mapSrc || !mapContainer) {
      return;
    }

    mapContainer.innerHTML = `
      <iframe
        title="Mapa de Clínica Dental Doctor Babío"
        src="${mapSrc}"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
    `;
  });
});

const newsFilterButtons = Array.from(document.querySelectorAll("[data-news-filter]"));
const newsBoardItems = Array.from(document.querySelectorAll("[data-news-category]"));

if (newsFilterButtons.length > 0 && newsBoardItems.length > 0) {
  const applyNewsFilter = (category) => {
    newsFilterButtons.forEach((button) => {
      const selected = button.dataset.newsFilter === category;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    newsBoardItems.forEach((item) => {
      item.hidden = category !== "todas" && item.dataset.newsCategory !== category;
    });
  };

  newsFilterButtons.forEach((button) => {
    button.addEventListener("click", () => applyNewsFilter(button.dataset.newsFilter));
  });

  const categoryFromHash = window.location.hash.replace("#", "");
  const validCategory = newsFilterButtons.some(
    (button) => button.dataset.newsFilter === categoryFromHash,
  );
  applyNewsFilter(validCategory ? categoryFromHash : "todas");
}
