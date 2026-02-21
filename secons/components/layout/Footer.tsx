"use client";

import Link from "next/link";
import { Instagram, Mail, MapPin, Code, MessageSquare, ChevronRight } from "lucide-react";

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
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                                <Instagram className="size-4 text-slate-400 group-hover:text-white" />
                            </a>
                            <a href="mailto:support@secons.org" className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                                <Mail className="size-4 text-slate-400 group-hover:text-white" />
                            </a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div className="space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Product</h3>
                        <ul className="space-y-4">
                            {["Features", "Archives & Inventory", "Pricing"].map((item) => (
                                <li key={item}>
                                    <Link href={`/${item.toLowerCase().replace(/ /g, "-")}`} className="text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center group">
                                        <ChevronRight className="size-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Secretariat Links */}
                    <div className="space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Secretariat</h3>
                        <ul className="space-y-4">
                            {["Control Room", "Alumni Handover", "Support Desk"].map((item) => (
                                <li key={item}>
                                    <Link href={`/${item.toLowerCase().replace(/ /g, "-")}`} className="text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center group">
                                        <ChevronRight className="size-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
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
                                <div className="flex items-start gap-4">
                                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        <Mail className="size-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase italic tracking-tight">Email Support</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">support@secons.org</p>
                                    </div>
                                </div>
                            </li>
                            <li>
                                <div className="flex items-start gap-4">
                                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        <MapPin className="size-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase italic tracking-tight">Address</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">St. Edmund's College, Shillong, India</p>
                                    </div>
                                </div>
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
