import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Skill {
  skill: string;
  level: "beginner" | "intermediate" | "advanced";
  evidence: string;
}

export interface MissingSkill {
  skill: string;
  priority: "high" | "medium" | "low";
  why: string;
  resources: string[];
}

export interface Resource {
  title: string;
  url: string;
  type: "course" | "video" | "article" | "practice";
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  skills: string[];
  durationHours: number;
  resources: Resource[];
  order: number;
  type: string;
}

// ── Client ────────────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
})

// ── Exported functions ────────────────────────────────────────────────────────

export async function generateSkillGapReport(params: {
  resumeText: string;
  targetRole: string;
  domain: string;
}): Promise<{
  readinessScore: number;
  skillsPresent: Skill[];
  skillsMissing: MissingSkill[];
  summary: string;
}> {
  const { resumeText, targetRole, domain } = params;

  const prompt =
    `You are a career coach and technical recruiter specialising in ${domain}. ` +
    `Analyse the candidate's resume against the target role. ` +
    `Return only valid JSON, no markdown or code fences.\n\n` +
    `Resume:\n${resumeText}\n\n` +
    `Target role: ${targetRole}\n\n` +
    `Return JSON:\n` +
    `{\n` +
    `  "readinessScore": number 0-100,\n` +
    `  "summary": string,\n` +
    `  "skillsPresent": [{"skill": string, "level": "beginner"|"intermediate"|"advanced", "evidence": string}],\n` +
    `  "skillsMissing": [{"skill": string, "priority": "high"|"medium"|"low", "why": string, "resources": [string]}]\n` +
    `}`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    throw new Error(
      `Skill gap analysis failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function generateLearningPath(params: {
  missingSkills: MissingSkill[];
  targetRole: string;
  timelineWeeks: number;
}): Promise<{ modules: LearningModule[] }> {
  const { missingSkills, targetRole, timelineWeeks } = params;

  const skillsList = missingSkills
    .map((s) => `- ${s.skill} (priority: ${s.priority}): ${s.why}`)
    .join("\n");

  const prompt =
    `You are a curriculum designer building personalised learning paths for software professionals. ` +
    `Return only valid JSON, no markdown or code fences.\n\n` +
    `Target role: ${targetRole}\n` +
    `Available weeks: ${timelineWeeks}\n` +
    `Skills to acquire:\n${skillsList}\n\n` +
    `Return JSON:\n` +
    `{\n` +
    `  "modules": [\n` +
    `    {\n` +
    `      "id": string,\n` +
    `      "title": string,\n` +
    `      "description": string,\n` +
    `      "skills": [string],\n` +
    `      "durationHours": number,\n` +
    `      "resources": [{"title": string, "url": string, "type": "course"|"video"|"article"|"practice"}],\n` +
    `      "order": number,\n` +
    `      "type": string\n` +
    `    }\n` +
    `  ]\n` +
    `}`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    throw new Error(
      `Learning path generation failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
