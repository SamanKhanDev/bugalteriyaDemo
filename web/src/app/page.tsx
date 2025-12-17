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
      <header className="w-full px-6 py-6 flex justify-between items-center z-50 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-cyan-500/20">
            B
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Bugalteriya.uz</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/auth/login" className="hidden md:block px-6 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Kirish
          </Link>
          <Link href="/auth/register" className="px-6 py-2.5 text-sm font-medium bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-all shadow-lg shadow-white/10 flex items-center gap-2">
            Boshlash <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 z-10 max-w-5xl mx-auto mt-10 mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Yangi guruhlar qabuli boshlandi</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-400 leading-tight">
          Buxgalteriya hisobini <br />
          <span className="text-cyan-400">Mukammal O'rganing</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Nazariya va amaliyot birlashgan zamonaviy platforma. Video darslar, interaktiv testlar va real loyihalar orqali malakangizni oshiring.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/auth/register" className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            Hoziroq Boshlash <ArrowRight size={20} />
          </Link>
          <Link href="#features" className="px-8 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl font-semibold text-slate-300 hover:bg-slate-800 transition-all backdrop-blur-sm flex items-center justify-center gap-2">
            Batafsil Ma'lumot
          </Link>
        </div>

        {/* Stats */}
        <LandingStats />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-900/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Nima uchun aynan biz?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Bizning platforma orqali siz buxgalteriya sohasini noldan boshlab professional darajagacha o'rganishingiz mumkin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-colors group">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="text-cyan-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Mukammal Dastur</h3>
              <p className="text-slate-400 leading-relaxed">
                Boshlang'ich tushunchalardan tortib murakkab hisobotlargacha bo'lgan barcha mavzularni qamrab oluvchi tizimlashtirilgan o'quv dasturi.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition-colors group">
              <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart2 className="text-purple-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Interaktiv Praktika</h3>
              <p className="text-slate-400 leading-relaxed">
                Shunchaki video ko'rish emas, balki har bir mavzu bo'yicha real testlar va amaliy topshiriqlar orqali bilimingizni mustahkamlang.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 hover:border-green-500/50 transition-colors group">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="text-green-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">O'z Vaqtingizda</h3>
              <p className="text-slate-400 leading-relaxed">
                Qat'iy grafik yo'q. O'zingizga qulay vaqtda va tezlikda o'qing. Platforma 24/7 sizning xizmatingizda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 md:p-20 text-center border border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute top-[-50%] left-[-20%] w-[70%] h-[70%] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Kelajak kasbini bugun o'rganing
            </h2>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
              Minglab o'quvchilar biz bilan o'z karyerasini boshlashdi. Siz ham ular safiga qo'shiling va professional buxgalter bo'ling.
            </p>
            <Link href="/auth/register" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all shadow-xl shadow-white/10 transform hover:scale-105">
              Ro'yxatdan O'tish <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              B
            </div>
            <span className="font-bold text-lg text-white">Bugalteriya.uz</span>
          </div>
          <div className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Barcha huquqlar himoyalangan. 
            <br>
              <span>INSYSTEM.uz Tomonidan ishlab chiqilgan. </span>
            </br>
          </div>
        </div>
      </footer>
    </main>
  );
}
