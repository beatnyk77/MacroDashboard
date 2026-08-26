const ALLOWED_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DIV', 'EM', 'H1', 'H2', 'H3', 'H4',
  'H5', 'H6', 'HR', 'I', 'LI', 'OL', 'P', 'PRE', 'SPAN', 'STRONG', 'TABLE',
  'TBODY', 'TD', 'TH', 'THEAD', 'TR', 'U', 'UL',
]);

const ALLOWED_ATTRIBUTES = new Set(['colspan', 'href', 'rel', 'rowspan', 'target', 'title']);

function fallbackSanitize(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?(?:script|style|iframe|object|embed|form|noscript)[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:href|src)\s*=\s*(?:"|')?\s*javascript:[^\s>"']*(?:"|')?/gi, '');
}

/** Sanitize database-backed narrative HTML before using dangerouslySetInnerHTML. */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return fallbackSanitize(html);

  const document = new globalThis.DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = document.body.firstElementChild;
  if (!root) return '';

  const nodes = Array.from(root.querySelectorAll('*')).reverse();
  for (const node of nodes) {
    if (!ALLOWED_TAGS.has(node.tagName)) {
      if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'NOSCRIPT'].includes(node.tagName)) {
        node.remove();
      } else {
        node.replaceWith(...Array.from(node.childNodes));
      }
      continue;
    }

    for (const attribute of Array.from(node.attributes)) {
      if (!ALLOWED_ATTRIBUTES.has(attribute.name.toLowerCase())) node.removeAttribute(attribute.name);
    }

    if (node.tagName === 'A') {
      const href = node.getAttribute('href')?.trim() ?? '';
      if (!/^(?:https?:|mailto:)/i.test(href)) node.removeAttribute('href');
      if (node.getAttribute('target') === '_blank') node.setAttribute('rel', 'noopener noreferrer');
    }
  }

  return root.innerHTML;
}
