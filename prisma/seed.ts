import { PrismaClient, MesaTipo, ReservaEstado } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default configuration
  await prisma.configuracion.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      emailDueno: process.env.EMAIL_DUENO || 'trainera@example.com',
      toleranciaMinutos: 10,
      diasAntelacionMin: 0,
      diasAntelacionMax: 30,
      horariosReservas: '19:00,19:30,20:00,20:30,21:00,21:30,22:00,22:30',
    },
  });
  console.log('✅ Configuracion created');

  // Create tables
  const mesasData = [
    // 10 mesas for 4 people
    ...Array.from({ length: 10 }, (_, i) => ({
      nombre: `Mesa ${i + 1}`,
      capacidad: 4,
      tipo: MesaTipo.MESA,
      activa: true,
    })),
    // 5 mesas for 2 people
    ...Array.from({ length: 5 }, (_, i) => ({
      nombre: `Mesa ${11 + i}`,
      capacidad: 2,
      tipo: MesaTipo.MESA,
      activa: true,
    })),
    // Barra
    {
      nombre: 'Barra Principal',
      capacidad: 6,
      tipo: MesaTipo.BARRA,
      activa: true,
    },
  ];

  for (const mesa of mesasData) {
    await prisma.mesa.upsert({
      where: { id: mesa.nombre.toLowerCase().replace(/\s+/g, '-') },
      update: mesa,
      create: {
        id: mesa.nombre.toLowerCase().replace(/\s+/g, '-'),
        ...mesa,
      },
    });
  }
  console.log('✅ Mesas created:', mesasData.length);

  // Create sample reservations for testing
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sampleReservas = [
    {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      telefono: '+5493415551234',
      fecha: today,
      hora: '20:00',
      comensales: 4,
      estado: ReservaEstado.CONFIRMADA,
    },
    {
      nombre: 'María',
      apellido: 'García',
      email: 'maria@example.com',
      telefono: '+5493415555678',
      fecha: today,
      hora: '20:00',
      comensales: 2,
      estado: ReservaEstado.PENDIENTE,
    },
    {
      nombre: 'Carlos',
      apellido: 'López',
      email: 'carlos@example.com',
      telefono: '+5493415559012',
      fecha: tomorrow,
      hora: '21:00',
      comensales: 6,
      estado: ReservaEstado.PENDIENTE,
    },
  ];

  for (const reserva of sampleReservas) {
    const created = await prisma.reserva.create({
      data: reserva,
    });

    // Assign tables
    const mesas = await prisma.mesa.findMany({
      where: { activa: true },
      take: reserva.comensales <= 4 ? 1 : 2,
    });

    await prisma.reservaMesa.createMany({
      data: mesas.map((mesa) => ({
        reservaId: created.id,
        mesaId: mesa.id,
      })),
    });
  }
  console.log('✅ Sample reservas created:', sampleReservas.length);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
