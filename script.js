/* script.js — PromptAds Interactive Layer */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================
     NAVBAR SCROLL EFFECT
  ============================ */
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ============================
     MOBILE HAMBURGER
  ============================ */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const open = mobileMenu.classList.contains('open');
    hamburger.innerHTML = open
      ? '<span style="transform:rotate(45deg) translate(5px,5px)"></span><span style="opacity:0"></span><span style="transform:rotate(-45deg) translate(5px,-5px)"></span>'
      : '<span></span><span></span><span></span>';
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.innerHTML = '<span></span><span></span><span></span>';
    });
  });

  /* ============================
     SCROLL REVEAL
  ============================ */
  const revealEls = document.querySelectorAll(
    '.service-card, .result-card, .testi-card, .pricing-card, .process-step, .result-metric'
  );
  revealEls.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => observer.observe(el));

  /* ============================
     ANIMATED STAT COUNTERS
  ============================ */
  const statEls = document.querySelectorAll('.stat-num[data-target]');
  let statsAnimated = false;

  const animateStats = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !statsAnimated) {
        statsAnimated = true;
        statEls.forEach(el => {
          const target = parseInt(el.dataset.target);
          const duration = 1800;
          const step = 16;
          const increment = target / (duration / step);
          let current = 0;
          const timer = setInterval(() => {
            current = Math.min(current + increment, target);
            el.textContent = Math.round(current);
            if (current >= target) clearInterval(timer);
          }, step);
        });
      }
    });
  };

  const statsSection = document.querySelector('.hero-stats');
  if (statsSection) {
    const statsObserver = new IntersectionObserver(animateStats, { threshold: 0.5 });
    statsObserver.observe(statsSection);
  }

  /* ============================
     CHAT MOCKUP ANIMATION
  ============================ */
  const aiMsg = document.getElementById('ai-msg');
  const chatAd = document.getElementById('chat-ad');
  const aiSecond = document.getElementById('ai-second');
  const typingSpan = aiMsg ? aiMsg.querySelector('.typing-cursor') : null;

  const chatSequence = () => {
    if (!aiMsg) return;

    // Step 1: Show typing indicator for 1.5s
    setTimeout(() => {
      if (aiMsg) {
        aiMsg.style.display = 'block';
      }
    }, 800);

    // Step 2: Show sponsored ad after typing
    setTimeout(() => {
      if (chatAd) {
        chatAd.style.display = 'block';
        chatAd.style.opacity = '0';
        chatAd.style.transform = 'translateY(8px)';
        chatAd.style.transition = 'all 0.4s ease';
        requestAnimationFrame(() => {
          chatAd.style.opacity = '1';
          chatAd.style.transform = 'translateY(0)';
        });
      }
    }, 2500);

    // Step 3: Show AI response
    setTimeout(() => {
      if (aiMsg) aiMsg.style.display = 'none';
      if (aiSecond) {
        aiSecond.style.display = 'block';
        aiSecond.style.opacity = '0';
        aiSecond.style.transition = 'opacity 0.4s ease';
        requestAnimationFrame(() => { aiSecond.style.opacity = '1'; });
      }
    }, 3500);

    // Step 4: Loop the animation
    setTimeout(() => {
      if (chatAd) { chatAd.style.display = 'none'; chatAd.style.opacity = '0'; }
      if (aiSecond) { aiSecond.style.display = 'none'; }
      if (aiMsg) {
        aiMsg.style.display = 'none';
        // Reset and restart
        setTimeout(() => chatSequence(), 1000);
      }
    }, 7000);
  };

  // Start chat animation after a short delay
  setTimeout(chatSequence, 1000);

  /* ============================
     CONTACT FORM SUBMISSION (Real API)
  ============================ */
  const form = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');
  const submitBtn = document.getElementById('submit-btn');
  const formNote = form ? form.querySelector('.form-note') : null;

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const originalText = submitBtn.textContent;
      submitBtn.textContent = '⏳ Sending...';
      submitBtn.disabled = true;
      if (formNote) formNote.style.color = '';

      const payload = {
        name: document.getElementById('name')?.value.trim(),
        email: document.getElementById('email')?.value.trim(),
        company: document.getElementById('company')?.value.trim(),
        budget: document.getElementById('budget')?.value,
        goal: document.getElementById('goal')?.value.trim(),
      };

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // ✅ Success
          form.style.display = 'none';
          formSuccess.style.display = 'block';
          formSuccess.style.opacity = '0';
          formSuccess.style.transition = 'opacity 0.5s ease';
          requestAnimationFrame(() => { formSuccess.style.opacity = '1'; });
        } else {
          // ❌ Server validation error
          if (formNote) {
            formNote.textContent = '⚠️ ' + (data.message || 'Something went wrong. Please check your details.');
            formNote.style.color = '#f87171';
          }
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      } catch (err) {
        // ❌ Network error
        if (formNote) {
          formNote.textContent = '⚠️ Network error. Please try again or email us directly.';
          formNote.style.color = '#f87171';
        }
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  /* ============================
     SMOOTH ACTIVE NAV LINK
  ============================ */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const activeLinkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.style.color = 'var(--teal)';
          }
        });
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(sec => activeLinkObserver.observe(sec));

  /* ============================
     CARD TILT EFFECT (Desktop)
  ============================ */
  if (window.innerWidth > 768) {
    document.querySelectorAll('.service-card, .result-card, .testi-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
        card.style.transform = `translateY(-4px) rotateX(${y}deg) rotateY(${x}deg)`;
        card.style.transition = 'transform 0.1s ease';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.4s ease';
      });
    });
  }

  /* ============================
     PARTICLE SPARKLE ON HERO
  ============================ */
  const hero = document.querySelector('.hero');
  if (hero) {
    const spawnParticle = () => {
      const p = document.createElement('div');
      const size = Math.random() * 4 + 2;
      const x = Math.random() * hero.offsetWidth;
      const duration = Math.random() * 4000 + 3000;
      Object.assign(p.style, {
        position: 'absolute',
        left: x + 'px',
        top: Math.random() * hero.offsetHeight + 'px',
        width: size + 'px',
        height: size + 'px',
        borderRadius: '50%',
        background: Math.random() > 0.5 ? 'rgba(56,189,248,0.6)' : 'rgba(167,139,250,0.6)',
        boxShadow: `0 0 ${size * 2}px currentColor`,
        pointerEvents: 'none',
        zIndex: '0',
        opacity: '0',
        transition: `opacity 0.5s ease`,
        animation: `floatParticle ${duration}ms ease-in-out infinite`,
      });
      hero.appendChild(p);
      requestAnimationFrame(() => { p.style.opacity = '0.7'; });
      setTimeout(() => {
        p.style.opacity = '0';
        setTimeout(() => p.remove(), 600);
      }, duration - 600);
    };

    // Add CSS for particle float
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floatParticle {
        0%, 100% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-30px) scale(0.8); }
      }
    `;
    document.head.appendChild(style);

    setInterval(spawnParticle, 600);
  }

});
