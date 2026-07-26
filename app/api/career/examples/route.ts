import { NextRequest } from "next/server";
import { getResumeExamples } from "@/lib/career-data/loader";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const targetLevel = searchParams.get("level") || undefined;
  const limit = parseInt(searchParams.get("limit") || "5");

  const data = getResumeExamples({ targetLevel, limit });
  return Response.json({ examples: data, total: data.length });
}
