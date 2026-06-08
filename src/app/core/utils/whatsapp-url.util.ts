/** Exibe no formulário: número local, não "https://1196...". */
export function whatsappForInput(stored: string | null | undefined): string {
  const raw = (stored ?? '').trim();
  if (!raw) return '';

  const waMe = raw.match(/wa\.me\/(\d+)/i);
  if (waMe) {
    const digits = waMe[1];
    if (digits.startsWith('55') && digits.length >= 12) {
      return digits.slice(2);
    }
    return digits;
  }

  const withoutScheme = raw.replace(/^https?:\/\//i, '');
  if (/^\d+$/.test(withoutScheme)) {
    return withoutScheme;
  }

  return raw;
}

/** Salva como link wa.me clicável. */
export function normalizeWhatsappForSave(input: string): string {
  const raw = input.trim();
  if (!raw) return '';

  const digits = raw.replace(/^https?:\/\//i, '').replace(/\D/g, '');
  if (!digits) return '';

  let normalized = digits;
  if ((normalized.length === 10 || normalized.length === 11) && !normalized.startsWith('55')) {
    normalized = `55${normalized}`;
  }

  return `https://wa.me/${normalized}`;
}
