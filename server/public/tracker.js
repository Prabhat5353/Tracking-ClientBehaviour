/**
 * Universal User Analytics & Cross-Domain Session Tracker
 *
 * Designed to be embedded on ANY external website (Shopify, WordPress, Webflow,
 * Next.js, React, Static HTML, etc.).
 *
 * Features:
 * - Pure Vanilla JavaScript (zero dependencies, < 5KB)
 * - Automatic API endpoint discovery from script source origin (zero manual config)
 * - Multi-site partitioning via `data-site-id` or automatic hostname derivation
 * - Cross-domain resilient session tracking via localStorage + cookies
 * - Automatic page_view capture on initialization & visibility change
 * - Window-level click tracking (coordinate x, y, target metadata, product tags)
 * - Guaranteed exit capture via `navigator.sendBeacon`
 * - Full Single-Page Application (SPA) programmatic API (`window.CFAnalytics`)
 */
(function (window, document) {
  'use strict';

  // Prevent multiple initializations on the same page
  if (window.__CF_USER_TRACKER_INITIALIZED__) {
    return;
  }
  window.__CF_USER_TRACKER_INITIALIZED__ = true;

  // Configuration constants
  const SESSION_STORAGE_KEY = 'cf_session_id';
  const DEFAULT_API_ENDPOINT = 'http://localhost:5000/api/events';

  /**
   * Helper to read cookie value
   */
  function getCookie(name) {
    try {
      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return match ? decodeURIComponent(match[3]) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Helper to write cookie value (30-day session expiry)
   */
  function setCookie(name, value, days = 30) {
    try {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    } catch (e) {
      // Ignore cookie write restrictions
    }
  }

  /**
   * Determine target ingestion endpoint:
   * 1. <script data-api-endpoint="..."> attribute
   * 2. Global window.CF_ANALYTICS_ENDPOINT variable
   * 3. Automatic derivation from <script src="..."> origin
   * 4. Fallback to DEFAULT_API_ENDPOINT
   */
  function resolveApiEndpoint() {
    try {
      const currentScript =
        document.currentScript ||
        document.querySelector('script[data-api-endpoint]') ||
        document.querySelector('script[src*="tracker.js"]') ||
        document.querySelector('script[data-site-id]');

      if (currentScript && currentScript.getAttribute('data-api-endpoint')) {
        return currentScript.getAttribute('data-api-endpoint');
      }

      if (window.CF_ANALYTICS_ENDPOINT && typeof window.CF_ANALYTICS_ENDPOINT === 'string') {
        return window.CF_ANALYTICS_ENDPOINT;
      }

      // Auto-discover backend origin from script src URL
      if (currentScript && currentScript.src) {
        try {
          const parsedUrl = new URL(currentScript.src, window.location.href);
          if (parsedUrl.origin && parsedUrl.origin !== 'null') {
            return `${parsedUrl.origin}/api/events`;
          }
        } catch (err) {}
      }
    } catch (e) {
      // Ignore DOM lookup errors
    }
    return DEFAULT_API_ENDPOINT;
  }

  /**
   * Determine site identifier:
   * 1. <script data-site-id="..."> attribute
   * 2. Global window.CF_SITE_ID variable
   * 3. Current window hostname fallback (e.g. "my-shopify-store.com")
   */
  function resolveSiteId() {
    try {
      const currentScript =
        document.currentScript ||
        document.querySelector('script[data-site-id]') ||
        document.querySelector('script[data-api-endpoint]') ||
        document.querySelector('script[src*="tracker.js"]');

      if (currentScript && currentScript.getAttribute('data-site-id')) {
        return currentScript.getAttribute('data-site-id');
      }

      if (window.CF_SITE_ID && typeof window.CF_SITE_ID === 'string') {
        return window.CF_SITE_ID;
      }

      return window.location.hostname || 'external-site';
    } catch (e) {
      return 'external-site';
    }
  }

  const API_ENDPOINT = resolveApiEndpoint();
  const SITE_ID = resolveSiteId();
  const HOST_DOMAIN = typeof window !== 'undefined' && window.location ? window.location.hostname : 'unknown-host';

  /**
   * Generates a collision-resistant unique session identifier.
   * Format: sess_<timestamp>_<random>
   */
  function generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `sess_${timestamp}_${randomPart}`;
  }

  /**
   * Retrieves or creates the current session ID in localStorage (with cookie synchronization).
   */
  function getOrCreateSessionId() {
    try {
      // 1. Check localStorage first
      let sessionId = null;
      try {
        sessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
      } catch (e) {
        // localStorage might be blocked in strict mode
      }

      // 2. Check cookie if localStorage empty
      if (!sessionId) {
        sessionId = getCookie(SESSION_STORAGE_KEY);
      }

      // 3. Generate new ID if absent from both
      if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
        sessionId = generateSessionId();
      }

      // Persist across both localStorage and cookie
      try {
        window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      } catch (e) {}
      setCookie(SESSION_STORAGE_KEY, sessionId);

      return sessionId;
    } catch (err) {
      if (!window.__cf_fallback_session_id) {
        window.__cf_fallback_session_id = generateSessionId();
      }
      return window.__cf_fallback_session_id;
    }
  }

  /**
   * Resolves the canonical page URL (path + search params)
   */
  function getCurrentPageUrl() {
    try {
      return window.location.pathname + window.location.search || '/';
    } catch (e) {
      return '/';
    }
  }

  /**
   * Dispatches event payload asynchronously to backend.
   * Supports navigator.sendBeacon during page exit.
   */
  function sendEventPayload(payload, useBeacon = false) {
    try {
      const jsonBody = JSON.stringify(payload);

      // 1. If beacon requested (e.g., page unload), use sendBeacon
      if (useBeacon && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([jsonBody], { type: 'application/json' });
        const sent = navigator.sendBeacon(API_ENDPOINT, blob);
        if (sent) return;
      }

      // 2. Use fetch with keepalive: true and mode: cors
      if (typeof window.fetch === 'function') {
        window
          .fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: jsonBody,
            mode: 'cors',
            credentials: 'omit',
            keepalive: true,
          })
          .then((response) => {
            // Internal dispatch for UI HUD hooks
            if (typeof window.dispatchEvent === 'function') {
              window.dispatchEvent(
                new CustomEvent('cf_tracker_event_sent', {
                  detail: { payload, status: response.status },
                })
              );
            }
          })
          .catch(() => {
            // Silently swallow fetch network errors
          });
      } else if (typeof window.XMLHttpRequest === 'function') {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_ENDPOINT, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(jsonBody);
      }
    } catch (err) {
      // Fail silently
    }
  }

  /**
   * Auto-extracts semantic target attributes from clicked elements
   */
  function extractSemanticMetadata(target) {
    if (!target) return {};

    try {
      // Find closest interactive element or semantic container
      const interactiveElem =
        target.closest('[data-product-name], [data-product-id], [data-action], button, a, input, select') ||
        target;

      const productId =
        interactiveElem.getAttribute('data-product-id') ||
        target.getAttribute('data-product-id') ||
        null;

      const productName =
        interactiveElem.getAttribute('data-product-name') ||
        target.getAttribute('data-product-name') ||
        null;

      let actionType =
        interactiveElem.getAttribute('data-action') ||
        target.getAttribute('data-action') ||
        null;

      // Extract cleaned, truncated element text preview
      let rawText = interactiveElem.innerText || interactiveElem.textContent || '';
      rawText = rawText.replace(/\s+/g, ' ').trim();
      const elementText = rawText ? rawText.substring(0, 100) : null;

      // Classify action type if not explicitly tagged
      if (!actionType) {
        if (/add to (cart|bag)/i.test(rawText)) {
          actionType = 'CART_ACTION';
        } else if (/checkout|complete order|pay/i.test(rawText)) {
          actionType = 'CHECKOUT_ACTION';
        } else if (productId || productName) {
          actionType = 'PRODUCT_CLICK';
        } else if (interactiveElem.tagName === 'A' || interactiveElem.tagName === 'BUTTON') {
          actionType = 'CLICK_CTA';
        } else {
          actionType = 'CLICK';
        }
      }

      return {
        elementTag: (target.tagName || '').toUpperCase() || null,
        elementId: target.id || interactiveElem.id || null,
        elementClass: target.className && typeof target.className === 'string' ? target.className.substring(0, 80) : null,
        elementText,
        productId,
        productName,
        actionType,
        domain: HOST_DOMAIN,
        siteId: SITE_ID,
        title: document.title ? document.title.substring(0, 120) : null,
        referrer: document.referrer ? document.referrer.substring(0, 200) : null,
      };
    } catch (e) {
      return {
        domain: HOST_DOMAIN,
        siteId: SITE_ID,
      };
    }
  }

  /**
   * Records a page view event.
   */
  function trackPageView(customUrl) {
    const sessionId = getOrCreateSessionId();
    const pageUrl = customUrl || getCurrentPageUrl();

    const payload = {
      sessionId,
      session_id: sessionId,
      eventType: 'page_view',
      event_type: 'page_view',
      pageUrl,
      page_url: pageUrl,
      timestamp: new Date().toISOString(),
      coordinates: null,
      metadata: {
        actionType: 'VIEW',
        domain: HOST_DOMAIN,
        siteId: SITE_ID,
        elementText: document.title ? document.title.substring(0, 100) : null,
        title: document.title ? document.title.substring(0, 120) : null,
        referrer: document.referrer ? document.referrer.substring(0, 200) : null,
      },
    };

    sendEventPayload(payload);
  }

  /**
   * Window-level click event listener
   */
  function trackClick(e) {
    try {
      const sessionId = getOrCreateSessionId();
      const pageUrl = getCurrentPageUrl();

      // Compute coordinate relative to document
      let x = e.pageX;
      let y = e.pageY;

      if (x === undefined || y === undefined) {
        x = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft || 0);
        y = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop || 0);
      }

      const metadata = extractSemanticMetadata(e.target);

      const payload = {
        sessionId,
        session_id: sessionId,
        eventType: 'click',
        event_type: 'click',
        pageUrl,
        page_url: pageUrl,
        timestamp: new Date().toISOString(),
        coordinates: {
          x: Math.round(x),
          y: Math.round(y),
        },
        x: Math.round(x),
        y: Math.round(y),
        metadata,
      };

      sendEventPayload(payload);
    } catch (err) {
      // Fail silently
    }
  }

  // 1. Capture initial page_view immediately upon script evaluation
  trackPageView();

  // 2. Attach click event listener to window in capture phase
  window.addEventListener('click', trackClick, true);

  // 3. Track visibility change / page exit using navigator.sendBeacon
  let hasSentExitBeacon = false;
  function handlePageExit() {
    if (hasSentExitBeacon) return;
    hasSentExitBeacon = true;
    const sessionId = getOrCreateSessionId();
    const payload = {
      sessionId,
      eventType: 'page_view',
      pageUrl: getCurrentPageUrl(),
      timestamp: new Date().toISOString(),
      coordinates: null,
      metadata: {
        actionType: 'NAVIGATE',
        elementText: 'Page Exit / Visibility Change',
        domain: HOST_DOMAIN,
        siteId: SITE_ID,
      },
    };
    sendEventPayload(payload, true);
  }

  window.addEventListener('beforeunload', handlePageExit);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      handlePageExit();
    }
  });

  // Public Programmatic & SPA API
  const publicApi = {
    version: '2.1.0',
    endpoint: API_ENDPOINT,
    siteId: SITE_ID,
    domain: HOST_DOMAIN,
    getSessionId: getOrCreateSessionId,
    trackPageView,
    track: function (actionType, customMetadata = {}) {
      const sessionId = getOrCreateSessionId();
      const payload = {
        sessionId,
        eventType: 'click',
        pageUrl: getCurrentPageUrl(),
        timestamp: new Date().toISOString(),
        coordinates: { x: 0, y: 0 },
        metadata: {
          actionType: actionType || 'CUSTOM_ACTION',
          domain: HOST_DOMAIN,
          siteId: SITE_ID,
          ...customMetadata,
        },
      };
      sendEventPayload(payload);
    },
    trackCustomClick: function (x, y, url, meta) {
      const payload = {
        sessionId: getOrCreateSessionId(),
        eventType: 'click',
        pageUrl: url || getCurrentPageUrl(),
        timestamp: new Date().toISOString(),
        coordinates: { x: Math.round(x), y: Math.round(y) },
        metadata: {
          domain: HOST_DOMAIN,
          siteId: SITE_ID,
          ...(meta || {}),
        },
      };
      sendEventPayload(payload);
    },
    resetSession: function () {
      try {
        const newSessionId = generateSessionId();
        window.localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
        setCookie(SESSION_STORAGE_KEY, newSessionId);
        return newSessionId;
      } catch (e) {
        return generateSessionId();
      }
    },
  };

  window.CFAnalytics = publicApi;
  window.UserTracker = publicApi;
})(window, document);
