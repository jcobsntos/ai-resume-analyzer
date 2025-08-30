import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatCurrency(amount: number | undefined, currency: string = 'PHP'): string {
  if (amount === undefined || amount === null) {
    return currency === 'PHP' ? '₱0' : '$0';
  }
  
  const locale = currency === 'PHP' ? 'en-PH' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getInitials(firstName: string, lastName: string): string {
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  // Philippine phone number validation (supports mobile and landline)
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Philippine mobile numbers: 09xxxxxxxxx or 639xxxxxxxxx
  const mobileRegex = /^(09|639)\d{9}$/;
  // Philippine landline: (0xx)xxxxxxx or 63xxxxxxxxxxxx
  const landlineRegex = /^(0\d{1,2}\d{7,8}|63\d{10,11})$/;
  
  return mobileRegex.test(cleanPhone) || landlineRegex.test(cleanPhone);
}

export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Format Philippine mobile numbers
  if (cleanPhone.match(/^09\d{9}$/)) {
    return `+63 ${cleanPhone.substring(1, 4)} ${cleanPhone.substring(4, 7)} ${cleanPhone.substring(7)}`;
  }
  
  // Format international Philippine mobile numbers
  if (cleanPhone.match(/^639\d{9}$/)) {
    return `+${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 5)} ${cleanPhone.substring(5, 8)} ${cleanPhone.substring(8)}`;
  }
  
  return phone; // Return original if no pattern matches
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
