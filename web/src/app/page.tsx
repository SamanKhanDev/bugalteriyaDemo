import Link from "next/link";
import { ArrowRight, BookOpen, BarChart2, Clock } from "lucide-react";
import LandingStats from "@/components/home/LandingStats";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950 text-slate-100 selection:bg-cyan-500/30">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <header className="w-full px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center z-50 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl text-white shadow-lg shadow-cyan-500/20">
            B
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight text-white">Bugalteriya.uz</span>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          <Link href="/auth/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Kirish
          </Link>
          <Link href="/auth/register" className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-all shadow-lg shadow-white/10 flex items-center gap-1.5 sm:gap-2">
            Boshlash <ArrowRight size={14} className="sm:w-4 sm:h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 z-10 max-w-5xl mx-auto mt-8 sm:mt-16 mb-16 sm:mb-24">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm mb-6 sm:mb-8 animate-fade-in-up">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-medium text-slate-300 uppercase tracking-wider">Yangi guruhlar qabuli boshlandi</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-400 leading-tight">
          Buxgalteriya hisobini <br className="hidden sm:block" />
          <span className="text-cyan-400"> Mukammal O'rganing</span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mb-8 sm:mb-10 leading-relaxed">
          Nazariya va amaliyot birlashgan zamonaviy platforma. Video darslar, interaktiv testlar va real loyihalar orqali malakangizni oshiring.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link href="/auth/register" className="px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            Hoziroq Boshlash <ArrowRight size={20} />
          </Link>
          <Link href="#features" className="px-6 sm:px-8 py-3.5 sm:py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl font-semibold text-slate-300 hover:bg-slate-800 transition-all backdrop-blur-sm flex items-center justify-center gap-2">
            Batafsil Ma'lumot
          </Link>
        </div>

        {/* Stats */}
        <div className="w-full">
          <LandingStats />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-slate-900/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">Nima uchun aynan biz?</h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Bizning platforma orqali siz buxgalteriya sohasini noldan boshlab professional darajagacha o'rganishingiz mumkin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 hover:border-cyan-500/50 transition-colors group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="text-cyan-400" size={28} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Mukammal Dastur</h3>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Boshlang'ich tushunchalardan tortib murakkab hisobotlargacha bo'lgan barcha mavzularni qamrab oluvchi tizimlashtirilgan o'quv dasturi.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart2 className="text-purple-400" size={28} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Interaktiv Praktika</h3>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Shunchaki video ko'rish emas, balki har bir mavzu bo'yicha real testlar va amaliy topshiriqlar orqali bilimingizni mustahkamlang.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 hover:border-green-500/50 transition-colors group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="text-green-400" size={28} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3">O'z Vaqtingizda</h3>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Qat'iy grafik yo'q. O'zingizga qulay vaqtda va tezlikda o'qing. Platforma 24/7 sizning xizmatingizda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-20 text-center border border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute top-[-50%] left-[-20%] w-[70%] h-[70%] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-6">
              Kelajak kasbini bugun o'rganing
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Minglab o'quvchilar biz bilan o'z karyerasini boshlashdi. Siz ham ular safiga qo'shiling va professional buxgalter bo'ling.
            </p>
            <Link href="/auth/register" className="inline-flex items-center gap-2 px-6 sm:px-10 py-3.5 sm:py-5 bg-white text-slate-900 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:bg-slate-100 transition-all shadow-xl shadow-white/10 transform hover:scale-105">
              Ro'yxatdan O'tish <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              B
            </div>
            <span className="font-bold text-lg text-white">Bugalteriya.uz</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3">
            <span className="text-slate-500 text-sm text-center md:text-right">
              &copy; {new Date().getFullYear()} Barcha huquqlar himoyalangan.
            </span>

            <a
              href="https://insystem.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/40 border border-slate-800/50 hover:border-cyan-500/30 hover:bg-slate-900/80 transition-all duration-300 hover:shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>

              <span className="text-[10px] sm:text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                <span className="font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:via-blue-300 group-hover:to-purple-300 transition-all duration-300 text-xs sm:text-sm">
                  Insystem.uz
                </span>
                <span className="ml-1">IT digital group tomonidan ishlangan</span>
              </span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
