'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Settings, Menu, X, Loader2, Armchair } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Skip all sidebar/layout for login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-300 flex-shrink-0">
        <div className="p-6 border-b border-stone-800">
          <h1 className="text-xl font-serif text-white">Trainera</h1>
          <p className="text-xs text-stone-500">Admin</p>
        </div>
        
        <nav className="p-4 space-y-1">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/admin' 
                ? 'bg-stone-800 text-white' 
                : 'hover:bg-stone-800 hover:text-white'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span>Calendario</span>
          </Link>
          
          <Link
            href="/admin/config"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/admin/config' 
                ? 'bg-stone-800 text-white' 
                : 'hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-stone-100">
        {children}
      </main>
    </div>
  );
}