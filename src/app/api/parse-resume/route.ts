import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File must be 5 MB or smaller" },
        { status: 422 }
      );
    }

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const isPdf =
      file.type === "application/pdf" || ext === ".pdf";
    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === ".docx";

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 422 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let rawText: string;
    try {
      if (isPdf) {
        const PDFParser = (await import('pdf2json')).default
        const pdfParser = new PDFParser()
        rawText = await new Promise<string>((resolve, reject) => {
          pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
            const text = pdfData.Pages
              .flatMap((page: any) => page.Texts)
              .map((t: any) =>
                t.R.map((r: any) => {
                  try {
                    return decodeURIComponent(r.T)
                  } catch {
                    return r.T
                  }
                }).join('')
              )
              .join(' ')
            resolve(text)
          })
          pdfParser.on('pdfParser_dataError', reject)
          pdfParser.parseBuffer(buffer)
        })
      } else {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value;
      }
    } catch (parseError) {
      console.error('parse-resume error:', parseError)
      console.error('error message:', (parseError as any)?.message)
      console.error('error stack:', (parseError as any)?.stack)
      return NextResponse.json(
        { error: "Failed to parse the document" },
        { status: 422 }
      );
    }

    const storagePath = `${user.id}/${Date.now()}${ext}`;
    const { error: storageError } = await supabase.storage
      .from("resumes")
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json(
        { error: "Failed to upload file", detail: storageError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("resumes").getPublicUrl(storagePath);

    const { data: resume, error: dbError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        raw_text: rawText,
      })
      .select("id")
      .single();

    if (dbError || !resume) {
      console.error('DB error:', dbError)
      return NextResponse.json(
        { error: "Failed to save resume", detail: dbError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: resume.id });
  } catch (error) {
    console.error("parse-resume error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
