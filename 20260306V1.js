(() => {
  const FALLBACK_IMAGE = "https://www.jungle-city.be/site/layout/img/junglecity-logo.png";

  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modal-title");
  const modalText = document.getElementById("modal-text");
  const modalImg = document.getElementById("modal-img");
  const closeBtn = modal?.querySelector(".close");
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");

  const selectors = {
    cards: ".attraction-card",
  };

  function normalizeText(text = "") {
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  }

  function parseAccessInfo(detailsRaw = "") {
    const details = normalizeText(detailsRaw);

    const guidedRange =
      details.match(/(?:begeleid|accompagné)[ :]*([0-9]{1,3})\s*[-–]\s*([0-9]{1,3})cm/i) ||
      null;

    const guidedPlus =
      details.match(/(?:begeleid|accompagné)[ :]*\+([0-9]{1,3})cm/i) || null;

    const soloRange =
      details.match(/(?:alleen|seul)[ :]*([0-9]{1,3})\s*[-–]\s*([0-9]{1,3})cm/i) ||
      null;

    const soloPlus =
      details.match(/(?:alleen|seul)[ :]*\+([0-9]{1,3})cm/i) || null;

    const maxMatch =
      detailsRaw.match(/max[^0-9]*([0-9]{2,3}\s*cm[^/]*\/[^0-9]*[0-9]{2,3}\s*kg)/i) ||
      null;

    return {
      guidedRange,
      guidedPlus,
      soloRange,
      soloPlus,
      max: maxMatch ? maxMatch[1] : null,
      isNew: /\b(nieuw|new|nouveau)\b/i.test(detailsRaw),
    };
  }

  function createAccessibilityUI(card, info) {
    const content = card.querySelector(".attraction-content");
    const summary = content?.querySelector("p");
    if (!content || !summary) return;

    const wrapper = document.createElement("div");
    wrapper.className = "accessibility-wrapper";

    let hasIcons = false;

    if (info.guidedRange) {
      const [, min, max] = info.guidedRange;
      const node = document.createElement("div");
      node.className = "access-icon access-icon--guided";
      node.innerHTML = `<span class="emoji">👨‍👧</span><span>${min}-${max}cm</span>`;
      node.title = "Begeleid";
      wrapper.appendChild(node);
      hasIcons = true;
    } else if (info.guidedPlus) {
      const [, min] = info.guidedPlus;
      const node = document.createElement("div");
      node.className = "access-icon access-icon--guided";
      node.innerHTML = `<span class="emoji">👨‍👧</span><span>+${min}cm</span>`;
      node.title = "Begeleid";
      wrapper.appendChild(node);
      hasIcons = true;
    }

    if (info.soloRange) {
      const [, min, max] = info.soloRange;
      const node = document.createElement("div");
      node.className = "access-icon access-icon--solo";
      node.innerHTML = `<span class="emoji">🧍</span><span>${min}-${max}cm</span>`;
      node.title = "Alleen";
      wrapper.appendChild(node);
      hasIcons = true;
    } else if (info.soloPlus) {
      const [, min] = info.soloPlus;
      const node = document.createElement("div");
      node.className = "access-icon access-icon--solo";
      node.innerHTML = `<span class="emoji">🧍</span><span>+${min}cm</span>`;
      node.title = "Alleen";
      wrapper.appendChild(node);
      hasIcons = true;
    }

    if (info.max) {
      const max = document.createElement("div");
      max.className = "max-limits";
      max.textContent = `Max: ${info.max}`;
      wrapper.appendChild(max);
    }

    if (hasIcons) {
      summary.hidden = true;
      content.appendChild(wrapper);
    }
  }

  function addCardDecorations(card, info) {
    if (info.isNew && !card.querySelector(".badge-new")) {
      const badge = document.createElement("div");
      badge.className = "badge-new";
      badge.textContent = "NEW";
      card.appendChild(badge);
    }

    if (!card.querySelector(".click-icon")) {
      const icon = document.createElement("div");
      icon.className = "click-icon";
      icon.innerHTML = "🔍";
      card.appendChild(icon);
    }
  }

  function openModal(card) {
    if (!modal) return;

    const title = card.dataset.name || "";
    const details = card.dataset.details || "";
    const image = card.dataset.image || FALLBACK_IMAGE;

    modalTitle.textContent = title;
    modalText.textContent = details;
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
    const cards = document.querySelectorAll(selectors.cards);

    cards.forEach((card) => {
      if (card.dataset.visible === "false") {
        card.style.display = "none";
        return;
      }

      const details = card.dataset.details || "";
      const info = parseAccessInfo(details);

      createAccessibilityUI(card, info);
      addCardDecorations(card, info);

      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${card.dataset.name || "Attractie"} details bekijken`);

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

    window.addEventListener("scroll", toggle);
    toggle();

    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
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
  });
})();
