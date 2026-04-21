# AUDITORÍA DE SEGURIDAD - PLAN DE ACCIÓN

## Estado: 🔴 EN PROGRESO (Fase 1)

---

## FASE 1: SEGURIDAD - URGENTE ✅ PARCIALMENTE COMPLETADO

### Completado:
- [x] Creado `lib/admin-auth.ts` con funciones helper
- [x] `app/api/admin/mesas/route.ts` - auth agregado
- [x] `app/api/admin/mesas/[id]/route.ts` - auth agregado
- [x] `app/api/admin/reservas/[id]/confirmar/route.ts` - auth agregado

### Pendiente:

#### 1.1 APIs de Admin - AGREGAR AUTH
| Archivo | Estado |
|---------|--------|
| `app/api/admin/reservas/route.ts` | ⬜ PENDIENTE |
| `app/api/admin/reservas/[id]/route.ts` | ⬜ PENDIENTE |
| `app/api/admin/reservas/[id]/mesas/route.ts` | ⬜ PENDIENTE |
| `app/api/admin/reservas/by-fecha/route.ts` | ⬜ PENDIENTE |
| `app/api/admin/config/route.ts` | ⬜ PENDIENTE |

#### 1.2 IDOR - Fix Cancelar/Reprogramar
| Archivo | Estado |
|---------|--------|
| `app/api/reservas/[id]/cancelar/route.ts` | ⬜ PENDIENTE - Agregar verificación de cancelToken |
| `app/api/reservas/[id]/reprogramar/route.ts` | ⬜ PENDIENTE - Agregar verificación de cancelToken |
| `app/api/admin/reservas/[id]/cancelar/route.ts` | ✅ COMPLETADO |

#### 1.3 Session Token - MEJORAR
| Tarea | Estado |
|-------|--------|
| Agregar HttpOnly cookies | ⬜ PENDIENTE |
| Usar signed/encrypted cookies | ⬜ PENDIENTE |

---

## FASE 2: LÓGICA - INTEGRIDAD DE DATOS

### 2.1 Race Condition - TRANSACTIONS
- [ ] `app/api/reservas/route.ts` - Wrappear en `prisma.$transaction()`

### 2.2 Bugs Varios
- [ ] `app/api/disponibilidad/route.ts:158` - Fix Math.max bug
- [ ] `app/api/cron/recordatorios/route.ts` - Fix timezone

### 2.3 Validación de Estados
- [ ] Agregar transición de estados server-side

---

## FASE 3: TESTS

### 3.1 Tests Existentes
- ✅ `tests/api/reservas.test.ts`
- ✅ `tests/lib/matching.test.ts`

### 3.2 Tests Faltantes
- [ ] Tests de concurrencia
- [ ] Tests de autenticación  
- [ ] Tests E2E con Playwright

---

## VULNERABILIDADES ENCONTRADAS

### CRÍTICO #1: APIs de Admin Sin Auth
### CRÍTICO #2: Confirmar/Cancelar Sin Auth
### CRÍTICO #3: IDOR en Cancelar/Reprogramar
### CRÍTICO #4: Session Token Expuesto
### MEDIO #5: Fallback sin validación

---

## ERRORES LÓGICOS

### CRÍTICO #1: Race Condition en Matching
### CRÍTICO #2: Bug Math.max en Disponibilidad
### CRÍTICO #3: Bug Timezone en Cron
### MEDIO #4: Validación de Estados Débil

---

*Plan creado: 2026-04-21*
*Para continuar: Ejecutar las tareas pendientes de Fase 1*
