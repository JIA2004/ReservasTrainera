import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchingGreedy, calcularMesasLibres } from '@/lib/matching';
import { validateDate, isDayValid, validateEmail, validatePhone } from '@/app/lib/validations';

// ============================================
// TESTS PARA UTILIDADES DE MATCHING
// (Tests directos sin mock de Prisma complejo)
// ============================================

describe('Matching Logic - Tests Unitarios', () => {
  describe('matchingGreedy', () => {
    it('debería asignar mesa con tolerancia +2 cuando sea mejor opción', () => {
      const mesas = [
        { id: 'mesa-chica', capacidad: 4 },
        { id: 'mesa-grande', capacidad: 8 },
      ];
      
      const resultado = matchingGreedy(4, mesas as any);
      
      expect(resultado.disponible).toBe(true);
      expect(resultado.requiereAtencion).toBe(false);
    });

    it('debería requerir atención para grupos > 6 personas', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 10 },
      ];
      
      const resultado = matchingGreedy(8, mesas as any);
      
      expect(resultado.disponible).toBe(false);
      expect(resultado.requiereAtencion).toBe(true);
      expect(resultado.mensaje).toContain('más de 6 personas');
    });

    it('debería combinar dos mesas si ninguna individual alcanza', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 2 },
        { id: 'mesa-2', capacidad: 4 },
      ];
      
      const resultado = matchingGreedy(5, mesas as any);
      
      expect(resultado.disponible).toBe(true);
    });

    it('debería fallar cuando no hay mesas suficientes', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 2 },
        { id: 'mesa-2', capacidad: 2 },
      ];
      
      const resultado = matchingGreedy(6, mesas as any);
      
      expect(resultado.disponible).toBe(false);
    });

    it('debería manejar grupos de 1 persona', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 4 },
      ];
      
      const resultado = matchingGreedy(1, mesas as any);
      
      expect(resultado.disponible).toBe(true);
    });

    it('debería manejar exactamente 6 personas', () => {
      const mesas = [
        { id: 'mesa-1', capacidad: 6 },
      ];
      
      const resultado = matchingGreedy(6, mesas as any);
      
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

      // Si no hay mesas libres, capacidad debe ser 0 (NO min 1)
      const capacidad = mesasLibres
        .filter((m) => m.disponible)
        .reduce((sum, m) => sum + m.capacidad, 0);

      expect(capacidad).toBe(0); // Correcto: 0 cuando no hay mesas
    });
  });
});

describe('Validación de fechas', () => {
  it('debería validar formato de fecha correcto', () => {
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toISOString().split('T')[0];

    expect(validateDate(fechaHoy).isValid).toBe(true);
    expect(validateDate(fechaManana).isValid).toBe(true);
  });

  it('debería rechazar formato de fecha incorrecto', () => {
    expect(validateDate('15-04-2024').isValid).toBe(false);
    expect(validateDate('2024/04/15').isValid).toBe(false);
    expect(validateDate('inválido').isValid).toBe(false);
    expect(validateDate('').isValid).toBe(false);
  });

  it('debería validar días de la semana (martes a sábado)', () => {
    // Martes
    const martes = new Date();
    while (martes.getDay() !== 2) martes.setDate(martes.getDate() + 1);
    expect(isDayValid(martes)).toBe(true); 
    // Miércoles
    const miercoles = new Date();
    while (miercoles.getDay() !== 3) miercoles.setDate(miercoles.getDate() + 1);
    expect(isDayValid(miercoles)).toBe(true);
    // Jueves
    const jueves = new Date();
    while (jueves.getDay() !== 4) jueves.setDate(jueves.getDate() + 1);
    expect(isDayValid(jueves)).toBe(true);
    // Viernes
    const viernes = new Date();
    while (viernes.getDay() !== 5) viernes.setDate(viernes.getDate() + 1);
    expect(isDayValid(viernes)).toBe(true);
    // Sábado
    const sabado = new Date();
    while (sabado.getDay() !== 6) sabado.setDate(sabado.getDate() + 1);
    expect(isDayValid(sabado)).toBe(true);
    // Domingo
    const domingo = new Date();
    while (domingo.getDay() !== 0) domingo.setDate(domingo.getDate() + 1);
    expect(isDayValid(domingo)).toBe(false);
    // Lunes
    const lunes = new Date();
    while (lunes.getDay() !== 1) lunes.setDate(lunes.getDate() + 1);
    expect(isDayValid(lunes)).toBe(false);
  });
});

describe('Validación de datos de reserva', () => {
  it('debería validar emails correctos', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('usuario.correo@dominio.com.ar')).toBe(true);
    expect(validateEmail('nombre+tag@gmail.com')).toBe(true);
  });

  it('debería rechazar emails inválidos', () => {
    expect(validateEmail('sin-arroba')).toBe(false);
    expect(validateEmail('espacios@ correo.com')).toBe(false);
    expect(validateEmail('@sin-local.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('debería validar teléfonos correctos', () => {
    expect(validatePhone('3415551234')).toBe(true);
    expect(validatePhone('+54 9 341 555 1234')).toBe(true);
    expect(validatePhone('(341) 555-1234')).toBe(true);
    expect(validatePhone('3416-880752')).toBe(true);
  });

  it('debería rechazar teléfonos inválidos', () => {
    expect(validatePhone('123')).toBe(false); // Muy corto
    expect(validatePhone('')).toBe(false);
    expect(validatePhone('abcdefghij')).toBe(false);
  });
});
