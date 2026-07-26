import { NextRequest } from "next/server";
import { getInterviewQuestions } from "@/lib/career-data/loader";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") || undefined;
  const level = searchParams.get("level") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20");

  const data = getInterviewQuestions({ category, level, limit });
  return Response.json({ questions: data, total: data.length });
}
