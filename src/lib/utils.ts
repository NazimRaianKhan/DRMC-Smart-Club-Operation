import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  // Using clsx natively. (Normally tailwind-merge would be used here, but keeping it minimal)
  return clsx(inputs);
}
