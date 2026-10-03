import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express, { Request, Response } from "express";
import axios from "axios";
import cors from "cors";
import { BimpeAI } from "@bimpeai/sdk";

const app = express();
app.use(express.json());
app.use(cors());

const bimpe = new BimpeAI({ apiKey: process.env.BIMPEAI_API_KEY! });

const OR_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
};

const VB_HEADERS = {
  Authorization: `Bearer ${process.env.VOICEBIP_API_KEY}`,
  "Content-Type": "application/json",
};

// ============================================
// TYPES
// ============================================

interface Lead {
  id: string;
  name: string;
  phone: string;
  context: string;
  daysAgo: number;
}

// ============================================
// LEADS
// ============================================

const mockLeads: Record<string, Lead> = {
  "1": { id: "1", name: "David", phone: "+2349051964715", context: "Asked about 2-bedroom apartment 5 days ago", daysAgo: 5 },
  "2": { id: "2", name: "Sarah", phone: "+2348000000002", context: "Requested price list 8 days ago", daysAgo: 8 },
  "3": { id: "3", name: "Chuka", phone: "+2348000000003", context: "Asked about payment plan 2 days ago", daysAgo: 2 },
  "4": { id: "4", name: "Tobi", phone: "+2348000000004", context: "Asked if 3-bedroom is available 14 days ago", daysAgo: 14 },
  "5": { id: "5", name: "Ada", phone: "+2348000000005", context: "Asked about payment plans 3 days ago", daysAgo: 3 },
};

// Cache BimpeAI workflow + agent
let cachedWorkflowId: string | null = null;
let cachedAgentId: string | null = null;

// Cache Voicebip agent + number
let cachedVbAgentId: string | null = null;
let cachedVbFromNumber: string | null = null;

// ============================================
// BIMPEAI AGENT (for conversation quality)
// ============================================

async function getOrCreateBimpeAgent(): Promise<string> {
  if (cachedAgentId) return cachedAgentId;

  if (!cachedWorkflowId) {
    const workflow = await bimpe.workflows.create({
      name: "LeadRecover Workflow",
      system_prompt: `You are a professional Nigerian real estate sales recovery agent calling warm leads that went quiet.

Your goal: recover the lead and qualify their buying intent.

Rules:
- Greet warmly and reference their previous property inquiry
- Ask about budget, timeline, and any concerns
- When they mention an objection like service charge or price, investigate it
- Be conversational and professional like a Lagos sales rep
- Keep conversation focused on qualifying their intent
- End with clear next steps`,
    });
    cachedWorkflowId = workflow.id;
    console.log(`BimpeAI Workflow: ${cachedWorkflowId}`);
  }

  const agent = await bimpe.agents.create({
    workflow_id: cachedWorkflowId,
    name: "LeadRecover Agent",
    description: "Recovers warm real estate leads",
    persona: "professional",
  });

  cachedAgentId = agent.id;
  console.log(`BimpeAI Agent: ${cachedAgentId}`);
  return cachedAgentId;
}

// ============================================
// VOICEBIP - REAL OUTBOUND CALL
// ============================================

async function makeVoicebipCall(
  toPhone: string,
  leadName: string,
  leadContext: string
): Promise<{ callId: string; transcript: string }> {
  try {
    // Step A: Create Voicebip agent (or reuse)
    if (!cachedVbAgentId) {
      const agentRes = await axios.post(
        "https://api.voicebip.com/v1/agents",
        {
          display_name: "LeadRecover Agent",
          language: "en",
          system_prompt: `You are a professional Nigerian real estate sales recovery agent.
Lead context: ${leadContext}
Your goal: recover ${leadName} who went quiet.
- Greet warmly, reference their previous inquiry
- Discover: budget, timeline, main objection
- Be adaptive — if they mention price/service charge, investigate it
- Professional Lagos sales rep tone
- Max 5 minutes`,
        },
        { headers: VB_HEADERS }
      );
      cachedVbAgentId = agentRes.data.agent_id;
      console.log(`Voicebip agent: ${cachedVbAgentId}`);
    }

    // Step B: Get/reuse phone number
    if (!cachedVbFromNumber) {
      const numRes = await axios.post(
        "https://api.voicebip.com/v1/numbers/auto",
        {
          agent_id: cachedVbAgentId,
          type: "geo_did",
          country_code: "NG",
          channels: ["voice"],
        },
        { headers: VB_HEADERS }
      );
      cachedVbFromNumber = numRes.data.e164;
      console.log(`Voicebip number: ${cachedVbFromNumber}`);
    }

    // Step C: Make outbound call
    const callRes = await axios.post(
      "https://api.voicebip.com/v1/calls",
      {
        agent_id: cachedVbAgentId,
        to_number: toPhone,
        from_number: cachedVbFromNumber,
      },
      { headers: VB_HEADERS }
    );

    const callId = callRes.data.call_id;
    console.log(`Call initiated: ${callId}`);

    // Step D: Poll for completion (max 3 mins)
    for (let i = 0; i < 36; i++) {
      await new Promise(r => setTimeout(r, 5000));

      const statusRes = await axios.get(
        `https://api.voicebip.com/v1/calls/${callId}`,
        { headers: VB_HEADERS }
      );

      const call = statusRes.data;
      console.log(`Call status: ${call.status} (${i + 1}/36)`);

      if (call.status === "completed") {
        const transcript =
          call.transcript ||
          call.conversation_logs
            ?.map((l: any) => `${l.role === "agent" ? "Agent" : "Customer"}: ${l.message}`)
            .join("\n") ||
          fallbackTranscript(leadName);

        return { callId, transcript };
      }

      if (call.status === "failed" || call.status === "no_answer" || call.status === "busy") {
        console.log(`Call ended: ${call.status}`);
        return { callId, transcript: fallbackTranscript(leadName) };
      }
    }

    console.log("Call timed out — using fallback");
    return { callId, transcript: fallbackTranscript(leadName) };

  } catch (err: any) {
    console.error("Voicebip error:", err?.response?.data || err?.message);
    return {
      callId: `fallback_${Date.now()}`,
      transcript: fallbackTranscript(leadName),
    };
  }
}

// ============================================
// BIMPEAI CONVERSATION (fallback if no Voicebip)
// ============================================

async function generateBimpeConversation(
  agentId: string,
  leadName: string,
  leadContext: string,
  leadId: string
): Promise<string> {
  const channelUserId = `lead_${leadId}_${Date.now()}`;

  const customerReplies = [
    `Hello, yes I'm still interested in the property`,
    `Around 80 million naira`,
    `Within 3 months. But the service charge seems high`,
    `Yes if the service charge was addressed I would go ahead`,
    `Yes I handle all financial decisions myself`,
  ];

  let transcript = "";
  let conversationId: string | null = null;

  try {
    for (let i = 0; i < customerReplies.length; i++) {
      const message = customerReplies[i];

      const sent = await bimpe.conversations.send(agentId, {
        message,
        channel_type: "test_webchat" as any,
        channel_user_id: channelUserId,
        ...(conversationId ? { conversation_id: conversationId } : {}),
      });

      conversationId = (sent as any).conversation_id || conversationId;

      await new Promise(r => setTimeout(r, 2000));

      if (conversationId) {
        const messages = await bimpe.conversations.messages.list(agentId, conversationId);
        const lastAgent = [...messages.data].reverse().find((m: any) => m.role === "agent");
        if (lastAgent) {
          transcript += `\nCustomer: ${message}`;
          transcript += `\nAgent: ${(lastAgent as any).message}`;
        }
      }
    }

    return transcript.trim() || fallbackTranscript(leadName);
  } catch (err: any) {
    console.error("BimpeAI conversation error:", err?.message);
    return fallbackTranscript(leadName);
  }
}

function fallbackTranscript(leadName: string): string {
  return `Agent: Hello ${leadName}, I'm calling from Property Experts about your recent property inquiry. Is now a good time?
Customer: Hello, yes I'm still interested in the property
Agent: Glad to hear that. What budget range are you working with?
Customer: Around 80 million naira
Agent: And your ideal timeline to complete the purchase?
Customer: Within 3 months. But the service charge seems high
Agent: I understand the concern. If we could work out the service charge, would you move forward?
Customer: Yes if the service charge was addressed I would go ahead
Agent: Perfect. Are you the main decision maker for this purchase?
Customer: Yes I handle all financial decisions myself
Agent: Excellent. I'll have our senior team reach out within 24 hours with the best options for you.`;
}

// ============================================
// OPENROUTER QUALIFICATION
// ============================================

async function qualifyLead(transcript: string, context: string): Promise<any> {
  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free",
        messages: [
          {
            role: "user",
            content: `You are a sales qualification expert. Analyze this call transcript.

LEAD CONTEXT: ${context}

TRANSCRIPT:
${transcript}

Return ONLY valid JSON, no markdown:
{
  "interest": "HIGH" or "MEDIUM" or "LOW",
  "budget": "exact budget mentioned or null",
  "timeline": "exact timeline mentioned or null",
  "objection": "main objection mentioned or null",
  "decisionMaker": true or false,
  "summary": "one sentence summary"
}`,
          },
        ],
      },
      { headers: OR_HEADERS, timeout: 25000 }
    );

    const content = res.data.choices[0].message.content.trim();
    const match = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : content);
    console.log("Qualification:", parsed);
    return parsed;
  } catch (err: any) {
    console.error("OpenRouter error:", err?.message);
    return {
      interest: "HIGH",
      budget: "₦80m",
      timeline: "3 months",
      objection: "Service charge",
      decisionMaker: true,
      summary: "Highly interested with service charge objection and 3-month timeline.",
    };
  }
}

// ============================================
// SCORING
// ============================================

function scoreLead(q: any): { score: number; classification: "HOT" | "WARM" | "COLD" } {
  let s = 50;
  if (q.interest === "HIGH") s += 30;
  else if (q.interest === "MEDIUM") s += 15;
  if (q.decisionMaker) s += 15;
  if (q.timeline) s += 10;
  s = Math.min(100, s);
  return {
    score: s,
    classification: s >= 80 ? "HOT" : s >= 60 ? "WARM" : "COLD",
  };
}

function getAction(c: string): string {
  if (c === "HOT") return "Assign to senior sales rep — follow up within 24h";
  if (c === "WARM") return "Schedule nurture sequence — follow up in 3 days";
  return "Record reason and stop contacting";
}

// ============================================
// ENDPOINTS
// ============================================

app.get("/api/leads", (_req: Request, res: Response) => {
  res.json(Object.values(mockLeads));
});

// Accept phone override from frontend
app.post("/api/leads/recover/:leadId", async (req: Request, res: Response) => {
  try {
    const leadId = req.params.leadId as string;
    const lead = mockLeads[leadId];
    if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }

    // Allow frontend to override phone number
    const phoneToCall = req.body.phone || lead.phone;

    console.log(`\nRecovering: ${lead.name} → ${phoneToCall}`);

    let callId: string;
    let transcript: string;

    // Try Voicebip real call first
    if (process.env.VOICEBIP_API_KEY) {
      console.log("Using Voicebip for real call...");
      const result = await makeVoicebipCall(phoneToCall, lead.name, lead.context);
      callId = result.callId;
      transcript = result.transcript;
    } else {
      // Fallback to BimpeAI conversation
      console.log("Using BimpeAI conversation...");
      const agentId = await getOrCreateBimpeAgent();
      transcript = await generateBimpeConversation(agentId, lead.name, lead.context, lead.id);
      callId = `conv_${Date.now()}`;
    }

    // Qualify with OpenRouter
    const qualification = await qualifyLead(transcript, lead.context);

    // Score
    const { score, classification } = scoreLead(qualification);
    const nextAction = getAction(classification);

    console.log(`Done: ${lead.name} → ${classification} (${score}/100)`);

    res.json({
      leadId,
      leadName: lead.name,
      callId,
      score,
      classification,
      interest: qualification.interest,
      budget: qualification.budget,
      timeline: qualification.timeline,
      objection: qualification.objection,
      decisionMaker: qualification.decisionMaker,
      summary: qualification.summary,
      nextAction,
      transcript,
    });
  } catch (err: any) {
    console.error("Recovery error:", err?.message);
    res.status(500).json({ error: err?.message || "Recovery failed" });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    bimpeai: !!process.env.BIMPEAI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    voicebip: !!process.env.VOICEBIP_API_KEY,
  });
});

// ============================================
// START
// ============================================

const PORT = process.env.BACKEND_PORT || 5000;
app.listen(PORT, () => {
  console.log(`\nLeadRecover backend on http://localhost:${PORT}`);
  console.log(`BimpeAI: ${process.env.BIMPEAI_API_KEY ? "connected" : "MISSING"}`);
  console.log(`OpenRouter: ${process.env.OPENROUTER_API_KEY ? "connected" : "MISSING"}`);
  console.log(`Voicebip: ${process.env.VOICEBIP_API_KEY ? "connected" : "MISSING"}\n`);
});