import { NextResponse } from "next/server";
import { readTopic, readMainTopic } from "@/lib/content";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = readTopic(slug);
  if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mainTopics = topic.data.mainTopics.map((mtSlug) => {
    const mt = readMainTopic(slug, mtSlug);
    return mt ? { slug: mtSlug, ...mt.data } : null;
  }).filter(Boolean);

  return NextResponse.json({ slug, ...topic.data, mainTopics });
}
