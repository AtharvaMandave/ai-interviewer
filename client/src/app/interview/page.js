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
  ArrowRight,
  Code
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const modes = [
  {
    title: "Company Wise",
    description: "Practice actual questions asked by top tech companies like Google, Amazon, and Microsoft.",
    href: "/companywise",
    icon: Building2,
    color: '#2563EB',
    bg: '#EFF6FF',
    badge: "Popular",
    badgeVariant: "info"
  },
  {
    title: "Topic Wise",
    description: "Master specific concepts including DSA, System Design, OS, and DBMS.",
    href: "/topicwise",
    icon: Brain,
    color: '#7C3AED',
    bg: '#F5F3FF',
    badge: "Recommended",
    badgeVariant: "accent"
  },
  {
    title: "Role Specific",
    description: "Tailored interview paths for Frontend, Backend, DevOps, and Full Stack roles.",
    href: "/rolespecific",
    icon: Briefcase,
    color: '#D97706',
    bg: '#FFFBEB',
    badge: "Targeted",
    badgeVariant: "warning"
  },
  {
    title: "Resume Based",
    description: "AI analyzes your resume to generate personalized project-specific questions.",
    href: "/resumebased",
    icon: FileText,
    color: '#059669',
    bg: '#ECFDF5',
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
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0, 0.2, 1] } }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      color: '#111827',
      fontFamily: 'Inter, Helvetica Neue, system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        height: '64px',
        borderBottom: '1px solid #E5E7EB',
        background: 'rgba(249,250,251,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '0 24px', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#F3F4F6', border: '1px solid #E5E7EB',
                color: '#6B7280', textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E5E7EB'; e.currentTarget.style.color = '#111827'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#6B7280'; }}
            >
              <ChevronLeft style={{ width: '18px', height: '18px' }} />
            </Link>
            <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: '#2563EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Code style={{ width: '14px', height: '14px', color: '#fff' }} />
              </div>
              <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                Interview Preparation
              </h1>
            </div>
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Welcome back,</span>
              <Badge variant="neutral">
                {user.name?.split(' ')[0]}
              </Badge>
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
            <p style={{
              fontSize: '13px', fontWeight: 600, color: '#2563EB',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px'
            }}>
              Choose Your Path
            </p>
            <h2 style={{
              fontSize: 'clamp(26px, 3.5vw, 36px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#111827',
              lineHeight: 1.2,
              marginBottom: '16px'
            }}>
              Choose Your Path to Mastery
            </h2>
            <p style={{ fontSize: '17px', color: '#6B7280', lineHeight: 1.65 }}>
              Select a practice mode below to start your personalized interview session.
              Our AI adapts to your responses in real-time.
            </p>
          </motion.div>

          {/* Modes Grid — 2 columns */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '24px'
            }}
            className="grid-cols-1 md:grid-cols-2"
          >
            {modes.map((mode, index) => (
              <Link key={index} href={mode.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    padding: '28px 32px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    height: '100%'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: mode.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <mode.icon style={{ width: '24px', height: '24px', color: mode.color }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#111827' }}>
                        {mode.title}
                      </h3>
                      <Badge variant={mode.badgeVariant} size="xs">
                        {mode.badge}
                      </Badge>
                    </div>
                    <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, marginBottom: '16px' }}>
                      {mode.description}
                    </p>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      fontSize: '13px', fontWeight: 600, color: '#2563EB'
                    }}>
                      Start Session <ArrowRight style={{ width: '13px', height: '13px' }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            variants={itemVariants}
            style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '48px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '32px',
              maxWidth: '640px',
              margin: '0 auto',
              width: '100%'
            }}
          >
            {stats.map((stat, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                <div style={{
                  padding: '12px', borderRadius: '12px',
                  background: '#F3F4F6', border: '1px solid #E5E7EB'
                }}>
                  <stat.icon style={{ width: '20px', height: '20px', color: '#6B7280' }} />
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
