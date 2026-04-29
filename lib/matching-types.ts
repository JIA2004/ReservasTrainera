import { Mesa } from '@prisma/client';

export interface MatchingResult {
  disponible: boolean;
  requiereAtencion: boolean;
  mesasAsignadas?: Mesa[];
  mensaje?: string;
  wastedSpace: number; // Total Capacity - Group Size
}

export interface MatchingRequest {
  groupSize: number;
  fecha: Date;
  hora: string;
}

export interface ContiguityGraph {
  [mesaId: string]: string[]; // Mesa ID -> Array of neighbor Mesa IDs
}
