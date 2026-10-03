import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const cyclingWords = ["Warm Leads", "Lost Opportunities", "Quiet Prospects", "Forgotten Deals"];

const ArrowRight = () => (
  <svg viewBox="0 0 16 16" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 8h10M9 4l4 4-4 4"/>
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 10.5a19.79 19.79 0 01-3-8.63A2 2 0 012.48 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96-.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24A2.5 2.5 0 019.5 2z"/>
    <path d="M14.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 004.96-.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24A2.5 2.5 0 0014.5 2z"/>
  </svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const LogoIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
    <circle cx="16" cy="16" r="14" stroke="#5B9BD5" strokeWidth="2"/>
    <path d="M8 24 Q12 10 16 16 Q20 22 24 8" stroke="#5B9BD5" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="24" cy="8" r="2.5" fill="#70AD47"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="6"/>
    <polyline points="5 8 7 10 11 6"/>
  </svg>
);

export default function Landing() {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = cyclingWords[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;
    if (!isDeleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 80);
    } else if (!isDeleting && displayed.length === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length - 1)), 40);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setWordIndex(prev => (prev + 1) % cyclingWords.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex]);

  const features = [
    {
      icon: <PhoneIcon />,
      title: "Real Outbound Calls",
      desc: "Agent dials warm leads on real Nigerian +234 numbers through Voicebip infrastructure."
    },
    {
      icon: <BrainIcon />,
      title: "Adaptive Conversation",
      desc: "BimpeAI agent adapts to what the customer says — detects objections and investigates them."
    },
    {
      icon: <TargetIcon />,
      title: "Lead Qualification",
      desc: "Every call produces a score, classification, and structured intelligence about the lead."
    },
    {
      icon: <ZapIcon />,
      title: "Immediate Action",
      desc: "HOT leads get routed to senior reps. WARM leads enter nurture. COLD leads are closed."
    },
  ];

  return (
    <div style={{ background: '#0F172A', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'white' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .cursor::after { content: '|'; animation: blink 1s step-end infinite; color: #5B9BD5; }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .a1 { animation: fadeUp 0.5s ease forwards; }
        .a2 { animation: fadeUp 0.5s 0.1s ease both; }
        .a3 { animation: fadeUp 0.5s 0.2s ease both; }
        .a4 { animation: fadeUp 0.5s 0.3s ease both; }
        .a5 { animation: fadeUp 0.5s 0.4s ease both; }
        .bg-dots { background-image: radial-gradient(circle, rgba(91,155,213,0.08) 1px, transparent 1px); background-size: 28px 28px; }
        .feature-card:hover { border-color: #5B9BD5; transform: translateY(-2px); }
        .cta-btn:hover { background: #4A7DAF; transform: translateY(-1px); }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid #1E293B', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoIcon />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#5B9BD5', letterSpacing: '-0.5px' }}>LeadRecover</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="cta-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: '#5B9BD5', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Open Dashboard <ArrowRight />
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-dots" style={{ paddingTop: 120, paddingBottom: 80, display: 'flex', alignItems: 'center', minHeight: '92vh' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div className="a1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#1E293B', border: '1px solid #334155', borderRadius: 999, fontSize: 12, color: '#94A3B8', marginBottom: 32, fontWeight: 500 }}>
            <svg viewBox="0 0 8 8" width="8" height="8"><circle cx="4" cy="4" r="4" fill="#70AD47"/></svg>
            Built for Lagos Agentic AI Hack Night 2026
          </div>

          <h1 className="a2" style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', margin: '0 0 24px' }}>
            Recover your<br />
            <span className="cursor" style={{ color: '#5B9BD5' }}>{displayed}</span>
          </h1>

          <p className="a3" style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.8, maxWidth: 520, margin: '0 auto 40px', fontWeight: 400 }}>
            Nigerian businesses lose thousands in warm leads every week. LeadRecover calls them back, understands why they went quiet, and tells your sales team exactly what to do next.
          </p>

          <div className="a4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="cta-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 32px', background: '#5B9BD5', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(91,155,213,0.25)' }}
            >
              Try the Demo <ArrowRight />
            </button>
          </div>

          {/* STATS */}
          <div className="a5" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 560, margin: '64px auto 0' }}>
            {[
              { value: '73%', label: 'of warm leads never get followed up' },
              { value: '5x', label: 'easier to close a warm lead than cold' },
              { value: '₦0', label: 'revenue from leads you never call back' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: 'white' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7F5600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>How It Works</span>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0F172A', marginTop: 8, letterSpacing: '-0.5px' }}>
              One click. Real call. Actionable result.
            </h2>
          </div>

          {/* FLOW */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 64 }}>
            {[
              { label: 'Warm Lead', sub: 'went quiet' },
              { label: 'AI Calls', sub: 'real +234 number' },
              { label: 'Understands', sub: 'budget, objection' },
              { label: 'Qualifies', sub: 'HOT / WARM / COLD' },
              { label: 'Acts', sub: 'routes to right team' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ textAlign: 'center', background: '#F8FAFC', border: '1px solid #E4E7EC', borderRadius: 12, padding: '16px 20px', minWidth: 100 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{step.label}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{step.sub}</div>
                </div>
                {i < 4 && (
                  <svg viewBox="0 0 16 16" fill="none" width="16" height="16" stroke="#5B9BD5" strokeWidth="1.5">
                    <path d="M3 8h10M9 4l4 4-4 4"/>
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* FEATURES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <div
                key={i}
                className="feature-card"
                style={{ background: '#F8FAFC', border: '1px solid #E4E7EC', borderRadius: 16, padding: 24, transition: 'all 0.2s', cursor: 'default' }}
              >
                <div style={{ width: 40, height: 40, background: '#EFF6FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#136299', marginBottom: 16 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#475467', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0F172A', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>
            Stop letting warm leads<br />
            <span style={{ color: '#5B9BD5' }}>disappear.</span>
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 16, lineHeight: 1.8, marginBottom: 40 }}>
            Every lead that goes quiet is revenue at risk. LeadRecover finds those opportunities and converts them into actions.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="cta-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 36px', background: '#5B9BD5', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(91,155,213,0.25)' }}
          >
            Open Dashboard <ArrowRight />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
            {['Nigerian phone infrastructure', 'BimpeAI powered', 'Real-time qualification'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#70AD47' }}>
                <CheckIcon />
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0B0F1A', borderTop: '1px solid #1E293B', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <LogoIcon />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#5B9BD5' }}>LeadRecover</span>
        </div>
        <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>Built at Lagos Agentic AI Hack Night 2026 · Powered by BimpeAI + Voicebip + OpenRouter</p>
      </footer>
    </div>
  );
}