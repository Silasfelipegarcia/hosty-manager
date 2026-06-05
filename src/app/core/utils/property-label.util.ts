import { PropertyDto } from '../models/property.models';

export const GLOBAL_PROPERTY_ID = '__GLOBAL__';
export const GLOBAL_PROPERTY_LABEL = 'Toda a carteira';

export function propertyLabel(
  propertyId: string | null | undefined,
  properties: PropertyDto[],
  fallbackName?: string | null,
): string {
  const id = (propertyId ?? '').trim();
  if (!id) return '—';
  if (id === GLOBAL_PROPERTY_ID) return GLOBAL_PROPERTY_LABEL;
  if (fallbackName && fallbackName.trim()) return fallbackName.trim();
  const found = properties.find((p) => p.id === id);
  if (found?.name?.trim()) {
    const city = found.city?.trim();
    return city ? `${found.name} · ${city}` : found.name;
  }
  return 'Imóvel';
}

export function propertySelectLabel(p: PropertyDto): string {
  const city = p.city?.trim();
  return city ? `${p.name} · ${city}` : p.name;
}
