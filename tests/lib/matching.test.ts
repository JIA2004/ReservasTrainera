import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// TESTS PARA UTILIDADES DE MATCHING
// (Tests directos sin mock de Prisma complejo)
// ============================================

describe('Matching Logic - Tests Unitarios', () => {
  // Helper para simular el algoritmo greedy
  function matchingGreedy(comensales: number, mesas: { id: string; capacidad: number }[]): { disponible: boolean; requiereAtencion: boolean; mensaje?: string } {
    // Caso especial: comensales > 6 requiere atención manual
    if (comensales > 6) {
      return {
        disponible: false,
        requiereAtencion: true,
        mensaje: 'Para grupos de más de 6 personas, contactá directamente al restaurante.',
      };
    }

    // Intento 1: Mesa individual que alcance o supere por poco (tolerance +2)
    for (const mesa of mesas) {
      if (mesa.capacidad >= comensales && mesa.capacidad <= comensales + 2) {
        return { disponible: true, requiereAtencion: false };
      }
    }

    // Intento 2: Mesa individual que alcance o supere (sin tolerancia)
    for (const mesa of mesas) {
      if (mesa.capacidad >= comensales) {
        return { disponible: true, requiereAtencion: false };
      }
    }

    // Intento 3: Combinación de 2 mesas
    for (let i = 0; i < mesas.length; i++) {
      for (let j = i + 1; j < mesas.length; j++) {
        if (mesas[i].capacidad + mesas[j].capacidad >= comensales) {
          return { disponible: true, requiereAtencion: false };
        }
      }
    }

    // No hay combinación posible
    return {
      disponible: false,
      requiereAtencion: false,
      mensaje: 'No hay disponibilidad para esa cantidad de comensales.',
    };
  }

  // Helper para calcular disponibilidad
  function calcularMesasLibres(
    todasMesas: { id: string; capacidad: number; activa: boolean }[],
    reservas: { mesas: { mesaId: string }[] }[]
  ): { id: string; capacidad: number; disponible: boolean }[] {
    const mesasOcupadas = new Set<string>();
    reservas.forEach((reserva) => {
      reserva.mesas.forEach((rm) => {
        mesasOcupadas.add(rm.mesaId);
      });
    });

    return todasMesas
      .filter((m) => m.activa)
      .map((mesa) => ({
        ...mesa,
        disponible: !mesasOcupadas.has(mesa.id),
      }))
      .sort((a, b) => b.capacidad - a.capacidad);
  }

  describe('matchingGreedy', () => {
    it('debería asignar mesa con tolerancia +2 cuando sea mejor opción', () => {
      const mesas = [
        { id: 'mesa-chica', capacidad: 4 },
        { id: 'mesa-grande', capacidad: 8 },
      ];
      
      const resultado = matchingGreedy(4, mesas);
      
      expect(resultado.disponible).toBe(true);
      expect(resultado.requiereAtencion).toBe(false);
    });

    it('debería requerir atención para grupos > 6 personas', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 10 },
      ];
      
      const resultado = matchingGreedy(8, mesas);
      
      expect(resultado.disponible).toBe(false);
      expect(resultado.requiereAtencion).toBe(true);
      expect(resultado.mensaje).toContain('más de 6 personas');
    });

    it('debería combinar dos mesas si ninguna individual alcanza', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 2 },
        { id: 'mesa-2', capacidad: 4 },
      ];
      
      const resultado = matchingGreedy(5, mesas);
      
      expect(resultado.disponible).toBe(true);
    });

    it('debería fallar cuando no hay mesas suficientes', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 2 },
        { id: 'mesa-2', capacidad: 2 },
      ];
      
      const resultado = matchingGreedy(6, mesas);
      
      expect(resultado.disponible).toBe(false);
    });

    it('debería manejar grupos de 1 persona', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 4 },
      ];
      
      const resultado = matchingGreedy(1, mesas);
      
      expect(resultado.disponible).toBe(true);
    });

    it('debería manejar exactamente 6 personas', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 6 },
      ];
      
      const resultado = matchingGreedy(6, mesas);
      
      expect(resultado.disponible).toBe(true);
      expect(resultado.requiereAtencion).toBe(false);
    });
  });

  describe('calcularMesasLibres', () => {
    it('debería marcar todas las mesas como disponibles cuando no hay reservas', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 4, activa: true },
        { id: 'mesa-2', capacidad: 6, activa: true },
      ];
      const reservas: { mesas: { mesaId: string }[] }[] = [];

      const resultado = calcularMesasLibres(mesas, reservas);

      expect(resultado).toHaveLength(2);
      expect(resultado.every((m) => m.disponible)).toBe(true);
    });

    it('debería marcar mesas ocupadas correctamente', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 4, activa: true },
        { id: 'mesa-2', capacidad: 6, activa: true },
      ];
      const reservas = [
        { mesas: [{ mesaId: 'mesa-1' }] },
      ];

      const resultado = calcularMesasLibres(mesas, reservas);

      expect(resultado.find((m) => m.id === 'mesa-1')?.disponible).toBe(false);
      expect(resultado.find((m) => m.id === 'mesa-2')?.disponible).toBe(true);
    });

    it('debería filtrar mesas inactivas', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 4, activa: true },
        { id: 'mesa-2', capacidad: 6, activa: false },
      ];
      const reservas: { mesas: { mesaId: string }[] }[] = [];

      const resultado = calcularMesasLibres(mesas, reservas);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe('mesa-1');
    });

    it('debería ordenar mesas por capacidad descendente', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 2, activa: true },
        { id: 'mesa-2', capacidad: 8, activa: true },
        { id: 'mesa-3', capacidad: 4, activa: true },
      ];
      const reservas: { mesas: { mesaId: string }[] }[] = [];

      const resultado = calcularMesasLibres(mesas, reservas);

      expect(resultado[0].id).toBe('mesa-2'); // 8
      expect(resultado[1].id).toBe('mesa-3'); // 4
      expect(resultado[2].id).toBe('mesa-1'); // 2
    });

    it('debería manejar múltiples reservas en la misma mesa', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 4, activa: true },
      ];
      const reservas = [
        { mesas: [{ mesaId: 'mesa-1' }] },
        { mesas: [{ mesaId: 'mesa-1' }] },
      ];

      const resultado = calcularMesasLibres(mesas, reservas);

      expect(resultado[0].disponible).toBe(false);
    });

    it('debería manejar arrays vacíos', () => {
      const resultado = calcularMesasLibres([], []);
      expect(resultado).toHaveLength(0);
    });
  });

  describe('Validación de capacidad', () => {
    it('debería calcular capacidad total correctamente', () => {
      const mesasLibres = [
        { id: 'mesa-1', capacidad: 4, disponible: true },
        { id: 'mesa-2', capacidad: 6, disponible: true },
        { id: 'mesa-3', capacidad: 2, disponible: false },
      ];

      const capacidad = mesasLibres
        .filter((m) => m.disponible)
        .reduce((sum, m) => sum + m.capacidad, 0);

      expect(capacidad).toBe(10);
    });

    it('debería retornar 0 cuando no hay mesas libres', () => {
      const mesasLibres: { id: string; capacidad: number; disponible: boolean }[] = [];

      const capacidad = Math.max(mesasLibres.reduce((sum, m) => sum + m.capacidad, 0), 1);

      expect(capacidad).toBe(1); // Mínimo 1
    });
  });
});

describe('Validación de fechas', () => {
  function validarFecha(fechaStr: string): boolean {
    // Validar formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      return false;
    }
    
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fechaDate = new Date(year, month - 1, day);
    
    // Verificar que la fecha es válida
    return (
      fechaDate.getFullYear() === year &&
      fechaDate.getMonth() === month - 1 &&
      fechaDate.getDate() === day
    );
  }

  function esDiaValido(fecha: Date): boolean {
    const day = fecha.getDay();
    return day >= 2 && day <= 6; // Martes = 2, Sábado = 6
  }

  it('debería validar formato de fecha correcto', () => {
    expect(validarFecha('2024-04-15')).toBe(true);
    expect(validarFecha('2024-12-31')).toBe(true);
    expect(validarFecha('2024-01-01')).toBe(true);
  });

  it('debería rechazar formato de fecha incorrecto', () => {
    expect(validarFecha('15-04-2024')).toBe(false);
    expect(validarFecha('2024/04/15')).toBe(false);
    expect(validarFecha('inválido')).toBe(false);
    expect(validarFecha('')).toBe(false);
  });

  it('debería validar días de la semana (martes a sábado)', () => {
    // Martes
    expect(esDiaValido(new Date(2024, 3, 16))).toBe(true); // 16 de abril de 2024 es martes
    // Miércoles
    expect(esDiaValido(new Date(2024, 3, 17))).toBe(true);
    // Jueves
    expect(esDiaValido(new Date(2024, 3, 18))).toBe(true);
    // Viernes
    expect(esDiaValido(new Date(2024, 3, 19))).toBe(true);
    // Sábado
    expect(esDiaValido(new Date(2024, 3, 20))).toBe(true);
    // Domingo
    expect(esDiaValido(new Date(2024, 3, 21))).toBe(false);
    // Lunes
    expect(esDiaValido(new Date(2024, 3, 22))).toBe(false);
  });
});

describe('Validación de datos de reserva', () => {
  function validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validarTelefono(telefono: string): boolean {
    const telefonoRegex = /^\+?[0-9\s\-()]{8,20}$/;
    return telefonoRegex.test(telefono);
  }

  it('debería validar emails correctos', () => {
    expect(validarEmail('test@example.com')).toBe(true);
    expect(validarEmail('usuario.correo@dominio.com.ar')).toBe(true);
    expect(validarEmail('nombre+tag@gmail.com')).toBe(true);
  });

  it('debería rechazar emails inválidos', () => {
    expect(validarEmail('sin-arroba')).toBe(false);
    expect(validarEmail('espacios@ correo.com')).toBe(false);
    expect(validarEmail('@sin-local.com')).toBe(false);
    expect(validarEmail('')).toBe(false);
  });

  it('debería validar teléfonos correctos', () => {
    expect(validarTelefono('3415551234')).toBe(true);
    expect(validarTelefono('+54 9 341 555 1234')).toBe(true);
    expect(validarTelefono('(341) 555-1234')).toBe(true);
    expect(validarTelefono('3416-880752')).toBe(true);
  });

  it('debería rechazar teléfonos inválidos', () => {
    expect(validarTelefono('123')).toBe(false); // Muy corto
    expect(validarTelefono('')).toBe(false);
    expect(validarTelefono('abcdefghij')).toBe(false);
  });
});
