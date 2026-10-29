(function () {
  "use strict";
  var C = window.ACQUIRE_CONFIG || {};
  var doc = document,
    root = doc.documentElement;
  var RM =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HAS_IO = "IntersectionObserver" in window;
  var $ = function (s, c) {
    return (c || doc).querySelector(s);
  };
  var $$ = function (s, c) {
    return Array.prototype.slice.call((c || doc).querySelectorAll(s));
  };
  var hide = function (el) {
    if (el) el.setAttribute("data-hidden", "");
  };
  var clamp = function (v, a, b) {
    return Math.min(b, Math.max(a, v));
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  var thumb = function (id, q) {
    return (
      "https://i.ytimg.com/vi/" + id + "/" + (q || "maxresdefault") + ".jpg"
    );
  };

  /* ---------- 1. Configuration ---------- */
  if (C.introVideo) {
    if (C.introVideo.show === false)
      $$('[data-config="introVideo"]').forEach(hide);
    else if (C.introVideo.youtubeId) {
      var vb = $('[data-config-video="introVideo"] .yt');
      if (vb && vb.getAttribute("data-yt") !== C.introVideo.youtubeId) {
        vb.setAttribute("data-yt", C.introVideo.youtubeId);
        var vi = $("img", vb);
        if (vi) vi.src = thumb(C.introVideo.youtubeId);
        var vl = $('[data-config="introVideo"] .video-cap a');
        if (vl) vl.href = "https://youtu.be/" + C.introVideo.youtubeId;
      }
    }
  }
  if (C.heroAvatars)
    C.heroAvatars.forEach(function (av, k) {
      if (!av || !av.src) return;
      $$('[data-avatar="' + k + '"]').forEach(function (el) {
        el.innerHTML =
          '<img src="' +
          esc(av.src) +
          '" alt="' +
          esc(av.alt || "") +
          '" decoding="async">';
      });
    });
  if (C.photos)
    Object.keys(C.photos).forEach(function (k) {
      var p = C.photos[k],
        el = $('[data-photo="' + k + '"]');
      if (!el || !p || !p.src) return;
      el.removeAttribute("role");
      el.removeAttribute("aria-label");
      el.classList.remove("ph", "ph--dark");
      el.innerHTML =
        '<img class="media-img" src="' +
        esc(p.src) +
        '" alt="' +
        esc(p.alt || "") +
        '" loading="lazy" decoding="async">';
    });
  if (C.projectStories) {
    if (C.projectStories.show === false)
      $$('[data-config="projectStories"]').forEach(hide);
    else if (C.projectStories.items) {
      var shown = 0,
        withText = 0;
      Object.keys(C.projectStories.items).forEach(function (k) {
        var s = C.projectStories.items[k],
          li = $('[data-story="' + k + '"]');
        if (!li || !s) return;
        if (s.show === false) {
          hide(li);
          return;
        }
        shown++;
        if (s.text) {
          withText++;
          var p = $("div > p", li);
          if (p) p.textContent = s.text;
          if (s.link && p)
            p.insertAdjacentHTML(
              "afterend",
              '<a class="link" href="' +
                esc(s.link) +
                '" target="_blank" rel="noopener">Read the story<span class="ext-icon" aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>',
            );
        }
        if (s.photo) {
          var ph = $(".ph", li);
          if (ph) {
            ph.removeAttribute("role");
            ph.removeAttribute("aria-label");
            ph.innerHTML =
              '<img class="media-img" src="' +
              esc(s.photo) +
              '" alt="' +
              esc(s.photoAlt || "") +
              '">';
          }
        }
      });
      if (!shown) $$('[data-config="projectStories"]').forEach(hide);
      if (withText)
        hide($('[data-config="projectStories"] .stories__head .chip'));
    }
  }
  if (C.partnerLogos)
    Object.keys(C.partnerLogos).forEach(function (k) {
      var l = C.partnerLogos[k],
        box = $('[data-logo="' + k + '"]');
      if (box && l && l.src)
        box.innerHTML =
          '<img src="' +
          esc(l.src) +
          '" alt="' +
          esc(l.alt || "") +
          '" loading="lazy">';
    });

  /* ---------- 2. Year ---------- */
  $$("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- 3. Hero title: word-by-word entrance + typewriter word ---------- */
  var title = $(".hero-title");
  if (title && !RM) {
    var wi = 0;
    $$("[data-split-words]", title).forEach(function (el) {
      var ws = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      ws.forEach(function (w, i) {
        var s = doc.createElement("span");
        s.className = "word";
        s.style.setProperty("--i", wi++);
        s.textContent = w;
        el.appendChild(s);
        if (i < ws.length - 1) el.appendChild(doc.createTextNode(" "));
      });
    });
    var rw0 = $(".word--rot", title);
    if (rw0) rw0.style.setProperty("--i", wi++);
  }
  var typer = $(".typer");
  if (typer && !RM) {
    var tText = $(".typer__text", typer),
      tWords = typer.getAttribute("data-words").split("|");
    var tWidths = [],
      tIdx = 0,
      tHover = false,
      tVisible = true;
    var measure = function () {
      var keep = tText.textContent,
        prevW = typer.style.width;
      typer.style.transition = "none";
      typer.style.width = "auto";
      tWidths = tWords.map(function (w) {
        tText.textContent = w;
        return Math.ceil(typer.getBoundingClientRect().width) + 1;
      });
      tText.textContent = keep;
      typer.style.width = prevW || tWidths[tIdx] + "px";
      typer.style.width = tWidths[tIdx] + "px";
      void typer.offsetWidth;
      typer.style.transition = "";
    };
    var wait = function (ms) {
      return new Promise(function (r) {
        setTimeout(r, ms);
      });
    };
    var whenFree = function () {
      return new Promise(function (r) {
        (function check() {
          if (!tHover && tVisible && !doc.hidden) r();
          else setTimeout(check, 200);
        })();
      });
    };
    var typeWord = async function (w) {
      typer.classList.add("is-typing");
      for (var i = 1; i <= w.length; i++) {
        await whenFree();
        tText.textContent = w.slice(0, i);
        await wait(85 + Math.random() * 50);
      }
      typer.classList.remove("is-typing");
    };
    var eraseWord = async function () {
      typer.classList.add("is-typing");
      while (tText.textContent.length) {
        await whenFree();
        tText.textContent = tText.textContent.slice(0, -1);
        await wait(45);
      }
      typer.classList.remove("is-typing");
    };
    tText.textContent = "";
    measure();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    title.addEventListener("mouseenter", function () {
      tHover = true;
    });
    title.addEventListener("mouseleave", function () {
      tHover = false;
    });
    if (HAS_IO)
      new IntersectionObserver(function (en) {
        tVisible = en[0].isIntersecting;
      }).observe(title);
    (async function loop() {
      await wait(1300); /* let the title entrance finish */
      for (;;) {
        await typeWord(tWords[tIdx]);
        await wait(2200);
        await whenFree();
        await eraseWord();
        tIdx = (tIdx + 1) % tWords.length;
        typer.style.width =
          tWidths[tIdx] + "px"; /* line re-centres while empty */
        await wait(500);
      }
    })();
  }
  var loaded = false;
  var go = function () {
    if (loaded) return;
    loaded = true;
    requestAnimationFrame(function () {
      root.classList.add("is-loaded");
    });
  };
  if (doc.fonts && doc.fonts.ready) {
    doc.fonts.ready.then(go);
    setTimeout(go, 700);
  } else go();

  /* ---------- 4. Header ---------- */
  var header = $(".site-header");
  /* ---------- 5. Floating contact visibility ---------- */
  var fab = $(".fab"),
    fabState = { top: true, end: false, menu: false };
  var updateFab = function () {
    if (fab)
      fab.classList.toggle(
        "is-hidden",
        fabState.top || fabState.end || fabState.menu,
      );
  };

  /* ---------- 6. Mobile menu ---------- */
  var burger = $(".burger"),
    menu = $("#menu");
  function openMenu() {
    menu.classList.add("is-open");
    doc.body.classList.add("menu-open");
    burger.setAttribute("aria-expanded", "true");
    fabState.menu = true;
    updateFab();
    setTimeout(function () {
      var c = $(".menu__close", menu);
      if (c) c.focus();
    }, 60);
  }
  function closeMenu(focusBack) {
    menu.classList.remove("is-open");
    doc.body.classList.remove("menu-open");
    burger.setAttribute("aria-expanded", "false");
    fabState.menu = false;
    updateFab();
    if (focusBack) burger.focus();
  }
  if (burger && menu) {
    burger.addEventListener("click", openMenu);
    $$("[data-close]", menu).forEach(function (el) {
      el.addEventListener("click", function () {
        closeMenu(el.tagName === "BUTTON");
      });
    });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeMenu(true);
        return;
      }
      if (e.key !== "Tab") return;
      var f = $$("a[href],button", menu),
        first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && menu.classList.contains("is-open"))
        closeMenu(false);
    });
  }

  /* ---------- 7. Scroll reveal ---------- */
  var reveals = $$("[data-reveal]");
  if (RM || !HAS_IO)
    reveals.forEach(function (el) {
      el.classList.add("is-in");
    });
  else {
    var rio = new IntersectionObserver(
      function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            rio.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    reveals.forEach(function (el) {
      rio.observe(el);
    });
  }

  /* ---------- 8. Statement: words light up with scroll ---------- */
  var statement = $(".statement[data-words]"),
    wordEls = [];
  if (statement && !RM) {
    var wrapWords = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(doc.createTextNode(part));
            else {
              var s = doc.createElement("span");
              s.className = "w";
              s.textContent = part;
              frag.appendChild(s);
              wordEls.push(s);
            }
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) wrapWords(n);
      });
    };
    wrapWords(statement);
  }

  /* ---------- 9. Sticky stacked course cards ---------- */
  var stack = $("#course-stack"),
    cards = stack ? $$(".course", stack) : [];
  var stackMQ = window.matchMedia("(min-width:1024px) and (min-height:720px)");
  var stacking = false;
  function setStacking() {
    stacking = !RM && stackMQ.matches && cards.length > 1;
    if (stack) stack.classList.toggle("is-stacking", stacking);
    cards.forEach(function (c, i) {
      c.style.setProperty("--i", i);
      if (!stacking) {
        var inner = c.firstElementChild;
        inner.style.transform = "";
        inner.style.filter = "";
      }
    });
  }
  setStacking();
  if (stackMQ.addEventListener) stackMQ.addEventListener("change", setStacking);

  /* ---------- Hero photo: widens on scroll ---------- */
  var heroPhoto = RM ? null : $(".hero__photo");

  /* ---------- Scroll loop (rAF-throttled) ---------- */
  var ticking = false;
  function onFrame() {
    ticking = false;
    var y = window.scrollY,
      vh = window.innerHeight;
    header.classList.toggle("is-scrolled", y > 8);
    var top = y < 480;
    if (top !== fabState.top) {
      fabState.top = top;
      updateFab();
    }
    if (heroPhoto) {
      var hp = clamp(y / (vh * 0.6), 0, 1);
      heroPhoto.style.setProperty("--hz", (1 - hp).toFixed(4));
      var hr = heroPhoto.getBoundingClientRect();
      var hs = clamp(1 - hr.bottom / (vh + hr.height), 0, 1);
      heroPhoto.style.setProperty("--hs", hs.toFixed(4));
    }
    if (wordEls.length) {
      var r = statement.getBoundingClientRect();
      var p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.38), 0, 1);
      var lit = p * wordEls.length * 1.08;
      for (var i = 0; i < wordEls.length; i++)
        wordEls[i].style.setProperty(
          "--o",
          (0.24 + 0.76 * clamp(lit - i, 0, 1)).toFixed(3),
        );
    }
    if (stacking) {
      for (var k = 0; k < cards.length - 1; k++) {
        var a = cards[k].getBoundingClientRect(),
          b = cards[k + 1].getBoundingClientRect();
        var q = clamp(1 - (b.top - a.top) / a.height, 0, 1);
        var inner = cards[k].firstElementChild;
        inner.style.transform = q
          ? "scale(" + (1 - 0.06 * q).toFixed(4) + ")"
          : "";
        inner.style.filter = q
          ? "brightness(" + (1 - 0.35 * q).toFixed(3) + ")"
          : "";
      }
    }
  }
  var requestTick = function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onFrame);
    }
  };
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  onFrame();

  /* ---------- 10. Active nav link ---------- */
  var navLinks = $$(".nav a");
  if (HAS_IO && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) {
      map[a.getAttribute("href").slice(1)] = a;
    });
    var nio = new IntersectionObserver(
      function (en) {
        en.forEach(function (e) {
          var a = map[e.target.id];
          if (!a || !e.isIntersecting) return;
          navLinks.forEach(function (l) {
            l.classList.remove("is-active");
            l.removeAttribute("aria-current");
          });
          a.classList.add("is-active");
          a.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    Object.keys(map).forEach(function (id) {
      var s = doc.getElementById(id);
      if (s) nio.observe(s);
    });
  }
  var endBlock = $(".end");
  if (HAS_IO && endBlock)
    new IntersectionObserver(
      function (en) {
        fabState.end = en[0].isIntersecting;
        updateFab();
      },
      { threshold: 0.15 },
    ).observe(endBlock);

  /* ---------- 11. Counters ---------- */
  var counters = $$("[data-count]");
  if (!RM && HAS_IO && counters.length) {
    counters.forEach(function (el) {
      el.textContent = "0";
    });
    var cio = new IntersectionObserver(
      function (en) {
        en.forEach(function (e) {
          if (!e.isIntersecting) return;
          cio.unobserve(e.target);
          var el = e.target,
            to = parseInt(el.getAttribute("data-count"), 10),
            t0 = null,
            dur = 1700;
          (function step(t) {
            if (t0 === null) t0 = t;
            var p = Math.min((t - t0) / dur, 1);
            el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 4))));
            if (p < 1) requestAnimationFrame(step);
          })(performance.now());
        });
      },
      { threshold: 0.6 },
    );
    counters.forEach(function (el) {
      cio.observe(el);
    });
  }

  /* ---------- 12. Tabs helper (values + activity) ---------- */
  function tabs(tablist, onSelect) {
    var list = $$('[role="tab"]', tablist);
    function select(tab, focus) {
      list.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = doc.getElementById(t.getAttribute("aria-controls"));
        if (panel) {
          if (on) panel.removeAttribute("hidden");
          else panel.setAttribute("hidden", "");
        }
      });
      if (focus) tab.focus();
      if (onSelect) onSelect(list.indexOf(tab));
    }
    list.forEach(function (t, i) {
      t.addEventListener("click", function () {
        select(t, false);
      });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight")
          n = list[(i + 1) % list.length];
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
          n = list[(i - 1 + list.length) % list.length];
        else if (e.key === "Home") n = list[0];
        else if (e.key === "End") n = list[list.length - 1];
        if (n) {
          e.preventDefault();
          select(n, true);
        }
      });
    });
    return { select: select, list: list };
  }
  var vt = $(".values__tabs");
  if (vt) tabs(vt);

  /* Activity slideshow */
  var act = $(".activity");
  if (act) {
    var bars = $(".activity__bars", act),
      pauseBtn = $(".activity__pause", act);
    var state = { user: false, hover: false, off: true };
    var api = tabs(bars);
    var applyPause = function () {
      act.classList.toggle("is-paused", state.user || state.hover || state.off);
      pauseBtn.setAttribute("aria-pressed", String(state.user));
      pauseBtn.setAttribute(
        "aria-label",
        state.user ? "Play slideshow" : "Pause slideshow",
      );
      $(".i-pause", pauseBtn).style.display = state.user ? "none" : "";
      $(".i-play", pauseBtn).style.display = state.user ? "" : "none";
    };
    if (RM) {
      pauseBtn.style.display = "none";
    } else {
      act.classList.add("is-auto");
      act.addEventListener("animationend", function (e) {
        if (e.animationName !== "fill") return;
        var cur = api.list.findIndex(function (t) {
          return t.getAttribute("aria-selected") === "true";
        });
        api.select(api.list[(cur + 1) % api.list.length], false);
      });
      act.addEventListener("mouseenter", function () {
        state.hover = true;
        applyPause();
      });
      act.addEventListener("mouseleave", function () {
        state.hover = false;
        applyPause();
      });
      act.addEventListener("focusin", function () {
        state.hover = true;
        applyPause();
      });
      act.addEventListener("focusout", function (e) {
        if (!act.contains(e.relatedTarget)) {
          state.hover = false;
          applyPause();
        }
      });
      pauseBtn.addEventListener("click", function () {
        state.user = !state.user;
        applyPause();
      });
      if (HAS_IO)
        new IntersectionObserver(
          function (en) {
            state.off = !en[0].isIntersecting;
            applyPause();
          },
          { threshold: 0.4 },
        ).observe(act);
      else state.off = false;
      applyPause();
    }
  }

  /* ---------- 13. Accordions ---------- */
  $$(".acc__btn").forEach(function (btn) {
    var panel = doc.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      panel.classList.toggle("is-open", !open);
    });
  });

  /* ---------- 14. YouTube facades (iframe loads on click only) ---------- */
  $$(".yt").forEach(function (btn) {
    var img = $("img", btn);
    if (img) {
      var fallback = function () {
        if (img.dataset.fb) {
          img.style.visibility = "hidden";
          return;
        }
        img.dataset.fb = "1";
        img.src = thumb(btn.getAttribute("data-yt"), "hqdefault");
      };
      img.addEventListener("error", fallback);
      img.addEventListener("load", function () {
        if (img.naturalWidth && img.naturalWidth < 200) fallback();
      });
      if (img.complete && img.naturalWidth === 0 && img.src) fallback();
    }
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-yt");
      var f = doc.createElement("iframe");
      f.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(id) +
        "?autoplay=1&cc_load_policy=1&cc_lang_pref=en&hl=en&rel=0&playsinline=1";
      f.title = btn.getAttribute("data-title") || "YouTube video";
      f.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      );
      f.setAttribute("allowfullscreen", "");
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      btn.parentNode.replaceChild(f, btn);
      f.focus();
    });
  });
})();
