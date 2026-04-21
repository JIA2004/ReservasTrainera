import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar auth
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id } = await params;
    
    const mesa = await prisma.mesa.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ mesa });
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar auth
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    
    await prisma.mesa.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}