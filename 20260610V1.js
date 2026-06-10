(() => {
  const FALLBACK_IMAGE = "https://www.jungle-city.be/site/layout/img/junglecity-logo.png";

  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modal-title");
  let modalText = document.getElementById("modal-text");
  const modalImg = document.getElementById("modal-img");
  const closeBtn = modal?.querySelector(".close");
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");

  const pageText = document.body.textContent.toLowerCase();
  const isFr =
    document.documentElement.lang?.toLowerCase().startsWith("fr") ||
    location.pathname.includes("/fr/") ||
    pageText.includes("accompagné");

  const labels = isFr
    ? {
        guided: "Minimum accompagne",
        solo: "Minimum seul",
        details: "Voir les details",
        max: "Max",
      }
    : {
        guided: "Minimum begeleid",
        solo: "Minimum alleen",
        details: "Details bekijken",
        max: "Max",
      };

  if (modalText && modalText.tagName.toLowerCase() === "p") {
    const div = document.createElement("div");
    div.id = "modal-text";
    div.className = modalText.className;
    modalText.replaceWith(div);
    modalText = div;
  }

  function normalizeText(text = "") {
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  }

  function parseAccessInfo(detailsRaw = "") {
    const details = normalizeText(detailsRaw);

    const guidedRange =
      details.match(/(?:begeleid|accompagn[eé])[ :]*([0-9]{1,3})\s*[-–]\s*([0-9]{1,3})cm/i) || null;

    const guidedPlus =
      details.match(/(?:begeleid|accompagn[eé])[ :]*\+([0-9]{1,3})cm/i) || null;

    const soloRange =
      details.match(/(?:alleen|seul)[ :]*([0-9]{1,3})\s*[-–]\s*([0-9]{1,3})cm/i) || null;

    const soloPlus =
      details.match(/(?:alleen|seul)[ :]*\+([0-9]{1,3})cm/i) || null;

    const maxMatch =
      detailsRaw.match(/max[^0-9]*([0-9]{1,3}\s*cm(?:[^0-9]+[0-9]{1,3}\s*kg)?)/i) ||
      detailsRaw.match(/max[^0-9]*([0-9]{1,3}\s*kg)/i) ||
      null;

    return {
      guidedRange,
      guidedPlus,
      soloRange,
      soloPlus,
      max: maxMatch ? maxMatch[1].replace(/\s+/g, " ").trim() : null,
      isNew: /\b(nieuw|new|nouveau)\b/i.test(detailsRaw),
    };
  }

  function createSvgIcon(type) {
    const span = document.createElement("span");
    span.className = `access-symbol access-symbol--${type}`;
    span.setAttribute("aria-hidden", "true");

    if (type === "guided") {
      span.innerHTML =
        '<svg viewBox="0 0 24 24"><circle cx="8" cy="7" r="3"/><circle cx="16" cy="8" r="2.4"/><path d="M3.4 20c.5-4.4 2.9-6.7 6.5-6.7 2.6 0 4.6 1.2 5.7 3.5"/><path d="M13.6 20c.3-2.9 2.1-4.6 4.8-4.6 1.2 0 2.3.3 3.2 1"/></svg>';
    } else if (type === "solo") {
      span.innerHTML =
        '<svg viewBox="0 0 24 24"><circle cx="12" cy="6.5" r="3"/><path d="M6.4 21c.6-5.2 2.8-7.7 5.6-7.7s5 2.5 5.6 7.7"/></svg>';
    } else {
      span.innerHTML =
        '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></svg>';
    }

    return span;
  }

  function createPill(className, type, text, title) {
    const node = document.createElement("div");
    node.className = className;
    node.title = title;
    node.dataset.label = title;

    const value = document.createElement("span");
    value.className = "access-value";
    value.textContent = text;

    node.appendChild(createSvgIcon(type));
    node.appendChild(value);

    return node;
  }

  function createAccessChips(info) {
    const wrapper = document.createElement("div");
    wrapper.className = "accessibility-wrapper";
    let hasChips = false;

    if (info.guidedRange) {
      const [, min, max] = info.guidedRange;
      wrapper.appendChild(createPill("access-icon access-icon--guided", "guided", `${min}-${max}cm`, labels.guided));
      hasChips = true;
    } else if (info.guidedPlus) {
      const [, min] = info.guidedPlus;
      wrapper.appendChild(createPill("access-icon access-icon--guided", "guided", `+${min}cm`, labels.guided));
      hasChips = true;
    }

    if (info.soloRange) {
      const [, min, max] = info.soloRange;
      wrapper.appendChild(createPill("access-icon access-icon--solo", "solo", `${min}-${max}cm`, labels.solo));
      hasChips = true;
    } else if (info.soloPlus) {
      const [, min] = info.soloPlus;
      wrapper.appendChild(createPill("access-icon access-icon--solo", "solo", `+${min}cm`, labels.solo));
      hasChips = true;
    }

    if (info.max) {
      const max = document.createElement("div");
      max.className = "max-limits";
      max.textContent = `${labels.max}: ${info.max}`;
      wrapper.appendChild(max);
    }

    return hasChips ? wrapper : null;
  }

  function enhanceCard(card, info) {
    const content = card.querySelector(".attraction-content");
    const summary = content?.querySelector("p");
    if (!content || !summary) return;

    const chips = createAccessChips(info);

    if (chips) {
      summary.hidden = true;
      content.appendChild(chips);
    }

    if (info.isNew && !card.querySelector(".badge-new")) {
      const badge = document.createElement("div");
      badge.className = "badge-new";
      badge.textContent = "NEW";
      card.appendChild(badge);
    }

    if (!card.querySelector(".click-icon")) {
      const icon = document.createElement("div");
      icon.className = "click-icon";
      icon.title = labels.details;
      icon.appendChild(createSvgIcon("search"));
      card.appendChild(icon);
    }
  }

  function escapeHtml(text = "") {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function looksLikeStructuredDetails(lines = [], title = "") {
    return title.toLowerCase().includes("springkastelen") && lines.filter((line) => /cm/i.test(line)).length >= 2;
  }

  function isDetailTitle(line = "") {
    return !/cm|maximum|max|vanaf|onder|moins|partir|accompagn|begeleid|seul|alleen/i.test(line);
  }

  function formatStructuredDetails(lines = []) {
    let html = "";
    let currentBlock = "";

    lines.forEach((line) => {
      if (isDetailTitle(line)) {
        if (currentBlock) html += `<div class="detail-block">${currentBlock}</div>`;
        currentBlock = `<h4>${escapeHtml(line)}</h4>`;
      } else {
        currentBlock += `<p>${escapeHtml(line)}</p>`;
      }
    });

    if (currentBlock) html += `<div class="detail-block">${currentBlock}</div>`;
    return html;
  }

  function createModalRules(info, firstLine) {
    const chips = createAccessChips(info);

    if (chips) {
      const wrap = document.createElement("div");
      wrap.className = "modal-rules";
      Array.from(chips.children).forEach((child) => wrap.appendChild(child.cloneNode(true)));
      return wrap.outerHTML;
    }

    return firstLine ? `<div class="modal-rule-line">${escapeHtml(firstLine)}</div>` : "";
  }

  function formatDetails(details = "", title = "") {
    const lines = details.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return "";

    if (looksLikeStructuredDetails(lines, title)) {
      return formatStructuredDetails(lines);
    }

    const info = parseAccessInfo(details);
    const firstLine = lines[0] || "";
    const description = lines.slice(1).join("\n") || details;

    return `
      ${createModalRules(info, firstLine)}
      <div class="modal-description">${escapeHtml(description).replace(/\n/g, "<br>")}</div>
    `;
  }

  function openModal(card) {
    if (!modal || !modalTitle || !modalText || !modalImg) return;

    const title = card.dataset.name || card.querySelector("h3")?.textContent || "";
    const details = card.dataset.details || "";
    const image = card.dataset.image || card.querySelector("img")?.src || FALLBACK_IMAGE;

    modalTitle.textContent = title;
    modalText.innerHTML = formatDetails(details, title);
    modalImg.src = image;
    modalImg.onerror = () => {
      modalImg.src = FALLBACK_IMAGE;
    };

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function initCards() {
    document.querySelectorAll(".attraction-card").forEach((card) => {
      if (card.dataset.visible === "false") {
        card.style.display = "none";
        return;
      }

      const info = parseAccessInfo(card.dataset.details || "");
      enhanceCard(card, info);

      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${card.dataset.name || "Attractie"} ${labels.details}`);

      card.addEventListener("click", () => openModal(card));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openModal(card);
        }
      });
    });
  }

  function initScrollButton() {
    if (!scrollToTopBtn) return;

    const toggle = () => {
      scrollToTopBtn.classList.toggle("is-visible", window.scrollY > 250);
    };

    window.addEventListener("scroll", toggle, { passive: true });
    toggle();

    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function initStickyMenuAutoHide() {
    const menu = document.getElementById("stickyMenu");
    if (!menu) return;

    let lastY = window.scrollY;
    let ticking = false;

    function update() {
      const currentY = window.scrollY;
      const delta = currentY - lastY;

      if (currentY < 80) {
        menu.classList.remove("is-menu-hidden");
      } else if (delta > 8) {
        menu.classList.add("is-menu-hidden");
      } else if (delta < -8) {
        menu.classList.remove("is-menu-hidden");
      }

      lastY = Math.max(currentY, 0);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  function initModalEvents() {
    closeBtn?.addEventListener("click", closeModal);

    modal?.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCards();
    initScrollButton();
    initModalEvents();
    initStickyMenuAutoHide();
  });
})();
