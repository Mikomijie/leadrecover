import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Lead {
  id: string;
  name: string;
  phone: string;
  context: string;
  daysAgo: number;
  lastMessage?: string;
}

interface Result {
  leadId: string;
  leadName: string;
  score: number;
  classification: 'HOT' | 'WARM' | 'COLD';
  interest: string;
  budget?: string;
  timeline?: string;
  objection?: string;
  decisionMaker: boolean;
  summary: string;
  nextAction: string;
  transcript: string;
}

const lastMessages: Record<string, string> = {
  '1': 'How much is the 2-bedroom flat?',
  '2': 'Please send me your price list',
  '3': 'Do you offer payment plans?',
  '4': 'Is the 3-bedroom still available?',
  '5': 'What are the payment options?',
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getUrgencyColor(days: number) {
  if (days <= 3) return { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
  if (days <= 7) return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
  return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
}

function getUrgencyLabel(days: number) {
  if (days <= 3) return 'Recent';
  if (days <= 7) return 'Cooling';
  return 'At risk';
}

const ArrowLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M13 8H3M7 4l-4 4 4 4"/>
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 10.5a19.79 19.79 0 01-3-8.63A2 2 0 012.48 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const LogoIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" width="24" height="24">
    <circle cx="16" cy="16" r="14" stroke="#136299" strokeWidth="2"/>
    <path d="M8 24 Q12 10 16 16 Q20 22 24 8" stroke="#136299" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="24" cy="8" r="2.5" fill="#70AD47"/>
  </svg>
);

const ChevronDown = () => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4 6l4 4 4-4"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 8 6 11 13 4"/>
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="6"/>
    <line x1="8" y1="5" x2="8" y2="8"/>
    <line x1="8" y1="11" x2="8.01" y2="11"/>
  </svg>
);

const Spinner = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
    </path>
  </svg>
);

const MessageIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="12" height="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l2 2 2-2h5a1 1 0 001-1V3a1 1 0 00-1-1z"/>
  </svg>
);
const CALL_SCRIPT = [
  { role: 'agent', text: "Hi, am I speaking with David? This is Temi from Property Experts Lagos." },
  { role: 'customer', text: "Yes, this is David." },
  { role: 'agent', text: "I'm calling about your 2-bedroom apartment enquiry. Are you still interested?" },
  { role: 'customer', text: "Yes, still interested." },
  { role: 'agent', text: "What budget range are you working with?" },
  { role: 'customer', text: "Around 80 million naira." },
  { role: 'agent', text: "And your timeline to complete the purchase?" },
  { role: 'customer', text: "Within 3 months. But the service charge seems high." },
  { role: 'agent', text: "That's something we can work with. Can I flag that for our senior team?" },
  { role: 'customer', text: "Yes, that works." },
  { role: 'agent', text: "Are you the main decision maker for this purchase?" },
  { role: 'customer', text: "Yes, I handle all financial decisions." },
  { role: 'agent', text: "Perfect. Our senior team will reach out within 24 hours. Thank you David!" },
];

function CallSimulator() {
  const [active, setActive] = useState(false);
  const [lines, setLines] = useState<{role:string;text:string}[]>([]);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  const speak = (text: string, isAgent: boolean) => {
    return new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-GB';
      utter.rate = 0.9;
      utter.pitch = isAgent ? 1.2 : 0.8;
      utter.volume = 1;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    });
  };

  const start = async () => {
    window.speechSynthesis.cancel();
    setActive(true);
    setLines([]);
    setDone(false);
    for (let i = 0; i < CALL_SCRIPT.length; i++) {
      const line = CALL_SCRIPT[i];
      setLines(p => [...p, line]);
      await speak(line.text, line.role === 'agent');
      await new Promise(r => setTimeout(r, 500));
    }
    setDone(true);
    setActive(false);
  };

  return (
    <div style={{background:'#0F172A',borderRadius:16,padding:28,marginBottom:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <p style={{color:'#F8FAFC',fontWeight:600,fontSize:15,margin:0}}>📞 Live Call Simulator</p>
          <p style={{color:'#64748B',fontSize:13,margin:'4px 0 0'}}>Watch Temi recover David in real time</p>
        </div>
        <button onClick={start} disabled={active} style={{background:active?'#374151':'#3B82F6',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:active?'not-allowed':'pointer'}}>
          {done ? '↺ Replay' : active ? 'Speaking...' : '▶ Start Call'}
        </button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10,maxHeight:280,overflowY:'auto'}}>
        {lines.map((l,i) => (
          <div key={i} style={{display:'flex',justifyContent:l.role==='agent'?'flex-start':'flex-end'}}>
            <div style={{background:l.role==='agent'?'#1E3A5F':'#1E293B',border:`1px solid ${l.role==='agent'?'#3B82F6':'#334155'}`,borderRadius:10,padding:'8px 14px',maxWidth:'75%'}}>
              <p style={{color:l.role==='agent'?'#93C5FD':'#CBD5E1',fontSize:11,margin:'0 0 3px',fontWeight:600}}>{l.role==='agent'?'Temi (Agent)':'David (Lead)'}</p>
              <p style={{color:'#F8FAFC',fontSize:14,margin:0,lineHeight:1.5}}>{l.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function Dashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeLead, setActiveLead] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recovered, setRecovered] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('https://leadrecover.onrender.com/api/leads')
      .then(r => r.json())
      .then(data => setLeads(data.map((l: Lead) => ({ ...l, lastMessage: lastMessages[l.id] }))))
      .catch(() => setError('Cannot connect to backend. Make sure it is running.'));
  }, []);

  const recoverLead = async (leadId: string) => {
    setLoading(true);
    setActiveLead(leadId);
    setResult(null);
    setError(null);
    setTranscriptOpen(false);
    try {
      const res = await fetch(`https://leadrecover.onrender.com/api/leads/recover/${leadId}`, { method: 'POST' });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setResult(data);
      setRecovered(prev => new Set([...prev, leadId]));
    } catch (err: any) {
      setError(err.message || 'Recovery failed. Check backend logs.');
    }
    setLoading(false);
  };

  const classConfig = {
    HOT: { bg: '#FEF2F2', border: '#FECACA', badge: '#DC2626', badgeBg: '#FEF2F2', label: 'Hot Lead', barColor: '#DC2626' },
    WARM: { bg: '#FFFBEB', border: '#FDE68A', badge: '#D97706', badgeBg: '#FFFBEB', label: 'Warm Lead', barColor: '#D97706' },
    COLD: { bg: '#EFF6FF', border: '#BFDBFE', badge: '#2563EB', badgeBg: '#EFF6FF', label: 'Cold Lead', barColor: '#2563EB' },
  };

  const hotCount = recovered.size;
  const atRiskCount = leads.filter(l => l.daysAgo > 7).length;

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .lead-card { transition: all 0.15s ease; }
        .lead-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .recover-btn { transition: all 0.15s ease; }
        .recover-btn:hover:not(:disabled) { background: #0F4F7A !important; }
        .recover-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 768px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
          .leads-panel { max-height: 380px; overflow-y: auto; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '5px 10px', color: '#64748B', fontSize: 12, cursor: 'pointer' }}>
              <ArrowLeft /> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LogoIcon />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#136299' }}>LeadRecover</span>
              <span style={{ fontSize: 11, color: '#94A3B8', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Dashboard</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }}/>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>System ready</span>
          </div>
        </div>
      </header>

      {/* STATS BAR */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '12px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total warm leads', value: leads.length, color: '#136299' },
            { label: 'At risk (8+ days)', value: atRiskCount, color: '#DC2626' },
            { label: 'Recovered today', value: hotCount, color: '#16A34A' },
            { label: 'Potential revenue', value: '₦400m+', color: '#D97706' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{s.label}</span>
              {i < 3 && <div style={{ width: 1, height: 20, background: '#E2E8F0', marginLeft: 14 }}/>}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid" style={{ maxWidth: 1400, margin: '0 auto', padding: 20, display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>

        {/* LEADS PANEL */}
        <div className="leads-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Warm Leads</span>
            <span style={{ fontSize: 11, color: '#94A3B8', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{leads.length} leads</span>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12, color: '#DC2626', display: 'flex', gap: 8 }}>
              <AlertIcon /> {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leads.map(lead => {
              const urgency = getUrgencyColor(lead.daysAgo);
              const isActive = activeLead === lead.id;
              const isRecovered = recovered.has(lead.id);
              return (
                <div
                  key={lead.id}
                  className="lead-card"
                  style={{
                    background: 'white',
                    border: `1px solid ${isActive ? '#136299' : '#E2E8F0'}`,
                    borderRadius: 12,
                    padding: 16,
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 0 0 3px rgba(19,98,153,0.1)' : 'none',
                  }}
                >
                  {/* TOP ROW */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#136299', flexShrink: 0 }}>
                      {getInitials(lead.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{lead.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {isRecovered && (
                            <span style={{ fontSize: 10, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Recovered</span>
                          )}
                          <span style={{ fontSize: 10, color: urgency.text, background: urgency.bg, border: `1px solid ${urgency.border}`, padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                            {getUrgencyLabel(lead.daysAgo)}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px', lineHeight: 1.4 }}>{lead.context}</p>
                      {lead.lastMessage && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94A3B8' }}>
                          <MessageIcon />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{lead.lastMessage}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PHONE */}
                  <div style={{ marginBottom: 10 }}>
  <input
    type="tel"
    defaultValue={lead.phone}
    onChange={(e) => {
      const updated = leads.map(l => l.id === lead.id ? { ...l, phone: e.target.value } : l);
      setLeads(updated);
    }}
    style={{
      width: '100%',
      padding: '6px 10px',
      fontSize: 12,
      fontFamily: 'monospace',
      border: '1px solid #E2E8F0',
      borderRadius: 6,
      color: '#475569',
      background: '#F8FAFC',
    }}
    placeholder="+234..."
  />
</div>

                  {/* DAYS AGO */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[1,2,3,4,5,6,7].map(d => (
                        <div key={d} style={{ width: 4, height: 12, borderRadius: 2, background: d <= Math.min(lead.daysAgo, 7) ? urgency.text : '#E2E8F0' }}/>
                      ))}
                      <span style={{ fontSize: 10, color: urgency.text, marginLeft: 4, fontWeight: 600 }}>{lead.daysAgo}d ago</span>
                    </div>
                  </div>

                  {/* BUTTON */}
                  <button
                    className="recover-btn"
                    onClick={() => recoverLead(lead.id)}
                    disabled={loading}
                    style={{ width: '100%', padding: '9px 0', background: '#136299', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {loading && activeLead === lead.id ? (
                      <><Spinner /> Recovering...</>
                    ) : (
                      <><PhoneIcon /> Recover Lead</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RESULT PANEL */}
        <div>
          {!result && !loading && (
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 48, textAlign: 'center', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', marginBottom: 16 }}>
                <PhoneIcon />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>Select a lead to recover</h3>
                           <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0 }}>Click any warm lead on the left to start</p>
                   <CallSimulator />
            </div>
          )}
          {loading && (
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 48, textAlign: 'center', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#136299', marginBottom: 20 }}><Spinner /></div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Recovering lead...</h3>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 28 }}>BimpeAI agent is in conversation</p>
              <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Creating BimpeAI agent', 'Initiating conversation', 'Qualifying with OpenRouter', 'Generating score'].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#64748B' }}>
                    <Spinner /> {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && !loading && (() => {
            const cfg = classConfig[result.classification];
            return (
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
                {/* RESULT HEADER */}
                <div style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Recovery Result — {result.leadName}</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cfg.badge, background: 'white', border: `1px solid ${cfg.border}`, padding: '4px 12px', borderRadius: 6 }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: cfg.badge, lineHeight: 1 }}>{result.score}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: 600 }}>QUALIFICATION SCORE</div>
                  </div>
                </div>

                <div style={{ padding: 28 }}>
                  {/* SCORE BAR */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${result.score}%`, background: cfg.barColor, borderRadius: 3, transition: 'width 1s ease' }}/>
                    </div>
                  </div>

                  {/* SUMMARY */}
                  {result.summary && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: '#475569', lineHeight: 1.7, fontStyle: 'italic' }}>
                      "{result.summary}"
                    </div>
                  )}

                  {/* DATA GRID */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Interest Level', value: result.interest || 'N/A' },
                      { label: 'Budget', value: result.budget || 'Not specified' },
                      { label: 'Timeline', value: result.timeline || 'Not specified' },
                      { label: 'Decision Maker', value: result.decisionMaker ? 'Yes' : 'No', check: result.decisionMaker },
                    ].map((item, i) => (
                      <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {item.check !== undefined && (
                            <span style={{ color: item.check ? '#16A34A' : '#DC2626' }}>
                              {item.check ? <CheckIcon /> : <AlertIcon />}
                            </span>
                          )}
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* OBJECTION */}
                  {result.objection && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 10, color: '#DC2626', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>Main Objection</div>
                      <div style={{ fontSize: 13, color: '#991B1B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertIcon /> {result.objection}
                      </div>
                    </div>
                  )}

                  {/* NEXT ACTION */}
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                    <div style={{ fontSize: 10, color: '#136299', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>Recommended Action</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF' }}>{result.nextAction}</div>
                  </div>

                  {/* TRANSCRIPT */}
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                    <button
                      onClick={() => setTranscriptOpen(!transcriptOpen)}
                      style={{ width: '100%', padding: '12px 16px', background: '#F8FAFC', border: 'none', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span>View Call Transcript</span>
                      <span style={{ transform: transcriptOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#136299' }}>
                        <ChevronDown />
                      </span>
                    </button>
                    {transcriptOpen && (
                      <pre style={{ margin: 0, padding: 16, background: '#0F172A', color: '#94A3B8', fontSize: 12, lineHeight: 1.8, overflowX: 'auto', maxHeight: 280, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                        {result.transcript}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
