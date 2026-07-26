import { NextRequest } from "next/server";
import { getJobs } from "@/lib/career-data/loader";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const level = searchParams.get("level") || undefined;
  const skills = searchParams.get("skills")?.split(",").filter(Boolean) || undefined;
  const limit = parseInt(searchParams.get("limit") || "20");

  const data = getJobs({ level, skills, limit });
  return Response.json({ jobs: data, total: data.length });
}
