import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-700">TutorPlatform</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Learn from the best,{' '}
            <span className="text-primary-600">anytime.</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Access private lessons, video materials, live sessions, and more.
            Your personal learning journey starts here.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold text-lg"
            >
              Start Learning
            </Link>
            <Link
              href="/lessons"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-100 font-semibold text-lg"
            >
              Browse Lessons
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} TutorPlatform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
