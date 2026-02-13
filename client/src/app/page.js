'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Rocket,
  Target,
  Brain,
  TrendingUp,
  Code,
  Briefcase,
  FileText,
  Building2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import AnoAI from '@/components/ui/animated-shader-background';

export default function Home() {
  const [user, setUser] = useState(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch (e) { }
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden font-sans">

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <AnoAI />
      </div>

      {/* Navbar */}
      <nav className="fixed top-6 left-0 right-0 mx-auto w-[92%] max-w-6xl z-50 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-lg shadow-black/10">
        <div className="px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors ring-1 ring-white/10">
              <Code className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              Interview<span className="text-primary">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
              <Link href="/features" className="hover:text-white transition-colors">Features</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl">Dashboard</Button>
                </Link>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-primary/20">
                  {user.name?.charAt(0)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" className="rounded-xl shadow-lg shadow-primary/20" icon={ChevronRight}>
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            <motion.div variants={itemVariants} className="flex justify-center">
            
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-foreground">
              Master Your Next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500">
                Technical Interview
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Practice with our intelligent AI coach that adapts to your skill level,
              provides real-time feedback, and helps you land your dream job.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/interview">
                <Button variant="primary" size="xl" icon={Rocket} className="w-full sm:w-auto px-8">
                  Start Practicing Now
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="secondary" size="xl" icon={Target} className="w-full sm:w-auto px-8">
                  View Demo
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-border mt-20">
              {[
                { label: "Active Users", value: "10,000+", icon: Users },
                { label: "Questions Solved", value: "500k+", icon: CheckCircle2 },
                { label: "Offer Rate", value: "94%", icon: TrendingUp },
                { label: "Partner Companies", value: "50+", icon: Building2 },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-lg bg-surface mb-2 border border-border">
                    <stat.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Features Preview */}
        <div className="max-w-7xl mx-auto px-6 mt-32">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Practice Your Way</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Four powerful modes designed to cover every aspect of your interview preparation journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Company Wise",
                desc: "Target specific top-tier companies like Google, Amazon, and Microsoft.",
                icon: Building2,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                border: "group-hover:border-blue-500/30",
                href: "/companywise"
              },
              {
                title: "Topic Wise",
                desc: "Deep dive into specific concepts like DSA, System Design, and more.",
                icon: Brain,
                color: "text-violet-500",
                bg: "bg-violet-500/10",
                border: "group-hover:border-violet-500/30",
                href: "/topicwise"
              },
              {
                title: "Role Specific",
                desc: "Tailored questions for Frontend, Backend, DevOps, and other roles.",
                icon: Briefcase,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                border: "group-hover:border-amber-500/30",
                href: "/rolespecific"
              },
              {
                title: "Resume Based",
                desc: "Upload your resume and get questions pertinent to your experience.",
                icon: FileText,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                border: "group-hover:border-emerald-500/30",
                href: "/resumebased"
              },
            ].map((feature, i) => (
              <Link key={i} href={feature.href}>
                <Card
                  hover
                  animate={false}
                  className={`h-full group cursor-pointer border-border transition-all duration-300 hover:-translate-y-1 ${feature.border}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Code className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">InterviewAI</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2026 InterviewAI. Building the future of technical hiring.
          </p>
          <div className="flex gap-6 text-muted-foreground text-sm font-medium">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
