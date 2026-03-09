import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#e8e0d0]">
      {/* Notebook page container */}
      <div className="max-w-4xl mx-auto">
        <div
          className="min-h-screen bg-[#fdf6e3] shadow-[4px_4px_20px_rgba(0,0,0,0.15),-2px_0_10px_rgba(0,0,0,0.05)] relative"
          style={{
            backgroundImage: `
              repeating-linear-gradient(transparent, transparent 31px, #d4c9b0 31px, #d4c9b0 32px)
            `,
            backgroundPosition: '0 80px',
          }}
        >
          {/* Red margin line */}
          <div className="absolute left-12 sm:left-20 top-0 bottom-0 w-[2px] bg-red-400/40" />

          {/* Hole punches */}
          <div className="absolute left-3 sm:left-5 top-24 w-4 h-4 rounded-full bg-[#e8e0d0] border-2 border-[#c4b89a] shadow-inner" />
          <div className="absolute left-3 sm:left-5 top-[50%] w-4 h-4 rounded-full bg-[#e8e0d0] border-2 border-[#c4b89a] shadow-inner" />
          <div className="absolute left-3 sm:left-5 bottom-24 w-4 h-4 rounded-full bg-[#e8e0d0] border-2 border-[#c4b89a] shadow-inner" />

          {/* Content area - right of margin */}
          <div className="pl-16 sm:pl-24 pr-6 sm:pr-12">
            {/* Navbar */}
            <nav className="flex items-center justify-between py-6 relative z-10">
              <span className="font-hand text-2xl sm:text-3xl text-[#4a3f35] font-bold">
                TutorPlatform
              </span>
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  href="/auth/login"
                  className="font-hand text-lg text-[#6b5e50] hover:text-[#4a3f35] transition-colors"
                >
                  Autentificare
                </Link>
                <Link
                  href="/auth/register"
                  className="font-hand text-lg bg-[#4a3f35] text-[#fdf6e3] px-4 py-1.5 rounded hover:bg-[#3a302a] transition-colors"
                  style={{ border: '2px solid #4a3f35' }}
                >
                  Începe acum
                </Link>
              </div>
            </nav>

            {/* Hero */}
            <section className="pt-8 sm:pt-16 pb-12 sm:pb-20">
              {/* Pencil icon */}
              <div className="mb-6">
                <svg className="w-10 h-10 text-[#8b7d6b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </div>
              <h1 className="font-hand text-5xl sm:text-7xl lg:text-8xl text-[#3a302a] leading-[1.1] mb-4">
                Stăpânește orice{' '}
                <span className="relative inline-block">
                  materie
                  {/* Underline drawn effect */}
                  <svg className="absolute -bottom-1 left-0 w-full h-3" viewBox="0 0 200 12" preserveAspectRatio="none">
                    <path d="M2 8 Q50 2, 100 7 T198 5" stroke="#c44" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <h2 className="font-hand text-3xl sm:text-4xl text-[#6b5e50] mb-8">
                cu meditații personalizate
              </h2>
              <p className="text-[#8b7d6b] text-base sm:text-lg max-w-lg leading-relaxed mb-10" style={{ fontStyle: 'italic' }}>
                Accesează lecții de calitate, materiale video, sesiuni live prin Google Meet
                și feedback direct pe teme. Învață în ritmul tău.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/register"
                  className="font-hand text-xl text-center bg-[#4a3f35] text-[#fdf6e3] px-8 py-3 rounded hover:bg-[#3a302a] transition-all active:scale-[0.98]"
                  style={{ border: '2px solid #4a3f35' }}
                >
                  Începe să înveți →
                </Link>
                <Link
                  href="/auth/login"
                  className="font-hand text-xl text-center text-[#6b5e50] px-8 py-3 rounded hover:bg-[#f0e8d8] transition-all active:scale-[0.98]"
                  style={{ border: '2px dashed #c4b89a' }}
                >
                  Am deja cont
                </Link>
              </div>
            </section>

            {/* Separator - hand drawn line */}
            <div className="py-2">
              <svg className="w-full h-4" viewBox="0 0 800 16" preserveAspectRatio="none">
                <path d="M0 8 Q200 4, 400 10 T800 6" stroke="#c4b89a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* Stats */}
            <section className="py-10 sm:py-14">
              <div className="grid grid-cols-3 gap-4 sm:gap-8">
                {[
                  { value: '50+', label: 'Elevi activi' },
                  { value: '100+', label: 'Lecții' },
                  { value: '5+', label: 'Ani experiență' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-hand text-4xl sm:text-6xl text-[#4a3f35] font-bold">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-[#8b7d6b] mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Separator */}
            <div className="py-2">
              <svg className="w-full h-4" viewBox="0 0 800 16" preserveAspectRatio="none">
                <path d="M0 10 Q200 6, 400 12 T800 8" stroke="#c4b89a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* Features */}
            <section className="py-10 sm:py-14">
              <h2 className="font-hand text-3xl sm:text-5xl text-[#3a302a] mb-3">
                De ce să înveți cu noi?
              </h2>
              <p className="text-[#8b7d6b] mb-10 max-w-lg">
                O abordare structurată și personalizată care te ajută să-ți atingi obiectivele.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div
                  className="bg-[#fdf6e3] p-6 hover:-translate-y-1 transition-all duration-300 group"
                  style={{
                    border: '2px solid #c4b89a',
                    borderRadius: '2px 8px 4px 6px',
                  }}
                >
                  <div className="mb-4">
                    <svg className="w-10 h-10 text-[#6b5e50] group-hover:text-[#4a3f35] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-hand text-2xl text-[#3a302a] mb-2">Lecții video</h3>
                  <p className="text-sm text-[#8b7d6b] leading-relaxed">
                    Urmărește lecții înregistrate oricând. Dă înapoi, pune pauză și învață în ritmul tău.
                  </p>
                </div>

                {/* Card 2 */}
                <div
                  className="bg-[#fdf6e3] p-6 hover:-translate-y-1 transition-all duration-300 group"
                  style={{
                    border: '2px solid #c4b89a',
                    borderRadius: '6px 2px 8px 4px',
                  }}
                >
                  <div className="mb-4">
                    <svg className="w-10 h-10 text-[#6b5e50] group-hover:text-[#4a3f35] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="font-hand text-2xl text-[#3a302a] mb-2">Sesiuni live</h3>
                  <p className="text-sm text-[#8b7d6b] leading-relaxed">
                    Participă la sesiuni live pe Google Meet pentru interacțiune în timp real și discuții de grup.
                  </p>
                </div>

                {/* Card 3 */}
                <div
                  className="bg-[#fdf6e3] p-6 hover:-translate-y-1 transition-all duration-300 group"
                  style={{
                    border: '2px solid #c4b89a',
                    borderRadius: '4px 6px 2px 8px',
                  }}
                >
                  <div className="mb-4">
                    <svg className="w-10 h-10 text-[#6b5e50] group-hover:text-[#4a3f35] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-hand text-2xl text-[#3a302a] mb-2">Verificare teme</h3>
                  <p className="text-sm text-[#8b7d6b] leading-relaxed">
                    Trimite temele și primește feedback personalizat pentru a-ți urmări progresul.
                  </p>
                </div>
              </div>
            </section>

            {/* Separator */}
            <div className="py-2">
              <svg className="w-full h-4" viewBox="0 0 800 16" preserveAspectRatio="none">
                <path d="M0 6 Q200 12, 400 4 T800 10" stroke="#c4b89a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* How it works */}
            <section className="py-10 sm:py-14">
              <h2 className="font-hand text-3xl sm:text-5xl text-[#3a302a] mb-10">
                Cum funcționează
              </h2>

              <div className="space-y-6">
                {[
                  { num: '1', title: 'Creează un cont', desc: 'Înregistrează-te și solicită acces pe platformă.', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  { num: '2', title: 'Primește aprobarea', desc: 'Odată ce plata este confirmată, primești acces complet.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { num: '3', title: 'Începe să înveți', desc: 'Accesează grupurile, lecțiile, temele și întâlnirile live.', icon: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5' },
                ].map((step) => (
                  <div key={step.num} className="flex items-start gap-4 sm:gap-6">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center flex-shrink-0 bg-[#4a3f35] text-[#fdf6e3]"
                      style={{ borderRadius: '4px 8px 4px 8px' }}
                    >
                      <span className="font-hand text-2xl sm:text-3xl font-bold">{step.num}</span>
                    </div>
                    <div className="pt-1">
                      <h3 className="font-hand text-2xl sm:text-3xl text-[#3a302a] mb-1">{step.title}</h3>
                      <p className="text-sm text-[#8b7d6b]">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Separator */}
            <div className="py-2">
              <svg className="w-full h-4" viewBox="0 0 800 16" preserveAspectRatio="none">
                <path d="M0 8 Q200 14, 400 6 T800 10" stroke="#c4b89a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {/* CTA */}
            <section className="py-12 sm:py-20 text-center">
              <h2 className="font-hand text-4xl sm:text-6xl text-[#3a302a] mb-4">
                Pregătit să începi?
              </h2>
              <p className="text-[#8b7d6b] mb-8 max-w-md mx-auto">
                Alătură-te elevilor care învață eficient cu lecții structurate, sesiuni live și feedback personalizat.
              </p>
              <Link
                href="/auth/register"
                className="inline-block font-hand text-2xl bg-[#4a3f35] text-[#fdf6e3] px-10 py-4 rounded hover:bg-[#3a302a] transition-all active:scale-[0.98] hover:shadow-lg"
                style={{ border: '2px solid #4a3f35' }}
              >
                Creează cont gratuit →
              </Link>
            </section>

            {/* Footer */}
            <footer className="py-10 border-t-2 border-dashed border-[#c4b89a]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div>
                  <h4 className="font-hand text-2xl text-[#4a3f35] mb-2">TutorPlatform</h4>
                  <p className="text-sm text-[#8b7d6b]">
                    Lecții private și de grup online. Învață de oriunde, oricând.
                  </p>
                </div>
                <div>
                  <h4 className="font-hand text-lg text-[#4a3f35] mb-2">Linkuri rapide</h4>
                  <ul className="space-y-1 text-sm text-[#8b7d6b]">
                    <li><Link href="/auth/login" className="hover:text-[#4a3f35] transition-colors">Autentificare</Link></li>
                    <li><Link href="/auth/register" className="hover:text-[#4a3f35] transition-colors">Înregistrare</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-hand text-lg text-[#4a3f35] mb-2">Contact</h4>
                  <ul className="space-y-1 text-sm text-[#8b7d6b]">
                    <li>contact@tutorplatform.com</li>
                    <li>Luni - Vineri, 9:00 - 18:00</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-4 text-center text-xs text-[#b0a590]">
                &copy; {new Date().getFullYear()} TutorPlatform. Toate drepturile rezervate.
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
