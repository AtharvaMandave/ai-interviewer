'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { motion } from "framer-motion";
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
  CheckCircle2,
  Users,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Home() {
  const [user, setUser] = useState(null);

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
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.2, 0, 0.2, 1] }
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#F9FAFB', color: '#111827', fontFamily: 'Inter, Helvetica Neue, system-ui, sans-serif' }}>

      {/* ───── NAVBAR ───── */}
      <nav style={{
        height: '64px',
        borderBottom: '1px solid #E5E7EB',
        background: 'rgba(249,250,251,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Code style={{ width: '18px', height: '18px', color: '#fff' }} />
            </div>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
              Interview<span style={{ color: '#2563EB' }}>AI</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div className="hidden md:flex" style={{ gap: '32px', alignItems: 'center' }}>
              {['Features', 'Pricing', 'About'].map(link => (
                <Link
                  key={link}
                  href={`/${link.toLowerCase()}`}
                  style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#111827'}
                  onMouseLeave={e => e.target.style.color = '#6B7280'}
                >
                  {link}
                </Link>
              ))}
            </div>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#EFF6FF', border: '1px solid #BFDBFE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: '#2563EB'
                }}>
                  {user.name?.charAt(0)}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" icon={ChevronRight}>
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* ───── HERO SECTION ───── */}
        <section style={{ padding: '100px 24px 80px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}
            >
              <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
               
              </motion.div>

              <motion.h1 variants={itemVariants} style={{
                fontSize: 'clamp(40px, 5.5vw, 56px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                color: '#111827',
                marginBottom: '24px'
              }}>
                Master Your Next <br />
                <span style={{ color: '#2563EB' }}>Technical Interview</span>
              </motion.h1>

              <motion.p variants={itemVariants} style={{
                fontSize: '18px',
                color: '#6B7280',
                lineHeight: 1.65,
                maxWidth: '540px',
                margin: '0 auto 40px'
              }}>
                Practice with our intelligent AI coach that adapts to your skill level,
                provides real-time feedback, and helps you land your dream job.
              </motion.p>

              <motion.div
                variants={itemVariants}
                style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
              >
                <Link href="/interview">
                  <Button variant="primary" size="xl" icon={Rocket}>
                    Start Practicing Now
                  </Button>
                </Link>
              
              </motion.div>

              {/* Stats Row */}
              <motion.div
                variants={itemVariants}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0',
                  marginTop: '80px',
                  paddingTop: '48px',
                  borderTop: '1px solid #E5E7EB'
                }}
                className="grid-cols-2 md:grid-cols-4"
              >
                {[
                  { label: "Active Users", value: "10,000+", icon: Users },
                  { label: "Questions Solved", value: "500k+", icon: CheckCircle2 },
                  { label: "Offer Rate", value: "94%", icon: TrendingUp },
                  { label: "Partner Companies", value: "50+", icon: Building2 },
                ].map((stat, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '0 16px' }}>
                    <div style={{
                      padding: '8px', borderRadius: '10px',
                      background: '#F3F4F6', border: '1px solid #E5E7EB',
                      marginBottom: '4px'
                    }}>
                      <stat.icon style={{ width: '18px', height: '18px', color: '#6B7280' }} />
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ───── FEATURE GRID SECTION ───── */}
        <section id="demo" style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <p style={{
                fontSize: '13px', fontWeight: 600, color: '#2563EB',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px'
              }}>
                Practice Modes
              </p>
              <h2 style={{
                fontSize: 'clamp(24px, 3vw, 32px)',
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '-0.025em',
                marginBottom: '16px'
              }}>
                Practice Your Way
              </h2>
              <p style={{ fontSize: '17px', color: '#6B7280', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
                Four powerful modes designed to cover every aspect of your interview preparation journey.
              </p>
            </div>

            {/* 2×2 Grid → 4 features */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '24px'
            }} className="grid-cols-1 md:grid-cols-2">
              {[
                {
                  title: "Company Wise",
                  desc: "Target specific top-tier companies like Google, Amazon, and Microsoft with curated questions and patterns.",
                  icon: Building2,
                  color: '#2563EB',
                  bg: '#EFF6FF',
                  href: "/companywise"
                },
                {
                  title: "Topic Wise",
                  desc: "Deep dive into specific concepts like DSA, System Design, OS, DBMS, and more.",
                  icon: Brain,
                  color: '#7C3AED',
                  bg: '#F5F3FF',
                  href: "/topicwise"
                },
                {
                  title: "Role Specific",
                  desc: "Tailored questions for Frontend, Backend, DevOps, and other engineering roles.",
                  icon: Briefcase,
                  color: '#D97706',
                  bg: '#FFFBEB',
                  href: "/rolespecific"
                },
                {
                  title: "Resume Based",
                  desc: "Upload your resume and get questions pertinent to your actual experience and projects.",
                  icon: FileText,
                  color: '#059669',
                  bg: '#ECFDF5',
                  href: "/resumebased"
                },
              ].map((feature, i) => (
                <Link key={i} href={feature.href} style={{ textDecoration: 'none' }}>
                  <div
                    className="hover-lift group"
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                      padding: '32px',
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
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: feature.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '24px',
                      transition: 'transform 0.2s ease'
                    }}>
                      <feature.icon style={{ width: '24px', height: '24px', color: feature.color }} />
                    </div>
                    <h3 style={{
                      fontSize: '18px', fontWeight: 600, color: '#111827',
                      marginBottom: '12px', letterSpacing: '-0.01em'
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.65, marginBottom: '20px' }}>
                      {feature.desc}
                    </p>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      fontSize: '14px', fontWeight: 500, color: '#2563EB'
                    }}>
                      Start practicing <ArrowRight style={{ width: '14px', height: '14px' }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ───── HOW IT WORKS ───── */}
        <section style={{ padding: '100px 24px', background: '#FFFFFF', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                How It Works
              </p>
              <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: '#111827', letterSpacing: '-0.025em', marginBottom: '16px' }}>
                From Zero to Interview-Ready
              </h2>
              <p style={{ fontSize: '17px', color: '#6B7280', maxWidth: '480px', margin: '0 auto' }}>
                Start in seconds. Our AI handles the rest.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '32px'
            }} className="grid-cols-1 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Choose a Mode',
                  desc: 'Pick company, topic, role, or upload your resume. The AI creates a custom session.',
                  icon: Target
                },
                {
                  step: '02',
                  title: 'Practice with AI',
                  desc: 'Answer questions via text or voice. Follow-up questions adapt to your responses.',
                  icon: Brain
                },
                {
                  step: '03',
                  title: 'Get Insights',
                  desc: 'Receive a detailed performance report with weak areas and improvement suggestions.',
                  icon: TrendingUp
                },
              ].map((step, i) => (
                <div key={i} style={{
                  background: '#F9FAFB',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  padding: '32px'
                }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 700, color: '#9CA3AF',
                    letterSpacing: '0.08em', marginBottom: '20px'
                  }}>
                    STEP {step.step}
                  </div>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '20px'
                  }}>
                    <step.icon style={{ width: '22px', height: '22px', color: '#2563EB' }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.65 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── CTA BAND ───── */}
        <section style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              background: '#2563EB',
              borderRadius: '20px',
              padding: '64px 48px',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: 'clamp(24px, 3vw, 36px)',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.025em',
                marginBottom: '16px'
              }}>
                Ready to ace your next interview?
              </h2>
              <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.75)', marginBottom: '36px' }}>
                Join 10,000+ developers who practice smarter with InterviewAI.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/register">
                  <button style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '14px 28px', borderRadius: '12px',
                    background: '#FFFFFF', color: '#2563EB',
                    fontSize: '15px', fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F0F9FF'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Get Started Free <ChevronRight style={{ width: '16px', height: '16px' }} />
                  </button>
                </Link>
                <Link href="/interview">
                  <button style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '14px 28px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.12)', color: '#FFFFFF',
                    fontSize: '15px', fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                  >
                    Try Demo First
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ───── FOOTER ───── */}
      <footer style={{ borderTop: '1px solid #E5E7EB', background: '#FFFFFF', padding: '48px 24px' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          gap: '24px'
        }} className="md:flex-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Code style={{ width: '16px', height: '16px', color: '#fff' }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>InterviewAI</span>
          </div>

          <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
            © 2026 InterviewAI. Building the future of technical hiring.
          </p>

          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy', 'Terms', 'Twitter'].map(link => (
              <Link
                key={link}
                href="#"
                style={{ fontSize: '14px', fontWeight: 500, color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color = '#111827'}
                onMouseLeave={e => e.target.style.color = '#9CA3AF'}
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
