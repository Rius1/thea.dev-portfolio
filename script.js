// Tells the CSS that JavaScript is running (so .reveal elements can start hidden)
document.documentElement.classList.add("js");

/* ---------- THEME TOGGLE ---------- */
(function initTheme() {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");

  // Updates the button label so screen readers know what clicking does
  function updateLabel() {
    const isDark = root.getAttribute("data-theme") === "dark";
    toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }

  toggle.addEventListener("click", function () {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) { /* storage may be blocked; ignore */ }
    updateLabel();
  });

  // If the user never picked a theme, follow their system setting when it changes
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      let saved = null;
      try { saved = localStorage.getItem("theme"); } catch (err) {}
      if (!saved) {
        root.setAttribute("data-theme", e.matches ? "dark" : "light");
        updateLabel();
      }
    });
  }

  updateLabel();
})();

/* ---------- MOBILE MENU ---------- */
(function initMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  function setMenu(open) {
    navLinks.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  menuToggle.addEventListener("click", function () {
    setMenu(!navLinks.classList.contains("open"));
  });

  // Close the menu after choosing a link
  navLinks.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });

  // Close with the Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  // Close if the window grows to desktop size
  window.addEventListener("resize", function () {
    if (window.innerWidth > 720) setMenu(false);
  });
})();

/* ---------- ACTIVE NAV LINK + HEADER SHADOW ---------- */
(function initScrollSpy() {
  const header = document.getElementById("site-header");
  const links = Array.from(document.querySelectorAll(".nav-link"));
  const sections = links
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  function update() {
    header.classList.toggle("scrolled", window.scrollY > 10);

    // A section counts as "current" once its top passes about 35% down the screen
    const line = window.innerHeight * 0.35;
    let current = sections[0];
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= line) current = section;
    });

    // At the very bottom of the page, the last section (Contact) is current
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }

    links.forEach(function (link) {
      const isActive = link.getAttribute("href") === "#" + current.id;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

/* ---------- REVEAL ON SCROLL ---------- */
(function initReveal() {
  const items = document.querySelectorAll(".reveal");

  // Older browsers: just show everything
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("visible"); });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // animate only once
      }
    });
  }, { threshold: 0.12 });

  items.forEach(function (el) { observer.observe(el); });
})();

/* ---------- SKILLS CARD STACK ---------- */
(function initSkills() {
  // To change a skill or percentage, edit this list.
  const skills = [
    { name: "HTML",   percent: 20, logo: "logo-html" },
    { name: "CSS",    percent: 20, logo: "logo-css" },
    { name: "C",      percent: 17, logo: "logo-c" },
    { name: "C++",    percent: 32, logo: "logo-cpp" },
    { name: "Java",   percent: 11,  logo: "logo-java" },
    { name: "Python", percent: 15,  logo: "logo-python" }
  ];

  const track = document.getElementById("skill-track");
  const prevBtn = document.getElementById("skill-prev");
  const nextBtn = document.getElementById("skill-next");
  const nameEl = document.getElementById("skill-name");
  const percentEl = document.getElementById("skill-percent");
  const progressEl = document.getElementById("skill-progress");
  const fillEl = document.getElementById("skill-fill");

  const SVG_NS = "http://www.w3.org/2000/svg";
  let index = 0;          // which skill is selected
  let cards = [];

  // Build one card (a button) per skill
  skills.forEach(function (skill, i) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "skill-card";
    card.setAttribute("aria-label", skill.name + ", " + skill.percent + " percent");

    // Logo comes from the SVG sprite in index.html
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "skill-logo");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", "#" + skill.logo);
    svg.appendChild(use);
    card.appendChild(svg);

    // Clicking / tapping a side card brings it to the center
    card.addEventListener("click", function () {
      if (swiped) return; // ignore the click that ends a swipe
      goTo(i);
    });

    track.appendChild(card);
    cards.push(card);
  });

  // Positions every card relative to the selected one and updates the info below
  function render() {
    cards.forEach(function (card, i) {
      const offset = i - index;
      const abs = Math.abs(offset);
      card.style.setProperty("--offset", offset);
      card.style.setProperty("--abs", Math.min(abs, 3));
      card.classList.toggle("is-active", offset === 0);
      card.classList.toggle("is-hidden", abs > 2); // only show 2 cards on each side
      card.tabIndex = offset === 0 ? 0 : -1;
      if (offset === 0) card.setAttribute("aria-current", "true");
      else card.removeAttribute("aria-current");
    });

    const skill = skills[index];
    nameEl.textContent = skill.name;
    percentEl.textContent = skill.percent + "%";
    progressEl.setAttribute("aria-valuenow", String(skill.percent));
    progressEl.setAttribute("aria-valuetext", skill.percent + " percent");
    fillEl.style.width = skill.percent + "%";

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === skills.length - 1;
    prevBtn.style.opacity = prevBtn.disabled ? "0.35" : "";
    nextBtn.style.opacity = nextBtn.disabled ? "0.35" : "";
  }

  function goTo(i) {
    index = Math.max(0, Math.min(skills.length - 1, i));
    render();
  }

  prevBtn.addEventListener("click", function () { goTo(index - 1); });
  nextBtn.addEventListener("click", function () { goTo(index + 1); });

  // Keyboard: left / right arrows while the stack is focused
  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
  });

  // Swipe / drag support (touch, mouse and pen) using pointer events
  let startX = null;
  let swiped = false;
  const SWIPE_DISTANCE = 40; // pixels needed to count as a swipe

  track.addEventListener("pointerdown", function (e) {
    startX = e.clientX;
    swiped = false;
    track.classList.add("dragging");
  });

  function endDrag(e) {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    track.classList.remove("dragging");
    if (Math.abs(dx) >= SWIPE_DISTANCE) {
      swiped = true;
      goTo(dx < 0 ? index + 1 : index - 1); // swipe left = next skill
      // reset the flag after the click event (if any) has fired
      setTimeout(function () { swiped = false; }, 0);
    }
  }
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", function () {
    startX = null;
    track.classList.remove("dragging");
  });
  track.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse") endDrag(e);
  });

  render();
})();
