"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Brain,
  Briefcase,
  FileText,
  ChevronLeft,
  Sparkles,
  Zap,
  BarChart,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const modes = [
  {
    title: "Company Wise",
    description: "Practice actual questions asked by top tech companies like Google, Amazon, and Microsoft.",
    href: "/companywise",
    icon: Building2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    badge: "Popular",
    badgeVariant: "info"
  },
  {
    title: "Topic Wise",
    description: "Master specific concepts including DSA, System Design, OS, and DBMS.",
    href: "/topicwise",
    icon: Brain,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    badge: "Recommended",
    badgeVariant: "accent"
  },
  {
    title: "Role Specific",
    description: "Tailored interview paths for Frontend, Backend, DevOps, and Full Stack roles.",
    href: "/rolespecific",
    icon: Briefcase,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "Targeted",
    badgeVariant: "warning"
  },
  {
    title: "Resume Based",
    description: "AI analyzes your resume to generate personalized project-specific questions.",
    href: "/resumebased",
    icon: FileText,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    badge: "AI Powered",
    badgeVariant: "success"
  },
];

const stats = [
  { label: "Practice Modes", value: "4", icon: Sparkles },
  { label: "AI Evaluation", value: "Real-time", icon: Zap },
  { label: "Skill Tracking", value: "Smart", icon: BarChart },
];

export default function InterviewHub() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch (e) { }
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-surface rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-foreground">Interview Preparation</h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">Welcome back,</span>
              <Badge variant="neutral" className="bg-surface border-border">
                {user.name?.split(' ')[0]}
              </Badge>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
              Choose Your Path to Mastery
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Select a practice mode below to start your personalized interview session.
              Our AI adapts to your responses in real-time.
            </p>
          </motion.div>

          {/* Modes Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modes.map((mode, index) => (
              <Link key={index} href={mode.href}>
                <Card
                  hover
                  animate={false}
                  className="h-full group flex flex-col sm:flex-row items-start gap-6 p-6 transition-all hover:border-primary/50"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${mode.bg} ${mode.color} transition-transform group-hover:scale-110`}>
                    <mode.icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {mode.title}
                      </h3>
                      <Badge variant={mode.badgeVariant} size="xs" className="uppercase tracking-wider font-bold">
                        {mode.badge}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {mode.description}
                    </p>

                    <div className="pt-2 flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      Start Session <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </motion.div>

          {/* Stats Bar */}
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto border-t border-border pt-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center space-y-2 text-center">
                  <div className="text-muted-foreground bg-surface p-3 rounded-full mb-2">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
