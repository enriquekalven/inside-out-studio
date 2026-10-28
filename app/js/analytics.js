// Google Analytics 4 (GA4) Telemetry Module for Inside Out Studio.
// Official Firebase Web Stream in GCP project `project-maui`:
//   - Site: https://inside-out-explorer.web.app
//   - GA4 Measurement ID: G-B1SZ4464HN
//   - Firebase Web App ID: 1:697625214430:web:4e06a997ab151b0c82f14f
//   - GA4 Property ID: 521061448
// Automatically disables live network hits on localhost/headless test runs unless `?debug_ga=1` is passed.

export const GA_MEASUREMENT_ID = 'G-B1SZ4464HN';
export const FIREBASE_APP_ID = '1:697625214430:web:4e06a997ab151b0c82f14f';
export const GA_PROPERTY_ID = '521061448';

const PRODUCTION_HOSTS = new Set([
  'inside-out-explorer.web.app',
  'inside-out-explorer.firebaseapp.com',
]);

let initialized = false;
let analyticsState = {
  measurementId: GA_MEASUREMENT_ID,
  firebaseAppId: FIREBASE_APP_ID,
  propertyId: GA_PROPERTY_ID,
  initialized: false,
  enabled: false,
  debugMode: false,
  host: '',
  eventsSent: [],
};

function sanitizeParam(val, maxLen = 64) {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'number') return Number.isFinite(val) ? val : undefined;
  if (typeof val === 'boolean') return val;
  return String(val).slice(0, maxLen);
}

export function initAnalytics() {
  if (typeof window === 'undefined') return analyticsState;
  if (initialized) return analyticsState;
  initialized = true;

  const host = String(window.location?.hostname || '');
  let debugRequested = false;
  try {
    const params = new URLSearchParams(window.location?.search || '');
    debugRequested = params.get('debug_ga') === '1';
  } catch {
    debugRequested = false;
  }

  const isProdHost = PRODUCTION_HOSTS.has(host);
  const enabled = isProdHost || debugRequested;

  // Respect GA4 opt-out on local dev / CI unless ?debug_ga=1 is explicitly set
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = !enabled;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    app_name: 'Inside Out Studio',
    firebase_app_id: FIREBASE_APP_ID,
    anonymize_ip: true,
    ...(debugRequested ? { debug_mode: true } : {}),
  });

  analyticsState = {
    measurementId: GA_MEASUREMENT_ID,
    firebaseAppId: FIREBASE_APP_ID,
    propertyId: GA_PROPERTY_ID,
    initialized: true,
    enabled,
    debugMode: debugRequested,
    host,
    eventsSent: [],
  };

  window.__insideOutAnalytics = analyticsState;
  return analyticsState;
}

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (!initialized) initAnalytics();

  const safeName = String(eventName || '')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .slice(0, 40);
  if (!safeName) return;

  const cleanParams = {};
  for (const [k, v] of Object.entries(params || {})) {
    const safeKey = String(k).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
    const safeVal = sanitizeParam(v);
    if (safeKey && safeVal !== undefined) {
      cleanParams[safeKey] = safeVal;
    }
  }

  analyticsState.eventsSent.push({
    name: safeName,
    params: cleanParams,
    ts: Date.now(),
  });
  if (analyticsState.eventsSent.length > 30) {
    analyticsState.eventsSent.shift();
  }

  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', safeName, cleanParams);
    } catch {
      // Never let telemetry interrupt interactive 3D exploration
    }
  }
}

export function trackCategorySelect(categoryId) {
  trackEvent('select_category', { category_id: categoryId });
}

export function trackModelSelect(categoryId, modelId) {
  trackEvent('select_model', { category_id: categoryId, model_id: modelId });
}

export function trackModeSwitch(mode, categoryId, modelId) {
  trackEvent('switch_mode', { mode, category_id: categoryId, model_id: modelId });
}

export function trackPartInspect(categoryId, modelId, partId) {
  trackEvent('inspect_part', {
    category_id: categoryId,
    model_id: modelId,
    part_id: partId,
  });
}

export function trackReadAloud(langCode, engine, studioKey = '') {
  trackEvent('read_aloud', {
    lang_code: langCode,
    tts_engine: engine,
    studio_key: studioKey || 'dynamic',
  });
}

export function trackQuizComplete(categoryId, modelId, score, total, stars) {
  trackEvent('quiz_complete', {
    category_id: categoryId,
    model_id: modelId,
    score,
    total,
    stars,
  });
}

export function trackLanguageSwitch(langCode) {
  trackEvent('switch_language', { lang_code: langCode });
}
