/**
 * Standalone Client-Side User Analytics & Session Tracker
 *
 * Requirements:
 * - Pure Vanilla JavaScript (zero external dependencies)
 * - Persistent session tracking via localStorage ('cf_session_id')
 * - Automatic page_view capture on initialization
 * - Window-level click tracking (pageX, pageY, pageUrl, timestamp)
 * - Non-blocking asynchronous ingestion with silent failure handling
 */
(function (window, document) {
  'use strict';

  // Prevent multiple initializations on the same document
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
   * 3. Fallback to DEFAULT_API_ENDPOINT
   */
  function resolveApiEndpoint() {
    try {
      const currentScript =
        document.currentScript ||
        document.querySelector('script[data-api-endpoint]') ||
        document.querySelector('script[src*="tracker.js"]');

      if (currentScript && currentScript.getAttribute('data-api-endpoint')) {
        return currentScript.getAttribute('data-api-endpoint');
      }

      if (window.CF_ANALYTICS_ENDPOINT && typeof window.CF_ANALYTICS_ENDPOINT === 'string') {
        return window.CF_ANALYTICS_ENDPOINT;
      }
    } catch (e) {
      // Ignore DOM lookup errors
    }
    return DEFAULT_API_ENDPOINT;
  }

  const API_ENDPOINT = resolveApiEndpoint();

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
        // localStorage might be blocked
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
   * Fails silently on any network or execution error to never disrupt host site.
   */
  function sendEventPayload(payload) {
    try {
      // Use fetch with POST and application/json
      if (typeof window.fetch === 'function') {
        window
          .fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            // 'no-cors' is NOT used here because server allows CORS and we send JSON body
            mode: 'cors',
            credentials: 'omit',
            keepalive: true, // Guarantees beacon completion during unload
          })
          .then((response) => {
            // Optional internal dispatch for demo page UI HUD hooks
            if (typeof window.dispatchEvent === 'function') {
              window.dispatchEvent(
                new CustomEvent('cf_tracker_event_sent', {
                  detail: { payload, status: response.status },
                })
              );
            }
          })
          .catch(() => {
            // Silently swallow fetch network errors (offline, server down, etc.)
          });
      } else if (typeof window.XMLHttpRequest === 'function') {
        // Fallback for ancient browsers
        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_ENDPOINT, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(payload));
      }
    } catch (err) {
      // Fail silently
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
    };

    sendEventPayload(payload);
  }

  /**
   * Records a user click event with document coordinates.
   */
  function trackClick(e) {
    try {
      // Calculate coordinates with fallback if pageX/pageY are undefined
      let x = e.pageX;
      let y = e.pageY;

      if (typeof x !== 'number' || typeof y !== 'number') {
        const docElem = document.documentElement || document.body;
        x = (e.clientX || 0) + (docElem.scrollLeft || 0);
        y = (e.clientY || 0) + (docElem.scrollTop || 0);
      }

      const sessionId = getOrCreateSessionId();
      const pageUrl = getCurrentPageUrl();

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

  // Expose public API for host site debugging, custom reset, or testing
  window.UserTracker = {
    version: '1.0.0',
    endpoint: API_ENDPOINT,
    getSessionId: getOrCreateSessionId,
    trackPageView,
    trackCustomClick: function (x, y, url) {
      const payload = {
        sessionId: getOrCreateSessionId(),
        eventType: 'click',
        pageUrl: url || getCurrentPageUrl(),
        timestamp: new Date().toISOString(),
        coordinates: { x: Math.round(x), y: Math.round(y) },
      };
      sendEventPayload(payload);
    },
    resetSession: function () {
      try {
        const newSessionId = generateSessionId();
        window.localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
        return newSessionId;
      } catch (e) {
        return generateSessionId();
      }
    },
  };
})(window, document);
