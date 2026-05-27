/** Browser download / clipboard helpers for circuit DSL and SVG exports. */

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

/** Build a filesystem-safe filename from a DSL string (extension without dot). */
export function sanitizeDslFilename(dsl: string, extension: string): string {
  const ext = extension.replace(/^\./, '');
  const base = dsl.trim().replace(INVALID_FILENAME_CHARS, '').replace(/\s+/g, '').slice(0, 180);
  return `${base || 'circuit'}.${ext}`;
}

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through */
    }
  }

  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

export function flashButtonLabel(button: HTMLButtonElement, doneLabel = '✓', ms = 1200): void {
  const original = button.textContent ?? '';
  button.textContent = doneLabel;
  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, ms);
}
