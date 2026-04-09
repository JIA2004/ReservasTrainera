'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, UtensilsCrossed, Wine, ChefHat, ArrowRight, Star, Menu, X } from 'lucide-react';
import { useState } from 'react';

// Paleta de colores para Taberna Vasca:
// - Rojo Baskonia: #d71e28 (red-600)
// - Verde Baskonia: #1da174 (green-600)  
// - Crema: #fef7ed (amber-50)
// - Fondos oscuros cálidos

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="relative w-36 h-14">
            <Image
              src="/imgs/LogoSinFondo.png"
              alt="Trainera"
              fill
              className="object-contain"
              priority
            />
          </Link>
          
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-white/90">
            <Link href="#historia" className="hover:text-white transition-colors">Historia</Link>
            <Link href="#carta" className="hover:text-white transition-colors">Carta</Link>
            <Link href="#ubicacion" className="hover:text-white transition-colors">Ubicación</Link>
          </nav>

          {/* Desktop CTA */}
          <Link href="/reservar" className="hidden md:block">
            <Button className="bg-red-600 hover:bg-red-700 text-white border-0">
              Reservar
            </Button>
          </Link>

          {/* Mobile menu button */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-sm border-t border-white/10">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <Link 
                href="#historia" 
                className="text-white/90 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Historia
              </Link>
              <Link 
                href="#carta" 
                className="text-white/90 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Carta
              </Link>
              <Link 
                href="#ubicacion" 
                className="text-white/90 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ubicacion
              </Link>
              <Link 
                href="/reservar" 
                className="text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="bg-red-600 hover:bg-red-700 text-white border-0 w-full">
                  Reservar
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative h-screen min-h-[700px]">
        <div className="absolute inset-0">
          <Image
            src="/imgs/TortillaVasca.jpg"
            alt="Tortilla vasca - Trainera"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/60" />
        </div>

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Wine className="h-4 w-4 text-green-500" />
              <span className="text-green-500 text-sm font-medium">Sidrería y Restaurante</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6 leading-none drop-shadow-lg">
              Sabores del
              <span className="block text-red-600">País Vasco</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-xl leading-relaxed drop-shadow-md">
              En el corazón de Rosario, una experiencia gastronómica que 
              trasciende generaciones. Tradición, pasión y sabor.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/reservar">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white border-0 px-8 py-6 text-lg">
                  <ChefHat className="mr-2 h-5 w-5" />
                  Reservar una mesa
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-900 px-8 py-6 text-lg bg-transparent">
                  <UtensilsCrossed className="mr-2 h-5 w-5" />
                  Ver carta
                </Button>
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-16 pb-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-white/80">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-white">Horarios</p>
                  <p className="text-sm">Mar-Sáb 19:00 - 23:00</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-white">Ubicación</p>
                  <p className="text-sm">Rosario, Argentina</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-semibold text-white">Experiencia</p>
                  <p className="text-sm">Cocina tradicional vasca</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section id="historia" className="py-24 bg-gradient-to-b from-stone-950 to-stone-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-green-600 font-medium tracking-wider uppercase text-sm mb-3">
                Nuestra historia
              </p>
              <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">
                Tradición Vasca
                <span className="block text-red-600">en Rosario</span>
              </h2>
              <div className="space-y-4 text-stone-400 leading-relaxed">
                <p>
                  Itziar Aguirre, chef y fundadora de Trainera, trae consigo más de 
                  <span className="text-green-500 font-semibold"> 30 años de trayectoria</span> en la cocina vasca. 
                  Trabajó durante 25 años en el icónico Zazpirak Bat junto a su madre, 
                  antes de crear su propio proyecto.
                </p>
                <p>
                  En 2020 nació Trainera, la evolución de un sueño familiar. Itziar fue 
                  declarada <span className="text-green-500 font-semibold">"Cocinera Distinguida de Rosario"</span> 
                  por el Concejo Municipal, y es la única argentina seleccionada en el libro 
                  "Mamia" del Basque Culinary Center, que reconoce a las 50 mujeres que 
                  transformaron la cocina vasca en el mundo.
                </p>
                <p>
                  Cada plato es un tributo a las recetas que se transmiten de generación 
                  en generación, con un toque contemporáneo que refleja la esencia de 
                  la gastronomía vasca.
                </p>
              </div>
              <div className="mt-8 flex gap-4">
                <div className="text-center">
                  <p className="text-3xl font-serif text-red-600 font-bold">30+</p>
                  <p className="text-stone-500 text-sm">Años de trayectoria</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-serif text-red-600 font-bold">25+</p>
                  <p className="text-stone-500 text-sm">Años en Zazpirak Bat</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-serif text-red-600 font-bold">2020</p>
                  <p className="text-stone-500 text-sm">Año de fundación</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] relative rounded-2xl overflow-hidden">
                <Image
                  src="/imgs/HistoriaDeItziar.png"
                  alt="Itziar Aguirre - Chef de Trainera"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-red-600/20 rounded-full blur-2xl" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-600/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Especialidades */}
      <section className="py-24 bg-stone-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-green-600 font-medium tracking-wider uppercase text-sm mb-3">
              Nuestras especialidades
            </p>
            <h2 className="text-4xl md:text-5xl font-serif text-white">
              Sabores que definen
              <span className="block text-red-600">la esencia vasca</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Gambas */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="aspect-[4/3] relative">
                <Image
                  src="/imgs/GambasAlAjillo.jpg"
                  alt="Gambas al ajillo"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 pb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-red-200">
                  <UtensilsCrossed className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Gambas al Ajillo</h3>
                <p className="text-gray-600 leading-relaxed">
                  Gambas frescas salteadas en aceite de oliva con ajo, guindilla 
                  y un toque de txakoli. Una delicia del Cantábrico.
                </p>
              </div>
            </div>

            {/* Lomo */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="aspect-[4/3] relative">
                <Image
                  src="/imgs/Lomo.jpg"
                  alt="Lomo"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 pb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-200">
                  <Wine className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Lomo</h3>
                <p className="text-gray-600 leading-relaxed">
                  Lomo de calidad supreme, cocinado a la perfección. Carne tierna 
                  y jugosa con los mejores ingredientes vascos.
                </p>
              </div>
            </div>

            {/* Natilla */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="aspect-[4/3] relative">
                <Image
                  src="/imgs/PostreNatilla.jpg"
                  alt="Natilla"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 pb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-amber-200">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Natilla</h3>
                <p className="text-gray-600 leading-relaxed">
                  Postre tradicional vasco. Cremosa y delicada, elaborada con 
                  leche fresca y vainilla. El postre perfecto para cerrar la comida.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12" id="carta">
            <a href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white border-0 px-10 shadow-lg shadow-green-200">
                Ver carta completa
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Reservas CTA */}
      <section className="py-24 bg-gradient-to-r from-red-900 to-red-950">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-4">
            Vive la experiencia Trainera
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Reserva tu mesa y descubrí por qué somos referente de la cocina vasca 
            en Rosario. Recomendamos reservar con anticipación.
          </p>
          <Link href="/reservar">
            <Button size="lg" className="bg-white text-red-900 hover:bg-white/90 border-0 px-12 py-7 text-lg">
              <ChefHat className="mr-2 h-5 w-5" />
              Reservar ahora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 py-16" id="ubicacion">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <Link href="/" className="relative w-40 h-16 block mb-6">
                <Image
                  src="/imgs/LogoSinFondo.png"
                  alt="Trainera"
                  fill
                  className="object-contain brightness-0 invert"
                />
              </Link>
              <p className="text-stone-400 max-w-md leading-relaxed">
                Sidrería y restaurante de cocina vasca en Rosario. 
                Tradición, sabor y pasión desde 2020.
              </p>
            </div>
            
            {/* Address */}
            <div>
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                Dirección
              </h4>
              <div className="space-y-2 text-stone-400">
                <p>Constitución 306</p>
                <p>Entre Catamarca y Tucumán</p>
                <p>Rosario, Santa Fe</p>
              </div>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                Contacto
              </h4>
              <div className="space-y-2">
                <a href="tel:+543416880752" className="text-stone-400 hover:text-red-500 block transition-colors">
                  3416-880752
                </a>
                <a href="mailto:contacto@trainera.com.ar" className="text-green-500 hover:text-green-400 block transition-colors">
                  contacto@trainera.com.ar
                </a>
                <a href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 block transition-colors">
                  Ver carta online
                </a>
              </div>
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="border-t border-stone-800/50 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-stone-500 text-sm">
                © {new Date().getFullYear()} Trainera - Cocina Vasca
              </p>
              <div className="flex items-center gap-6">
                <a href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-red-500 text-sm transition-colors">
                  Carta
                </a>
                <Link href="/reservar" className="text-stone-500 hover:text-red-500 text-sm transition-colors">
                  Reservar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}