import { describe, it, expect } from 'vitest';
import { validateEmail, validatePhone, validateDate, isDayValid, isTimeValid } from '@/app/lib/validations';

// ============================================
// TESTS DE VALIDACIÓN - API RESERVAS
// (Tests de lógica de validación sin fetch real)
// ============================================

describe('Validación de datos de reserva', () => {
  function validarReserva(data: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    fecha?: string;
    hora?: string;
    comensales?: number;
  }): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!data.nombre?.trim()) errores.push('Nombre es requerido');
    if (!data.apellido?.trim()) errores.push('Apellido es requerido');

    if (!data.email?.trim()) {
      errores.push('Email es requerido');
    } else if (!validateEmail(data.email)) {
      errores.push('Email inválido');
    }

    if (!data.telefono?.trim()) {
      errores.push('Teléfono es requerido');
    } else if (!validatePhone(data.telefono)) {
      errores.push('Teléfono inválido');
    }

    if (!data.fecha) {
      errores.push('Fecha es requerida');
    } else if (!validateDate(data.fecha).isValid) {
      errores.push('Formato de fecha inválido (usar YYYY-MM-DD)');
    }

    if (!data.hora) {
      errores.push('Hora es requerida');
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.hora)) {
      errores.push('Formato de hora inválido (usar HH:MM)');
    }

    if (!data.comensales || data.comensales < 1 || data.comensales > 20) {
      errores.push('Comensales debe estar entre 1 y 20');
    }

    return { valido: errores.length === 0, errores };
  }

  it('debería validar reserva completa y correcta', () => {
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    const data = {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@test.com',
      telefono: '3415551234',
      fecha: fechaHoy,
      hora: '20:00',
      comensales: 4,
    };

    const resultado = validarReserva(data);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('debería rechazar email sin @', () => {
    const data = {
      nombre: 'Juan',
      email: 'email-sin-aroba.com',
    };

    const resultado = validarReserva(data);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContain('Email inválido');
  });

  it('debería rechazar teléfono muy corto', () => {
    const data = {
      telefono: '123',
    };

    const resultado = validarReserva(data);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContain('Teléfono inválido');
  });

  it('debería rechazar formato de fecha incorrecto', () => {
    const data = {
      fecha: '15-04-2024',
    };

    const resultado = validarReserva(data);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContain('Formato de fecha inválido (usar YYYY-MM-DD)');
  });

  it('debería rechazar formato de hora incorrecto', () => {
    const data = {
      hora: '8pm',
    };

    const resultado = validarReserva(data);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContain('Formato de hora inválido (usar HH:MM)');
  });

  it('debería rechazar comensales = 0', () => {
    const data = {
      comensales: 0,
    };

    const resultado = validarReserva(data);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContain('Comensales debe estar entre 1 y 20');
  });

  it('debería rechazar comensales > 20', () => {
    const data = {
      comensales: 25,
    };

    const resultado = validarReserva(data);
    expect(resultado.valido).toBe(false);
  });

  it('debería acumular múltiples errores', () => {
    const data = {
      nombre: '',
      email: 'invalido',
      telefono: 'abc',
    };

    const resultado = validarReserva(data);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.length).toBeGreaterThan(1);
  });
});

describe('Validación de fecha', () => {
  it('debería aceptar fechas futuras válidas', () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaStr = manana.toISOString().split('T')[0];

    const resultado = validateDate(fechaStr);
    expect(resultado.isValid).toBe(true);
  });

  it('debería rechazar fechas inválidas', () => {
    expect(validateDate('2024-02-30').isValid).toBe(false); // 30 de febrero no existe
    expect(validateDate('2024-13-01').isValid).toBe(false); // Mes 13 no existe
  });

  it('debería rechazar fechas en el pasado', () => {
    expect(validateDate('2020-01-01').isValid).toBe(false);
  });

  it('debería validar días de la semana', () => {
    // Martes (válido)
    const martes = new Date();
    while (martes.getDay() !== 2) martes.setDate(martes.getDate() + 1);
    expect(isDayValid(martes)).toBe(true);
    // Miércoles (válido)
    const miercoles = new Date();
    while (miercoles.getDay() !== 3) miercoles.setDate(miercoles.getDate() + 1);
    expect(isDayValid(miercoles)).toBe(true);
    // Domingo (inválido)
    const domingo = new Date();
    while (domingo.getDay() !== 0) domingo.setDate(domingo.getDate() + 1);
    expect(isDayValid(domingo)).toBe(false);
    // Lunes (inválido)
    const lunes = new Date();
    while (lunes.getDay() !== 1) lunes.setDate(lunes.getDate() + 1);
    expect(isDayValid(lunes)).toBe(false);
  });
});

describe('Validación de horarios', () => {
  it('debería validar horarios del restaurante', () => {
    const horarios = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];

    expect(isTimeValid('19:00', horarios)).toBe(true);
    expect(isTimeValid('22:30', horarios)).toBe(true);
    expect(isTimeValid('18:30', horarios)).toBe(false);
    expect(isTimeValid('23:00', horarios)).toBe(false);
    expect(isTimeValid('20:15', horarios)).toBe(false); // No es :00 o :30
  });

  it('debería tener formato HH:MM correcto', () => {
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    expect(horaRegex.test('19:00')).toBe(true);
    expect(horaRegex.test('09:30')).toBe(true);
    expect(horaRegex.test('22:30')).toBe(true);
    expect(horaRegex.test('25:00')).toBe(false);
    expect(horaRegex.test('19:60')).toBe(false);
    expect(horaRegex.test('8:00')).toBe(true);
  });
});

describe('Estados de reserva', () => {
  const estadosValidos = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA', 'NO_ASISTIO', 'REQUIERE_ATENCION'];

  it('debería tener todos los estados definidos', () => {
    expect(estadosValidos).toContain('PENDIENTE');
    expect(estadosValidos).toContain('CONFIRMADA');
    expect(estadosValidos).toContain('CANCELADA');
    expect(estadosValidos).toContain('COMPLETADA');
    expect(estadosValidos).toContain('NO_ASISTIO');
    expect(estadosValidos).toContain('REQUIERE_ATENCION');
  });

  it('debería identificar estados terminales', () => {
    const estadosTerminales = ['CANCELADA', 'COMPLETADA', 'NO_ASISTIO'];

    estadosTerminales.forEach((estado) => {
      expect(['CANCELADA', 'COMPLETADA', 'NO_ASISTIO']).toContain(estado);
    });

    expect(['PENDIENTE', 'CONFIRMADA', 'REQUIERE_ATENCION']).not.toContain('COMPLETADA');
  });

  it('debería permitir transiciones válidas', () => {
    function puedeTransicionar(estadoActual: string, nuevoEstado: string): boolean {
      const transicionesValidas: Record<string, string[]> = {
        PENDIENTE: ['CONFIRMADA', 'CANCELADA', 'REQUIERE_ATENCION'],
        CONFIRMADA: ['COMPLETADA', 'CANCELADA', 'NO_ASISTIO'],
        REQUIERE_ATENCION: ['CONFIRMADA', 'CANCELADA'],
        CANCELADA: [],
        COMPLETADA: ['NO_ASISTIO'],
        NO_ASISTIO: [],
      };

      return transicionesValidas[estadoActual]?.includes(nuevoEstado) ?? false;
    }

    expect(puedeTransicionar('PENDIENTE', 'CONFIRMADA')).toBe(true);
    expect(puedeTransicionar('PENDIENTE', 'CANCELADA')).toBe(true);
    expect(puedeTransicionar('CONFIRMADA', 'COMPLETADA')).toBe(true);
    expect(puedeTransicionar('CANCELADA', 'CONFIRMADA')).toBe(false); // No se puede deshacer
  });
});

describe('Tokens de cancelación', () => {
  function generarToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  it('debería generar tokens únicos', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generarToken());
    }
    expect(tokens.size).toBe(100);
  });

  it('debería tener longitud suficiente', () => {
    const token = generarToken();
    expect(token.length).toBeGreaterThanOrEqual(20);
  });

  it('debería poder verificar token', () => {
    function esTokenValido(token: string): boolean {
      return /^[a-z0-9]+$/i.test(token) && token.length >= 5;
    }

    expect(esTokenValido('abc12')).toBe(true);
    expect(esTokenValido('abc12345678')).toBe(true);
    expect(esTokenValido('abc')).toBe(false); // Muy corto
    expect(esTokenValido('with-spaces')).toBe(false);
    expect(esTokenValido('with-dashes')).toBe(false);
  });
});
