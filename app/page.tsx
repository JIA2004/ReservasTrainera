'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, UtensilsCrossed, Wine, ChefHat, ArrowRight, Star, Menu, X } from 'lucide-react';
import { useState } from 'react';

// Paleta de colores:
// - Brand: #37394e
// - Blanco
// - Negro

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
            <a href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Carta</a>
            <a href="https://www.google.com/maps/search/?api=1&query=Constitución+306+Rosario+Argentina" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Ubicación</a>
          </nav>

          {/* Desktop CTA */}
          <Link href="/reservar" className="hidden md:block">
            <Button className="bg-brand hover:bg-brand/90 text-white border-0">
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
              <a 
                href="https://taberna.trainera.com.ar" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white py-2"
              >
                Carta
              </a>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Constitución+306+Rosario+Argentina"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white py-2"
              >
                Ubicacion
              </a>
              <Link 
                href="/reservar" 
                className="text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="bg-brand hover:bg-brand/90 text-white border-0 w-full">
                  Reservar
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh]">
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

        <div className="relative z-10 container mx-auto px-4 pt-20 pb-16 flex flex-col justify-between min-h-[85vh]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-white/20">
              <Wine className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">Sidrería y Restaurante</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-4 leading-none drop-shadow-lg">
              Sabores del
              <span className="block text-white">País Vasco</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-6 max-w-xl leading-relaxed drop-shadow-md">
              En el corazón de Rosario, una experiencia gastronómica que 
              trasciende generaciones.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/reservar">
                <Button size="lg" className="bg-brand text-white hover:bg-brand/90 border-0 px-8 py-6 text-lg font-semibold">
                  <ChefHat className="mr-2 h-5 w-5" />
                  Reservar una mesa
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-brand px-8 py-6 text-lg bg-black/30">
                  <UtensilsCrossed className="mr-2 h-5 w-5" />
                  Ver carta
                </Button>
              </a>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-white/90 mt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <div>
                <p className="font-semibold text-white text-sm">Horarios</p>
                <p className="text-xs">Mar-Sáb 19:00-23:00</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <div>
                <p className="font-semibold text-white text-sm">Ubicación</p>
                <p className="text-xs">Constitución 306</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <div>
                <p className="font-semibold text-white text-sm">Experiencia</p>
                <p className="text-xs">Cocina vasca</p>
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
              <p className="text-white/70 font-medium tracking-wider uppercase text-sm mb-3">
                Nuestra historia
              </p>
              <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">
                Tradición Vasca
                <span className="block text-white">en Rosario</span>
              </h2>
              <div className="space-y-4 text-stone-400 leading-relaxed">
                <p>
                  Itziar Aguirre, chef y fundadora de Trainera, trae consigo más de 
                  <span className="text-brand font-semibold"> 30 años de trayectoria</span> en la cocina vasca. 
                  Trabajó durante 25 años en el icónico Zazpirak Bat junto a su madre, 
                  antes de crear su propio proyecto.
                </p>
                <p>
                  En 2020 nació Trainera, la evolución de un sueño familiar. Itziar fue 
                  declarada <span className="text-brand font-semibold">"Cocinera Distinguida de Rosario"</span> 
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
                  <p className="text-3xl font-serif text-brand font-bold">30+</p>
                  <p className="text-stone-500 text-sm">Años de trayectoria</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-serif text-brand font-bold">25+</p>
                  <p className="text-stone-500 text-sm">Años en Zazpirak Bat</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-serif text-brand font-bold">2020</p>
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
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Especialidades */}
      <section className="py-24 bg-stone-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-white/70 font-medium tracking-wider uppercase text-sm mb-3">
              Nuestras especialidades
            </p>
            <h2 className="text-4xl md:text-5xl font-serif text-white">
              Sabores que definen
              <span className="block text-white">la esencia vasca</span>
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
                <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-white/20">
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
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center mb-4">
                  <UtensilsCrossed className="h-5 w-5 text-white" />
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
                <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand/80 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-brand/20">
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
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 border-0 px-10">
                Ver carta completa
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Reservas CTA */}
      <section className="py-24 bg-gradient-to-r from-brand to-red-950">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-4">
            Vive la experiencia Trainera
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Reserva tu mesa y descubrí por qué somos referente de la cocina vasca 
            en Rosario. Recomendamos reservar con anticipación.
          </p>
          <Link href="/reservar">
            <Button size="lg" className="bg-white text-brand hover:bg-white/90 border-0 px-12 py-7 text-lg">
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
                <MapPin className="w-4 h-4 text-white" />
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
                <Clock className="w-4 h-4 text-white" />
                Contacto
              </h4>
              <div className="space-y-2">
                <a href="tel:+543416880752" className="text-stone-400 hover:text-white block transition-colors">
                  3416-880752
                </a>
                <a href="mailto:contacto@trainera.com.ar" className="text-white hover:text-gray-300 block transition-colors">
                  contacto@trainera.com.ar
                </a>
                <a href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 block transition-colors">
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
                <a href="https://taberna.trainera.com.ar" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-brand text-sm transition-colors">
                  Carta
                </a>
                <Link href="/reservar" className="text-stone-500 hover:text-brand text-sm transition-colors">
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