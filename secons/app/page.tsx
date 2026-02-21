"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  CalendarDays, Trophy, Zap, MessageCircle,
  ArrowRight, Menu, X, Check, Star, Activity, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/layout/Footer";

/* ============================
   CONSTANTS & DATA
   ============================ */

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Event Discovery",
    description: "Explore 45+ events across Sports, Cultural, and Literary domains. Register and track your favorite happenings.",
  },
  {
    icon: Trophy,
    title: "Live Telemetry",
    description: "Real-time scores and ranking updates from the SECONS Sports Command center.",
  },
  {
    icon: Zap,
    title: "Instant Updates",
    description: "Pinned announcements and live results delivered through our high-speed circuit.",
  },
];

/* ============================
   COMPONENTS
   ============================ */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      if (currentScrollY > lastScrollY.current && currentScrollY > 150) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-slate-200 py-3 shadow-sm"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-lg shadow-primary/10">
            <span className="text-white font-display font-bold text-xl">S</span>
          </div>
          <span className={cn("font-display font-bold text-xl tracking-tight transition-colors", scrolled ? "text-primary" : "text-primary-900")}>
            SECONS
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#events" className={cn("text-sm font-medium transition-colors hover:text-primary", scrolled ? "text-slate-600" : "text-slate-700")}>Events</Link>
          <Link href="/live" className={cn("text-sm font-medium transition-colors hover:text-primary", scrolled ? "text-slate-600" : "text-slate-700")}>Live Board</Link>
          <Link href="/login">
            <Button className={cn(
              "rounded-full px-6 transition-all hover:scale-105 shadow-md",
              scrolled ? "bg-primary text-white hover:bg-primary-600" : "bg-white text-primary hover:bg-slate-50"
            )}>
              Portal Access
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-primary" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden bg-white border-b border-slate-200 shadow-xl"
        >
          <div className="flex flex-col p-6 gap-4">
            <Link href="#events" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-slate-700 hover:text-primary">Events</Link>
            <Link href="/live" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-slate-700 hover:text-primary">Live Scoreboard</Link>
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-primary text-white">Portal Access</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

function Hero() {
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-[#F8F9FB]">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[80px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] bg-center" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest text-[11px] font-bold shadow-sm">
            Public Festival Protocol — SECONS 2026
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter text-slate-900 mb-6 leading-none uppercase italic"
        >
          Witness the <br /> <span className="text-primary tracking-normal">Spectacle.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-2xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
        >
          The premier inter-departmental festival. Explore events, register your interest, and witness history in real-time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link href="/live">
            <Button size="lg" className="h-16 px-10 rounded-full bg-slate-900 text-white hover:bg-primary font-display font-black text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-3">
              <Zap className="size-6 text-amber-400 fill-amber-400" /> LIVE SCOREBOARD
            </Button>
          </Link>
          <Link href="#events">
            <Button size="lg" variant="outline" className="h-16 px-10 rounded-full border-slate-200 hover:bg-slate-50 text-slate-900 font-display font-black text-lg shadow-sm">
              EXPLORE EVENTS
            </Button>
          </Link>
        </motion.div>
      </div>

      <motion.div
        style={{ y: y1, opacity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="w-[1px] h-12 bg-slate-200 mx-auto" />
      </motion.div>
    </div>
  );
}

function SectionHeading({ title, subtitle, label }: { title: string, subtitle: string, label: string }) {
  return (
    <div className="text-center mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4"
      >
        {label}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="font-display font-black text-4xl md:text-6xl text-slate-900 mb-4 tracking-tighter uppercase"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
      >
        {subtitle}
      </motion.p>
    </div>
  );
}

function FeaturedEvents() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/events?limit=10&status=published")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const filtered = d.data.events.filter((ev: any) => {
            if (ev.jgaDomain === "sports") {
              const hasLink = ev.registrationLink && ev.registrationLink !== "N/A" && ev.registrationLink.trim() !== "";
              const isLive = ev.status === "ongoing";
              return hasLink || isLive;
            }
            return true;
          }).slice(0, 3);
          setEvents(filtered);
        }
      })
      .catch(() => { });
  }, []);

  return (
    <section id="events" className="py-32 relative bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading label="Circuit Feed" title="Featured Events" subtitle="The highlights from the SECONS schedule." />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.length > 0 ? events.map((ev, i) => {
            const isSportsLive = ev.jgaDomain === "sports" && ev.status === "ongoing";
            const hasLink = ev.registrationLink && ev.registrationLink !== "N/A" && ev.registrationLink.trim() !== "";

            return (
              <motion.div
                key={ev._id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full rounded-[2.5rem] border-slate-100 shadow-xl hover:shadow-2xl transition-all overflow-hidden group">
                  <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
                    {ev.flierUrl ? (
                      <img src={ev.flierUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-200"><CalendarDays className="size-20" /></div>
                    )}
                    <div className="absolute top-6 right-6 bg-white shadow-xl px-4 py-1.5 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest border border-slate-50">
                      {ev.jgaDomain.replace(/_/g, " ")}
                    </div>
                    {isSportsLive && (
                      <div className="absolute top-6 left-6 bg-red-500 shadow-xl px-4 py-1.5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest animate-pulse">
                        Ongoing
                      </div>
                    )}
                  </div>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-display font-black text-slate-900 mb-3 uppercase italic tracking-tighter">{ev.title}</h3>
                    <p className="text-slate-400 font-mono text-[10px] uppercase tracking-widest mt-1 mb-8 opacity-60">Venue: {ev.venue}</p>

                    <div className="block">
                      {ev.jgaDomain === "sports" ? (
                        <>
                          {ev.status === "ongoing" ? (
                            <Link href="/live">
                              <Button className="w-full h-12 rounded-2xl bg-red-600 text-white hover:bg-red-700 font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2">
                                <Activity className="size-4" /> See Live Scores
                              </Button>
                            </Link>
                          ) : ev.status === "completed" ? (
                            <Button disabled className="w-full h-12 rounded-2xl bg-slate-100 text-slate-400 font-black uppercase tracking-widest text-[11px] cursor-not-allowed">
                              Completed
                            </Button>
                          ) : hasLink ? (
                            <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer">
                              <Button className="w-full h-12 rounded-2xl bg-slate-100 text-slate-900 hover:bg-primary hover:text-white font-black uppercase tracking-widest text-[11px] transition-all">
                                Register Interest
                              </Button>
                            </a>
                          ) : null}
                        </>
                      ) : (
                        <>
                          {(ev.status === "ongoing" || ev.status === "completed") ? (
                            <Button disabled className="w-full h-12 rounded-2xl bg-slate-100 text-slate-400 font-black uppercase tracking-widest text-[11px] cursor-not-allowed leading-tight px-4">
                              Registration Closed / Event Completed
                            </Button>
                          ) : hasLink ? (
                            <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer">
                              <Button className="w-full h-12 rounded-2xl bg-slate-100 text-slate-900 hover:bg-primary hover:text-white font-black uppercase tracking-widest text-[11px] transition-all">
                                Register Interest
                              </Button>
                            </a>
                          ) : null}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }) : (
            <div className="col-span-full py-20 text-center opacity-20 font-display font-black text-3xl uppercase italic">No public events listed yet.</div>
          )}
        </div>

        <div className="text-center mt-20">
          <Link href="/all-events">
            <Button variant="ghost" className="font-display font-black uppercase tracking-[0.3em] text-[11px] hover:text-primary">
              View All Events <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[#F8F9FB] min-h-screen text-slate-900">
      <Navbar />
      <Hero />

      {/* Philosophy Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-6"
              >
                <div className="size-16 rounded-[2rem] bg-white shadow-xl border border-slate-50 flex items-center justify-center mx-auto text-primary">
                  <f.icon className="size-8" />
                </div>
                <h4 className="text-xl font-display font-black uppercase tracking-tighter">{f.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FeaturedEvents />

      {/* CTA Section */}
      <section className="py-40 relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-12">
          <h2 className="font-display font-black text-6xl md:text-8xl text-white italic tracking-tighter uppercase leading-none">
            Are you <br /> <span className="text-primary italic">Ready?</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/login">
              <Button size="lg" className="h-16 px-12 rounded-full bg-white text-slate-900 hover:bg-primary hover:text-white font-display font-black uppercase text-base shadow-2xl transition-all hover:scale-105">
                Organizer Portal
              </Button>
            </Link>
            <Link href="/live">
              <Button size="lg" variant="outline" className="h-16 px-12 rounded-full border-white/20 hover:bg-white/10 text-white font-display font-black uppercase text-base shadow-xl">
                Live Scoreboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
