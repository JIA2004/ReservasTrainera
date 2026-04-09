# SPEC.md - Sistema de Reservas Trainera

## 1. Overview

**Proyecto:** Sistema de Reservas Trainera  
**Cliente:** Restaurant Trainera (Rosario, Argentina)  
**Problema:** Gestión de reservas con capacidad real de mesas (sustituto de Google Calendar improvisado)  
**Usuarios:** Comensales (reservas), Dueño/Admin (gestión)  
**Stack:** Next.js 14, PostgreSQL (Vercel Postgres), Prisma, Resend, Tailwind

---

## 2. Funcionalidad Core

### 2.1 Página Pública de Reserva (`/reservar`)

**Flujo:**
1. Comensal selecciona fecha (calendario, mismo día hasta 30 días adelante)
2. Comensal selecciona hora (dropdown de slots disponibles: 19:00 a 23:00, cada 30min)
3. Sistema muestra disponibilidad real basada en matching de mesas
4. Comensal completa: nombre, apellido, email, teléfono, cantidad de comensales
5. Submit → Validación → Confirmación

**Validaciones:**
- Fecha válida (entre hoy y +30 días)
- Horario dentro de 19:00-23:00
- Slots con disponibilidad (matching de mesas)
- Campos requeridos con formato correcto
- Email y teléfono con formato válido

**Texto de confirmación:**
> "Muchas gracias por tu reserva! Te comentamos que tenemos una tolerancia de 10 min. al horario de reserva. Te estaremos esperando con gusto! Mientras tanto, podés conocer nuestra carta ingresando a taberna.trainera.com.ar"

---

### 2.2 Sistema de Matching de Mesas

**Modelo de datos:**
```typescript
Mesa {
  id: string
  nombre: string // "Mesa 1", "Barra A"
  capacidad: number // 2, 4, 6
  tipo: 'MESA' | 'BARRA'
  activa: boolean
}

Configuracion {
  capacidadTotalMaxima: number // 50 (para desarrollo)
  horariosReservas: string[] // ["19:00","19:30","20:00"...]
  diasAntelacionMin: 0
  diasAntelacionMax: 30
  toleranciaMinutos: 10
}
```

**Algoritmo de matching (disponible en `/api/disponibilidad`):**
```
1. Obtener todas las mesas activas ordenadas por capacidad DESC
2. Para cada reserva existente en esa fecha+hora, marcar mesas como "ocupadas"
3. Dada la cantidad de comensalesRequested:
   a. Si existe una mesa con capacidad >= comensalesRequested Y capacidad <= comensalesRequested + 2: USAR ESA MESA
   b. Si no: Buscar combinación de 2 mesas cuya suma >= comensalesRequested
   c. Si comensales > 6 Y no hay mesa individual: MARCAR COMO "REQUIERE_ATENCION_ADMIN"
4. Retornar: { disponible: boolean, mesasSugeridas: Mesa[], requiereAtencion: boolean }
```

**Casos especiales:**
- **3 comensales → mesa de 4**: OK automático
- **3 comensales → mesa de 6 disponible**: OK, sugiere la mesa de 6
- **7 comensales**: Requiere atención admin (juntar mesas)
- **Reserva para barra**: Solo si hay lugares en barra disponibles

---

### 2.3 Notificaciones por Email (Resend)

**Trigger 1: Confirmación al cliente**
- **Quién recibe:** Cliente (email ingresado)
- **Timing:** Inmediato tras confirmación
- **Contenido:** Detalles de la reserva + mensaje de Trainera

**Trigger 2: Notificación al dueño**
- **Quién recibe:** owner@trainera.com.ar (configurable)
- **Timing:** Inmediato tras confirmación
- **Contenido:** Nueva reserva con todos los detalles

**Trigger 3: Recordatorio 2hs antes**
- **Quién recibe:** Cliente
- **Timing:** 2 horas antes de la reserva (cron job / Vercel Cron)
- **Contenido:** "Tu reserva es en 2 horas" + botones:
  - **[Confirmado, ahí voy]** (no hace nada, solo tracking)
  - **[Reprogramar]** → Link a página de reprogramación
  - **[Cancelar]** → Cancela inmediatamente con token

**Trigger 4: Confirmación de cancelación**
- **Quién recibe:** Cliente
- **Timing:** Inmediato tras cancelación
- **Contenido:** "Tu reserva ha sido cancelada"

**Trigger 5: Notificación de cancelación al dueño**
- **Quién recibe:** Dueño
- **Contenido:** "Una reserva fue cancelada" + detalles

---

### 2.4 Cancelación y Reprogramación

**Token de seguridad:**
- Cada reserva tiene un `cancelToken` (UUID v4) generado al crearse
- Link de cancelación: `/cancelar/[token]`
- Link de reprogramación: `/reprogramar/[token]`

**Cancelación directa (Opción A):**
```
GET /cancelar/[token]
→ Muestra página de confirmación visual: "¿Confirmás cancelar?"
→ Click "Sí, cancelar" → POST /api/reservas/[id]/cancelar
→ Reserva pasa a estado CANCELADA
→ Se liberan las mesas asignadas
→ Se envía email de cancelación al cliente
→ Se envía notificación de cancelación al dueño
```

**Reprogramación:**
```
GET /reprogramar/[token]
→ Muestra formulario con fecha/hora actual pre-seleccionados
→ Cliente selecciona nueva fecha/hora
→ Sistema valida disponibilidad (mismo algoritmo de matching)
→ Si OK: UPDATE reserva + nuevo cancelToken
→ Se envía email de confirmación actualizado al cliente
→ Se envía notificación de cambio al dueño
```

---

### 2.5 Admin Dashboard (`/admin`)

**Autenticación:**
- Password simple en variable de entorno (env: `ADMIN_PASSWORD`)
- Cookie de sesión (httpOnly, secure)
- Middleware que redirige a `/admin/login` si no está autenticado

**Vista: Calendario (`/admin`)**

```
┌─────────────────────────────────────────────────────────────────┐
│  Trainera Admin                            [Cerrar sesión]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ◄   Abril 2026   ►                                            │
│                                                                 │
│  Do Lu Ma Mi Ju Vi Sá                                          │
│           1  2  3  4                                            │
│  [5]  6  7 [8] 9 10 11  ← Números con reservas tienen borde  │
│  12 13 14 15 16 17 18                                          │
│  ...                                                            │
│                                                                 │
│  Leyenda: ● 1-5 reservas  ●● 6-10  ●●● 11+                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Vista: Día específico (click en fecha)**

```
┌─────────────────────────────────────────────────────────────────┐
│  ◄ Volver al calendario     Martes 8 de Abril, 2026            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RESUMEN DEL DÍA                                               │
│  ┌─────────────┬─────────────┬─────────────┐                   │
│  │ 12 reservas │ 38 comensales│ $0 ingresos │                   │
│  └─────────────┴─────────────┴─────────────┘                   │
│                                                                 │
│  19:00 ─────────────────────────────────────────               │
│  ├─ Mesa 1 (4p) - Juan Pérez - 2p - CONFIRMADA                 │
│  ├─ Barra A (2p) - María García - 1p - PENDIENTE              │
│                                                                 │
│  19:30 ─────────────────────────────────────────               │
│  ├─ Mesa 3 (4p) - Carlos López - 4p - CONFIRMADA               │
│  └─ Mesa 5+6 (6p) - Ana Martínez - 6p - ⚠️ REQUIERE ATENCIÓN   │
│                                                                 │
│  20:00 ─────────────────────────────────────────               │
│  ...                                                            │
│                                                                 │
│  [+ Nueva Reserva Manual]                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Vista: Configuración (`/admin/config`)**

```
┌─────────────────────────────────────────────────────────────────┐
│  Configuración                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HORARIOS                                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Horarios de reserva (30min interval):                      │  │
│  │ ☑ 19:00  ☑ 19:30  ☑ 20:00  ☑ 20:30  ☑ 21:00              │  │
│  │ ☑ 21:30  ☑ 22:00  ☐ 22:30  ☐ 23:00                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  CAPACIDAD                                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Tolerancia de llegada: [ 10 ] minutos                     │  │
│  │ Días de anticipación máxima: [ 30 ] días                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  MESAS                                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Mesa 1  │ Capacidad: 4 │ Tipo: MESA │ ☑ Activa   │ [✏️] │  │
│  │ Mesa 2  │ Capacidad: 4 │ Tipo: MESA │ ☑ Activa   │ [✏️] │  │
│  │ Mesa 3  │ Capacidad: 6 │ Tipo: MESA │ ☑ Activa   │ [✏️] │  │
│  │ Barra A │ Capacidad: 6 │ Tipo: BARRA│ ☑ Activa   │ [✏️] │  │
│  │                                                         │  │
│  │ [+ Agregar Mesa]                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  NOTIFICACIONES                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Email del dueño: [trainera@email.com]                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [ Guardar Cambios ]                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.6 Estados de Reserva

```typescript
enum ReservaEstado {
  PENDIENTE = 'PENDIENTE',      // Reservada, no confirmada
  CONFIRMADA = 'CONFIRMADA',   // Confirmada por el admin
  CANCELADA = 'CANCELADA',     // Cancelada por cliente o admin
  COMPLETADA = 'COMPLETADA',   // Ya se presentó
  NO_ASISTIO = 'NO_ASISTIO',   // No se presentó
  REQUIERE_ATENCION = 'REQUIERE_ATENCION' // Comensales > capacidad mesa
}
```

---

## 3. Rutas y Endpoints

### Páginas públicas
| Ruta | Descripción |
|------|-------------|
| `/` | Landing page con CTA "Reservar" |
| `/reservar` | Formulario de reserva |
| `/confirmacion/[id]` | Página de confirmación post-reserva |
| `/cancelar/[token]` | Página de cancelación |
| `/reprogramar/[token]` | Página de reprogramación |

### Admin
| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Login del admin |
| `/admin` | Dashboard con calendario |
| `/admin/reservas/[fecha]` | Detalle de día |
| `/admin/config` | Configuración de mesas/horarios |
| `/admin/reservas/[id]/editar` | Editar reserva específica |

### API Routes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/disponibilidad?fecha=YYYY-MM-DD` | Slots disponibles con matching |
| `POST` | `/api/reservas` | Crear nueva reserva |
| `GET` | `/api/reservas/[id]` | Detalle de reserva |
| `POST` | `/api/reservas/[token]/cancelar` | Cancelar con token |
| `POST` | `/api/reservas/[token]/reprogramar` | Reprogramar con token |
| `GET` | `/api/admin/reservas` | Lista reservas (auth required) |
| `PATCH` | `/api/admin/reservas/[id]` | Actualizar estado reserva |
| `GET` | `/api/admin/config` | Obtener configuración |
| `PATCH` | `/api/admin/config` | Actualizar configuración |
| `GET` | `/api/admin/mesas` | Listar mesas |
| `POST` | `/api/admin/mesas` | Crear mesa |
| `PATCH` | `/api/admin/mesas/[id]` | Editar mesa |
| `DELETE` | `/api/admin/mesas/[id]` | Eliminar mesa |

### Cron Jobs (Vercel Cron)
| Schedule | Descripción |
|----------|-------------|
| `*/15 * * * *` | Enviar recordatorios 2hs antes de reservas |

---

## 4. Modelo de Datos (Prisma)

```prisma
model Mesa {
  id        String   @id @default(cuid())
  nombre    String
  capacidad Int
  tipo      MesaTipo @default(MESA)
  activa    Boolean  @default(true)
  reservas  ReservaMesa[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum MesaTipo {
  MESA
  BARRA
}

model Reserva {
  id           String        @id @default(cuid())
  nombre       String
  apellido     String
  email        String
  telefono     String
  fecha        DateTime      @db.Date
  hora         String        // "19:00", "19:30", etc.
  comensales   Int
  estado       ReservaEstado @default(PENDIENTE)
  cancelToken  String        @unique @default(uuid())
  recordatorioEnviado Boolean @default(false)
  mesas        ReservaMesa[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

enum ReservaEstado {
  PENDIENTE
  CONFIRMADA
  CANCELADA
  COMPLETADA
  NO_ASISTIO
  REQUIERE_ATENCION
}

model ReservaMesa {
  reserva   Reserva @relation(fields: [reservaId], references: [id])
  reservaId String
  mesa      Mesa    @relation(fields: [mesaId], references: [id])
  mesaId    String
  @@id([reservaId, mesaId])
}

model Configuracion {
  id                    String @id @default("global")
  emailDueno             String
  toleranciaMinutos      Int    @default(10)
  diasAntelacionMin      Int    @default(0)
  diasAntelacionMax      Int    @default(30)
  horariosReservas       String @default("19:00,19:30,20:00,20:30,21:00,21:30,22:00,22:30")
}
```

---

## 5. Emails (Templates Resend)

### Email: Confirmación al cliente
```
Subject: Tu reserva en Trainera está confirmada 📅

[Logo Trainera]

¡Hola {nombre}!

Tu reserva ha sido confirmada:

📅 {fecha} a las {hora}
👥 {comensales} comensales
📍 Trainera

{textoConfirmacion}

Te esperamos!

--
Trainera - Cocina Vasca
taberna.trainera.com.ar
```

### Email: Recordatorio 2hs antes
```
Subject: Tu reserva en Trainera es en 2 horas ⏰

[Logo Trainera]

¡Hola {nombre}!

Recordamos que tenés una reserva en:

📅 {fecha} a las {hora}
👥 {comensales} comensales

¿Todo bien con tu asistencia?

[ Confirmado, ahí voy ]  [ Reprogramar ]  [ Cancelar reserva ]

¡Te esperamos!
```

### Email: Notificación al dueño
```
Subject: Nueva reserva - {nombre} {apellido} ({comensales}p)

Se realizó una nueva reserva:

👤 {nombre} {apellido}
📧 {email}
📱 {telefono}
📅 {fecha} a las {hora}
👥 {comensales} comensales
🪑 Mesas asignadas: {mesas}

[Ver en admin →
```

---

## 6. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| Double booking | Transaction con row-level locking previene race conditions |
| Cliente tenta cancelar fuera de horario | Puede cancelar hasta 1hs antes |
| Todas las mesas llenas | Retorna `disponibles: 0` para ese slot |
| Mesa offline (desactivada) | No se muestra en matching, libera sus reservas |
| Email inválido | Validación en frontend + backend, se rechaza |
| Reservas muy separadas | Sistema de matching puede asignar mesa de 4 a 1 persona |

---

## 7. Criterios de Aceptación

- [ ] Comensal puede reservar sin registro en menos de 60 segundos
- [ ] Sistema no permite double-booking (validado con load test)
- [ ] Admin ve calendario con reservas en menos de 2 clicks
- [ ] Email de confirmación llega en menos de 30 segundos
- [ ] Recordatorio 2hs antes se envía automáticamente
- [ ] Cancelación/reprogramación funciona con link mágico
- [ ] Responsive mobile-first
- [ ] Lighthouse score > 90 en Performance
