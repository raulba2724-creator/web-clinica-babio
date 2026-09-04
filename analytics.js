(() => {
  const measurementId = "G-9LN6HNGJSR";
  const consentKey = "babio_analytics_consent";
  const validConsent = new Set(["granted", "denied"]);
  let analyticsLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });

  const storedConsent = () => {
    try {
      const value = window.localStorage.getItem(consentKey);
      return validConsent.has(value) ? value : null;
    } catch {
      return null;
    }
  };

  const saveConsent = (value) => {
    try {
      window.localStorage.setItem(consentKey, value);
    } catch {
      // La elección sigue aplicándose durante la visita aunque no pueda guardarse.
    }
  };

  const loadAnalytics = () => {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    window.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      anonymize_ip: true,
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  };

  const classifyAction = (element, href) => {
    if (href.includes("wa.me") || href.includes("whatsapp")) return "whatsapp";
    if (href.startsWith("tel:")) return "telefono";
    if (href.includes("google.com/maps")) return "mapa";
    if (element.classList.contains("map-load-button")) return "cargar_mapa";
    if (element.classList.contains("service-card-toggle")) return "tratamiento";
    if (element.hasAttribute("data-news-filter")) return "filtro_noticias";
    if (href.includes("/noticias/") || href.includes("noticias.html")) return "noticia";
    if (href.includes("contacto") || href.includes("#contacto")) return "contacto";
    if (element.closest(".site-nav")) return "menu";
    return element.tagName === "BUTTON" ? "boton" : "enlace";
  };

  const actionLabel = (element) => (
    element.dataset.analyticsLabel
    || element.getAttribute("aria-label")
    || element.textContent
    || element.getAttribute("href")
    || "Sin etiqueta"
  ).replace(/\s+/g, " ").trim().slice(0, 100);

  const trackAction = (element) => {
    if (storedConsent() !== "granted" || !analyticsLoaded) return;
    if (element.matches("[data-analytics-ignore], .menu-toggle, .hero-dot, .facilities-dot")) return;
    if (element.closest("[data-cookie-consent]")) return;

    const href = element.getAttribute("href") || "";
    const buttonType = classifyAction(element, href);
    const buttonName = actionLabel(element);

    window.gtag("event", "cta_click", {
      button_name: buttonName,
      button_type: buttonType,
      link_url: href.slice(0, 500),
      page_path: `${window.location.pathname}${window.location.hash}`,
    });

    if (["whatsapp", "telefono", "contacto"].includes(buttonType)) {
      window.gtag("event", "generate_lead", {
        method: buttonType,
        button_name: buttonName,
      });
    }
  };

  const createConsentInterface = () => {
    const panel = document.createElement("section");
    panel.className = "analytics-consent";
    panel.setAttribute("aria-label", "Preferencias de analítica");
    panel.setAttribute("data-cookie-consent", "");
    panel.innerHTML = `
      <div class="analytics-consent-copy">
        <strong>Ayúdanos a mejorar la web</strong>
        <p>Usamos Google Analytics para conocer las visitas y qué botones se utilizan. No recogemos información clínica ni datos de los mensajes.</p>
        <a href="/cookies.html">Más información</a>
      </div>
      <div class="analytics-consent-actions">
        <button type="button" class="button button-secondary" data-consent-choice="denied">Rechazar</button>
        <button type="button" class="button button-primary" data-consent-choice="granted">Aceptar analítica</button>
      </div>`;

    const settings = document.createElement("button");
    settings.type = "button";
    settings.className = "analytics-settings";
    settings.textContent = "Configurar analítica";
    settings.setAttribute("data-cookie-consent", "");
    settings.setAttribute("data-analytics-ignore", "");

    const showPanel = () => {
      panel.hidden = false;
      settings.hidden = true;
    };
    const hidePanel = () => {
      panel.hidden = true;
      settings.hidden = false;
    };
    const setConsent = (value) => {
      saveConsent(value);
      window.gtag("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: value,
      });
      if (value === "granted") loadAnalytics();
      hidePanel();
    };

    panel.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-consent-choice]")?.dataset.consentChoice;
      if (validConsent.has(choice)) setConsent(choice);
    });
    settings.addEventListener("click", showPanel);
    document.querySelectorAll("[data-consent-choice]").forEach((button) => {
      button.addEventListener("click", () => setConsent(button.dataset.consentChoice));
    });

    document.body.append(panel, settings);
    storedConsent() ? hidePanel() : showPanel();
  };

  document.addEventListener("click", (event) => {
    const action = event.target.closest("a, button");
    if (action) trackAction(action);
  }, { capture: true });

  if (storedConsent() === "granted") loadAnalytics();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createConsentInterface, { once: true });
  } else {
    createConsentInterface();
  }
})();
