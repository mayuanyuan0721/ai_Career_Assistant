import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import withTimeout from "@/lib/timeout";

// pdf-parse and mammoth are loaded dynamically to avoid bundling issues

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const authResult = await withTimeout(
    supabase.auth.getUser(),
    5000,
    { data: { user: null }, error: null } as any
  );
  const { data: { user } } = authResult;
  if (!user) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "未收到文件" }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (filename.endsWith(".md") || filename.endsWith(".txt")) {
      // Plain text / Markdown
      text = buffer.toString("utf-8");

    } else if (filename.endsWith(".pdf")) {
      // PDF
      const pdfParse = (await import("pdf-parse")).default;
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;

    } else if (filename.endsWith(".docx")) {
      // Word
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;

    } else if (filename.endsWith(".doc")) {
      return Response.json(
        { error: "暂不支持 .doc 格式，请导出为 .docx 或 PDF 后重试" },
        { status: 400 }
      );

    } else {
      return Response.json(
        { error: `不支持的文件格式: ${filename}，请上传 .md / .pdf / .docx 文件` },
        { status: 400 }
      );
    }

    if (!text || text.trim().length < 20) {
      return Response.json(
        { error: "文件内容过短或为空，请确认简历内容完整后重试" },
        { status: 400 }
      );
    }

    console.log(`[EXTRACT] ${filename} -> ${text.length} chars`);

    return Response.json({
      text,
      filename: file.name,
      charCount: text.length,
    });

  } catch (error: any) {
    console.error("[EXTRACT] Error:", error);
    return Response.json(
      { error: "文件解析失败: " + error.message },
      { status: 500 }
    );
  }
}
