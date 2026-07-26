import { NextRequest } from "next/server";
import { getProjects } from "@/lib/career-data/loader";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const stack = searchParams.get("stack")?.split(",").filter(Boolean) || undefined;
  const limit = parseInt(searchParams.get("limit") || "20");

  const data = getProjects({ stack, limit });
  return Response.json({ projects: data, total: data.length });
}
