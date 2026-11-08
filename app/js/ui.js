// Small DOM + randomness helpers. All DOM is built with createElement/textContent
// (never innerHTML) so no string is ever parsed as HTML.

const ALLOWED_ATTRS = /^(class|id|type|role|title|for|tabindex|hidden|disabled|value|min|max|step|src|alt|width|height|lang|placeholder|autocomplete|aria-[a-z]+|data-[a-z-]+)$/;
const SVG_NS = 'http://www.w3.org/2000/svg';

const ICON_PATHS = {
  xray: [
    ['rect', { x: '3', y: '3', width: '18', height: '18', rx: '4' }],
    ['path', { d: 'M8 8h8M9 12h6M10 16h4M12 6v12' }],
  ],
  spin: [
    ['path', { d: 'M21 12a9 9 0 1 1-2.64-6.36' }],
    ['path', { d: 'M21 3v6h-6' }],
  ],
  labels: [
    ['path', { d: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' }],
    ['circle', { cx: '7', cy: '7', r: '1.5' }],
  ],
  'camera-reset': [
    ['path', { d: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2' }],
    ['circle', { cx: '12', cy: '12', r: '3' }],
  ],
  moon: [
    ['path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' }],
  ],
  sun: [
    ['circle', { cx: '12', cy: '12', r: '4' }],
    ['path', { d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41' }],
  ],
  search: [
    ['circle', { cx: '11', cy: '11', r: '7' }],
    ['path', { d: 'M20 20l-3.8-3.8' }],
  ],
};

/** Crisp 2px-stroke inline SVG icon built strictly with createElementNS (never innerHTML). */
export function svgIcon(name, size = 18) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const [tag, attrs] of ICON_PATHS[name] || []) {
    const shape = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) shape.setAttribute(k, v);
    svg.appendChild(shape);
  }
  return svg;
}

/** el('button', { class: 'btn', 'aria-label': 'x' }, 'text', childNode, ...) */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === false || value === null || value === undefined) continue;
    if (!ALLOWED_ATTRS.test(key)) throw new Error(`attribute not allowed: ${key}`);
    node.setAttribute(key, value === true ? '' : String(value));
  }
  append(node, children);
  return node;
}

function append(node, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(node, child);
    else if (child instanceof Node) node.appendChild(child);
    else node.appendChild(document.createTextNode(String(child)));
  }
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/** Uniform random integer in [0, n) from the OS CSPRNG (not security-critical, but cheap). */
export function randInt(n) {
  if (n <= 1) return 0;
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n;
  let x;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % n;
}

export function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample(list, count) {
  return shuffle(list).slice(0, count);
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** "⭐⭐☆" style string with an accessible label. */
export function starsNode(count, max = 3, className = 'mode-stars') {
  const span = el('span', { class: className, 'aria-label': `${count} of ${max} stars` });
  span.textContent = '★'.repeat(count) + '☆'.repeat(Math.max(0, max - count));
  return span;
}

/** Lowercase the first letter and drop the final period: "Keeps it cool." -> "keeps it cool" */
export function asClause(sentence) {
  const s = sentence.trim().replace(/[.!]+$/, '');
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const PRAISE = ['Awesome!', 'You did it!', 'Super job!', 'Brilliant!', 'Engineer level!', 'Fantastic!', 'Way to go!'];
export const praise = () => PRAISE[randInt(PRAISE.length)];
