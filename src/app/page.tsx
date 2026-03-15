'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function Home() {
  // Snap an element's top position to the nearest 32px grid line
  const ctaRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const L = 32;
    const snap = (el: HTMLElement | null) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const paper = el.closest('.bg-paper') as HTMLElement;
      if (!paper) return;
      const paperTop = paper.getBoundingClientRect().top;
      const relativeTop = rect.top - paperTop;
      const offset = relativeTop % L;
      if (offset > 1) {
        el.style.marginTop = `${L - offset}px`;
      }
    };
    snap(ctaRef.current);
    snap(footerRef.current);
  }, []);
  // Notebook grid: lines every 32px
  // ALL text has line-height: 32px so baselines sit on notebook lines
  // Large text extends UPWARD above the line (like real handwriting)
  const L = 32;

  return (
    <div className="min-h-screen bg-desk flex justify-center">
      <div className="w-full max-w-5xl">
        <div
          className="min-h-screen bg-paper shadow-[0_0_30px_rgba(0,0,0,0.12)] relative overflow-hidden"
          style={{
            backgroundImage: `repeating-linear-gradient(transparent, transparent ${L - 1}px, #d4c9b0 ${L - 1}px, #d4c9b0 ${L}px)`,
          }}
        >
          {/* Red margin line */}
          <div className="absolute left-10 sm:left-16 top-0 bottom-0 w-[2px] bg-red-400/30" />

          {/* Hole punches */}
          <div className="absolute left-2 sm:left-4 top-24 w-3.5 h-3.5 rounded-full bg-desk border-2 border-sketch/60 shadow-inner" />
          <div className="absolute left-2 sm:left-4 top-[50%] w-3.5 h-3.5 rounded-full bg-desk border-2 border-sketch/60 shadow-inner" />
          <div className="absolute left-2 sm:left-4 bottom-24 w-3.5 h-3.5 rounded-full bg-desk border-2 border-sketch/60 shadow-inner" />

          {/* Content */}
          <div
            className="px-8 sm:px-16 lg:px-24"
            style={{ paddingTop: `${L * 2}px`, marginLeft: '40px' }}
          >
            {/* Navbar */}
            <nav className="flex items-center justify-between" style={{ height: `${L}px` }}>
              <span className="font-hand text-2xl sm:text-3xl text-sketch-dark font-bold" style={{ lineHeight: `${L}px` }}>
                TutorPlatform
              </span>
              <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/auth/login" className="font-hand text-lg text-ink-light hover:text-ink transition-colors" style={{ lineHeight: `${L}px` }}>
                  Autentificare
                </Link>
                <Link href="/auth/register" className="font-hand text-lg bg-sketch-dark text-paper px-5 rounded-md hover:bg-ink transition-colors" style={{ lineHeight: `${L}px` }}>
                  Începe acum
                </Link>
              </div>
            </nav>

            {/* 3 empty lines before title */}
            <div style={{ height: `${L * 3}px` }} />

            {/* Hero title - large text, baseline on line, extends up */}
            <h1
              className="font-hand text-[2.8rem] sm:text-[3.5rem] lg:text-[4rem] text-ink overflow-visible"
              style={{ lineHeight: `${L}px`, paddingTop: `${L}px` }}
            >
              Stăpânește orice{' '}
              <span
                className="underline decoration-wavy decoration-[#c44] decoration-2 underline-offset-4"
              >materie</span>
            </h1>

            {/* 1 empty line */}
            <div style={{ height: `${L}px` }} />

            {/* Subtitle */}
            <h2 className="font-hand text-xl sm:text-2xl lg:text-3xl text-ink-light" style={{ lineHeight: `${L}px` }}>
              cu meditații personalizate
            </h2>

            {/* 1 empty line */}
            <div style={{ height: `${L}px` }} />

            {/* Description */}
            <p className="text-ink-lighter text-[15px] sm:text-base max-w-md italic" style={{ lineHeight: `${L}px` }}>
              Accesează lecții de calitate, materiale video, sesiuni live
              prin Google Meet și feedback direct pe teme. Învață în ritmul tău.
            </p>

            {/* 1 empty line */}
            <div style={{ height: `${L}px` }} />

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <Link
                href="/auth/register"
                className="font-hand text-xl text-center bg-sketch-dark text-paper px-8 rounded-md hover:bg-ink transition-all active:scale-[0.98]"
                style={{ lineHeight: `${L}px`, height: `${L}px` }}
              >
                Începe să înveți →
              </Link>
              <Link
                href="/auth/login"
                className="font-hand text-xl text-center text-ink-light px-8 rounded-md hover:bg-sketch/20 transition-all active:scale-[0.98] border-2 border-dashed border-sketch"
                style={{ lineHeight: `${L - 4}px`, height: `${L}px` }}
              >
                Am deja cont
              </Link>
            </div>

            {/* 4 empty lines */}
            <div style={{ height: `${L * 4}px` }} />

            {/* Separator */}
            <div className="flex items-center" style={{ height: `${L}px` }}>
              <svg className="w-full h-3" viewBox="0 0 800 12" preserveAspectRatio="none">
                <path d="M0 6 Q200 2, 400 8 T800 4" stroke="#c4b89a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* 2 empty lines */}
            <div style={{ height: `${L * 2}px` }} />

            {/* Despre mine - heading sits on line, extends up */}
            <h2 className="font-hand text-3xl sm:text-4xl text-ink" style={{ lineHeight: `${L}px`, paddingTop: `${L}px` }}>
              Despre mine
            </h2>

            {/* 2 empty lines */}
            <div style={{ height: `${L * 2}px` }} />

            {/* Sticky note */}
            <div className="flex justify-center" style={{ marginBottom: `${L * 2}px` }}>
              <div className="relative max-w-lg w-full" style={{ transform: 'rotate(1.5deg)' }}>
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-24 h-8"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,235,180,0.75) 0%, rgba(240,220,160,0.55) 100%)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(200,180,130,0.3)',
                    borderRadius: '2px',
                  }}
                />
                <div
                  className="relative p-7 sm:p-9"
                  style={{
                    background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 30%, #fde047 100%)',
                    boxShadow: '3px 4px 15px rgba(0,0,0,0.15), inset 0 0 40px rgba(255,255,255,0.3)',
                    borderRadius: '1px 1px 20px 1px',
                  }}
                >
                  <div className="absolute bottom-0 right-0 w-8 h-8" style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%)' }} />
                  <p className="font-hand text-lg sm:text-xl text-[#5a4a20] leading-relaxed mb-5">
                    Mă numesc{' '}
                    <span className="font-bold text-[#3a2a10] underline decoration-[#92400e]/30 underline-offset-2">
                      Jaqueline Șerbănescu
                    </span>{' '}
                    și ofer meditații și îndrumare pentru studenți la următoarele discipline:
                  </p>
                  <ul className="space-y-1.5 mb-6 ml-1">
                    {['Economia serviciilor', 'Turism și agroturism', 'Alimentație publică', 'Îndrumare pentru realizarea lucrărilor de licență'].map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-[#5a4a20]">
                        <span className="text-[#92400e] mt-0.5">&#8226;</span>
                        <span className="font-hand text-base sm:text-lg">{d}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t pt-5" style={{ borderColor: 'rgba(120,100,40,0.2)' }}>
                    <p className="font-hand text-base sm:text-lg text-[#6b5a30] leading-relaxed mb-2">
                      Sunt licențiată a Institutului de Petrol și Gaze – Facultatea de Economie
                      și am master în Audit financiar și consiliere.
                    </p>
                    <p className="font-hand text-base sm:text-lg text-[#78650e] leading-relaxed">
                      Am experiență îndelungată în predare și explic materia clar, pe înțelesul
                      tuturor, adaptându-mă nevoilor fiecărui student.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="flex items-center" style={{ height: `${L}px` }}>
              <svg className="w-full h-3" viewBox="0 0 800 12" preserveAspectRatio="none">
                <path d="M0 4 Q200 10, 400 2 T800 8" stroke="#c4b89a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* 2 empty lines */}
            <div style={{ height: `${L * 2}px` }} />

            {/* Materiile noastre */}
            <h2 className="font-hand text-3xl sm:text-4xl text-ink" style={{ lineHeight: `${L}px`, paddingTop: `${L}px` }}>
              Materiile noastre
            </h2>
            <p className="text-ink-lighter text-[15px] sm:text-base max-w-lg" style={{ lineHeight: `${L}px` }}>
              Pregătire specializată pentru fiecare materie, adaptată nevoilor tale.
            </p>

            {/* 1 empty line */}
            <div style={{ height: `${L}px` }} />

            {/* Polaroid grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-12" style={{ marginBottom: `${L * 2}px` }}>
              {[
                { title: 'Economia serviciilor', img: '/images/economia-serviciilor.jpg', rotate: '-2deg' },
                { title: 'Turism și agroturism', img: '/images/turism.jpg', rotate: '1.5deg' },
                { title: 'Alimentație publică', img: '/images/alimentatie.jpg', rotate: '-1deg' },
                { title: 'Lucrări de licență', img: '/images/licenta.jpg', rotate: '2.5deg' },
              ].map((materie) => (
                <div key={materie.title} className="relative group cursor-default" style={{ transform: `rotate(${materie.rotate})` }}>
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-20 h-7 rounded-sm"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,235,180,0.7) 0%, rgba(240,220,160,0.5) 100%)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(200,180,130,0.3)',
                    }}
                  />
                  <div className="bg-white p-2 pb-4 shadow-[2px_3px_12px_rgba(0,0,0,0.12)] hover:shadow-[3px_5px_20px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-300 border border-sketch-light">
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-desk">
                      <img src={materie.img} alt={materie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <p className="font-hand text-xl sm:text-2xl text-ink text-center mt-3 px-2">{materie.title}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className="flex items-center" style={{ height: `${L}px` }}>
              <svg className="w-full h-3" viewBox="0 0 800 12" preserveAspectRatio="none">
                <path d="M0 6 Q200 10, 400 4 T800 8" stroke="#c4b89a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* 2 empty lines */}
            <div style={{ height: `${L * 2}px` }} />

            {/* CTA */}
            <div ref={ctaRef} className="text-center">
              <h2 className="font-hand text-4xl sm:text-5xl text-ink" style={{ lineHeight: `${L}px`, paddingTop: `${L}px` }}>
                Pregătit să începi?
              </h2>

              <div style={{ height: `${L}px` }} />

              <p className="text-ink-lighter text-[15px] sm:text-base max-w-md mx-auto" style={{ lineHeight: `${L}px` }}>
                Alătură-te elevilor care învață eficient cu lecții structurate,
                sesiuni live și feedback personalizat.
              </p>

              <div style={{ height: `${L}px` }} />

              <Link
                href="/auth/register"
                className="inline-block font-hand text-xl sm:text-2xl bg-sketch-dark text-paper px-10 rounded-md hover:bg-ink transition-all active:scale-[0.98] hover:shadow-lg"
                style={{ lineHeight: `${L}px`, height: `${L}px` }}
              >
                Creează cont gratuit →
              </Link>
            </div>

            {/* 4 empty lines */}
            <div style={{ height: `${L * 4}px` }} />

            {/* Footer */}
            <footer ref={footerRef} className="border-t-2 border-dashed border-sketch" style={{ paddingTop: `${L}px`, paddingBottom: `${L * 2}px` }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8">
                <div>
                  <h4 className="font-hand text-xl text-sketch-dark" style={{ lineHeight: `${L}px` }}>TutorPlatform</h4>
                  <p className="text-sm text-ink-lighter" style={{ lineHeight: `${L}px` }}>Lecții private și de grup online.</p>
                  <p className="text-sm text-ink-lighter" style={{ lineHeight: `${L}px` }}>Învață de oriunde, oricând.</p>
                </div>
                <div>
                  <h4 className="font-hand text-xl text-sketch-dark" style={{ lineHeight: `${L}px` }}>Linkuri rapide</h4>
                  <p style={{ lineHeight: `${L}px` }}><Link href="/auth/login" className="text-sm text-ink-lighter hover:text-ink transition-colors">Autentificare</Link></p>
                  <p style={{ lineHeight: `${L}px` }}><Link href="/auth/register" className="text-sm text-ink-lighter hover:text-ink transition-colors">Înregistrare</Link></p>
                </div>
                <div>
                  <h4 className="font-hand text-xl text-sketch-dark" style={{ lineHeight: `${L}px` }}>Contact</h4>
                  <p className="text-sm text-ink-lighter" style={{ lineHeight: `${L}px` }}>contact@tutorplatform.com</p>
                  <p className="text-sm text-ink-lighter" style={{ lineHeight: `${L}px` }}>Luni – Vineri, 9:00 – 18:00</p>
                </div>
              </div>
              <div style={{ height: `${L}px` }} />
              <p className="text-center text-xs text-ink-muted" style={{ lineHeight: `${L}px` }}>
                &copy; {new Date().getFullYear()} TutorPlatform. Toate drepturile rezervate.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
