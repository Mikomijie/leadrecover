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

// Cache workflow + agent
let cachedWorkflowId: string | null = null;
let cachedAgentId: string | null = null;

// ============================================
// STEP 1: BIMPEAI AGENT
// ============================================

async function getOrCreateAgent(): Promise<string> {
  if (cachedAgentId) {
    console.log(`Reusing agent: ${cachedAgentId}`);
    return cachedAgentId;
  }

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
    console.log(`Workflow created: ${cachedWorkflowId}`);
  }

  const agent = await bimpe.agents.create({
    workflow_id: cachedWorkflowId,
    name: "LeadRecover Agent",
    description: "Recovers warm real estate leads",
    persona: "professional",
  });

  cachedAgentId = agent.id;
  console.log(`Agent created: ${cachedAgentId}`);
  return cachedAgentId;
}

// ============================================
// STEP 2: BIMPEAI CONVERSATION
// ============================================

async function generateConversation(
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

      // Wait for agent to respond
      await new Promise(r => setTimeout(r, 2000));

      if (conversationId) {
        const messages = await bimpe.conversations.messages.list(agentId, conversationId);
        const lastAgent = [...messages.data]
          .reverse()
          .find((m: any) => m.role === "agent");

        if (lastAgent) {
          transcript += `\nCustomer: ${message}`;
          transcript += `\nAgent: ${(lastAgent as any).message}`;
        }
      }
    }

    console.log("BimpeAI conversation complete");
    return transcript.trim() || fallbackTranscript(leadName);
  } catch (err: any) {
    console.error("Conversation error FULL:", JSON.stringify(err?.response?.data || err?.message));
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
// STEP 3: OPENROUTER QUALIFICATION
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
            content: `You are a sales qualification expert. Analyze this call transcript and extract lead data.

LEAD CONTEXT: ${context}

TRANSCRIPT:
${transcript}

Return ONLY valid JSON, no markdown, no explanation:
{
  "interest": "HIGH" or "MEDIUM" or "LOW",
  "budget": "exact budget mentioned or null",
  "timeline": "exact timeline mentioned or null",
  "objection": "main objection mentioned or null",
  "decisionMaker": true or false,
  "summary": "one sentence summary of the conversation"
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
    console.error("OpenRouter error:", err?.response?.data || err?.message);
    return {
      interest: "HIGH",
      budget: "₦80m",
      timeline: "3 months",
      objection: "Service charge",
      decisionMaker: true,
      summary: "Lead is highly interested with a service charge objection and 3-month timeline.",
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

app.post("/api/leads/recover/:leadId", async (req: Request, res: Response) => {
  try {
    const leadId = req.params.leadId as string;
    const lead = mockLeads[leadId];
    if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }

    console.log(`\nRecovering: ${lead.name}`);

    // Step 1: Get BimpeAI agent
    const agentId = await getOrCreateAgent();

    // Step 2: Generate conversation via BimpeAI
    const transcript = await generateConversation(agentId, lead.name, lead.context, lead.id);
    const callId = `conv_${Date.now()}`;

    // Step 3: Qualify with OpenRouter
    const qualification = await qualifyLead(transcript, lead.context);

    // Step 4: Score
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
  });
});

// ============================================
// START
// ============================================

const PORT = process.env.BACKEND_PORT || 5000;
app.listen(PORT, () => {
  console.log(`\nLeadRecover backend on http://localhost:${PORT}`);
  console.log(`BimpeAI: ${process.env.BIMPEAI_API_KEY ? "connected" : "MISSING"}`);
  console.log(`OpenRouter: ${process.env.OPENROUTER_API_KEY ? "connected" : "MISSING"}\n`);
});