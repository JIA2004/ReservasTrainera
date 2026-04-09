# TECH_DESIGN.md - Sistema de Reservas Trainera

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  Next.js 14 App Router (React 18)                               │
│  - Server Components para páginas públicas                     │
│  - Client Components para formularios interactivos             │
│  - Server Actions para mutations simples                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ API Routes / Server Actions
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│  Next.js API Routes + Prisma ORM                                │
│  - Validación con Zod                                           │
│  - Auth simple con cookies                                      │
│  - Transacciones para reservas                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                              │
│  Vercel Postgres (PostgreSQL)                                   │
│  - Prisma Client con connection pooling                         │
│  - Row-level locking para reservas                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         EXTERNAL                                 │
│  Resend API → Emails transaccionales                            │
│  Vercel Cron → Recordatorios programados                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Estructura de Archivos

```
trainera/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx                    # Layout público
│   │   ├── page.tsx                      # Landing
│   │   ├── reservar/
│   │   │   └── page.tsx                  # Formulario
│   │   ├── confirmacion/
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Confirmación
│   │   ├── cancelar/
│   │   │   └── [token]/
│   │   │       └── page.tsx              # Cancelación
│   │   └── reprogramar/
│   │       └── [token]/
│   │           └── page.tsx              # Reprogramación
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── layout.tsx                # Layout admin
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx                  # Calendario
│   │   │   ├── reservas/
│   │   │   │   └── [fecha]/
│   │   │   │       └── page.tsx          # Detalle día
│   │   │   └── config/
│   │   │       └── page.tsx              # Config
│   ├── api/
│   │   ├── disponibilidad/
│   │   │   └── route.ts
│   │   ├── reservas/
│   │   │   ├── route.ts                  # POST crear
│   │   │   └── [id]/
│   │   │       └── route.ts              # GET detalle
│   │   ├── cron/
│   │   │   └── recordatorios/
│   │   │       └── route.ts              # Vercel Cron endpoint
│   │   ├── admin/
│   │   │   ├── reservas/
│   │   │   │   ├── route.ts              # GET list
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts          # PATCH estado
│   │   │   ├── config/
│   │   │   │   └── route.ts
│   │   │   └── mesas/
│   │   │       ├── route.ts              # GET, POST
│   │   │       └── [id]/
│   │   │           └── route.ts          # PATCH, DELETE
│   │   └── auth/
│   │       ├── login/
│   │       │   └── route.ts
│   │       └── logout/
│   │           └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                               # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── reservas/
│   │   ├── reserva-form.tsx
│   │   ├── slot-selector.tsx
│   │   └── disponibilidad-badge.tsx
│   ├── admin/
│   │   ├── sidebar.tsx
│   │   ├── reserva-list.tsx
│   │   ├── calendario.tsx
│   │   ├── mesa-form.tsx
│   │   └── stats-card.tsx
│   └── emails/
│       ├── confirmacion-cliente.tsx      # React Email template
│       ├── recordatorio.tsx
│       └── notificacion-dueno.tsx
├── lib/
│   ├── prisma.ts                        # Prisma client singleton
│   ├── auth.ts                          # Auth utilities
│   ├── email.ts                         # Resend client
│   ├── matching.ts                      # Algorithm de mesas
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── imgs/
│       ├── logoTrainera.jpeg
│       └── TraineraCocinaVasca.jpeg
├── .env.local                           # Variables locales
├── .env.example                         # Template
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 3. Matching Algorithm - Detalle

```typescript
// lib/matching.ts

interface MatchingResult {
  disponible: boolean;
  requiereAtencion: boolean;
  mensaje?: string;
  mesasAsignadas?: Mesa[];
}

async function encontrarMesasDisponibles(
  fecha: Date,
  hora: string,
  comensales: number,
  prisma: PrismaClient
): Promise<MatchingResult> {
  
  // 1. Obtener todas las mesas activas
  const todasMesas = await prisma.mesa.findMany({
    where: { activa: true },
    orderBy: { capacidad: 'desc' }
  });
  
  // 2. Obtener reservas existentes para fecha+hora
  const reservasExistentes = await prisma.reserva.findMany({
    where: {
      fecha,
      hora,
      estado: { notIn: ['CANCELADA'] }
    },
    include: { mesas: { include: { mesa: true } } }
  });
  
  // 3. Calcular mesas ocupadas
  const mesasOcupadas = new Set<string>();
  reservasExistentes.forEach(r => {
    r.mesas.forEach(rm => mesasOcupadas.add(rm.mesaId));
  });
  
  const mesasDisponibles = todasMesas.filter(m => !mesasOcupadas.has(m.id));
  
  // 4. Algoritmo de matching
  return matchingGreedy(comensales, mesasDisponibles);
}

function matchingGreedy(comensales: number, mesas: Mesa[]): MatchingResult {
  // Caso especial: comensales > 6 requiere atención
  if (comensales > 6) {
    return {
      disponible: false,
      requiereAtencion: true,
      mensaje: 'Para grupos de más de 6 personas, contactá directamente al restaurante.'
    };
  }
  
  // Intento 1: Mesa individual que alcance o supere por poco
  for (const mesa of mesas) {
    if (mesa.capacidad >= comensales && mesa.capacidad <= comensales + 2) {
      return { disponible: true, requiereAtencion: false, mesasAsignadas: [mesa] };
    }
  }
  
  // Intento 2: Mesa individual más grande
  for (const mesa of mesas) {
    if (mesa.capacidad >= comensales) {
      return { disponible: true, requiereAtencion: false, mesasAsignadas: [mesa] };
    }
  }
  
  // Intento 3: Combinación de 2 mesas
  for (let i = 0; i < mesas.length; i++) {
    for (let j = i + 1; j < mesas.length; j++) {
      if (mesas[i].capacidad + mesas[j].capacidad >= comensales) {
        return { disponible: true, requiereAtencion: false, mesasAsignadas: [mesas[i], mesas[j]] };
      }
    }
  }
  
  // No hay combinación posible
  return {
    disponible: false,
    requiereAtencion: false,
    mensaje: 'No hay disponibilidad para esa cantidad de comensales.'
  };
}
```

---

## 4. API Design - Detalle

### POST /api/reservas

```typescript
// Validación con Zod
const reservaSchema = z.object({
  nombre: z.string().min(2).max(50),
  apellido: z.string().min(2).max(50),
  email: z.string().email(),
  telefono: z.string().regex(/^\+?[0-9]{8,15}$/),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  comensales: z.number().int().min(1).max(20)
});

// Handler
export async function POST(req: Request) {
  const body = await req.json();
  const data = reservaSchema.parse(body);
  
  // 1. Validar horario dentro de config
  const config = await prisma.configuracion.findFirst();
  if (!config.horariosReservas.includes(data.hora)) {
    return Response.json({ error: 'HORARIO_INVALIDO' }, { status: 400 });
  }
  
  // 2. Matching de mesas (con transaction)
  const resultado = await prisma.$transaction(async (tx) => {
    const match = await encontrarMesasDisponibles(data.fecha, data.hora, data.comensales, tx);
    
    if (!match.disponible) {
      throw new Error('SIN_DISPONIBILIDAD');
    }
    
    // 3. Crear reserva
    const reserva = await tx.reserva.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        fecha: new Date(data.fecha),
        hora: data.hora,
        comensales: data.comensales,
        estado: match.requiereAtencion ? 'REQUIERE_ATENCION' : 'PENDIENTE',
        cancelToken: crypto.randomUUID(),
        mesas: {
          create: match.mesasAsignadas!.map(m => ({ mesaId: m.id }))
        }
      }
    });
    
    return { reserva, match };
  });
  
  // 4. Enviar emails (async, no bloquear respuesta)
  enviarConfirmacionCliente(resultado.reserva);
  enviarNotificacionDueno(resultado.reserva, resultado.match.mesasAsignadas);
  
  return Response.json(resultado.reserva, { status: 201 });
}
```

---

## 5. Auth Strategy

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Rutas protegidas
  if (req.nextUrl.pathname.startsWith('/admin') && 
      !req.nextUrl.pathname.startsWith('/admin/login')) {
    
    const session = req.cookies.get('admin_session');
    
    if (!session || session.value !== process.env.ADMIN_SESSION_SECRET) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};
```

```typescript
// app/api/auth/login/route.ts
export async function POST(req: Request) {
  const { password } = await req.json();
  
  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Invalid' }, { status: 401 });
  }
  
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_session', process.env.ADMIN_SESSION_SECRET!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });
  
  return res;
}
```

---

## 6. Cron Job para Recordatorios

```typescript
// app/api/cron/recordatorios/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Verificar secret del cron job
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const ahora = new Date();
  const enDosHoras = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);
  
  // Buscar reservas pendientes entre ahora y en 2hs que no tengan recordatorio enviado
  const reservas = await prisma.reserva.findMany({
    where: {
      fecha: {
        gte: new Date(ahora.toDateString()),
        lte: new Date(enDosHoras.toDateString())
      },
      hora: {
        gte: formatHora(ahora),
        lte: formatHora(enDosHoras)
      },
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      recordatorioEnviado: false
    }
  });
  
  for (const reserva of reservas) {
    await enviarRecordatorio(reserva);
    await prisma.reserva.update({
      where: { id: reserva.id },
      data: { recordatorioEnviado: true }
    });
  }
  
  return NextResponse.json({ processed: reservas.length });
}
```

Config en `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/recordatorios",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## 7. Environment Variables

```bash
# .env.example

# Database (Vercel Postgres)
DATABASE_URL="postgresql://..."

# Admin
ADMIN_PASSWORD="change-me-in-production"
ADMIN_SESSION_SECRET="random-secret-32chars"

# Resend
RESEND_API_KEY="re_..."
EMAIL_FROM="Trainera <noreply@trainera.com>"
EMAIL_DUENO="trainera@email.com"

# Cron (Vercel)
CRON_SECRET="random-secret"

# App
NEXT_PUBLIC_APP_URL="https://trainera.vercel.app"
```

---

## 8. Dependencias

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^5.12.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.0",
    "resend": "^3.2.0",
    "@react-email/components": "^0.0.17",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.363.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.11.0",
    "tailwindcss": "^3.4.0",
    "prisma": "^5.12.0",
    "eslint": "^8.57.0",
    "@types/react": "^18.2.0"
  }
}
```

---

## 9. Decisiones de Diseño

### Por qué PostgreSQL y no SQLite
- Vercel Postgres ofrece tier gratuito generoso
- Multiple serverless instances pueden acceder a la misma DB
- Row-level locking para evitar race conditions en reservas
- Transactions nativas para atomicidad de operaciones

### Por qué Prisma
- Type-safe, autocompletado en el IDE
- Migrations versionadas
- Conexión pooling integrada
- DX excelente con Next.js

### Por qué Resend directo
- Sin servidor adicional (n8n requiere VPS)
- Free tier 3k emails/mes suficiente para restaurante
- API simple, integrable en Next.js
- Templates con React Email

### Por qué Auth con cookies simple
- Un solo usuario (el dueño)
- No necesita roles ni permisos complejos
- Middleware de Next.js suficiente
- Cambio de password via env var si es necesario
