/**
 * Demo Page Interactive Controller & Live Tracker HUD
 */
document.addEventListener('DOMContentLoaded', () => {
  const sessionIdEl = document.getElementById('hudSessionId');
  const eventCountEl = document.getElementById('hudEventCount');
  const currentUrlEl = document.getElementById('hudCurrentUrl');
  const resetSessionBtn = document.getElementById('hudResetSession');
  const simulatePageBtn = document.getElementById('hudSimulatePage');
  const hudToast = document.getElementById('hudToast');

  let localEventCount = 0;
  let simulatedPages = ['/demo/index.html', '/demo/features.html', '/demo/pricing.html', '/demo/checkout.html'];
  let simulatedIndex = 0;

  function showToast(msg) {
    if (!hudToast) return;
    hudToast.textContent = msg;
    hudToast.classList.add('visible');
    setTimeout(() => {
      hudToast.classList.remove('visible');
    }, 1800);
  }

  function updateHud() {
    if (window.UserTracker) {
      if (sessionIdEl) sessionIdEl.textContent = window.UserTracker.getSessionId();
      if (currentUrlEl) currentUrlEl.textContent = window.location.pathname;
    }
  }

  // Update HUD initially
  updateHud();

  // Listen to tracker event sent custom event
  window.addEventListener('cf_tracker_event_sent', (e) => {
    localEventCount++;
    if (eventCountEl) eventCountEl.textContent = localEventCount;
    const type = e.detail?.payload?.eventType || 'event';
    showToast(`✓ Tracked ${type}`);
  });

  // Reset Session
  if (resetSessionBtn) {
    resetSessionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.UserTracker) {
        const newId = window.UserTracker.resetSession();
        localEventCount = 0;
        if (sessionIdEl) sessionIdEl.textContent = newId;
        if (eventCountEl) eventCountEl.textContent = '0';
        window.UserTracker.trackPageView();
        showToast('🔄 New Session Created!');
      }
    });
  }

  // Simulate Page Navigation (for testing multi-page user journeys)
  if (simulatePageBtn) {
    simulatePageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      simulatedIndex = (simulatedIndex + 1) % simulatedPages.length;
      const targetPage = simulatedPages[simulatedIndex];

      if (window.UserTracker) {
        window.UserTracker.trackPageView(targetPage);
        if (currentUrlEl) currentUrlEl.textContent = targetPage;
        showToast(`📄 Navigated to ${targetPage}`);
      }
    });
  }

  // Add click ripple / feedback to buttons
  const buttons = document.querySelectorAll('.btn, .feature-card, .pricing-card');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.style.transform = 'scale(0.98)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 150);
    });
  });
});
