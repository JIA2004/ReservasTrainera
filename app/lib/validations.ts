export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;
  return phoneRegex.test(phone);
}

export function validateDate(dateStr: string): { isValid: boolean; date?: Date; error?: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { isValid: false, error: 'Formato de fecha inválido. Use YYYY-MM-DD' };
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Fecha inválida' };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const maxFecha = new Date();
  maxFecha.setDate(maxFecha.getDate() + 30);

  if (date < hoy || date > maxFecha) {
    return { isValid: false, error: 'La fecha seleccionada no está dentro del rango permitido (hoy hasta 30 días)' };
  }

  return { isValid: true, date };
}

export function isDayValid(date: Date): boolean {
  const diaSemana = date.getDay();
  // 0: Domingo, 1: Lunes. Restaurante cerrado domingos y lunes.
  return diaSemana !== 0 && diaSemana !== 1;
}

export function isTimeValid(time: string, validTimes: string[]): boolean {
  return validTimes.includes(time);
}
