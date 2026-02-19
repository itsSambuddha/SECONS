"use client";

import { useState, useEffect, useRef } from "react";

/* ============================
   ICON COMPONENTS (inline SVG)
   ============================ */
function IconCalendar({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconTrophy({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
function IconUsers({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconZap({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IconShield({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IconBarChart({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}
function IconMessageCircle({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
function IconMap({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  );
}
function IconArrowRight({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IconChevronDown({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function IconMenu({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
function IconX({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/* ============================
   ANIMATED COUNTER
   ============================ */
function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ============================
   FLOATING PARTICLES
   ============================ */
function FloatingParticles() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            borderRadius: "50%",
            background: i % 3 === 0
              ? "rgba(232, 160, 32, 0.3)"
              : i % 3 === 1
                ? "rgba(26, 60, 110, 0.2)"
                : "rgba(255, 255, 255, 0.15)",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${4 + Math.random() * 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ============================
   SECTION DATA
   ============================ */
const features = [
  {
    icon: IconCalendar,
    title: "Event Management",
    description: "Create, publish, and manage events with flyer uploads, registration links, and real-time status tracking.",
    color: "#2563EB",
  },
  {
    icon: IconTrophy,
    title: "Sports & Live Scoring",
    description: "Auto-generated fixtures for 18 teams — pool stage, knockout, or round-robin. Live scoreboard updates via WebSocket.",
    color: "#E8A020",
  },
  {
    icon: IconBarChart,
    title: "Leaderboard & Points",
    description: "Real-time leaderboard with overall, per-semester, and per-category breakdowns. Animated rank changes.",
    color: "#16A34A",
  },
  {
    icon: IconMessageCircle,
    title: "Communication Hub",
    description: "Role-based chat threads, announcement broadcasts, and meeting scheduler with instant notifications.",
    color: "#8B5CF6",
  },
  {
    icon: IconShield,
    title: "Finance Management",
    description: "Budget allocation, expense tracking, approval workflows, and PDF receipt generation for complete financial control.",
    color: "#DC2626",
  },
  {
    icon: IconUsers,
    title: "Team & Volunteer Ops",
    description: "Manage 18 competing teams, assign volunteers, track duties, and coordinate the entire organizing committee.",
    color: "#0EA5E9",
  },
  {
    icon: IconMap,
    title: "Campus Map & Directory",
    description: "Annotated campus maps with venue markers. Searchable contact directory for the entire organizing team.",
    color: "#F97316",
  },
  {
    icon: IconZap,
    title: "PDF Exports & Reports",
    description: "Export fixtures, leaderboards, itineraries, receipts, and finance summaries as print-ready PDFs.",
    color: "#EC4899",
  },
];

const stats = [
  { number: 18, suffix: "", label: "Competing Teams" },
  { number: 45, suffix: "+", label: "Events Managed" },
  { number: 5, suffix: "", label: "User Roles" },
  { number: 100, suffix: "%", label: "Digital Workflow" },
];

const roles = [
  { title: "General Animator", tier: "Tier 1", desc: "Super Admin — full platform control", count: "1 person", color: "#E8A020" },
  { title: "Joint General Animator", tier: "Tier 2", desc: "Domain leads — Sports, Cultural, Literary, etc.", count: "~8 people", color: "#2563EB" },
  { title: "Animator", tier: "Tier 3", desc: "Event managers — one or more per event", count: "45+ people", color: "#16A34A" },
  { title: "Volunteer", tier: "Tier 4", desc: "Ground-level helpers assigned to events", count: "Unlimited", color: "#8B5CF6" },
  { title: "Student", tier: "Tier 5", desc: "Participants — browse events & register", count: "Open", color: "#6B7280" },
];

const teams = [
  { group: "Commerce", depts: "Commerce (unified)", color: "#E8A020" },
  { group: "Professional", depts: "Computer Applications, Social Work PG & UG", color: "#2563EB" },
  { group: "Life Science", depts: "BioChem, BioTech, Botany, Env. Science, Zoology", color: "#16A34A" },
  { group: "Physical Science", depts: "Chemistry, CS, Electronics, Physics, Mathematics", color: "#DC2626" },
  { group: "Social Science", depts: "Economics, Pol. Sci., Psychology, Sociology", color: "#8B5CF6" },
  { group: "Humanities", depts: "Education, English, Khasi, History, Geography", color: "#F97316" },
];

/* ============================
   MAIN LANDING PAGE
   ============================ */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      {/* ===================== NAVBAR ===================== */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: "all 0.3s ease",
          background: scrolled ? "rgba(248, 249, 251, 0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                <span style={{ color: "white", fontWeight: 800, fontSize: "18px", fontFamily: "var(--font-display)" }}>S</span>
              </div>
              <div>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", color: "var(--color-primary)" }}>
                  SECONS
                </span>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <div style={{ display: "flex", alignItems: "center", gap: "32px" }} className="hide-mobile">
              {["Features", "Teams", "Roles", "About"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    transition: "color 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                >
                  {item}
                </a>
              ))}
              <a
                href="/login"
                style={{
                  padding: "10px 24px",
                  borderRadius: "var(--radius-full)",
                  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.2s",
                  boxShadow: "var(--shadow-md)",
                  cursor: "pointer",
                }}
              >
                Sign In
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: "var(--color-text-primary)",
              }}
              className="show-mobile-only"
            >
              {mobileMenuOpen ? <IconX className="" /> : <IconMenu className="" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              background: "var(--color-surface)",
              borderTop: "1px solid var(--color-border)",
              padding: "16px 24px",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {["Features", "Teams", "Roles", "About"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 0",
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                  borderBottom: "1px solid var(--color-border-light)",
                }}
              >
                {item}
              </a>
            ))}
            <a
              href="/login"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "16px",
                padding: "12px 24px",
                borderRadius: "var(--radius-full)",
                background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
                color: "white",
                fontWeight: 600,
              }}
            >
              Sign In
            </a>
          </div>
        )}
      </nav>

      {/* ===================== HERO SECTION ===================== */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "linear-gradient(160deg, #0F2847 0%, #1A3C6E 30%, #2A5494 60%, #1A3C6E 100%)",
        }}
      >
        <FloatingParticles />

        {/* Decorative orbs */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232, 160, 32, 0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            left: "5%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(42, 84, 148, 0.3) 0%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 10, maxWidth: "900px", margin: "0 auto", padding: "120px 24px 80px", textAlign: "center" }}>
          {/* Badge */}
          <div
            className="animate-fade-in-up"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              borderRadius: "var(--radius-full)",
              background: "rgba(232, 160, 32, 0.15)",
              border: "1px solid rgba(232, 160, 32, 0.3)",
              marginBottom: "32px",
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-accent)", animation: "pulse-glow 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-accent-light)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              EdBlazon Management Platform
            </span>
          </div>

          {/* Main Title */}
          <h1
            className="animate-fade-in-up delay-100"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              color: "white",
              marginBottom: "24px",
              letterSpacing: "-0.03em",
            }}
          >
            <span style={{ display: "block" }}>SECONS</span>
            <span
              style={{
                display: "block",
                fontSize: "clamp(1rem, 2.5vw, 1.6rem)",
                fontWeight: 400,
                fontFamily: "var(--font-body)",
                color: "rgba(255, 255, 255, 0.7)",
                marginTop: "8px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              EdBlazon in the palm of your hands
            </span>
          </h1>

          {/* Description */}
          <p
            className="animate-fade-in-up delay-200"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "rgba(255, 255, 255, 0.65)",
              maxWidth: "640px",
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            The single source of truth for your annual college cultural & sports week.
            Manage events, sports fixtures, finance, communications, and more — all in one platform.
          </p>

          {/* CTA Buttons */}
          <div
            className="animate-fade-in-up delay-300"
            style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <a
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 32px",
                borderRadius: "var(--radius-full)",
                background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-light) 100%)",
                color: "var(--color-text-on-accent)",
                fontSize: "16px",
                fontWeight: 700,
                boxShadow: "0 4px 20px rgba(232, 160, 32, 0.3)",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              Get Started
              <IconArrowRight className="" style={{ width: "18px", height: "18px" }} />
            </a>
            <a
              href="#features"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 32px",
                borderRadius: "var(--radius-full)",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "white",
                fontSize: "16px",
                fontWeight: 600,
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              Explore Features
            </a>
          </div>

          {/* Stats Bar */}
          <div
            className="animate-fade-in-up delay-500"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1px",
              marginTop: "80px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: "24px 16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                    fontWeight: 800,
                    color: "var(--color-accent)",
                    lineHeight: 1,
                  }}
                >
                  <AnimatedCounter target={stat.number} suffix={stat.suffix} />
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", marginTop: "4px", fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="animate-fade-in-up delay-700"
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            animation: "float 3s ease-in-out infinite",
          }}
        >
          <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll</span>
          <IconChevronDown className="" style={{ width: "20px", height: "20px", color: "rgba(255, 255, 255, 0.4)" }} />
        </div>
      </section>

      {/* ===================== FEATURES SECTION ===================== */}
      <section id="features" style={{ padding: "120px 24px", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--color-accent)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Platform Features
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              marginBottom: "16px",
            }}
          >
            Everything EdBlazon Needs
          </h2>
          <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
            From event creation to finance reports — every operational aspect, unified in one platform.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* ===================== TEAMS SECTION ===================== */}
      <section
        id="teams"
        style={{
          padding: "100px 24px",
          background: "linear-gradient(180deg, var(--color-background) 0%, var(--color-primary-50) 50%, var(--color-background) 100%)",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span
              style={{
                display: "inline-block",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-accent)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Competition Structure
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 800,
                color: "var(--color-text-primary)",
                marginBottom: "16px",
              }}
            >
              18 Teams, 3 Semesters
            </h2>
            <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
              6 groups across 2nd, 4th & 6th semesters — each group fields participants from multiple departments as one unified team.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {teams.map((team) => (
              <div
                key={team.group}
                style={{
                  padding: "28px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                  e.currentTarget.style.borderColor = team.color;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "var(--radius-sm)",
                      background: team.color,
                    }}
                  />
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {team.group}
                  </h3>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: team.color,
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      background: `${team.color}15`,
                    }}
                  >
                    × 3 semesters
                  </span>
                </div>
                <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{team.depts}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== ROLES SECTION ===================== */}
      <section id="roles" style={{ padding: "100px 24px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--color-accent)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Access Control
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              marginBottom: "16px",
            }}
          >
            5-Tier Role Hierarchy
          </h2>
          <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
            Every user sees and does only what their role permits — no more, no less.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {roles.map((role, idx) => (
            <div
              key={role.title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                padding: "24px 28px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = role.color;
                e.currentTarget.style.boxShadow = `0 4px 20px ${role.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-md)",
                  background: `${role.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", color: role.color }}>
                  {idx + 1}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {role.title}
                  </h3>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: role.color,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      background: `${role.color}15`,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {role.tier}
                  </span>
                </div>
                <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginTop: "4px" }}>{role.desc}</p>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {role.count}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== ABOUT / CTA SECTION ===================== */}
      <section
        id="about"
        style={{
          padding: "100px 24px",
          background: "linear-gradient(160deg, #0F2847 0%, #1A3C6E 50%, #0F2847 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <FloatingParticles />
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 10 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "white",
              marginBottom: "24px",
            }}
          >
            Ready to Transform EdBlazon?
          </h2>
          <p style={{ fontSize: "18px", color: "rgba(255, 255, 255, 0.65)", marginBottom: "40px", lineHeight: 1.7, maxWidth: "600px", margin: "0 auto 40px" }}>
            Eliminate spreadsheets, WhatsApp chaos, and manual coordination.
            SECONS brings your entire organizing committee onto one unified platform — built for speed, built for scale.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "16px 36px",
                borderRadius: "var(--radius-full)",
                background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-light) 100%)",
                color: "var(--color-text-on-accent)",
                fontSize: "16px",
                fontWeight: 700,
                boxShadow: "0 4px 30px rgba(232, 160, 32, 0.35)",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              Launch SECONS
              <IconArrowRight className="" style={{ width: "18px", height: "18px" }} />
            </a>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer
        style={{
          padding: "48px 24px 32px",
          background: "var(--color-primary-900)",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "white", fontWeight: 800, fontSize: "16px", fontFamily: "var(--font-display)" }}>S</span>
              </div>
              <div>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "rgba(255, 255, 255, 0.9)" }}>
                  SECONS
                </span>
                <span style={{ display: "block", fontSize: "11px", color: "rgba(255, 255, 255, 0.4)" }}>EdBlazon in the palm of your hands</span>
              </div>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.3)" }}>
              © {new Date().getFullYear()} SECONS · Built for the EdBlazon Organizing Committee
            </p>
          </div>
        </div>
      </footer>

      {/* ===================== RESPONSIVE STYLES ===================== */}
      <style jsx global>{`
        .hide-mobile {
          display: flex !important;
        }
        .show-mobile-only {
          display: none !important;
        }
        .show-mobile-only svg {
          width: 24px;
          height: 24px;
        }
        @media (max-width: 768px) {
          .hide-mobile {
            display: none !important;
          }
          .show-mobile-only {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================
   FEATURE CARD COMPONENT
   ============================ */
function FeatureCard({ feature }: { feature: (typeof features)[number] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "32px",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-surface)",
        border: `1px solid ${hovered ? feature.color + "40" : "var(--color-border)"}`,
        boxShadow: hovered ? `0 8px 30px ${feature.color}15` : "var(--shadow-sm)",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        cursor: "default",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "var(--radius-md)",
          background: `${feature.color}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          transition: "all 0.3s ease",
          transform: hovered ? "scale(1.1)" : "scale(1)",
        }}
      >
        <feature.icon
          className=""
          {...{ style: { width: "24px", height: "24px", color: feature.color } } as Record<string, unknown>}
        />
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: "8px",
        }}
      >
        {feature.title}
      </h3>
      <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
        {feature.description}
      </p>
    </div>
  );
}
