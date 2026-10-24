/* Animated register form — character walks in, catches the sliding form, then leans on it. */
(() => {
  const $ = (s) => document.querySelector(s);
  const card = $("#card");
  const character = $("#character");
  const parts = {
    body: $("#body"),
    torso: $("#torso"),
    head: $("#head"),
    armB: $("#armB"), foreB: $("#foreB"),
    armF: $("#armF"), foreF: $("#foreF"),
    thighB: $("#thighB"), shinB: $("#shinB"),
    thighF: $("#thighF"), shinF: $("#shinF"),
  };

  /* ---------- joints (SVG coordinates) ---------- */
  const joints = {
    body: "100 405",
    torso: "102 212",
    head: "103 100",
    armB: "80 124", foreB: "80 182",
    armF: "120 124", foreF: "119 182",
    thighB: "95 212", shinB: "95 310",
    thighF: "107 212", shinF: "107 310",
  };
  Object.entries(joints).forEach(([k, o]) => gsap.set(parts[k], { svgOrigin: o }));

  /* ---------- poses ---------- */
  const POSES = {
    stand: { body: { rotation: 0, y: 0 }, torso: 0, head: 0, armB: 0, foreB: 0, armF: 0, foreF: 0, thighB: 0, shinB: 0, thighF: 0, shinF: 0 },
    push: {
      body: { rotation: 0, y: 20 }, torso: 18, head: -12,
      armB: -76, foreB: -14, armF: -84, foreF: -6,
      thighB: 34, shinB: 4, thighF: -20, shinF: 30,
    },
    lean: {
      body: { rotation: 8, y: 6 }, torso: -3, head: -6,
      armB: 4, foreB: -6, armF: -28, foreF: 92,
      thighB: -8, shinB: 3, thighF: 15, shinF: -4,
    },
  };

  const poseTo = (name, duration = 0.4, ease = "power2.inOut") => {
    const p = POSES[name];
    const tl = gsap.timeline({ defaults: { duration, ease, overwrite: "auto" } });
    Object.entries(p).forEach(([k, v]) => {
      tl.to(parts[k], typeof v === "number" ? { rotation: v } : v, 0);
    });
    return tl;
  };

  /* ---------- walk cycle ---------- */
  const walk = gsap.timeline({ paused: true, repeat: -1, defaults: { duration: 0.3, ease: "sine.inOut" } });
  const step = (s) => {
    walk
      .to(parts.thighF, { rotation: -24 * s })
      .to(parts.thighB, { rotation: 24 * s }, "<")
      .to(parts.shinF, { rotation: s > 0 ? 6 : 26 }, "<")
      .to(parts.shinB, { rotation: s > 0 ? 26 : 6 }, "<")
      .to(parts.armF, { rotation: 20 * s }, "<")
      .to(parts.armB, { rotation: -20 * s }, "<")
      .to(parts.foreF, { rotation: -12 }, "<")
      .to(parts.foreB, { rotation: -12 }, "<")
      .to(parts.body, { y: 6 }, "<")
      .to(parts.head, { rotation: 3 * s }, "<");
  };
  step(1);
  step(-1);

  /* ---------- idle loop (after landing) ---------- */
  const idle = () => {
    gsap.to(parts.torso, { rotation: -1.5, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.to(parts.head, { rotation: -2, duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 0.4 });
    gsap.timeline({ repeat: -1, repeatDelay: 2.4, delay: 1 })
      .to(parts.shinF, { rotation: -10, duration: 0.15, ease: "power1.out" })
      .to(parts.shinF, { rotation: -2, duration: 0.2, ease: "power1.in" })
      .to(parts.shinF, { rotation: -10, duration: 0.15, ease: "power1.out" })
      .to(parts.shinF, { rotation: -2, duration: 0.2, ease: "power1.in" });
  };

  /* ---------- intro timeline ---------- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const intro = () => {
    const W = window.innerWidth;
    const charW = character.getBoundingClientRect().width;
    const pushOffset = -0.34 * charW;                 // hands reach the card edge in push pose
    const contact = Math.min(W * 0.22, 280);          // where character meets the card
    const cardStart = W / 2 + 320;                    // off-screen right
    const charStart = -(W / 2 + 160);                 // off-screen left

    gsap.set(card, { x: cardStart, rotation: 0 });
    gsap.set(character, { x: charStart });
    gsap.set("#scene", { visibility: "visible" });

    if (reduce) {
      gsap.set(card, { x: 0 });
      gsap.set(character, { x: 0 });
      poseTo("lean", 0);
      return;
    }

    const tl = gsap.timeline({ delay: 0.3 });
    tl.add(() => walk.play(0), 0)
      // walk in
      .to(character, { x: contact + pushOffset - 24, duration: 2.0, ease: "power1.out" }, 0)
      // card slides in from the right
      .to(card, { x: contact, duration: 1.15, ease: "power3.out" }, 1.05)
      // brace into a push
      .add(() => walk.pause(), 1.8)
      .add(poseTo("push", 0.38, "power2.out"), 1.8)
      .to(character, { x: contact + pushOffset, duration: 0.38, ease: "power2.out" }, 1.8)
      // impact wobble
      .to(card, { rotation: -1.2, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, 2.18)
      // both slide to centre while he brakes
      .to(card, { x: 0, duration: 1.35, ease: "power2.out" }, 2.2)
      .to(character, { x: pushOffset, duration: 1.35, ease: "power2.out" }, 2.2)
      .to(parts.armF, { rotation: -88, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" }, 2.25)
      // relax and lean on the card
      .add(poseTo("lean", 0.75, "back.out(1.4)"), 3.65)
      .to(character, { x: 0, duration: 0.75, ease: "power2.inOut" }, 3.65)
      .add(idle, 4.5)
      .add(() => $("#first").focus({ preventScroll: true }), 4.6);
  };

  /* ---------- form behaviour ---------- */
  const fields = [...document.querySelectorAll(".field")];
  const check = (f) => {
    const ok = f.querySelector("input").value.trim() !== "";
    f.classList.toggle("invalid", !ok);
    return ok;
  };

  fields.forEach((f) => {
    const input = f.querySelector("input");
    input.addEventListener("blur", () => check(f));
    input.addEventListener("input", () => { if (f.classList.contains("invalid")) check(f); });
  });

  card.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = fields.filter((f) => !check(f));
    const success = $("#success");

    if (bad.length) {
      success.textContent = "";
      bad.forEach((f) => {
        f.classList.remove("shake");
        void f.offsetWidth;
        f.classList.add("shake");
      });
      // character shakes his head "no"
      gsap.timeline()
        .to(parts.head, { rotation: -14, duration: 0.1, overwrite: "auto" })
        .to(parts.head, { rotation: 10, duration: 0.14, repeat: 3, yoyo: true })
        .to(parts.head, { rotation: -6, duration: 0.15 });
      bad[0].querySelector("input").focus();
      return;
    }

    success.textContent = `Thanks, ${$("#first").value.trim()}! You're registered.`;
    // happy hop
    gsap.timeline()
      .to(character, { y: -40, duration: 0.25, ease: "power2.out" })
      .to(character, { y: 0, duration: 0.35, ease: "bounce.out" });
    gsap.fromTo(success, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 });
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(intro);
  else window.addEventListener("load", intro);
})();
