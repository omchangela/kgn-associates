import gsap from 'gsap';

/**
 * High-performance GSAP animation utility suite for KGN Associates Portal
 */

// Staggered entrance animation for cards, list items, or form inputs
export const animateStaggerEntrance = (elements, options = {}) => {
  if (typeof window === 'undefined' || !elements) return null;
  const {
    y = 24,
    x = 0,
    opacity = 0,
    duration = 0.65,
    stagger = 0.08,
    ease = 'power3.out',
    delay = 0.05,
    scale = 0.98,
  } = options;

  return gsap.fromTo(
    elements,
    { opacity, y, x, scale },
    {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration,
      stagger,
      ease,
      delay,
      clearProps: 'transform',
    }
  );
};

// Hero and title reveal animation
export const animateHeroReveal = (titleElem, subtitleElem, ctaElem) => {
  if (typeof window === 'undefined') return null;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (titleElem) {
    tl.fromTo(
      titleElem,
      { y: 28, opacity: 0, filter: 'blur(4px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7 }
    );
  }
  if (subtitleElem) {
    tl.fromTo(
      subtitleElem,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
      '-=0.4'
    );
  }
  if (ctaElem) {
    tl.fromTo(
      ctaElem,
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' },
      '-=0.3'
    );
  }
  return tl;
};

// Smooth numerical counter using GSAP
export const animateCounter = (element, endValue, duration = 1.2) => {
  if (typeof window === 'undefined' || !element) return null;
  const targetObj = { val: 0 };
  const numericEnd = typeof endValue === 'number' ? endValue : parseFloat(endValue) || 0;

  return gsap.to(targetObj, {
    val: numericEnd,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      if (element) {
        element.innerText = Math.round(targetObj.val).toLocaleString();
      }
    },
  });
};

// Subtle ambient breathing/pulsing glow animation
export const animatePulseGlow = (element) => {
  if (typeof window === 'undefined' || !element) return null;
  return gsap.to(element, {
    boxShadow: '0 0 25px rgba(212, 176, 122, 0.45)',
    repeat: -1,
    yoyo: true,
    duration: 2.2,
    ease: 'sine.inOut',
  });
};

// Magnetic hover feel for interactive buttons and luxury badges
export const initMagneticHover = (element, strength = 0.25) => {
  if (typeof window === 'undefined' || !element) return () => {};

  const handleMouseMove = (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    gsap.to(element, {
      x: x * strength,
      y: y * strength,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.4)',
    });
  };

  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
};

const animationUtils = {
  animateStaggerEntrance,
  animateHeroReveal,
  animateCounter,
  animatePulseGlow,
  initMagneticHover,
};

export default animationUtils;
