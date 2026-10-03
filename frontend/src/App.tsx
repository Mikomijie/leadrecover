import { useState, useEffect } from 'react';
import './App.css';

interface Lead {
  id: string;
  name: string;
  phone: string;
  context: string;
  daysAgo: number;
}

interface Result {
  leadId: string;
  leadName: string;
  score: number;
  classification: string;
  interest: string;
  budget?: string;
  timeline?: string;
  objection?: string;
  decisionMaker: boolean;
  summary: string;
  nextAction: string;
  transcript: string;
}

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/leads')
      .then(r => r.json())
      .then(data => setLeads(data))
      .catch(err => console.error('Failed to load leads:', err));
  }, []);

  const recoverLead = async (leadId: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`http://localhost:5000/api/leads/recover/${leadId}`, {
        method: 'POST',
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Recovery failed. Check backend.');
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        body { margin: 0; padding: 0; background: #0F172A; }
        .app { min-height: 100vh; background: #0F172A; }
      `}</style>

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E4E7EC]">
        <div className="h-[60px] max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <div className="text-[18px] font-bold text-[#136299]">🚀 LeadRecover</div>
          <div className="text-[13px] text-[#475467]">Recover warm leads before they disappear</div>
        </div>
      </header>

      <main className="pt-[60px] pb-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
            
            {/* LEADS SECTION */}
            <div className="lg:col-span-1">
              <div className="sticky top-[80px]">
                <h2 className="text-white text-[20px] font-bold mb-6">📋 Warm Leads</h2>
                <div className="space-y-3">
                  {leads.map(lead => (
                    <div
                      key={lead.id}
                      className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 hover:border-[#5B9BD5] transition-all cursor-pointer"
                      onClick={() => recoverLead(lead.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-semibold text-[14px]">{lead.name}</h3>
                        <span className="text-[#64748B] text-[11px] bg-[#0F172A] px-2 py-1 rounded">
                          {lead.daysAgo}d ago
                        </span>
                      </div>
                      <p className="text-[#94A3B8] text-[12px] mb-2">{lead.context}</p>
                      <p className="text-[#475467] text-[11px] font-mono">{lead.phone}</p>
                      <button
                        disabled={loading}
                        className="mt-3 w-full px-3 py-2 bg-[#5B9BD5] hover:bg-[#4A7DAF] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-semibold rounded-lg transition-colors"
                      >
                        {loading ? '📞 Calling...' : 'Recover Lead'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RESULT SECTION */}
            <div className="lg:col-span-2">
              {result ? (
                <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8">
                  {/* Classification Badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6 font-bold text-[15px] ${
                    result.classification === 'HOT'
                      ? 'bg-[#7F1D1D] text-[#FCA5A5]'
                      : result.classification === 'WARM'
                      ? 'bg-[#78350F] text-[#FCD34D]'
                      : 'bg-[#1E3A8A] text-[#93C5FD]'
                  }`}>
                    {result.classification === 'HOT' && '🔥'}
                    {result.classification === 'WARM' && '🟡'}
                    {result.classification === 'COLD' && '🔵'}
                    {' '}{result.classification}
                  </div>

                  {/* Score */}
                  <div className="mb-8">
                    <div className="text-[56px] font-extrabold text-[#5B9BD5]">{result.score}</div>
                    <div className="text-[14px] text-[#94A3B8]">Qualification Score</div>
                  </div>

                  {/* Analysis Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
                      <div className="text-[11px] text-[#64748B] uppercase font-bold mb-1">Interest</div>
                      <div className="text-white font-semibold">{result.interest}</div>
                    </div>
                    <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
                      <div className="text-[11px] text-[#64748B] uppercase font-bold mb-1">Budget</div>
                      <div className="text-white font-semibold">{result.budget || 'Not specified'}</div>
                    </div>
                    <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
                      <div className="text-[11px] text-[#64748B] uppercase font-bold mb-1">Timeline</div>
                      <div className="text-white font-semibold">{result.timeline || 'N/A'}</div>
                    </div>
                    <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
                      <div className="text-[11px] text-[#64748B] uppercase font-bold mb-1">Decision Maker</div>
                      <div className="text-white font-semibold">{result.decisionMaker ? '✅ Yes' : '❌ No'}</div>
                    </div>
                  </div>

                  {/* Objection */}
                  {result.objection && (
                    <div className="bg-[#7F1D1D]/20 border border-[#7F1D1D]/40 rounded-lg p-4 mb-8">
                      <div className="text-[11px] text-[#FCA5A5] uppercase font-bold mb-1">Main Objection</div>
                      <div className="text-white">{result.objection}</div>
                    </div>
                  )}

                  {/* Next Action */}
                  <div className="bg-[#5B9BD5]/10 border border-[#5B9BD5]/20 rounded-lg p-4 mb-8">
                    <div className="text-[11px] text-[#5B9BD5] uppercase font-bold mb-2">Recommended Action</div>
                    <div className="text-white text-[14px] font-semibold">{result.nextAction}</div>
                  </div>

                  {/* Transcript */}
                  <details className="bg-[#0F172A] rounded-lg border border-[#334155]">
                    <summary className="p-4 cursor-pointer font-semibold text-[#5B9BD5] hover:text-[#4A7DAF]">
                      📝 View Call Transcript
                    </summary>
                    <pre className="p-4 bg-[#000000] text-[#94A3B8] text-[12px] whitespace-pre-wrap overflow-auto max-h-[300px] border-t border-[#334155]">
                      {result.transcript}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 text-center">
                  <div className="text-[48px] mb-4">👈</div>
                  <h3 className="text-white text-[18px] font-bold mb-2">Select a lead to recover</h3>
                  <p className="text-[#94A3B8]">Click any warm lead on the left to start recovery</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}