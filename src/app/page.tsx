import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary-700">
            TutorPlatform
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-primary-50 text-primary-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Private & Group Lessons Online
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Master any subject with{' '}
            <span className="text-primary-600">personalized tutoring</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Get access to high-quality lessons, video materials, live sessions via Google Meet,
            and direct feedback on your homework. Learn at your own pace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto bg-primary-600 text-white px-8 py-3.5 rounded-xl hover:bg-primary-700 font-semibold text-lg transition-colors"
            >
              Start Learning
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why learn with us?
            </h2>
            <p className="text-gray-500 text-lg">
              With years of teaching experience, I provide a structured, personalized approach
              to help you achieve your learning goals — whether you&apos;re a beginner or advanced.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Lessons</h3>
              <p className="text-gray-500">
                Watch high-quality recorded lessons anytime. Rewind, pause, and learn at your pace.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Sessions</h3>
              <p className="text-gray-500">
                Join live Google Meet sessions for real-time interaction, Q&A, and group discussions.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Homework Review</h3>
              <p className="text-gray-500">
                Submit homework and receive personal feedback to track your progress and improve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 max-w-lg mx-auto">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-700 text-xs font-bold">1</span>
                </div>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Create an account</span> — register and request access to the platform.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-700 text-xs font-bold">2</span>
                </div>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Get approved</span> — once your payment is confirmed, you get full access.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-700 text-xs font-bold">3</span>
                </div>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Start learning</span> — access your groups, lessons, assignments, and live meetings.
                </p>
              </li>
            </ul>
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link
                href="/auth/register"
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 font-semibold transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-bold text-primary-700 mb-3">TutorPlatform</h4>
              <p className="text-sm text-gray-500">
                Private and group lessons online. Learn from anywhere, at any time.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/auth/login" className="hover:text-gray-700">Log in</Link></li>
                <li><Link href="/auth/register" className="hover:text-gray-700">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>contact@tutorplatform.com</li>
                <li>Mon - Fri, 9:00 - 18:00</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-100 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} TutorPlatform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
