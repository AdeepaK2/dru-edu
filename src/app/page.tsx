import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01143d] via-[#0a2147] to-[#0088e0] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium border border-white/30">
              🏆 Melbourne's Premier Education Centre
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-8 leading-tight">
            Excel in Your
            <span className="block bg-gradient-to-r from-[#0088e0] to-[#00b4d8] bg-clip-text text-transparent">
              Studies
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Transform your academic journey with personalized coaching, expert guidance, 
            and proven methods that unlock your true potential.
          </p>
          <div className="flex justify-center">
            <Link 
              href="/enroll" 
              className="group bg-gradient-to-r from-[#0088e0] to-[#00b4d8] hover:from-[#0066b3] hover:to-[#0088e0] text-white font-semibold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-[#0088e0]/25"
            >
              <span className="flex items-center space-x-2">
                <span>Enroll Now</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-32 h-32 bg-[#0088e0]/20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute top-1/2 right-8 w-16 h-16 bg-white/5 rounded-full blur-lg animate-pulse delay-300"></div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block bg-gradient-to-r from-[#01143d] to-[#0088e0] bg-clip-text text-transparent text-sm font-semibold uppercase tracking-wider mb-4">
              Why Choose Us
            </div>
            <h2 className="text-5xl font-bold text-[#01143d] mb-6">Why Choose Dr. U Education?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We provide comprehensive coaching with a proven track record of student success
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group text-center p-8 rounded-2xl border border-gray-100 hover:border-[#0088e0]/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50/50">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0088e0] to-[#00b4d8] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#01143d] mb-4 group-hover:text-[#0088e0] transition-colors">Expert Teachers</h3>
              <p className="text-gray-600 leading-relaxed">Qualified educators with years of teaching experience and deep subject knowledge</p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl border border-gray-100 hover:border-[#0088e0]/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50/50">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0088e0] to-[#00b4d8] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#01143d] mb-4 group-hover:text-[#0088e0] transition-colors">Proven Results</h3>
              <p className="text-gray-600 leading-relaxed">Track record of high ATAR scores and successful university placements</p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl border border-gray-100 hover:border-[#0088e0]/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50/50">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0088e0] to-[#00b4d8] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#01143d] mb-4 group-hover:text-[#0088e0] transition-colors">Personalized Learning</h3>
              <p className="text-gray-600 leading-relaxed">Tailored approach to meet each student's unique learning style and needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" className="py-24 bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block bg-gradient-to-r from-[#01143d] to-[#0088e0] bg-clip-text text-transparent text-sm font-semibold uppercase tracking-wider mb-4">
              Our Subjects
            </div>
            <h2 className="text-5xl font-bold text-[#01143d] mb-6">VCE Subjects We Offer</h2>
            <p className="text-xl text-gray-600 leading-relaxed">Comprehensive coaching across all major VCE subjects</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Mathematics Methods", icon: "📊", color: "from-blue-500 to-cyan-500" },
              { name: "Specialist Mathematics", icon: "🔢", color: "from-purple-500 to-pink-500" },
              { name: "Physics", icon: "⚡", color: "from-yellow-500 to-orange-500" },
              { name: "Chemistry", icon: "🧪", color: "from-green-500 to-teal-500" },
              { name: "Biology", icon: "🧬", color: "from-red-500 to-pink-500" },
              { name: "Further Mathematics", icon: "�", color: "from-indigo-500 to-blue-500" },
              { name: "Psychology", icon: "🧠", color: "from-rose-500 to-red-500" },
              { name: "English", icon: "📚", color: "from-gray-600 to-gray-800" }
            ].map((subject, index) => (
              <div key={index} className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-[#0088e0]/30">
                <div className={`w-16 h-16 bg-gradient-to-br ${subject.color} rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <span className="text-3xl">{subject.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-[#01143d] text-center group-hover:text-[#0088e0] transition-colors">{subject.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#01143d] mb-4">Student Success Stories</h2>
            <p className="text-xl text-gray-600">Hear from our successful VCE graduates</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-[#0088e0]">
                  {"★".repeat(5)}
                </div>
              </div>
              <p className="text-gray-600 mb-4 italic">
                "Dr. U Education helped me achieve a 99+ ATAR. The personalized attention and expert teaching made all the difference."
              </p>
              <div className="font-semibold text-[#01143d]">- Sarah M., University of Melbourne</div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-[#0088e0]">
                  {"★".repeat(5)}
                </div>
              </div>
              <p className="text-gray-600 mb-4 italic">
                "The Math Methods course was exceptional. I went from struggling to excelling in just one semester."
              </p>
              <div className="font-semibold text-[#01143d]">- James L., Monash University</div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-[#0088e0]">
                  {"★".repeat(5)}
                </div>
              </div>
              <p className="text-gray-600 mb-4 italic">
                "Amazing support for Physics and Chemistry. The teachers really know how to explain complex concepts clearly."
              </p>
              <div className="font-semibold text-[#01143d]">- Emily R., RMIT University</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-[#01143d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Excel in VCE?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Join thousands of successful students who have achieved their dreams with Dr. U Education
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link 
              href="/enroll" 
              className="bg-[#0088e0] hover:bg-[#0066b3] text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Enroll Now
            </Link>
            <a 
              href="tel:+61234567890" 
              className="border-2 border-white hover:bg-white hover:text-[#01143d] text-white font-semibold py-4 px-8 rounded-full transition-all duration-300"
            >
              Call Us Today
            </a>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-white">
            <div>
              <h3 className="text-lg font-semibold mb-2">Location</h3>
              <p className="text-white/80">Melbourne, Victoria</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Phone</h3>
              <p className="text-white/80">+61 234 567 890</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Email</h3>
              <p className="text-white/80">info@drueducation.com.au</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/60">
            © 2025 Dr. U Education. All rights reserved. | VCE Math & Science Coaching Melbourne
          </p>
        </div>
      </footer>
    </div>
  );
}
