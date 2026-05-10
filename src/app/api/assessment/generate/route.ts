import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { skill, level } = body as { skill?: string; level?: string };

  if (!skill) {
    return NextResponse.json({ error: "skill is required" }, { status: 400 });
  }

  const normalizedLevel = level ?? "intermediate";

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction:
      "You are a technical assessment expert. " +
      "Generate exactly 10 multiple-choice questions as a valid JSON array. " +
      "Return ONLY the JSON array with no surrounding text, markdown, or code fences.",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt =
    `Generate 10 multiple-choice questions to assess ${skill} knowledge at the ${normalizedLevel} level.\n\n` +
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

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json(
      { error: "Model returned malformed output" },
      { status: 502 }
    );
  }

  let questions: unknown;
  try {
    questions = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse questions" },
      { status: 502 }
    );
  }

  return NextResponse.json({ questions });
}
