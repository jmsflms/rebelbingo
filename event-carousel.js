(() => {
  const config = window.REBEL_EVENTS;
  const grid = document.getElementById("events-grid");
  if (!config || !grid) return;
  const safeUrl = value => {
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };
  for (const event of config.events.filter(event => event.visible !== false)) {
    const card = document.createElement("article");
    card.className = "event-card";
    const img = document.createElement("img");
    img.className = "event-img";
    img.src = safeUrl(event.image);
    img.alt = event.title;
    img.loading = "lazy";
    const title = document.createElement("h2");
    title.className = "event-name";
    title.textContent = event.title;
    const waitlist = event.status === "waitlist";
    const url = safeUrl(event.url || (waitlist ? config.waitlistUrl : config.bookUrl));
    const action = document.createElement(url ? "a" : "button");
    action.className = "event-action";
    action.textContent = waitlist ? "JOIN WAITLIST" : "GET TICKETS";
    if (url) {
      action.href = url;
      action.target = "_blank";
      action.rel = "noopener noreferrer";
      action.setAttribute("aria-label", action.textContent + " — " + event.title);
    } else {
      action.type = "button";
      action.disabled = true;
    }
    card.append(img, title, action);
    if (!url) {
      const note = document.createElement("p");
      note.className = "event-note";
      note.textContent = waitlist ? "Waitlist opening soon." : "Booking opening soon.";
      card.append(note);
    }
    grid.append(card);
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = window.matchMedia("(min-width: 761px)");
  const carousel = grid.closest(".events");
  const originals = [...grid.children];
  if (!originals.length) return;
  const clone = card => {
    const copy = card.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    copy.querySelectorAll("a,button").forEach(control => control.tabIndex = -1);
    return copy;
  };
  // Each repeated group is wider than the desktop viewport, so wrapping is invisible.
  const repeats = Math.max(1, Math.ceil(1000 / (originals.length * 240)));
  for (let repeat = 1; repeat < repeats; repeat++) {
    originals.forEach(card => grid.append(clone(card)));
  }
  const middle = [...grid.children];
  const before = document.createDocumentFragment();
  middle.forEach(card => before.append(clone(card)));
  grid.prepend(before);
  const after = middle.map(clone);
  after.forEach(card => grid.append(card));
  grid.style.scrollSnapType = "none";
  let cycle = 0;
  let position = 0;
  let resumeAfter = 0;
  const measure = () => {
    cycle = after[0].getBoundingClientRect().left - middle[0].getBoundingClientRect().left;
    position = cycle;
    grid.scrollLeft = position;
  };
  const normalise = value => {
    if (!cycle) return value;
    return cycle + ((value - cycle) % cycle + cycle) % cycle;
  };
  measure();
  window.addEventListener("resize", measure);
  const pauseAfterInteraction = () => { resumeAfter = Date.now() + 7000; };
  for (const eventName of ["pointerdown", "wheel", "keydown"]) {
    carousel.addEventListener(eventName, pauseAfterInteraction, {passive: true});
  }
  const move = direction => {
    pauseAfterInteraction();
    const step = middle[0].getBoundingClientRect().width + parseFloat(getComputedStyle(grid).gap);
    grid.scrollTo({left: grid.scrollLeft + direction * step, behavior: reduced.matches ? "instant" : "smooth"});
  };
  document.getElementById("events-prev").addEventListener("click", () => move(-1));
  document.getElementById("events-next").addEventListener("click", () => move(1));
  grid.addEventListener("keydown", event => {
    if (event.target !== grid) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    }
  });
  // Restore the matching middle group after a manual swipe or arrow movement.
  let scrollTimer;
  grid.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      position = normalise(grid.scrollLeft);
      if (Math.abs(position - grid.scrollLeft) > 1) grid.scrollLeft = position;
    }, 180);
  }, {passive: true});
  let previousTime;
  const animate = time => {
    const elapsed = previousTime === undefined ? 0 : Math.min(time - previousTime, 50);
    previousTime = time;
    const bounds = carousel.getBoundingClientRect();
    const paused = !desktop.matches || reduced.matches || document.hidden ||
      Date.now() < resumeAfter || carousel.matches(":hover") ||
      carousel.matches(":focus-within") || bounds.bottom <= 0 || bounds.top >= window.innerHeight;
    if (paused) {
      position = grid.scrollLeft;
    } else {
      position = normalise(position + 24 * elapsed / 1000);
      grid.scrollLeft = position;
    }
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
})();
