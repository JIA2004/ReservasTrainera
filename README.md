# Trainera - Sistema de Reservas

Sistema de reservas para el restaurant Trainera (Cocina Vasca, Rosario, Argentina).

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Base de datos**: PostgreSQL (Vercel Postgres)
- **ORM**: Prisma
- **Styling**: Tailwind CSS + shadcn/ui
- **Emails**: Resend
- **Validación**: Zod
- **Hosting**: Vercel

## Setup Local

### Prerrequisitos

- Node.js 18+
- PostgreSQL (local o Docker)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd trainera

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 4. Crear la base de datos
# Opción A: Docker
docker run --name trainera-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=trainera -p 5432:5432 -d postgres

# Opción B: PostgreSQL local
# Crear base de datos llamada 'trainera'

# 5. Correr migraciones
npm run db:push

# 6. Poblar con datos de prueba (opcional)
npm run db:seed

# 7. Iniciar dev server
npm run dev
```

### Variables de Entorno

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trainera?schema=public"

# Admin Auth
ADMIN_PASSWORD="tu-password-aqui"
ADMIN_SESSION_SECRET="random-32-char-string"

# Resend (Emails)
RESEND_API_KEY="re_tu_api_key"
EMAIL_FROM="Trainera <noreply@trainera.com>"
EMAIL_DUENO="owner@trainera.com"

# Cron
CRON_SECRET="random-secret"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Scripts Disponibles

```bash
npm run dev          # Iniciar dev server
npm run build        # Build de producción
npm run start        # Iniciar server de producción
npm run lint         # Linting
npm run db:generate  # Generar Prisma client
npm run db:push      # Push schema a DB
npm run db:migrate   # Correr migraciones
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Poblar con datos de prueba
```

## Rutas

### Público
- `/` - Landing page
- `/reservar` - Formulario de reserva
- `/confirmacion/[id]` - Confirmación de reserva
- `/cancelar/[token]` - Cancelar reserva
- `/reprogramar/[token]` - Reprogramar reserva

### Admin
- `/admin/login` - Login
- `/admin` - Dashboard con calendario
- `/admin/reservas/[fecha]` - Reservas del día
- `/admin/config` - Configuración

## API Endpoints

### Público
- `GET /api/disponibilidad?fecha=YYYY-MM-DD` - Slots disponibles
- `POST /api/reservas` - Crear reserva
- `GET /api/reservas/[id]` - Detalle de reserva

### Admin (requiere auth)
- `GET /api/admin/reservas` - Listar reservas
- `PATCH /api/admin/reservas/[id]` - Actualizar reserva
- `GET /api/admin/config` - Obtener config
- `PATCH /api/admin/config` - Actualizar config
- `GET/POST /api/admin/mesas` - CRUD mesas

## Deploy a Vercel

1. Conectar repo a Vercel
2. Configurar environment variables en Vercel Dashboard
3. Deploy automático al push

### Vercel Postgres Setup

1. Crear proyecto en Vercel
2. Agregar "Storage" > "Vercel Postgres"
3. Copiar connection string a `DATABASE_URL`
4. Hacer deploy para que corran las migraciones

## Estructura del Proyecto

```
├── app/
│   ├── (public routes)
│   ├── admin/           # Admin routes
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   └── ...
├── lib/
│   ├── prisma.ts        # Prisma client
│   ├── utils.ts         # Utilities
│   ├── matching.ts       # Table matching algorithm
│   └── email.ts         # Email sending
├── prisma/
│   ├── schema.prisma    # DB schema
│   └── seed.ts          # Seed data
└── public/
    └── imgs/            # Images
```

## Funcionalidades

- [x] Formulario de reserva público
- [x] Sistema de matching automático de mesas
- [x] Múltiples reservas simultáneas por horario
- [x] Dashboard admin con calendario
- [x] Gestión de reservas (confirmar, cancelar)
- [x] Configuración de horarios y mesas
- [x] Emails de confirmación
- [x] Recordatorios 2hs antes (cron job)
- [x] Cancelación y reprogramación por email
- [ ] Tests
- [ ] PWA (posible future)

## Licencia

Privado - Trainera
