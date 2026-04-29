import { prisma } from './prisma';
import { MesaEstado } from '@prisma/client';

export interface ValidationResult {
  processed: number;
  markedForReview: number;
  errors: string[];
}

/**
 * TableValidationService handles the synchronization between 
 * Global Configuration and Physical Table definitions.
 */
export class TableValidationService {
  /**
   * Validates all tables against the current global capacity limit.
   * Tables exceeding the limit are marked as PENDING_REVIEW.
   */
  async validateAllTables(): Promise<ValidationResult> {
    try {
      const config = await prisma.configuracion.findUnique({
        where: { id: 'global' },
      });

      if (!config) {
        throw new Error('Global configuration not found');
      }

      const maxCapacity = config.maxTableCapacity;
      
      const tablesToReview = await prisma.mesa.findMany({
        where: {
          capacidad: {
            gt: maxCapacity,
          },
          estado: {
            not: MesaEstado.PENDING_REVIEW,
          },
        },
      });

      const markedCount = tablesToReview.length;

      if (markedCount > 0) {
        await prisma.mesa.updateMany({
          where: {
            id: {
              in: tablesToReview.map((t) => t.id),
            },
          },
          data: {
            estado: MesaEstado.PENDING_REVIEW,
          },
        });
      }

      return {
        processed: await prisma.mesa.count(),
        markedForReview: markedCount,
        errors: [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during validation';
      return {
        processed: 0,
        markedForReview: 0,
        errors: [message],
      };
    }
  }

  /**
   * Validates a single table capacity during creation or update.
   * @throws Error if capacity exceeds global limit.
   */
  async validateTableCapacity(capacidad: number): Promise<void> {
    const config = await prisma.configuracion.findUnique({
      where: { id: 'global' },
    });

    if (!config) {
      throw new Error('Global configuration not found');
    }

    if (capacidad > config.maxTableCapacity) {
      throw new Error(`Table capacity ${capacidad} exceeds the maximum allowed capacity of ${config.maxTableCapacity}`);
    }
  }
}

export const tableValidationService = new TableValidationService();
