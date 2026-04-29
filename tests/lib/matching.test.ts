import { describe, it, expect } from 'vitest';
import { matchingRecursive } from '../../lib/matching';
import { Mesa } from '@prisma/client';
import { ContiguityGraph } from '../../lib/matching-types';

// Helper to create a mock Mesa
const createMesa = (id: string, capacidad: number): Mesa => ({
  id,
  capacidad,
  activa: true,
  estado: 'AVAILABLE',
  } as unknown as Mesa);

describe('matchingRecursive', () => {
  it('should assign the smallest possible table for small groups (1-2 people)', () => {
    const mesas = [
      createMesa('T1', 2),
      createMesa('T2', 4),
      createMesa('T3', 6),
    ];
    const graph: ContiguityGraph = {}; 
    
    const result = matchingRecursive(1, mesas, graph);
    
    expect(result.disponible).toBe(true);
    expect(result.mesasAsignadas).toHaveLength(1);
    expect(result.mesasAsignadas?.[0].id).toBe('T1');
    expect(result.wastedSpace).toBe(1);
  });

  it('should find optimal combination for medium groups (3-6 people)', () => {
    const mesas = [
      createMesa('T1', 2),
      createMesa('T2', 2),
      createMesa('T3', 2),
    ];
    const graph: ContiguityGraph = {
      'T1': ['T2'],
      'T2': ['T1', 'T3'],
      'T3': ['T2'],
    };
    
    // Group size 5 needs all 3 tables (total 6)
    const result = matchingRecursive(5, mesas, graph);
    
    expect(result.disponible).toBe(true);
    expect(result.mesasAsignadas).toHaveLength(3);
    expect(result.wastedSpace).toBe(1);
  });

  it('should find optimal combination for large groups (> 6 people)', () => {
    const mesas = [
      createMesa('T1', 4),
      createMesa('T2', 4),
      createMesa('T3', 4),
      createMesa('T4', 4),
    ];
    const graph: ContiguityGraph = {
      'T1': ['T2'],
      'T2': ['T1', 'T3'],
      'T3': ['T2', 'T4'],
      'T4': ['T3'],
    };
    
    // Group size 10 needs 3 tables (total 12)
    const result = matchingRecursive(10, mesas, graph);
    
    expect(result.disponible).toBe(true);
    expect(result.mesasAsignadas).toHaveLength(3);
    expect(result.wastedSpace).toBe(2);
  });

  it('should prioritize combination with least wasted space', () => {
    const mesas = [
      createMesa('T1', 4),
      createMesa('T2', 4),
      createMesa('T3', 4),
      createMesa('T4', 2),
    ];
    const graph: ContiguityGraph = {
      'T1': ['T2'], // Combo A: T1+T2 = 8
      'T2': ['T1'],
      'T3': ['T4'], // Combo B: T3+T4 = 6
      'T4': ['T3'],
    };
    
    // Group size 6.
    // Combo A: 8 - 6 = 2 wasted
    // Combo B: 6 - 6 = 0 wasted
    const result = matchingRecursive(6, mesas, graph);
    
    expect(result.disponible).toBe(true);
    expect(result.mesasAsignadas).toContainEqual(expect.objectContaining({ id: 'T3' }));
    expect(result.mesasAsignadas).toContainEqual(expect.objectContaining({ id: 'T4' }));
    expect(result.wastedSpace).toBe(0);
  });

  it('should prioritize a single larger table over a combination if wasted space is lower or equal', () => {
    const mesas = [
      createMesa('T1', 4),
      createMesa('T2', 2),
      createMesa('T3', 2),
    ];
    const graph: ContiguityGraph = {
      'T2': ['T3'],
      'T3': ['T2'],
    };
    
    // Group size 4.
    const result = matchingRecursive(4, mesas, graph);
    
    expect(result.disponible).toBe(true);
    expect(result.wastedSpace).toBe(0);
  });

  it('should only combine contiguous tables', () => {
    const mesas = [
      createMesa('T1', 4),
      createMesa('T2', 4),
    ];
    const nonEmptyGraph: ContiguityGraph = {
      'T1': [],
      'T2': [],
    };
    
    const result = matchingRecursive(6, mesas, nonEmptyGraph);
    
    expect(result.disponible).toBe(false);
  });

  it('should return unavailable when no tables are provided', () => {
    const mesas: Mesa[] = [];
    const graph: ContiguityGraph = {};
    
    const result = matchingRecursive(2, mesas, graph);
    
    expect(result.disponible).toBe(false);
    expect(result.wastedSpace).toBe(Infinity);
  });

  it('should return unavailable when capacity exists but no contiguous combination is large enough', () => {
    const mesas = [
      createMesa('T1', 2),
      createMesa('T2', 2),
      createMesa('T3', 2),
    ];
    const graph: ContiguityGraph = {
      'T1': ['T2'],
      'T2': ['T1'],
      'T3': [], 
    };
    
    const result = matchingRecursive(5, mesas, graph);
    
    expect(result.disponible).toBe(false);
  });

  it('should return unavailable when group is larger than total capacity', () => {
    const mesas = [
      createMesa('T1', 2),
      createMesa('T2', 2),
    ];
    const graph: ContiguityGraph = {
      'T1': ['T2'],
      'T2': ['T1'],
    };
    
    const result = matchingRecursive(10, mesas, graph);
    
    expect(result.disponible).toBe(false);
  });
});
