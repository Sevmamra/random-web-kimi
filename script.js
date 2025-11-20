/*****************************************************************
 *  NEONPULSE — MAIN JAVASCRIPT PIPELINE
 *  Author: NeonPulse Team
 *  Version: 1.0.0
 *  Browser Support: Modern evergreen browsers
 *****************************************************************/

(() => {
  'use strict';

  /****************************************************************
   * CONFIG CONSTANTS
   ****************************************************************/
  const CONFIG = {
    debounceDelay: 150,
    throttleDelay: 100,
    scrollOffset: 64,
    typewriterSpeed: 80,
    particleCount: 60,
    revealThreshold: 0.15,
    sliderInterval: 5000,
    apiEndpoint: 'https://api.neonpulse.studio/contact',
    breakpoints: {
      mobile: 480,
      tablet: 768,
      desktop: 1024
    }
  };

  /****************************************************************
   * HELPERS — UTILS
   ****************************************************************/
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const debounce = (fn, delay = CONFIG.debounceDelay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  const throttle = (fn, delay = CONFIG.throttleDelay) => {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= delay) {
        last = now;
        fn.apply(this, args);
      }
    };
  };

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isInViewport = (el, threshold = CONFIG.revealThreshold) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) * (1 + threshold) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) * (1 + threshold)
    );
  };

  const createNode = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else el.appendChild(child);
    });
    return el;
  };

  /****************************************************************
   * THEME TOGGLE
   ****************************************************************/
  const initTheme = () => {
    const saved = localStorage.getItem('theme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initial = saved || system;
    document.documentElement.setAttribute('data-theme', initial);
  };

  const handleThemeToggle = () => {
    const toggle = $('#theme-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  };

  /****************************************************************
   * LOADER
   ****************************************************************/
  const handleLoader = () => {
    const loader = $('#loader');
    if (!loader) return;

    window.addEventListener('load', () => {
      loader.classList.add('loader--hidden');
      document.body.removeChild(loader);
    });
  };

  /****************************************************************
   * NAVIGATION — ACTIVE LINK & MOBILE
   ****************************************************************/
  const initNav = () => {
    const header = $('#header');
    const nav = $('#nav');
    const hamburger = $('#hamburger');
    const links = $$('.nav__link');

    const setActiveLink = () => {
      const sections = $$('[data-section]');
      let current = '';
      sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= CONFIG.scrollOffset && rect.bottom >= CONFIG.scrollOffset) {
          current = sec.id;
        }
      });
      links.forEach(link => {
        link.classList.toggle('nav__link--active', link.getAttribute('href') === `#${current}`);
      });
    };

    const toggleMobileNav = () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !expanded);
      nav.classList.toggle('nav--open');
    };

    window.addEventListener('scroll', throttle(setActiveLink));
    hamburger?.addEventListener('click', toggleMobileNav);
    setActiveLink();
  };

  /****************************************************************
   * SCROLL REVEAL
   ****************************************************************/
  const initScrollReveal = () => {
    if (prefersReducedMotion()) return;

    const targets = $$('.about__card, .service, .gallery__item, .stat, .testimonial, .contact__block');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: CONFIG.revealThreshold }
    );

    targets.forEach(el => observer.observe(el));
  };

  /****************************************************************
   * HERO PARTICLES
   ****************************************************************/
  const initHeroParticles = () => {
    const container = $('#hero-particles');
    if (!container) return;

    for (let i = 0; i < CONFIG.particleCount; i++) {
      const p = createNode('span', {
        class: 'particle',
        style: `
          position:absolute;
          width:${2 + Math.random() * 4}px;
          height:${2 + Math.random() * 4}px;
          background: hsl(${180 + Math.random() * 180}, 100%, 50%);
          top:${Math.random() * 100}%;
          left:${Math.random() * 100}%;
          border-radius:50%;
          opacity:${0.2 + Math.random() * 0.6};
          animation: floatParticle ${10 + Math.random() * 20}s infinite linear;
          pointer-events:none;
        `
      });
      container.appendChild(p);
    }

    const style = createNode('style', {}, `
      @keyframes floatParticle {
        0% { transform: translateY(0) translateX(0); }
        100% { transform: translateY(-100vh) translateX(${-50 + Math.random() * 100}px); }
      }
    `);
    document.head.appendChild(style);
  };

  /****************************************************************
   * STATS COUNTER
   ****************************************************************/
  const initStats = () => {
    const stats = $$('.stat__num');
    if (prefersReducedMotion()) {
      stats.forEach(stat => {
        const target = +stat.getAttribute('data-target');
        stat.textContent = target;
      });
      return;
    }

    const runCounter = el => {
      const target = +el.getAttribute('data-target');
      const increment = target / 100;
      let current = 0;

      const update = () => {
        current += increment;
        if (current < target) {
          el.textContent = Math.ceil(current);
          requestAnimationFrame(update);
        } else {
          el.textContent = target;
        }
      };
      update();
    };

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    stats.forEach(stat => observer.observe(stat));
  };

  /****************************************************************
   * TESTIMONIALS SLIDER
   ****************************************************************/
  const initTestimonials = () => {
    const slider = $('#testimonials-slider');
    const prev = $('#testimonials-prev');
    const next = $('#testimonials-next');
    const dotsContainer = $('#testimonials-dots');
    const items = $$('.testimonial', slider);
    if (!items.length) return;

    let index = 0;
    let interval;

    const createDots = () => {
      items.forEach((_, i) => {
        const d = createNode('span', { class: `testimonials__dot ${i === 0 ? 'active' : ''}` });
        d.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(d);
      });
    };

    const update = () => {
      items.forEach((item, i) => item.classList.toggle('active', i === index));
      $$('.testimonials__dot').forEach((d, i) => d.classList.toggle('active', i === index));
    };

    const goTo = i => {
      index = (i + items.length) % items.length;
      update();
      resetInterval();
    };

    const nextSlide = () => goTo(index + 1);
    const prevSlide = () => goTo(index - 1);
    const resetInterval = () => {
      clearInterval(interval);
      interval = setInterval(nextSlide, CONFIG.sliderInterval);
    };

    createDots();
    prev.addEventListener('click', prevSlide);
    next.addEventListener('click', nextSlide);
    slider.addEventListener('mouseenter', () => clearInterval(interval));
    slider.addEventListener('mouseleave', resetInterval);
    resetInterval();
  };

  /****************************************************************
   * GALLERY FILTER
   ****************************************************************/
  const initGalleryFilter = () => {
    const grid = $('#gallery-grid');
    const buttons = $$('.gallery__btn');
    const items = $$('.gallery__item', grid);
    if (!buttons.length || !items.length) return;

    const filter = category => {
      items.forEach(item => {
        const cat = item.getAttribute('data-category');
        const show = category === 'all' || cat === category;
        item.style.display = show ? 'block' : 'none';
        if (show) item.classList.add('revealed');
      });
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filter(btn.getAttribute('data-filter'));
      });
    });
  };

  /****************************************************************
   * CONTACT FORM
   ****************************************************************/
  const initContactForm = () => {
    const form = $('#contact-form');
    if (!form) return;

    const fields = ['name', 'email', 'message'];
    const errors = {};
    let isSubmitting = false;

    const validate = () => {
      fields.forEach(f => {
        const input = $(`#${f}`);
        const error = $(`#${f}-error`);
        const value = input.value.trim();
        errors[f] = '';

        if (!value) errors[f] = `${f.charAt(0).toUpperCase() + f.slice(1)} is required`;
        else if (f === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[f] = 'Invalid email format';

        error.textContent = errors[f];
        input.classList.toggle('form-input--error', !!errors[f]);
      });

      return !Object.values(errors).some(Boolean);
    };

    const submit = async () => {
      if (!validate() || isSubmitting) return;
      isSubmitting = true;
      const status = $('#form-status');
      status.textContent = 'Sending...';

      const payload = Object.fromEntries(new FormData(form).entries());

      try {
        const res = await fetch(CONFIG.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Network error');
        status.textContent = 'Message sent! We’ll get back soon.';
        form.reset();
      } catch {
        status.textContent = 'Failed to send. Please try again.';
      } finally {
        isSubmitting = false;
      }
    };

    fields.forEach(f => {
      $(`#${f}`).addEventListener('blur', validate);
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      submit();
    });
  };

  /****************************************************************
   * SCROLL INDICATOR
   ****************************************************************/
  const initScrollIndicator = () => {
    const indicator = $('.scroll-indicator');
    if (!indicator) return;

    indicator.addEventListener('click', e => {
      e.preventDefault();
      const target = $(indicator.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  /****************************************************************
   * PARALLAX
   ****************************************************************/
  const initParallax = () => {
    const layers = $$('[data-parallax]');
    if (prefersReducedMotion() || !layers.length) return;

    const handleParallax = throttle(() => {
      const scrolled = window.pageYOffset;
      layers.forEach(layer => {
        const speed = +layer.getAttribute('data-parallax') || 0.5;
        const yPos = -(scrolled * speed);
        layer.style.transform = `translateY(${yPos}px)`;
      });
    }, CONFIG.throttleDelay);

    window.addEventListener('scroll', handleParallax);
  };

  /****************************************************************
   * LAZY LOAD IMAGES
   ****************************************************************/
  const initLazyLoad = () => {
    const images = $$('img[data-src]');
    if (!images.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: '100px' }
    );

    images.forEach(img => observer.observe(img));
  };

  /****************************************************************
   * GESTURE SWIPE FOR TESTIMONIALS
   ****************************************************************/
  const initSwipe = () => {
    const slider = $('#testimonials-slider');
    if (!slider) return;

    let startX = 0;
    let endX = 0;

    const handleStart = e => {
      startX = e.touches ? e.touches[0].clientX : e.clientX;
    };

    const handleEnd = e => {
      endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      if (startX - endX > 50) $('#testimonials-next').click();
      if (endX - startX > 50) $('#testimonials-prev').click();
    };

    slider.addEventListener('touchstart', handleStart);
    slider.addEventListener('mousedown', handleStart);
    slider.addEventListener('touchend', handleEnd);
    slider.addEventListener('mouseup', handleEnd);
  };

  /****************************************************************
   * YEAR IN FOOTER
   ****************************************************************/
  const initYear = () => {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  };

  /****************************************************************
   * ACCESSIBILITY — SKIP LINK
   ****************************************************************/
  const initSkipLink = () => {
    const skip = createNode('a', {
      href: '#main',
      class: 'skip-link',
      style: `
        position:absolute;
        top:-40px;
        left:6px;
        background:var(--color-primary-100);
        color:#fff;
        padding:8px;
        border-radius:4px;
        z-index:9999;
        transition:top .2s;
      `
    }, 'Skip to content');
    document.body.insertBefore(skip, document.body.firstChild);
    skip.addEventListener('focus', () => skip.style.top = '6px');
    skip.addEventListener('blur', () => skip.style.top = '-40px');
  };

  /****************************************************************
   * PERFORMANCE — PRELOAD CRITICAL
   ****************************************************************/
  const preloadCritical = () => {
    const links = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap'
    ];
    links.forEach(href => {
      const link = createNode('link', {
        rel: 'preload',
        as: 'style',
        href
      });
      document.head.appendChild(link);
    });
  };

  /****************************************************************
   * INIT ALL
   ****************************************************************/
  const init = () => {
    preloadCritical();
    initTheme();
    handleThemeToggle();
    handleLoader();
    initNav();
    initScrollReveal();
    initHeroParticles();
    initStats();
    initTestimonials();
    initGalleryFilter();
    initContactForm();
    initScrollIndicator();
    initParallax();
    initLazyLoad();
    initSwipe();
    initYear();
    initSkipLink();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
