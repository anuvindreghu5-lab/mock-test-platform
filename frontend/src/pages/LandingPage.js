import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const bannerSlides = [
    { title: "SSC JE Tier-I 2026", subtitle: "15 Full Length Tests • Bilingual • Based on Latest Pattern", badge: "🏗️ Engineering", bg: "from-slate-900 via-blue-950 to-slate-900", accent: "from-blue-400 to-cyan-300", tag: "NEW" },
    { title: "JEE Main 2026", subtitle: "1800+ Questions • Chapter-wise Tests • Full Mock Series", badge: "⚛️ Physics · Chemistry · Math", bg: "from-slate-900 via-indigo-950 to-slate-900", accent: "from-indigo-400 to-purple-300", tag: "TRENDING" },
    { title: "NEET UG 2026", subtitle: "2000+ Questions • Biology Focus • NTA Pattern", badge: "🏥 Medical Entrance", bg: "from-slate-900 via-emerald-950 to-slate-900", accent: "from-emerald-400 to-teal-300", tag: "POPULAR" },
    { title: "UPSC CSE 2026", subtitle: "3000+ Questions • Prelims & Mains • Current Affairs", badge: "🏛️ Civil Services", bg: "from-slate-900 via-orange-950 to-slate-900", accent: "from-orange-400 to-amber-300", tag: "HOT" },
    { title: "Kerala PSC 2026", subtitle: "2500+ Questions • Previous Year Papers • Malayalam & English", badge: "📋 State PSC", bg: "from-slate-900 via-red-950 to-slate-900", accent: "from-red-400 to-rose-300", tag: "UPDATED" },
  ];

  const upcomingExamsList = [
    { icon: "⚛️", name: "JEE Advanced 2026", fullName: "Joint Entrance Examination Advanced", date: "18 May 2026", daysLeft: 0, status: "Today!", statusColor: "from-red-500 to-rose-400", border: "border-red-500/30", subjects: "Physics · Chemistry · Math", tests: "10 Full Tests" },
    { icon: "🏥", name: "NEET UG 2026", fullName: "National Eligibility cum Entrance Test", date: "04 Jun 2026", daysLeft: 16, status: "In 16 Days", statusColor: "from-orange-500 to-amber-400", border: "border-orange-500/30", subjects: "Physics · Chemistry · Biology", tests: "15 Full Tests" },
    { icon: "🏛️", name: "UPSC Prelims 2026", fullName: "Union Public Service Commission", date: "25 May 2026", daysLeft: 6, status: "In 6 Days", statusColor: "from-yellow-500 to-amber-400", border: "border-yellow-500/30", subjects: "GS Paper I · CSAT", tests: "20 Full Tests" },
    { icon: "🚂", name: "SSC JE Tier-I 2026", fullName: "Staff Selection Commission Junior Engineer", date: "10 Jun 2026", daysLeft: 22, status: "In 22 Days", statusColor: "from-blue-500 to-cyan-400", border: "border-blue-500/30", subjects: "Technical · Reasoning · GK", tests: "15 Full Tests" },
    { icon: "📋", name: "Kerala PSC LDC 2026", fullName: "Kerala Public Service Commission", date: "22 Jun 2026", daysLeft: 34, status: "In 34 Days", statusColor: "from-red-500 to-rose-400", border: "border-red-500/30", subjects: "GK · Malayalam · Aptitude", tests: "12 Full Tests" },
    { icon: "🏦", name: "IBPS PO 2026", fullName: "Institute of Banking Personnel Selection", date: "15 Jul 2026", daysLeft: 57, status: "In 57 Days", statusColor: "from-teal-500 to-cyan-400", border: "border-teal-500/30", subjects: "Quant · Reasoning · English", tests: "18 Full Tests" },
  ];

  const examCategoryCards = [
    { icon: "⚛️", name: "JEE Main", desc: "Joint Entrance Examination", questions: "1800+ Questions", color: "from-blue-500 to-cyan-400", border: "border-blue-500/30" },
    { icon: "🏥", name: "NEET", desc: "National Eligibility cum Entrance Test", questions: "2000+ Questions", color: "from-green-500 to-emerald-400", border: "border-green-500/30" },
    { icon: "🏛️", name: "UPSC", desc: "Union Public Service Commission", questions: "3000+ Questions", color: "from-orange-500 to-amber-400", border: "border-orange-500/30" },
    { icon: "📋", name: "Kerala PSC", desc: "Kerala Public Service Commission", questions: "2500+ Questions", color: "from-red-500 to-rose-400", border: "border-red-500/30" },
    { icon: "🎓", name: "KEAM", desc: "Kerala Engineering Architecture Medical", questions: "1500+ Questions", color: "from-purple-500 to-violet-400", border: "border-purple-500/30" },
    { icon: "🚂", name: "SSC / Railway", desc: "Staff Selection Commission & RRB", questions: "4000+ Questions", color: "from-yellow-500 to-orange-400", border: "border-yellow-500/30" },
    { icon: "🏦", name: "Banking", desc: "IBPS, SBI PO & Clerk Exams", questions: "2200+ Questions", color: "from-teal-500 to-cyan-400", border: "border-teal-500/30" },
    { icon: "🎯", name: "GATE", desc: "Graduate Aptitude Test in Engineering", questions: "1200+ Questions", color: "from-pink-500 to-rose-400", border: "border-pink-500/30" },
  ];

  const features = [
    { icon: "⏱️", title: "Real Exam Timer", desc: "Experience actual exam pressure with our precision countdown timer that auto-submits when time ends." },
    { icon: "📊", title: "Detailed Analysis", desc: "Get subject-wise performance breakdown with visual progress bars and accuracy metrics." },
    { icon: "🎯", title: "Smart Question Palette", desc: "Track answered, skipped, and reviewed questions with our color-coded question navigator." },
    { icon: "📈", title: "Progress Tracking", desc: "Monitor your improvement over time with comprehensive result history and score trends." },
    { icon: "✅", title: "Instant Results", desc: "Get detailed results immediately after submission with correct answers and explanations." },
    { icon: "📱", title: "Mobile Friendly", desc: "Practice anywhere, anytime on any device with our fully responsive design." },
  ];

  const stats = [
    { value: "10,000+", label: "Questions" },
    { value: "8+", label: "Exam Categories" },
    { value: "100%", label: "Free Access" },
    { value: "24/7", label: "Available" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Smooth scroll to section by ID
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 70; // navbar height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0a0f1e]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl" : "bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/5"}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">

          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection("home")}>
                        <img src="/logo.png" alt="logo" className="w-10 h-10" />

            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none">RankAura</h1>
              <p className="text-xs text-cyan-400 tracking-widest">EXAM PORTAL</p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <button onClick={() => scrollToSection("home")} className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/8 rounded-xl transition-all">
              Home
            </button>
            <button onClick={() => scrollToSection("exam-categories")} className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/8 rounded-xl transition-all">
              Exam Categories
            </button>
            <button onClick={() => scrollToSection("upcoming-exams")} className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/8 rounded-xl transition-all">
              Upcoming Exam
            </button>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="hidden sm:block px-5 py-2 text-sm font-semibold text-white/80 hover:text-white transition-colors">
              Login
            </button>
            <button onClick={() => navigate("/register")} className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl hover:opacity-90 transition-all hover:scale-105">
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* ── BANNER CAROUSEL ── */}
      <div className="pt-[64px]">
        <div className="relative w-full overflow-hidden" style={{ height: "320px" }}>
          {bannerSlides.map((s, i) => (
            <div
              key={i}
              className={`absolute inset-0 bg-gradient-to-r ${s.bg} flex items-center`}
              style={{
                opacity: i === activeSlide ? 1 : 0,
                transform: i === activeSlide ? "translateX(0)" : i < activeSlide ? "translateX(-100%)" : "translateX(100%)",
                transition: "opacity 0.7s ease, transform 0.7s ease",
                zIndex: i === activeSlide ? 1 : 0,
              }}
            >
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
              <div className="absolute top-0 right-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
              <div className="relative z-10 max-w-7xl mx-auto px-8 w-full flex items-center justify-between gap-8">
                <div className="flex-1">
                  <span className={`inline-block mb-3 px-3 py-1 text-xs font-black tracking-widest rounded-full bg-gradient-to-r ${s.accent} text-[#0a0f1e]`}>{s.tag}</span>
                  <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-3">{s.title}</h2>
                  <p className="text-white/60 text-sm md:text-base mb-4">{s.subtitle}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-white">{s.badge}</span>
                    <button onClick={() => navigate("/register")} className={`px-6 py-2 rounded-xl text-sm font-bold bg-gradient-to-r ${s.accent} text-[#0a0f1e] hover:opacity-90 transition-all hover:scale-105`}>
                      Start Free Test →
                    </button>
                  </div>
                </div>
                <div className="hidden md:flex">
                  <span className={`text-[120px] font-black leading-none bg-gradient-to-br ${s.accent} bg-clip-text text-transparent opacity-20 select-none`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <button onClick={() => setActiveSlide((activeSlide - 1 + bannerSlides.length) % bannerSlides.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center hover:bg-black/60 transition-all backdrop-blur-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => setActiveSlide((activeSlide + 1) % bannerSlides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center hover:bg-black/60 transition-all backdrop-blur-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {bannerSlides.map((_, i) => (
              <button key={i} onClick={() => setActiveSlide(i)} className={`transition-all duration-300 rounded-full ${i === activeSlide ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`} />
            ))}
          </div>
        </div>

        {/* Notification bar */}
        <div className="w-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-y border-amber-500/20 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">📢</span>
            <p className="text-sm text-white/70">Stay tuned with latest updates on your competitive exams</p>
          </div>
          <button className="shrink-0 px-4 py-1.5 bg-amber-500 text-[#0a0f1e] text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors">Allow Notifications</button>
        </div>
      </div>

      {/* ── HOME / HERO ── */}
      <section id="home" className="relative py-20 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 text-sm text-blue-300 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            100% Free Mock Tests — No Registration Fee
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Ace Your Exams with
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">RankAura</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Practice with real exam-style mock tests for JEE, NEET, UPSC, Kerala PSC and more. Get instant results with detailed analysis completely free!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/register")} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl text-lg font-bold hover:opacity-90 transition-all hover:scale-105 shadow-2xl shadow-blue-500/30">
              Start Practicing Free →
            </button>
            <button onClick={() => navigate("/login")} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-lg font-bold hover:bg-white/10 transition-all backdrop-blur-sm">
              Login to Dashboard
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-2xl md:text-3xl font-black text-cyan-400">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXAM CATEGORIES ── */}
      <section id="exam-categories" className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Exam <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Categories</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Choose from a wide range of competitive exams and start practicing today</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {examCategoryCards.map((exam) => (
              <div key={exam.name} onClick={() => navigate("/register")} className={`bg-white/5 border ${exam.border} rounded-2xl p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl group`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${exam.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>{exam.icon}</div>
                <h3 className="text-xl font-black text-white mb-1">{exam.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{exam.desc}</p>

{/* Add this below */}
<button className="mt-4 w-full py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-400 text-[#0a0f1e] hover:opacity-90 transition-all">
  START →
</button>
                <div className={`inline-flex items-center gap-1 text-xs font-semibold bg-gradient-to-r ${exam.color} bg-clip-text text-transparent`}>📚 {exam.questions}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={() => navigate("/register")} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl text-lg font-bold hover:opacity-90 transition-all hover:scale-105">
              Start Free Practice →
            </button>
          </div>
        </div>
      </section>

      {/* ── UPCOMING EXAMS ── */}
      <section id="upcoming-exams" className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/15 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Upcoming <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">Exams</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Stay prepared — know your exam dates and start practicing now</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingExamsList.map((exam) => (
              <div key={exam.name} onClick={() => navigate("/register")} className={`bg-white/5 border ${exam.border} rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group cursor-pointer`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${exam.statusColor} flex items-center justify-center text-xl shrink-0`}>{exam.icon}</div>
                    <div>
                      <h3 className="text-base font-black text-white leading-tight">{exam.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{exam.fullName}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 ml-2 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${exam.statusColor} text-[#0a0f1e]`}>{exam.status}</span>
                </div>

                <div className="border-t border-white/8 mb-4" />

                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-1.5 text-white/60">
                    <span>📅</span><span>{exam.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/60">
                    <span>📚</span><span>{exam.tests}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">{exam.subjects}</p>

                {/* Urgency bar */}
                

                <button className="mt-4 w-full py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 text-[#0a0f1e] hover:opacity-90 transition-all">
Practice Now →
</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">RankAura?</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Everything you need to crack your competitive exam</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all hover:border-blue-500/30 group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              How It <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Works</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Account", desc: "Register for free in seconds. No credit card required.", icon: "👤" },
              { step: "02", title: "Choose Exam", desc: "Select your target exam from our wide range of categories.", icon: "🎯" },
              { step: "03", title: "Start Practicing", desc: "Take mock tests and get instant detailed analysis.", icon: "🚀" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-2xl mx-auto mb-4">{item.icon}</div>
                <div className="text-5xl font-black text-white/5 mb-2">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-2 -mt-8">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/30 border border-blue-500/20 rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Ready to <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">RankAura?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">Join thousands of students preparing smarter with RankAura. 100% free, forever!</p>
            <button onClick={() => navigate("/register")} className="px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl text-xl font-bold hover:opacity-90 transition-all hover:scale-105 shadow-2xl shadow-blue-500/30">
              Get Started Free →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="logo" className="w-10 h-10" />

            <span className="font-bold text-white">RankAura</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 RankAura. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;