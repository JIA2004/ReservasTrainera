import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET() {
  // Verificar auth
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const mesas = await prisma.mesa.findMany({
      orderBy: [
        { tipo: 'asc' },
        { nombre: 'asc' },
      ],
    });

    return NextResponse.json({ mesas });
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Verificar auth
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { nombre, capacidad, tipo, activa } = body;

    const mesa = await prisma.mesa.create({
      data: {
        nombre,
        capacidad,
        tipo,
        activa: activa ?? true,
      },
    });

    return NextResponse.json({ mesa }, { status: 201 });
  } catch (error) {
    console.error('Error al crear mesa:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}