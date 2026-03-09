'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className={`text-xl font-bold transition-colors ${scrolled ? 'text-primary-700' : 'text-white'}`}>
            TutorPlatform
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className={`font-medium px-3 py-2 rounded-lg transition-colors ${
                scrolled
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Autentificare
            </Link>
            <Link
              href="/auth/register"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                scrolled
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-white text-primary-700 hover:bg-white/90'
              }`}
            >
              Începe acum
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 py-32 sm:py-44 px-4 sm:px-6">
        {/* Decorative blobs */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-indigo-400/15 rounded-full blur-3xl" />
        <div className="absolute top-[40%] left-[20%] w-[200px] h-[200px] bg-primary-400/10 rounded-full blur-2xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-5 py-2 rounded-full mb-8 border border-white/20">
            Lecții private și de grup online
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
            Stăpânește orice materie cu{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-primary-200">
              meditații personalizate
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Accesează lecții de calitate, materiale video, sesiuni live prin Google Meet
            și feedback direct pe teme. Învață în ritmul tău.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto bg-white text-primary-700 px-8 py-4 rounded-xl hover:bg-white/90 font-semibold text-lg transition-all hover:shadow-lg hover:shadow-white/20 active:scale-[0.98]"
            >
              Începe să înveți
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto border-2 border-white/30 text-white px-8 py-4 rounded-xl hover:bg-white/10 font-semibold text-lg transition-all active:scale-[0.98]"
            >
              Am deja cont
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x sm:divide-gray-200">
            {[
              { value: '50+', label: 'Elevi activi' },
              { value: '100+', label: 'Lecții disponibile' },
              { value: '5+', label: 'Ani de experiență' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl sm:text-5xl font-bold text-primary-700 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              De ce să înveți cu noi?
            </h2>
            <p className="text-gray-500 text-lg">
              Cu ani de experiență în predare, ofer o abordare structurată și personalizată
              care te ajută să-ți atingi obiectivele.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 hover:border-primary-200 transition-all duration-300 group">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-600 transition-colors duration-300">
                <svg className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lecții video</h3>
              <p className="text-gray-500 leading-relaxed">
                Urmărește lecții înregistrate de calitate oricând. Dă înapoi, pune pauză și învață în ritmul tău.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 hover:border-amber-200 transition-all duration-300 group">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors duration-300">
                <svg className="w-7 h-7 text-amber-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sesiuni live</h3>
              <p className="text-gray-500 leading-relaxed">
                Participă la sesiuni live pe Google Meet pentru interacțiune în timp real, întrebări și discuții de grup.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 hover:border-emerald-200 transition-all duration-300 group">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors duration-300">
                <svg className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verificare teme</h3>
              <p className="text-gray-500 leading-relaxed">
                Trimite temele și primește feedback personalizat pentru a-ți urmări progresul și a te îmbunătăți.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Timeline */}
      <section className="py-20 bg-white px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Cum funcționează
            </h2>
            <p className="text-gray-500 text-lg">Trei pași simpli pentru a începe</p>
          </div>

          {/* Desktop timeline */}
          <div className="hidden sm:flex items-start justify-between gap-4">
            {[
              { num: '1', title: 'Creează un cont', desc: 'Înregistrează-te și solicită acces pe platformă.' },
              { num: '2', title: 'Primește aprobarea', desc: 'Odată ce plata este confirmată, primești acces complet.' },
              { num: '3', title: 'Începe să înveți', desc: 'Accesează grupurile, lecțiile, temele și întâlnirile live.' },
            ].map((step, i) => (
              <div key={step.num} className="flex-1 flex flex-col items-center text-center">
                <div className="flex items-center w-full mb-6">
                  {i > 0 && <div className="flex-1 h-0.5 bg-gradient-to-r from-primary-300 to-primary-400" />}
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-primary-200 flex-shrink-0">
                    {step.num}
                  </div>
                  {i < 2 && <div className="flex-1 h-0.5 bg-gradient-to-r from-primary-400 to-indigo-300" />}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile timeline */}
          <div className="sm:hidden space-y-0">
            {[
              { num: '1', title: 'Creează un cont', desc: 'Înregistrează-te și solicită acces pe platformă.' },
              { num: '2', title: 'Primește aprobarea', desc: 'Odată ce plata este confirmată, primești acces complet.' },
              { num: '3', title: 'Începe să înveți', desc: 'Accesează grupurile, lecțiile, temele și întâlnirile live.' },
            ].map((step, i) => (
              <div key={step.num} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-primary-200 flex-shrink-0">
                    {step.num}
                  </div>
                  {i < 2 && <div className="w-0.5 flex-1 bg-gradient-to-b from-primary-300 to-indigo-300 my-2" />}
                </div>
                <div className={`pb-8 ${i === 2 ? 'pb-0' : ''}`}>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-indigo-700 py-20 sm:py-24 px-4 sm:px-6">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-5%] w-[300px] h-[300px] bg-indigo-400/15 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            Pregătit să începi?
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
            Alătură-te elevilor care învață eficient cu lecții structurate, sesiuni live și feedback personalizat.
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-white text-primary-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/90 hover:shadow-lg hover:shadow-white/20 transition-all active:scale-[0.98]"
          >
            Creează cont gratuit
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-bold text-white mb-3">TutorPlatform</h4>
              <p className="text-sm text-gray-400">
                Lecții private și de grup online. Învață de oriunde, oricând.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Linkuri rapide</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Autentificare</Link></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Înregistrare</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>contact@tutorplatform.com</li>
                <li>Luni - Vineri, 9:00 - 18:00</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} TutorPlatform. Toate drepturile rezervate.
          </div>
        </div>
      </footer>
    </div>
  );
}
