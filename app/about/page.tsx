import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            TestApp
          </div>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 text-purple-600 dark:text-purple-400 font-medium border-b-2 border-purple-600 dark:border-purple-400"
            >
              About
            </Link>
            <Link
              href="/services"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
            >
              Services
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
            >
              Contact
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              About Us
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Learn more about our mission, values, and what makes us unique.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                Our Mission
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We are dedicated to creating exceptional digital experiences
                that combine innovation, design, and functionality. Our goal is
                to build products that make a positive impact on users' lives.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                Our Values
              </h2>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">
                    ✓
                  </span>
                  <span>User-centric design</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">
                    ✓
                  </span>
                  <span>Continuous innovation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">
                    ✓
                  </span>
                  <span>Transparency and honesty</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">
                    ✓
                  </span>
                  <span>Quality over quantity</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-white shadow-xl mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Us?</h2>
            <p className="text-lg opacity-90 leading-relaxed mb-6">
              We combine cutting-edge technology with beautiful design to
              deliver solutions that not only work flawlessly but also delight
              users. Our team is passionate about creating digital experiences
              that matter.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div>
                <div className="text-3xl font-bold mb-2">100+</div>
                <div className="opacity-90">Happy Clients</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">50+</div>
                <div className="opacity-90">Projects Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">5+</div>
                <div className="opacity-90">Years Experience</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
