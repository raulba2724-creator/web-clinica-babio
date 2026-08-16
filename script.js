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

  const showSlide = (index) => {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
    });

    activeSlideIndex = index;
  };

  const startSlideshow = () => {
    slideIntervalId = window.setInterval(() => {
      const nextIndex = (activeSlideIndex + 1) % slides.length;
      showSlide(nextIndex);
    }, intervalMs);
  };

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
  startSlideshow();
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
