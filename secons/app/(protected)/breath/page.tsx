"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Leaf, Heart, ArrowLeft, Timer, Music, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TakeABreathPage() {
    const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "idle">("idle");
    const [seconds, setSeconds] = useState(0);
    const [cycleCount, setCycleCount] = useState(0);

    const startBreathing = () => {
        setPhase("inhale");
        setSeconds(4);
    };

    useEffect(() => {
        if (phase === "idle") return;

        const timer = setInterval(() => {
            setSeconds(prev => {
                if (prev <= 1) {
                    if (phase === "inhale") {
                        setPhase("hold");
                        return 4;
                    } else if (phase === "hold") {
                        setPhase("exhale");
                        return 6;
                    } else if (phase === "exhale") {
                        setCycleCount(c => c + 1);
                        setPhase("inhale");
                        return 4;
                    }
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50/50 to-white overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-12"
            >
                <Badge className="bg-blue-100 text-blue-600 border-blue-200 mb-4 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] font-black text-[10px]">
                    Circuit Wellness Node
                </Badge>
                <h1 className="text-4xl md:text-6xl font-display font-black text-slate-900 tracking-tighter uppercase italic">
                    Take a Breath
                </h1>
                <p className="text-slate-500 mt-4 max-w-md mx-auto font-medium">
                    A quick 5-minute protocol to recalibrate your focus during the festival.
                </p>
            </motion.div>

            <div className="relative size-64 md:size-80 flex items-center justify-center">
                {/* Breathing Circle */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={phase}
                        initial={{ scale: 1 }}
                        animate={{
                            scale: phase === "inhale" ? 1.5 : phase === "hold" ? 1.5 : 1,
                            opacity: phase === "idle" ? 0.3 : 1
                        }}
                        transition={{
                            duration: phase === "inhale" ? 4 : phase === "hold" ? 0 : phase === "exhale" ? 6 : 0,
                            ease: "easeInOut"
                        }}
                        className={cn(
                            "absolute inset-0 rounded-full blur-3xl opacity-20",
                            phase === "inhale" ? "bg-blue-400" : phase === "hold" ? "bg-amber-400" : "bg-teal-400"
                        )}
                    />
                </AnimatePresence>

                <motion.div
                    animate={{
                        scale: phase === "inhale" ? 1.4 : phase === "hold" ? 1.4 : 1,
                        rotate: phase === "inhale" ? 90 : phase === "exhale" ? 0 : 0
                    }}
                    transition={{
                        duration: phase === "inhale" ? 4 : phase === "hold" ? 0 : phase === "exhale" ? 6 : 0.5,
                        ease: "easeInOut"
                    }}
                    className="relative z-10 size-40 md:size-56 rounded-full border-[12px] border-white shadow-2xl bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center text-slate-900"
                >
                    <span className="font-display font-black text-4xl md:text-5xl uppercase italic tracking-tighter leading-none">
                        {phase === "idle" ? <Wind className="size-12 text-blue-500" /> : seconds}
                    </span>
                    <span className="text-[10px] uppercase font-black tracking-widest mt-2 text-slate-400">
                        {phase.toUpperCase()}
                    </span>
                </motion.div>

                {/* Floating Particles */}
                {phase !== "idle" && [1, 2, 3, 4, 5].map(i => (
                    <motion.div
                        key={i}
                        className="absolute size-2 bg-blue-200 rounded-full"
                        animate={{
                            x: [0, Math.random() * 200 - 100],
                            y: [0, Math.random() * -200 - 100],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.5
                        }}
                    />
                ))}
            </div>

            <div className="mt-16 flex flex-col items-center gap-6">
                {phase === "idle" ? (
                    <Button
                        size="lg"
                        onClick={startBreathing}
                        className="h-16 px-12 rounded-full bg-slate-900 text-white font-display font-black uppercase text-lg shadow-xl hover:scale-105 transition-all"
                    >
                        Initiate Sequence
                    </Button>
                ) : (
                    <div className="text-center">
                        <p className="font-mono text-xs uppercase tracking-widest text-slate-400 mb-2">Cycles Completed: {cycleCount}</p>
                        <Button
                            variant="ghost"
                            onClick={() => setPhase("idle")}
                            className="text-slate-400 hover:text-red-500 font-black uppercase text-[10px] tracking-widest"
                        >
                            Terminate Protocol
                        </Button>
                    </div>
                )}
            </div>

            {/* Quick Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-3xl">
                <WellnessCard
                    icon={Leaf}
                    title="Soft Gaze"
                    desc="Relax your eyes and focus on the center circle."
                />
                <WellnessCard
                    icon={Heart}
                    title="Posture"
                    desc="Rest your hands on your lap and sit upright."
                />
                <WellnessCard
                    icon={Cloud}
                    title="Release"
                    desc="Let go of the next event's logistics for 5 mins."
                />
            </div>
        </div>
    );
}

function WellnessCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <Card className="p-6 rounded-[2rem] bg-white border-slate-100 shadow-sm transition-all hover:shadow-md">
            <Icon className="size-6 text-primary mb-3" />
            <h4 className="font-display font-black uppercase text-xs tracking-tight text-slate-900 mb-1">{title}</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{desc}</p>
        </Card>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
            {children}
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
