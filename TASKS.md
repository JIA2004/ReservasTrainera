# TASKS.md - Sistema de Reservas Trainera

## Resumen de Fases

| Fase | Días | Descripción |
|------|------|-------------|
| 1 | 2 | Setup + Fundamentos |
| 2 | 1.5 | Backend APIs |
| 3 | 2 | Frontend Público |
| 4 | 2 | Admin Dashboard |
| 5 | 0.5 | Emails |
| 6 | 1 | Polish + Deploy |
| **Total** | **9 días** | |

---

## Fase 1: Setup y Fundamentos (2 días)

### 1.1 Inicialización Proyecto
- [ ] Crear proyecto Next.js 14 con TypeScript: `npx create-next-app@latest trainera --typescript --tailwind --app`
- [ ] Instalar dependencias adicionales: prisma, zod, react-hook-form, resend, date-fns, lucide-react
- [ ] Inicializar Prisma: `npx prisma init`
- [ ] Configurar Tailwind con shadcn/ui
- [ ] Agregar imágenes a `public/imgs/` (ya existentes: logoTrainera.jpeg, TraineraCocinaVasca.jpeg)
- [ ] Crear `.env.example` con todas las variables
- [ ] Crear archivo `vercel.json` con configuración de crons

### 1.2 Schema de Base de Datos
- [ ] Definir `prisma/schema.prisma` con todos los modelos (Mesa, Reserva, ReservaMesa, Configuracion)
- [ ] Crear seed con mesas de ejemplo:
  - 10 mesas de 4 personas
  - 5 mesas de 2 personas
  - 1 barra con capacidad 6
- [ ] Crear seed con configuración default (horarios 19:00-23:00, tolerancia 10min)
- [ ] Correr migrations: `npx prisma migrate dev`
- [ ] Conectar base local para desarrollo (usar Docker PostgreSQL o PostgreSQL local)

### 1.3 Libs y Utilities
- [ ] Crear `lib/prisma.ts` (singleton pattern para PrismaClient)
- [ ] Crear `lib/utils.ts` (cn helper con clsx, formatters de fecha)
- [ ] Crear `lib/matching.ts` (algoritmo de asignación de mesas)
- [ ] Crear `lib/email.ts` (client de Resend, funciones de envío)
- [ ] Crear `lib/auth.ts` (utilidades de auth)

### 1.4 shadcn/ui Components
- [ ] Inicializar shadcn/ui: `npx shadcn-ui@latest init`
- [ ] Agregar: button, input, select, card, calendar, dialog, badge, dropdown-menu, toast, label, form
- [ ] Configurar tema con colores de Trainera

### 1.5 Verificar Setup
- [ ] `npm run dev` levanta sin errores
- [ ] DB connection funciona
- [ ] Prisma Studio accesible: `npx prisma studio`

---

## Fase 2: Backend APIs (1.5 días)

### 2.1 API: Disponibilidad
- [ ] `GET /api/disponibilidad/route.ts`
  - Query params: `fecha` (YYYY-MM-DD)
  - Retorna array de slots con disponibilidad
  - Integra con matching algorithm
- [ ] Validación de fecha (entre hoy y +30 días)
- [ ] Validación de horario (dentro de config)
- [ ] Tests de integración del endpoint

### 2.2 API: Reservas
- [ ] `POST /api/reservas/route.ts`
  - Validación Zod schema
  - Transaction con Prisma para atomicidad
  - Matching de mesas
  - Manejo de errores: SIN_DISPONIBILIDAD, HORARIO_INVALIDO
- [ ] `GET /api/reservas/[id]/route.ts` - Detalle de reserva
- [ ] `POST /api/reservas/[token]/cancelar/route.ts` - Cancelar con token
- [ ] `POST /api/reservas/[token]/reprogramar/route.ts` - Reprogramar con token
- [ ] Tests de race condition (double booking prevention)

### 2.3 API: Admin Auth
- [ ] `POST /api/auth/login/route.ts` - Login con password
- [ ] `POST /api/auth/logout/route.ts` - Logout
- [ ] Middleware `middleware.ts` para protección de rutas `/admin/*`

### 2.4 API: Admin Reservas
- [ ] `GET /api/admin/reservas/route.ts`
  - Query params: fecha, estado, page
  - Requiere auth
- [ ] `PATCH /api/admin/reservas/[id]/route.ts` - Actualizar estado
- [ ] `DELETE /api/admin/reservas/[id]/route.ts` - Soft delete (CANCELADA)

### 2.5 API: Admin Config
- [ ] `GET /api/admin/config/route.ts` - Obtener configuración
- [ ] `PATCH /api/admin/config/route.ts` - Actualizar configuración
- [ ] `GET /api/admin/mesas/route.ts` - Listar mesas
- [ ] `POST /api/admin/mesas/route.ts` - Crear mesa
- [ ] `PATCH /api/admin/mesas/[id]/route.ts` - Editar mesa
- [ ] `DELETE /api/admin/mesas/[id]/route.ts` - Eliminar mesa

### 2.6 API: Cron
- [ ] `GET /api/cron/recordatorios/route.ts`
  - Verificación de authorization header
  - Query de reservas próximas (2hs)
  - Update de flag recordatorioEnviado
- [ ] Config vercel.json actualizada

### 2.7 Tests de Integración
- [ ] Test flujo completo de reserva
- [ ] Test de disponibilidad
- [ ] Test de cancelación
- [ ] Test de reprogramación

---

## Fase 3: Frontend Público (2 días)

### 3.1 Layouts y Componentes Base
- [ ] Layout público `app/(public)/layout.tsx`
  - Navbar con logo Trainera
  - Footer con info de contacto
- [ ] Layout admin `app/(admin)/admin/layout.tsx`
- [ ] Componente `Navbar` con link a reservar y admin

### 3.2 Landing Page
- [ ] `app/page.tsx` - Landing page
  - Hero section con imagen TraineraCocinaVasca.jpeg
  - CTA "Reservar ahora" → `/reservar`
  - Info: horarios, ubicación
- [ ] Responsive mobile-first

### 3.3 Página de Reserva
- [ ] `app/(public)/reservar/page.tsx`
- [ ] Componente `DatePicker` (calendar)
- [ ] Componente `SlotSelector` (dropdown horarios)
- [ ] Componente `ComensalesSelect` (1-20)
- [ ] Componente `ReservaForm`
  - react-hook-form + zod validation
  - Campos: nombre, apellido, email, telefono
  - Submit → POST /api/reservas
- [ ] Estado de loading durante submit
- [ ] Mensaje de error si no hay disponibilidad
- [ ] Redirect a `/confirmacion/[id]` tras éxito

### 3.4 Página de Confirmación
- [ ] `app/(public)/confirmacion/[id]/page.tsx`
- [ ] Fetch de datos de reserva
- [ ] Mostrar detalles: fecha, hora, comensales
- [ ] Texto de Trainera:
  > "Muchas gracias por tu reserva! Te comentamos que tenemos una tolerancia de 10 min. al horario de reserva. Te estaremos esperando con gusto! Mientras tanto, podés conocer nuestra carta ingresando a taberna.trainera.com.ar"
- [ ] Link a carta

### 3.5 Página de Cancelar
- [ ] `app/(public)/cancelar/[token]/page.tsx`
- [ ] Fetch de datos de reserva por token
- [ ] Mostrar info de reserva a cancelar
- [ ] Botón "Sí, cancelar"
- [ ] POST /api/reservas/[token]/cancelar
- [ ] Mensaje de confirmación de cancelación
- [ ] Manejo de token inválido

### 3.6 Página de Reprogramar
- [ ] `app/(public)/reprogramar/[token]/page.tsx`
- [ ] Fetch de datos de reserva actual
- [ ] Formulario con nueva fecha/hora
- [ ] Validación de disponibilidad en tiempo real
- [ ] POST /api/reservas/[token]/reprogramar
- [ ] Redirect a nueva confirmación

---

## Fase 4: Admin Dashboard (2 días)

### 4.1 Login
- [ ] `app/(admin)/admin/login/page.tsx`
- [ ] Formulario password
- [ ] POST /api/auth/login
- [ ] Redirect a /admin tras éxito
- [ ] Mensaje de error si password incorrecto

### 4.2 Layout Admin
- [ ] `app/(admin)/admin/layout.tsx`
- [ ] Sidebar: calendario, reservas, configuración
- [ ] Header: logo, nombre, botón logout
- [ ] Protección de rutas (middleware)
- [ ] Responsive (sidebar colapsa en mobile)

### 4.3 Calendario (Dashboard)
- [ ] `app/(admin)/admin/page.tsx`
- [ ] Componente `Calendario`
  - Vista mensual
  - Indicadores de cantidad de reservas por día
  - Leyenda: colores por cantidad
- [ ] Click en día → navegar a `/admin/reservas/[fecha]`

### 4.4 Detalle de Día
- [ ] `app/(admin)/admin/reservas/[fecha]/page.tsx`
- [ ] Header con fecha formateada
- [ ] `StatsCard`: total reservas, total comensales
- [ ] `ReservaList`:
  - Agrupar por hora
  - Card por reserva: nombre, comensales, estado, mesas
  - Badge de estado con colores
  - Acciones: confirmar, cancelar, editar
- [ ] Botón "+ Nueva Reserva Manual"
- [ ] Empty state si no hay reservas

### 4.5 Editar Reserva
- [ ] `app/(admin)/admin/reservas/[id]/editar/page.tsx`
- [ ] Formulario pre-poblado con datos
- [ ] Campos editables: nombre, apellido, telefono, comensales
- [ ] Cambio de estado: pendiente → confirmada → completada/no asistio
- [ ] Botón cancelar reserva

### 4.6 Configuración
- [ ] `app/(admin)/admin/config/page.tsx`
- [ ] Sección Horarios: checkboxes para cada slot 19:00-23:00
- [ ] Sección Capacidad: inputs numéricos (tolerancia, días anticipación)
- [ ] Sección Mesas:
  - Lista de mesas con edit inline
  - Formulario agregar mesa: nombre, capacidad, tipo, activa
  - Botón eliminar (con confirmación)
- [ ] Sección Notificaciones: input email del dueño
- [ ] Botón "Guardar Cambios"

---

## Fase 5: Emails (0.5 días)

### 5.1 Templates React Email
- [ ] Crear carpeta `components/emails/`
- [ ] Template `ConfirmacionCliente.tsx`
  - Logo Trainera
  - Detalles de reserva
  - Texto de confirmación
- [ ] Template `Recordatorio.tsx`
  - Detalles de reserva
  - Botones: Confirmado, Reprogramar, Cancelar
- [ ] Template `NotificacionDueno.tsx`
  - Detalles completos de reserva
  - Link a admin
- [ ] Template `CancelacionCliente.tsx`
  - Confirmación de cancelación

### 5.2 Funciones de Envío
- [ ] Función `enviarConfirmacionCliente(reserva)`
- [ ] Función `enviarNotificacionDueno(reserva)`
- [ ] Función `enviarRecordatorio(reserva)`
- [ ] Función `enviarCancelacionCliente(reserva)`

### 5.3 Integración en APIs
- [ ] Integrar envío en POST /api/reservas (confirmación)
- [ ] Integrar envío en POST /api/reservas/[token]/cancelar
- [ ] Integrar envío en POST /api/reservas/[token]/reprogramar

### 5.4 Tests
- [ ] Test de envío de email (usar Resend test mode o email real)
- [ ] Verificar que emails llegan correctamente
- [ ] Verificar que links en emails funcionan

---

## Fase 6: Polish y Deploy (1 día)

### 6.1 UI/UX
- [ ] Responsive mobile-first (todas las páginas)
- [ ] Estados de loading (skeleton components)
- [ ] Estados de error (toast notifications)
- [ ] Empty states (sin reservas, sin mesas, etc.)
- [ ] Hover states y transiciones
- [ ] Optimizar imágenes (next/image)

### 6.2 SEO y Performance
- [ ] Meta tags en todas las páginas
- [ ] OG images (share image)
- [ ] Favicon
- [ ] Sitemap (`app/sitemap.ts`)
- [ ] Robots.txt (`app/robots.ts`)

### 6.3 Deploy a Vercel
- [ ] Push a GitHub repo
- [ ] Conectar repo a Vercel
- [ ] Configurar environment variables en Vercel:
  - DATABASE_URL (Vercel Postgres)
  - ADMIN_PASSWORD
  - ADMIN_SESSION_SECRET
  - RESEND_API_KEY
  - EMAIL_FROM
  - EMAIL_DUENO
  - CRON_SECRET
  - NEXT_PUBLIC_APP_URL
- [ ] Deploy inicial
- [ ] Correr migrations en prod: `npx prisma migrate deploy`

### 6.4 Testing E2E
- [ ] Test completo de flujo de reserva (desde landing hasta confirmación)
- [ ] Test de cancelacion (link mágico)
- [ ] Test de reprogramacion
- [ ] Test de admin: login, ver calendario, cambiar estado
- [ ] Test de emails (verificar inbox)
- [ ] Test mobile (responsive)

### 6.5 Documentación para el Cliente
- [ ] README.md actualizado con:
  - Instrucciones de setup local
  - Variables de entorno requeridas
  - Comandos útiles (dev, build, db push)
- [ ] Documento simple de uso del admin

---

## Dependencias Entre Fases

```
Fase 1 (Setup) ──────────────────────────────────────────────
    │                                                          │
    ├──────────────────────────────────────────────────────────┤
    ▼                                                          ▼
Fase 2 (APIs)          ← Necesita: Fase 1                    │
    │                                                          │
    ├──────────────────────────────────────────────────────────┤
    ▼                                                          ▼
Fase 3 (Frontend)      ← Necesita: Fase 1, Fase 2 (APIs)     │
    │                                                          │
    ├──────────────────────────────────────────────────────────┤
    ▼                                                          ▼
Fase 4 (Admin)          ← Necesita: Fase 1, Fase 2 (APIs)     │
    │                                                          │
    ├──────────────────────────────────────────────────────────┤
    ▼                                                          ▼
Fase 5 (Emails)        ← Necesita: Fase 2, Fase 4 (sabiendo qué existe)
    │                                                          │
    ├──────────────────────────────────────────────────────────┤
    ▼                                                          ▼
Fase 6 (Polish)         ← Necesita: Todo
```

---

## Notas de Implementación

### Prisma Transaction para Reservas
```typescript
// Siempre usar transaction al crear reserva para evitar race conditions
await prisma.$transaction(async (tx) => {
  // 1. Check disponibilidad con FOR UPDATE lock
  // 2. Crear reserva
  // 3. Asignar mesas
}, {
  isolationLevel: 'Serializable'
});
```

### Rate Limiting (Opcional)
- Para prevenir spam de reservas, agregar rate limiting en `/api/reservas`
- Usar Upstash Redis o similar si se necesita

### Internacionalización
- Por ahora hardcodeado en español
- Si se necesita inglés, agregar next-i18next

### Testing
- Unit tests: vitest para funciones puras (matching algorithm)
- Integration tests: para APIs
- E2E tests: playwright para flujos completos
