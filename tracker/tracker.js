/**
 * Universal User Analytics & Cross-Domain Session Tracker v2.2.0
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
 * - Real user identity linking via CFAnalytics.setUser({ userId, email, name })
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
  const USER_IDENTITY_KEY   = 'cf_user_identity';
  const DEFAULT_API_ENDPOINT = 'http://localhost:5000/api/events';

  // ─── Identity State ──────────────────────────────────────────────────────────
  let _currentUser = null;

  function loadPersistedIdentity() {
    try {
      const raw = window.localStorage.getItem(USER_IDENTITY_KEY);
      if (raw) _currentUser = JSON.parse(raw);
    } catch (e) {
      _currentUser = null;
    }
  }
  loadPersistedIdentity();

  function attachIdentity(payload) {
    if (_currentUser) {
      payload.userId    = _currentUser.userId || _currentUser.id || null;
      payload.userEmail = _currentUser.email  || null;
      payload.userName  = _currentUser.name   || null;
    }
    return payload;
  }

  // ─── Cookie Helpers ───────────────────────────────────────────────────────────
  function getCookie(name) {
    try {
      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return match ? decodeURIComponent(match[3]) : null;
    } catch (e) {
      return null;
    }
  }

  function setCookie(name, value, days = 30) {
    try {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    } catch (e) {}
  }

  // ─── API Endpoint & Site Resolution ──────────────────────────────────────────
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

      if (currentScript && currentScript.src) {
        try {
          const parsedUrl = new URL(currentScript.src, window.location.href);
          if (parsedUrl.origin && parsedUrl.origin !== 'null') {
            return `${parsedUrl.origin}/api/events`;
          }
        } catch (err) {}
      }
    } catch (e) {}
    return DEFAULT_API_ENDPOINT;
  }

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
  const SITE_ID      = resolveSiteId();
  const HOST_DOMAIN  = (typeof window !== 'undefined' && window.location) ? window.location.hostname : 'unknown-host';

  // ─── Session ID ───────────────────────────────────────────────────────────────
  function generateSessionId() {
    const timestamp  = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `sess_${timestamp}_${randomPart}`;
  }

  function getOrCreateSessionId() {
    try {
      let sessionId = null;
      try { sessionId = window.localStorage.getItem(SESSION_STORAGE_KEY); } catch (e) {}
      if (!sessionId) sessionId = getCookie(SESSION_STORAGE_KEY);
      if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
        sessionId = generateSessionId();
      }
      try { window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId); } catch (e) {}
      setCookie(SESSION_STORAGE_KEY, sessionId);
      return sessionId;
    } catch (err) {
      if (!window.__cf_fallback_session_id) {
        window.__cf_fallback_session_id = generateSessionId();
      }
      return window.__cf_fallback_session_id;
    }
  }

  function getCurrentPageUrl() {
    try {
      return window.location.pathname + window.location.search || '/';
    } catch (e) {
      return '/';
    }
  }

  // ─── Event Dispatch ───────────────────────────────────────────────────────────
  function sendEventPayload(payload, useBeacon = false) {
    try {
      attachIdentity(payload); // Always inject current user identity
      const jsonBody = JSON.stringify(payload);

      if (useBeacon && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([jsonBody], { type: 'application/json' });
        if (navigator.sendBeacon(API_ENDPOINT, blob)) return;
      }

      if (typeof window.fetch === 'function') {
        window.fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: jsonBody,
          mode: 'cors',
          credentials: 'omit',
          keepalive: true,
        }).then((response) => {
          if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('cf_tracker_event_sent', {
              detail: { payload, status: response.status },
            }));
          }
        }).catch(() => {});
      } else if (typeof window.XMLHttpRequest === 'function') {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_ENDPOINT, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(jsonBody);
      }
    } catch (err) {}
  }

  // ─── Semantic Metadata Extraction ─────────────────────────────────────────────
  function extractSemanticMetadata(target) {
    if (!target) return {};
    try {
      const interactiveElem =
        target.closest('[data-product-name], [data-product-id], [data-action], button, a, input, select') ||
        target;

      const productId   = interactiveElem.getAttribute('data-product-id')   || target.getAttribute('data-product-id')   || null;
      const productName = interactiveElem.getAttribute('data-product-name') || target.getAttribute('data-product-name') || null;
      let actionType    = interactiveElem.getAttribute('data-action')        || target.getAttribute('data-action')        || null;

      let rawText = (interactiveElem.innerText || interactiveElem.textContent || '').replace(/\s+/g, ' ').trim();
      const elementText = rawText ? rawText.substring(0, 100) : null;

      if (!actionType) {
        if      (/add to (cart|bag)/i.test(rawText))           actionType = 'CART_ACTION';
        else if (/checkout|complete order|pay/i.test(rawText)) actionType = 'CHECKOUT_ACTION';
        else if (productId || productName)                      actionType = 'PRODUCT_CLICK';
        else if (interactiveElem.tagName === 'A' || interactiveElem.tagName === 'BUTTON') actionType = 'CLICK_CTA';
        else                                                    actionType = 'CLICK';
      }

      return {
        elementTag:   (target.tagName || '').toUpperCase() || null,
        elementId:    target.id || interactiveElem.id || null,
        elementClass: target.className && typeof target.className === 'string' ? target.className.substring(0, 80) : null,
        elementText,
        productId,
        productName,
        actionType,
        domain:   HOST_DOMAIN,
        siteId:   SITE_ID,
        title:    document.title    ? document.title.substring(0, 120)    : null,
        referrer: document.referrer ? document.referrer.substring(0, 200) : null,
      };
    } catch (e) {
      return { domain: HOST_DOMAIN, siteId: SITE_ID };
    }
  }

  // ─── Core Tracking Functions ──────────────────────────────────────────────────
  function trackPageView(customUrl) {
    const sessionId = getOrCreateSessionId();
    const pageUrl   = customUrl || getCurrentPageUrl();
    sendEventPayload({
      sessionId, session_id: sessionId,
      eventType: 'page_view', event_type: 'page_view',
      pageUrl, page_url: pageUrl,
      timestamp: new Date().toISOString(),
      coordinates: null,
      metadata: {
        actionType: 'VIEW',
        domain:   HOST_DOMAIN,
        siteId:   SITE_ID,
        elementText: document.title    ? document.title.substring(0, 100)    : null,
        title:       document.title    ? document.title.substring(0, 120)    : null,
        referrer:    document.referrer ? document.referrer.substring(0, 200) : null,
      },
    });
  }

  function trackClick(e) {
    try {
      const sessionId = getOrCreateSessionId();
      const pageUrl   = getCurrentPageUrl();
      let x = e.pageX !== undefined ? e.pageX : e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft || 0);
      let y = e.pageY !== undefined ? e.pageY : e.clientY + (document.documentElement.scrollTop  || document.body.scrollTop  || 0);
      sendEventPayload({
        sessionId, session_id: sessionId,
        eventType: 'click', event_type: 'click',
        pageUrl, page_url: pageUrl,
        timestamp: new Date().toISOString(),
        coordinates: { x: Math.round(x), y: Math.round(y) },
        x: Math.round(x), y: Math.round(y),
        metadata: extractSemanticMetadata(e.target),
      });
    } catch (err) {}
  }

  // ─── Initialization ───────────────────────────────────────────────────────────
  trackPageView();
  window.addEventListener('click', trackClick, true);

  let hasSentExitBeacon = false;
  function handlePageExit() {
    if (hasSentExitBeacon) return;
    hasSentExitBeacon = true;
    sendEventPayload({
      sessionId: getOrCreateSessionId(),
      eventType: 'page_view',
      pageUrl: getCurrentPageUrl(),
      timestamp: new Date().toISOString(),
      coordinates: null,
      metadata: { actionType: 'NAVIGATE', elementText: 'Page Exit / Visibility Change', domain: HOST_DOMAIN, siteId: SITE_ID },
    }, true);
  }
  window.addEventListener('beforeunload', handlePageExit);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') handlePageExit();
  });

  // ─── Public API ───────────────────────────────────────────────────────────────
  const publicApi = {
    version: '2.2.0',
    endpoint: API_ENDPOINT,
    siteId:   SITE_ID,
    domain:   HOST_DOMAIN,

    getSessionId: getOrCreateSessionId,
    trackPageView,

    /**
     * setUser — Call after login to link all future events to a real user identity.
     * @param {{ userId: string, email: string, name: string }} user
     */
    setUser: function (user) {
      if (!user || typeof user !== 'object') return;
      _currentUser = {
        userId: user.userId || user.id || null,
        email:  user.email  || null,
        name:   user.name   || null,
      };
      try { window.localStorage.setItem(USER_IDENTITY_KEY, JSON.stringify(_currentUser)); } catch (e) {}
      // Fire a USER_LOGIN event so the admin sees it in real-time
      sendEventPayload({
        sessionId: getOrCreateSessionId(),
        eventType: 'page_view',
        pageUrl:   getCurrentPageUrl(),
        timestamp: new Date().toISOString(),
        coordinates: null,
        metadata: {
          actionType: 'USER_LOGIN',
          domain: HOST_DOMAIN,
          siteId: SITE_ID,
          title: document.title ? document.title.substring(0, 120) : null,
        },
      });
    },

    /** clearUser — Call on logout to revert to anonymous tracking. */
    clearUser: function () {
      _currentUser = null;
      try { window.localStorage.removeItem(USER_IDENTITY_KEY); } catch (e) {}
    },

    /** getUser — Returns the currently identified user, or null. */
    getUser: function () {
      return _currentUser ? Object.assign({}, _currentUser) : null;
    },

    /** track — Fire a custom named action event. */
    track: function (actionType, customMetadata = {}) {
      sendEventPayload({
        sessionId: getOrCreateSessionId(),
        eventType: 'click',
        pageUrl: getCurrentPageUrl(),
        timestamp: new Date().toISOString(),
        coordinates: { x: 0, y: 0 },
        metadata: { actionType: actionType || 'CUSTOM_ACTION', domain: HOST_DOMAIN, siteId: SITE_ID, ...customMetadata },
      });
    },

    /** trackCustomClick — Fire a click event at specific coordinates. */
    trackCustomClick: function (x, y, url, meta) {
      sendEventPayload({
        sessionId: getOrCreateSessionId(),
        eventType: 'click',
        pageUrl: url || getCurrentPageUrl(),
        timestamp: new Date().toISOString(),
        coordinates: { x: Math.round(x), y: Math.round(y) },
        metadata: { domain: HOST_DOMAIN, siteId: SITE_ID, ...(meta || {}) },
      });
    },

    /** resetSession — Generate a fresh session ID (e.g., after logout). */
    resetSession: function () {
      try {
        const newId = generateSessionId();
        window.localStorage.setItem(SESSION_STORAGE_KEY, newId);
        setCookie(SESSION_STORAGE_KEY, newId);
        return newId;
      } catch (e) {
        return generateSessionId();
      }
    },
  };

  window.CFAnalytics = publicApi;
  window.UserTracker = publicApi;
})(window, document);
