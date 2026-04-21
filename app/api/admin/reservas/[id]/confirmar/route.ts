import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/admin-auth';

interface Props {
  params: Promise<{ id: string }>;
}

const HTML_TEMPLATE = (title: string, message: string, color: string, icon: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #1c1917 0%, #292524 100%); min-height: 100vh; font-family: 'Source Sans 3', -apple-system, sans-serif;">
  <table width="100%" height="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" valign="middle" style="padding: 40px 20px;">
        <div style="max-width: 440px; width: 100%;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 700; color: #fafaf9; letter-spacing: 3px;">
              TRAINERA
            </h1>
            <p style="margin: 8px 0 0; font-size: 12px; color: #a8a29e; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">
              Cocina Vasca
            </p>
          </div>
          
          <div style="background: #ffffff; border-radius: 20px; padding: 48px 40px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.25);">
            <div style="width: 80px; height: 80px; background: ${color}; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 36px;">
              ${icon}
            </div>
            
            <h2 style="margin: 0 0 12px; font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 600; color: #1c1917;">
              ${title}
            </h2>
            
            <p style="margin: 0 0 32px; font-size: 16px; color: #57534e; line-height: 1.6;">
              ${message}
            </p>
            
            <a href="https://trainera-reservas.vercel.app/admin" 
               style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 14px rgba(220,38,38,0.4);">
              Ver Panel de Admin
            </a>
          </div>
          
          <p style="text-align: center; margin-top: 24px; font-size: 13px; color: #78716c;">
            © 2026 Trainera · Cocina Vasca
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export async function GET(request: Request, { params }: Props) {
  // VERIFICAR AUTH PRIMERO - Solo el admin puede confirmar
  const authError = await checkAdminAuth();
  if (authError) {
    return new NextResponse(
      HTML_TEMPLATE(
        'Acceso Denegado',
        'Necesitás estar autenticado como admin.',
        '#fee2e2',
        '🔒'
      ),
      { headers: { 'content-type': 'text/html' }, status: 401 }
    );
  }
  
  try {
    const resolvedParams = await params;
    const reservaId = resolvedParams.id;

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      return new NextResponse(
        HTML_TEMPLATE(
          'Reserva No Encontrada',
          'La reserva que intentás confirmar no existe en el sistema.',
          '#fef2f2',
          '❌'
        ),
        { headers: { 'content-type': 'text/html' } }
      );
    }

    // Update status to CONFIRMADA
    const updated = await prisma.reserva.update({
      where: { id: reservaId },
      data: { estado: 'CONFIRMADA' },
    });

    return new NextResponse(
      HTML_TEMPLATE(
        'Reserva Confirmada',
        `La reserva de <strong>${updated.nombre} ${updated.apellido}</strong> para el <strong>${updated.fecha.toLocaleDateString('es-AR')}</strong> a las <strong>${updated.hora}</strong> ha sido confirmada.`,
        '#dcfce7',
        '✅'
      ),
      { headers: { 'content-type': 'text/html' } }
    );
  } catch (error) {
    console.error('Error confirming reserva:', error);
    return new NextResponse(
      HTML_TEMPLATE(
        'Error Interno',
        'Hubo un problema al procesar la solicitud.',
        '#fef2f2',
        '⚠️'
      ),
      { headers: { 'content-type': 'text/html' }, status: 500 }
    );
  }
}