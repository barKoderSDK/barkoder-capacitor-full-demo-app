import { BARCODE_TYPES_1D } from '../constants/constants';

export const normalize = (value: string): string => value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

export const is1D = (type: string): boolean => {
  const normalizedType = normalize(type);
  return BARCODE_TYPES_1D.some(
    (item) => normalize(item.label) === normalizedType || normalize(item.id) === normalizedType,
  );
};