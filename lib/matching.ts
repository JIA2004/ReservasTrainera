import { PrismaClient, Mesa, ReservaEstado } from '@prisma/client';
import { MatchingResult, ContiguityGraph } from './matching-types';

type PrismaClientOrTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

interface MesaConDisponibilidad extends Mesa {
  disponible: boolean;
}

interface SlotDisponibilidad {
  hora: string;
  disponibles: number;
  puedeReservar: boolean;
  requiereAtencion: boolean;
}

/**
 * Obtiene las mesas disponibles para una fecha y hora específica
 */
export async function obtenerMesasDisponibles(
  prisma: PrismaClientOrTransaction,
  fecha: Date,
  hora: string
): Promise<MesaConDisponibilidad[]> {
  const todasMesas = await prisma.mesa.findMany({
    where: { activa: true },
    orderBy: { capacidad: 'desc' },
  });

  const reservasExistentes = await prisma.reserva.findMany({
    where: {
      fecha: fecha,
      hora: hora,
      estado: { notIn: [ReservaEstado.CANCELADA] },
    },
    include: {
      mesas: {
        include: { mesa: true },
      },
    },
  });

  const mesasOcupadas = new Set<string>();
  reservasExistentes.forEach((reserva) => {
    reserva.mesas.forEach((rm) => {
      mesasOcupadas.add(rm.mesaId);
    });
  });

  return todasMesas.map((mesa) => ({
    ...mesa,
    disponible: !mesasOcupadas.has(mesa.id),
  }));
}

/**
 * Obtiene el grafo de contigüidad de las mesas
 */
export async function obtenerGrafoContigüidad(
  prisma: PrismaClientOrTransaction
): Promise<ContiguityGraph> {
  const relaciones = await (prisma as any).mesaVecina.findMany();
  const grafo: ContiguityGraph = {};

  relaciones.forEach(({ mesaAId, mesaBId }: { mesaAId: string; mesaBId: string }) => {
    if (!grafo[mesaAId]) grafo[mesaAId] = [];
    if (!grafo[mesaBId]) grafo[mesaBId] = [];
    grafo[mesaAId].push(mesaBId);
    grafo[mesaBId].push(mesaAId);
  });

  return grafo;
}

/**
 * Obtiene la disponibilidad por slot horario para una fecha
 */
export async function obtenerDisponibilidadPorSlot(
  prisma: PrismaClientOrTransaction,
  fecha: Date,
  horarios: string[]
): Promise<SlotDisponibilidad[]> {
  const resultado: SlotDisponibilidad[] = [];

  for (const hora of horarios) {
    const mesas = await obtenerMesasDisponibles(prisma, fecha, hora);
    const disponibles = mesas.filter((m) => m.disponible);

    const capacidadDisponible = disponibles.reduce(
      (sum, m) => sum + m.capacidad,
      0
    );

    resultado.push({
      hora,
      disponibles: capacidadDisponible,
      puedeReservar: capacidadDisponible > 0,
      requiereAtencion: false,
    });
  }

  return resultado;
}

/**
 * Motor de matching recursivo para encontrar la combinación óptima de mesas contiguas
 */
export function matchingRecursive(
  groupSize: number,
  mesas: Mesa[],
  graph: ContiguityGraph
): MatchingResult {
  let bestCombination: Mesa[] | null = null;
  let minWastedSpace = Infinity;

  const availableIds = new Set(mesas.map((m) => m.id));
  const mesaMap = new Map(mesas.map((m) => [m.id, m]));

  // If graph is empty, we treat all available tables as connected (fallback)
  const isGraphEmpty = Object.keys(graph).length === 0;

  function findCombinations(
    currentSet: Mesa[],
    currentCapacity: number,
    visitedIds: Set<string>
  ) {
    if (currentCapacity >= groupSize) {
      const wastedSpace = currentCapacity - groupSize;
      if (wastedSpace < minWastedSpace) {
        minWastedSpace = wastedSpace;
        bestCombination = [...currentSet];
      }
      // Once we meet capacity, adding more tables only increases wastedSpace
      return;
    }

    // Try expanding from any table already in the set
    for (const mesa of currentSet) {
      const neighbors = isGraphEmpty 
        ? mesas.map(m => m.id) 
        : (graph[mesa.id] || []);

      for (const neighborId of neighbors) {
        if (availableIds.has(neighborId) && !visitedIds.has(neighborId)) {
          const neighborMesa = mesaMap.get(neighborId)!;
          
          visitedIds.add(neighborId);
          findCombinations(
            [...currentSet, neighborMesa],
            currentCapacity + neighborMesa.capacidad,
            visitedIds
          );
          visitedIds.delete(neighborId);
        }
      }
    }
  }

  // Start the recursive search from each available table
  for (const mesa of mesas) {
    const visited = new Set<string>([mesa.id]);
    findCombinations([mesa], mesa.capacidad, visited);
  }

  if (bestCombination) {
    return {
      disponible: true,
      requiereAtencion: false,
      mesasAsignadas: bestCombination,
      wastedSpace: minWastedSpace,
    };
  }

  return {
    disponible: false,
    requiereAtencion: false,
    mensaje: 'No hay disponibilidad para esa cantidad de comensales.',
    wastedSpace: Infinity,
  };
}

/**
 * Encuentra las mejores mesas disponibles para una reserva
 */
export async function encontrarMesasDisponibles(
  prisma: PrismaClientOrTransaction,
  fecha: Date,
  hora: string,
  comensales: number
): Promise<MatchingResult> {
  const mesasDisponibles = await obtenerMesasDisponibles(prisma, fecha, hora);
  const mesasLibres = mesasDisponibles.filter((m) => m.disponible).map(m => {
     const { disponible, ...mesa } = m;
     return mesa as Mesa;
  });

  if (mesasDisponibles.length === 0) {
    return {
      disponible: false,
      requiereAtencion: true,
      mensaje: 'El restaurante no tiene mesas configuradas. Contactá al restaurante.',
      wastedSpace: Infinity,
    };
  }

  if (mesasLibres.length === 0) {
    return {
      disponible: false,
      requiereAtencion: true,
      mensaje: 'No hay disponibilidad en este horario. Probá con otro horario.',
      wastedSpace: Infinity,
    };
  }

  const grafo = await obtenerGrafoContigüidad(prisma);
  return matchingRecursive(comensales, mesasLibres, grafo);
}

/**
 * Libera las mesas de una reserva (para cancelaciones)
 */
export async function liberarMesasReserva(
  prisma: PrismaClientOrTransaction,
  reservaId: string
): Promise<void> {
  await prisma.reservaMesa.deleteMany({
    where: { reservaId },
  });
}

export function calcularMesasLibres(
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
