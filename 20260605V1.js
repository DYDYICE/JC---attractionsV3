(() => {
  const FALLBACK_IMAGE = "https://www.jungle-city.be/site/layout/img/junglecity-logo.png";

  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modal-title");
  const modalText = document.getElementById("modal-text");
  const modalImg = document.getElementById("modal-img");
  const closeBtn = modal?.querySelector(".close");
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");

  function normalizeText(text = "") {
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  }

  function parseAccessInfo(detailsRaw = "") {
    const details = normalizeText(detailsRaw);

    const guidedRange =
      details.match(/(?:begeleid|accompagné)[ :]*([0-9]{1,3})\s*[-–]\s*([0-9]{1,3})cm/i) || null;

    const guidedPlus =
      details.match(/(?:begeleid|accompagné)[ :]*\+([0-9]{1,3})cm/i) || null;

    const soloRange =
      details.match(/(?:alleen|seul)[ :]*([0-9]{1,3})\s*[-–]\s*([0-9]{1,3})cm/i) || null;

    const soloPlus =
      details.match(/(?:alleen|seul)[ :]*\+([0-9]{1,3})cm/i) || null;

    const maxMatch =
      detailsRaw.match(/max[^0-9]*([0-9]{2,3}\s*cm[^/]*\/[^0-9]*[0-9]{2,3}\s*kg)/i) || null;

    return {
      guidedRange,
      guidedPlus,
      soloRange,
      soloPlus,
      max: maxMatch ? maxMatch[1] : null,
      isNew: /\b(nieuw|new|nouveau)\b/i.test(detailsRaw),
    };
  }

  function createPill(className, icon, text, title) {
    const node = document.createElement("div");
    node.className = className;
    node.title = title;

    const emoji = document.createElement("span");
    emoji.className = "emoji";
    emoji.textContent = icon;

    const label = document.createElement("span");
    label.textContent = text;

    node.appendChild(emoji);
    node.appendChild(label);

    return node;
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
      wrapper.appendChild(createPill("access-icon access-icon--guided", "👨‍👧", `${min}-${max}cm`, "Begeleid"));
      hasIcons = true;
    } else if (info.guidedPlus) {
      const [, min] = info.guidedPlus;
      wrapper.appendChild(createPill("access-icon access-icon--guided", "👨‍👧", `+${min}cm`, "Begeleid"));
      hasIcons = true;
    }

    if (info.soloRange) {
      const [, min, max] = info.soloRange;
      wrapper.appendChild(createPill("access-icon access-icon--solo", "🧍", `${min}-${max}cm`, "Alleen"));
      hasIcons = true;
    } else if (info.soloPlus) {
      const [, min] = info.soloPlus;
      wrapper.appendChild(createPill("access-icon access-icon--solo", "🧍", `+${min}cm`, "Alleen"));
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
      icon.textContent = "🔍";
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
    const normalizedTitle = title.toLowerCase();
    if (!normalizedTitle.includes("springkastelen")) return false;
    if (lines.length < 4) return false;

    const cmLines = lines.filter((line) => /cm/i.test(line));
    return cmLines.length >= 2;
  }

  function isDetailTitle(line = "") {
    return !/cm|maximum|vanaf|onder|moins|à partir|accompagn|begeleid/i.test(line);
  }

  function formatDetails(details = "", title = "") {
    const lines = details
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!looksLikeStructuredDetails(lines, title)) {
      return `<p>${escapeHtml(details).replace(/\n/g, "<br>")}</p>`;
    }

    let html = "";
    let currentBlock = "";

    lines.forEach((line) => {
      const isTitle = isDetailTitle(line);

      if (isTitle) {
        if (currentBlock) {
          html += `<div class="detail-block">${currentBlock}</div>`;
        }

        currentBlock = `<h4>${escapeHtml(line)}</h4>`;
      } else {
        currentBlock += `<p>${escapeHtml(line)}</p>`;
      }
    });

    if (currentBlock) {
      html += `<div class="detail-block">${currentBlock}</div>`;
    }

    return html;
  }

  function openModal(card) {
    if (!modal) return;

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
    const cards = document.querySelectorAll(".attraction-card");

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
