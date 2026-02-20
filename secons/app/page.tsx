"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  CalendarDays, Trophy, Users, Zap, Shield, BarChart3, MessageCircle, Map as MapIcon,
  ArrowRight, ChevronDown, Menu, X, Check, Star, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ============================
   CONSTANTS & DATA
   ============================ */

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Event Management",
    description: "End-to-end event lifecycle. Upload flyers, track registrations, and manage schedules in real-time.",
    className: "md:col-span-2",
  },
  {
    icon: Trophy,
    title: "Sports Engine",
    description: "Automated fixtures & live scoring for 18 teams across multiple disciplines.",
    className: "md:col-span-1",
  },
  {
    icon: BarChart3,
    title: "Live Leaderboard",
    description: "Real-time point tracking with animated rank changes and category breakdowns.",
    className: "md:col-span-1",
  },
  {
    icon: MessageCircle,
    title: "Comms Hub",
    description: "Role-based announcements and secure chat channels for the committee.",
    className: "md:col-span-2",
  },
  {
    icon: Shield,
    title: "Budget & Finance",
    description: "Expense tracking, approval workflows, and automated receipt generation.",
    className: "md:col-span-3",
  },
];

const TEAMS = [
  { group: "Commerce", depts: "Commerce (unified)", color: "bg-amber-500" },
  { group: "Professional", depts: "Comp App, Social Work", color: "bg-blue-600" },
  { group: "Life Science", depts: "BioChem, BioTech, Botany", color: "bg-green-600" },
  { group: "Physical Science", depts: "Physics, Chem, Math, CS", color: "bg-red-600" },
  { group: "Social Science", depts: "Econ, Pol Sci, Sociology", color: "bg-purple-600" },
  { group: "Humanities", depts: "English, History, Geo", color: "bg-orange-500" },
];

const ROLES = [
  { title: "General Animator", tier: "Tier 1", desc: "Super Admin Control", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { title: "Joint General Animator", tier: "Tier 2", desc: "Domain Leadership", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { title: "Animator", tier: "Tier 3", desc: "Event Management", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  { title: "Volunteer", tier: "Tier 4", desc: "On-ground Operations", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  { title: "Student", tier: "Tier 5", desc: "Participant Access", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200" },
];

/* ============================
   COMPONENTS
   ============================ */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
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
          {["Features", "Teams", "Roles", "Events"].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                scrolled ? "text-slate-600" : "text-slate-700"
              )}
            >
              {item}
            </Link>
          ))}
          <Link href="/login">
            <Button className={cn(
              "rounded-full px-6 transition-all hover:scale-105 shadow-md",
              scrolled ? "bg-primary text-white hover:bg-primary-600" : "bg-white text-primary hover:bg-slate-50"
            )}>
              Sign In
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
            {["Features", "Teams", "Roles", "Events"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className="text-lg font-medium text-slate-700 hover:text-primary"
              >
                {item}
              </Link>
            ))}
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-primary text-white">Sign In</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#F8F9FB]">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[80px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] bg-center mask-image-gradient-to-b" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-widest text-[11px] font-bold shadow-sm">
            EdBlazon Management Platform
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display font-black text-5xl sm:text-6xl md:text-7xl tracking-tight text-primary-900 mb-6 leading-[1.1]"
        >
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">Gold Standard</span> <br />
          of Event Operations.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          One unified platform to manage fixtures, finances, communications, and 45+ events. Built for the EdBlazon Organizing Committee.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/login">
            <Button size="lg" className="h-14 px-8 rounded-full bg-primary text-white hover:bg-primary-700 font-bold text-base shadow-lg shadow-primary/20 transition-all hover:scale-105">
              Get Started <ArrowRight className="ml-2 size-5" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-slate-200 hover:bg-white hover:text-primary bg-white/50 backdrop-blur-sm text-slate-600">
              Explore Features
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Hero Image / Dashboard Preview Placeholder */}
      <motion.div
        style={{ y: y1, opacity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-[1px] h-12 bg-slate-200" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Scroll</span>
      </motion.div>

    </div>
  );
}

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0], index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
        feature.className
      )}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
          <feature.icon className="size-6" />
        </div>
        <h3 className="font-display font-bold text-xl text-primary-900 mb-3 tracking-tight">{feature.title}</h3>
        <p className="text-slate-500 leading-relaxed text-sm">{feature.description}</p>
      </div>
    </motion.div>
  );
}

function SectionHeading({ title, subtitle, label }: { title: string, subtitle: string, label: string }) {
  return (
    <div className="text-center mb-16 md:mb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest mb-4"
      >
        {label}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="font-display font-black text-3xl md:text-5xl text-primary-900 mb-4"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-lg text-slate-500 max-w-2xl mx-auto"
      >
        {subtitle}
      </motion.p>
    </div>
  );
}

function FeaturedEvents() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/events?limit=3&status=published")
      .then(r => r.json())
      .then(d => d.success && setEvents(d.data.events))
      .catch(() => { });
  }, []);

  if (events.length === 0) return null;

  return (
    <section id="events" className="py-24 relative bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading label="Happening Now" title="Featured Events" subtitle="Explore the latest highlights from the festival schedule." />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((ev, i) => (
            <motion.div
              key={ev._id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border-slate-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  {ev.flierUrl ? (
                    <img src={ev.flierUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400"><CalendarDays className="size-10 opacity-50" /></div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm uppercase tracking-wide border border-slate-100">
                    {ev.jgaDomain.replace(/_/g, " ")}
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary-900 mb-2 line-clamp-1">{ev.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <MapIcon className="size-4" /> {ev.venue}
                  </div>
                  {ev.registrationLink && (
                    <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-primary hover:bg-primary-700 text-white shadow-sm">
                        Register Now
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/all-events">
            <Button variant="outline" size="lg" className="rounded-full border-slate-200 text-primary-900 hover:bg-slate-50">
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
    <div className="bg-[#F8F9FB] min-h-screen text-slate-900 selection:bg-primary/10">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading label="Platform Features" title="Built for Scale" subtitle="The unified operating system for the EdBlazon committee." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={i} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Teams Section */}
      <section id="teams" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading label="Computation" title="18 Teams. One Trophy." subtitle="Unified scoring across Sports, Cultural, and Literary events." />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEAMS.map((team, i) => (
              <motion.div
                key={team.group}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl bg-[#F8F9FB] border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-default"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={cn("size-3 rounded-full shadow-sm ring-2 ring-white", team.color)} />
                  <h3 className="font-display font-bold text-lg text-primary-900">{team.group}</h3>
                </div>
                <p className="text-sm text-slate-500 font-medium">{team.depts}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="py-24 relative">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeading label="Hierarchy" title="Role-Based Access" subtitle="Strict permission controls ensuring data security." />

          <div className="space-y-4">
            {ROLES.map((role, i) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "flex items-center justify-between p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all",
                  role.border
                )}
              >
                <div className="flex items-center gap-6">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center font-bold font-display text-lg", role.bg, role.color)}>
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary-900">{role.title}</h3>
                    <p className="text-sm text-slate-500">{role.desc}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("hidden sm:flex border bg-white", role.color, role.border)}>
                  {role.tier}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FeaturedEvents />

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden bg-primary text-white">
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display font-black text-5xl md:text-6xl text-white mb-8"
          >
            Ready to streamline <br /> <span className="text-amber-300">EdBlazon 2026?</span>
          </motion.h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join the committee portal and start managing your events today.
          </p>
          <Link href="/login">
            <Button size="lg" className="h-16 px-10 rounded-full text-lg font-bold bg-white text-primary hover:bg-slate-100 transition-transform hover:scale-105 shadow-xl">
              Launch Platform
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
              <span className="font-display font-bold text-sm">S</span>
            </div>
            <span className="text-slate-500 text-sm">© {(new Date()).getFullYear()} SECONS. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
