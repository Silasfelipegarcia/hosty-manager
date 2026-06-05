/** Mesma lógica do mobile: data URL, http(s) ou vazio. */
export function resolveProfilePhotoSrc(photoUrl: string | null | undefined): string | null {
  const v = photoUrl?.trim() ?? '';
  if (!v || v.startsWith('{') || v.startsWith('[')) return null;
  if (v.startsWith('data:image') || v.startsWith('http://') || v.startsWith('https://')) {
    return v;
  }
  return null;
}

export function profileInitials(name: string, email?: string | null): string {
  const base = name?.trim() || email?.split('@')[0] || '?';
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function imageFileToDataUrl(
  file: File,
  maxDim = 1920,
  quality = 0.82,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não disponível');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}
