import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

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

export interface AssessmentQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ── Client ────────────────────────────────────────────────────────────────────

const MODEL_NAME = "gemini-2.5-flash";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: { responseMimeType: "application/json" },
});

// ── Logging ───────────────────────────────────────────────────────────────────

async function insertLog(entry: {
  event_type: string;
  user_id?: string;
  duration_ms: number;
  tokens_used?: number;
  success: boolean;
  error_message?: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("research_logs").insert({
      event_type:    entry.event_type,
      user_id:       entry.user_id ?? null,
      duration_ms:   entry.duration_ms,
      tokens_used:   entry.tokens_used ?? null,
      model:         MODEL_NAME,
      success:       entry.success,
      error_message: entry.error_message ?? null,
      metadata:      entry.metadata,
    });
  } catch {
    // Logging must never break the main flow
  }
}

// ── Exported functions ────────────────────────────────────────────────────────

export async function generateSkillGapReport(params: {
  resumeText: string;
  targetRole: string;
  domain: string;
  userId?: string;
}): Promise<{
  readinessScore: number;
  skillsPresent: Skill[];
  skillsMissing: MissingSkill[];
  summary: string;
}> {
  const { resumeText, targetRole, domain, userId } = params;
  const t0 = Date.now();

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
    const parsed = JSON.parse(result.response.text()) as {
      readinessScore: number;
      skillsPresent: Skill[];
      skillsMissing: MissingSkill[];
      summary: string;
    };

    void insertLog({
      event_type:  "skill_gap_analysis",
      user_id:     userId,
      duration_ms: Date.now() - t0,
      tokens_used: result.response.usageMetadata?.totalTokenCount,
      success:     true,
      metadata: {
        targetRole,
        resumeLength: resumeText.length,
        skillsFound:  parsed.skillsPresent?.length ?? 0,
      },
    });

    return parsed;
  } catch (err) {
    void insertLog({
      event_type:    "skill_gap_analysis",
      user_id:       userId,
      duration_ms:   Date.now() - t0,
      success:       false,
      error_message: err instanceof Error ? err.message : String(err),
      metadata:      { targetRole, resumeLength: resumeText.length },
    });
    throw new Error(
      `Skill gap analysis failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function generateLearningPath(params: {
  missingSkills: MissingSkill[];
  targetRole: string;
  timelineWeeks: number;
  userId?: string;
}): Promise<{ modules: LearningModule[] }> {
  const { missingSkills, targetRole, timelineWeeks, userId } = params;
  const t0 = Date.now();

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
    const parsed = JSON.parse(result.response.text()) as { modules: LearningModule[] };

    void insertLog({
      event_type:  "learning_path_gen",
      user_id:     userId,
      duration_ms: Date.now() - t0,
      tokens_used: result.response.usageMetadata?.totalTokenCount,
      success:     true,
      metadata: {
        targetRole,
        skillsCount: missingSkills.length,
      },
    });

    return parsed;
  } catch (err) {
    void insertLog({
      event_type:    "learning_path_gen",
      user_id:       userId,
      duration_ms:   Date.now() - t0,
      success:       false,
      error_message: err instanceof Error ? err.message : String(err),
      metadata:      { targetRole, skillsCount: missingSkills.length },
    });
    throw new Error(
      `Learning path generation failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function generateAssessmentQuestions(params: {
  skill: string;
  level: string;
  userId?: string;
}): Promise<AssessmentQuestion[]> {
  const { skill, level, userId } = params;
  const t0 = Date.now();

  const assessmentModel = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction:
      "You are a technical assessment expert. " +
      "Generate exactly 10 multiple-choice questions as a valid JSON array. " +
      "Return ONLY the JSON array with no surrounding text, markdown, or code fences.",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt =
    `Generate 10 multiple-choice questions to assess ${skill} knowledge at the ${level} level.\n\n` +
    `Return a JSON array with this exact shape:\n` +
    `[\n` +
    `  {\n` +
    `    "question": "Question text — use backticks for code terms like \`useState\`",\n` +
    `    "options": ["Option A", "Option B", "Option C", "Option D"],\n` +
    `    "correctIndex": 0,\n` +
    `    "explanation": "One or two sentences explaining why this answer is correct."\n` +
    `  }\n` +
    `]\n\n` +
    `Requirements:\n` +
    `- Mix conceptual and practical questions\n` +
    `- All four options must be plausible but only one correct\n` +
    `- Gradually increase difficulty across the 10 questions\n` +
    `- Keep question text under 200 characters`;

  try {
    const result = await assessmentModel.generateContent(prompt);
    const raw = result.response.text().trim();

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Model returned malformed output");

    const questions = JSON.parse(jsonMatch[0]) as AssessmentQuestion[];

    void insertLog({
      event_type:  "assessment_gen",
      user_id:     userId,
      duration_ms: Date.now() - t0,
      tokens_used: result.response.usageMetadata?.totalTokenCount,
      success:     true,
      metadata:    { skill, level },
    });

    return questions;
  } catch (err) {
    void insertLog({
      event_type:    "assessment_gen",
      user_id:       userId,
      duration_ms:   Date.now() - t0,
      success:       false,
      error_message: err instanceof Error ? err.message : String(err),
      metadata:      { skill, level },
    });
    throw err;
  }
}
