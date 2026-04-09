import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, formatStr: string = 'PPP') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: es });
}

export function formatTime(hora: string) {
  const [hours, minutes] = hora.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return format(date, 'HH:mm');
}

export function isValidDateRange(
  fecha: Date,
  minDays: number = 0,
  maxDays: number = 30
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const minDate = addDays(today, minDays);
  const maxDate = addDays(today, maxDays);
  
  return (
    !isBefore(fecha, minDate) &&
    !isAfter(fecha, maxDate)
  );
}

export function isDiaValido(fecha: Date): boolean {
  const day = fecha.getDay();
  // 0 = Sunday, 1 = Monday, ..., 2 = Tuesday, ..., 6 = Saturday
  // Trainera open Tuesday (2) to Saturday (6)
  return day >= 2 && day <= 6;
}

export function formatTelefono(telefono: string): string {
  // Remove all non-digits
  const digits = telefono.replace(/\D/g, '');
  
  // If it's an Argentine number (starts with 54)
  if (digits.startsWith('54') && digits.length === 12) {
    return `+54 9 ${digits.slice(4, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
  }
  
  // If it's a local Argentine number (10 digits)
  if (digits.length === 10) {
    return `+54 9 ${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  
  return telefono;
}

export function generarHorariosDisponibles(horariosStr: string): string[] {
  return horariosStr.split(',').map(h => h.trim()).filter(Boolean);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
