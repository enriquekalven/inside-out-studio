// Small DOM + randomness helpers. All DOM is built with createElement/textContent
// (never innerHTML) so no string is ever parsed as HTML.

const ALLOWED_ATTRS = /^(class|id|type|role|title|for|tabindex|hidden|disabled|value|min|max|step|src|alt|width|height|lang|aria-[a-z]+|data-[a-z-]+)$/;

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
