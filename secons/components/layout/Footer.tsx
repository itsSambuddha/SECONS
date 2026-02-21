"use client";

import Link from "next/link";
import { Instagram, Mail, MapPin, Code, MessageSquare, ChevronRight, Book, Music, Trophy, Zap, Globe } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#020817] text-white pt-24 pb-12 overflow-hidden relative">
            {/* Background Decorative Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
                    {/* Brand Identity */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/20">
                                <span className="text-white font-display font-black text-2xl tracking-tighter">S</span>
                            </div>
                            <div>
                                <h2 className="font-display font-black text-2xl tracking-tight leading-none uppercase italic">SECONS</h2>
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary mt-1">St. Edmund's College</p>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed font-medium">
                            The high-performance operating system for <span className="text-white">Organizing</span>, <span className="text-white">Managing</span>, and tracking live updates of <span className="text-primary italic">EdBlazon</span>.
                        </p>

                        <div className="flex items-center gap-4">
                            <a href="https://instagram.com/st.edmundscollegeshillong" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                                <Instagram className="size-4 text-slate-400 group-hover:text-white" />
                            </a>
                            <a href="https://sec.edu.in" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                                <Globe className="size-4 text-slate-400 group-hover:text-white" />
                            </a>
                        </div>
                    </div>

                    {/* The Arena - Domain Grid */}
                    <div className="space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">The Arena</h3>
                        <ul className="space-y-5">
                            <li>
                                <Link href="/all-events?category=sports" className="flex items-center gap-4 group">
                                    <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:text-primary transition-colors">
                                        <Trophy className="size-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-tight">Sports Command</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/all-events?category=cultural" className="flex items-center gap-4 group">
                                    <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:text-primary transition-colors">
                                        <Music className="size-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-tight">Cultural Stage</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/all-events?category=literary" className="flex items-center gap-4 group">
                                    <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:text-primary transition-colors">
                                        <Book className="size-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-tight">Literary Circle</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* The Legacy - Festival Stats */}
                    <div className="space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">The Legacy</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="flex items-center gap-4">
                                <span className="font-display font-black text-3xl text-primary italic leading-none">45+</span>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Events</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Live this week</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-display font-black text-3xl text-white italic leading-none">15+</span>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Departments</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">In Competition</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                    <Zap className="size-3 text-primary animate-pulse" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live Telemetry active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Contact</h3>
                        <ul className="space-y-6">
                            <li>
                                <a href="https://wa.me/918837405788" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/50 transition-all">
                                        <Code className="size-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase italic tracking-tight">Contact Developer</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">WhatsApp Support</p>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a href="mailto:sidhusamsk@gmail.com" className="flex items-start gap-4 group">
                                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/50 transition-all">
                                        <Mail className="size-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase italic tracking-tight">Dev Email Support</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">sidhusamsk@gmail.com</p>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.instagram.com/_.sam.here._" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/50 transition-all">
                                        <Instagram className="size-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase italic tracking-tight">Dev Instagram</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">@_.sam.here._</p>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.google.com/maps/place/St.+Edmund's+College,+Shillong/@25.5675881,91.8943209,17z/data=!3m1!4b1!4m6!3m5!1s0x37507ea4cc6bcba9:0x2a59aebd4a4ac759!8m2!3d25.5675833!4d91.8968958!16zL20vMGR0cHl3?entry=ttu&g_ep=EgoyMDI2MDIxOC4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/50 transition-all">
                                        <MapPin className="size-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase italic tracking-tight">Address</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">St. Edmund's College, Shillong, India</p>
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        <p>&copy; {currentYear} SECONS Inc. All rights reserved.</p>
                        <span className="hidden md:inline opacity-20">|</span>
                        <p className="flex items-center gap-1">Designed & Engineered by <span className="text-white italic">SAM</span></p>
                    </div>
                    <div className="flex items-center gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>

            {/* Ghost Branding */}
            <div className="absolute -bottom-32 -left-32 text-[20vw] font-black text-white/[0.02] select-none pointer-events-none font-display uppercase italic tracking-tighter">
                SECONS
            </div>
        </footer>
    );
}
