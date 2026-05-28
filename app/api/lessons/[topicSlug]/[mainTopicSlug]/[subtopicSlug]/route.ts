import { NextResponse } from "next/server";
import { readLesson } from "@/lib/content";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ topicSlug: string; mainTopicSlug: string; subtopicSlug: string }> }
) {
  const { topicSlug, mainTopicSlug, subtopicSlug } = await params;
  const lesson = await readLesson(topicSlug, mainTopicSlug, subtopicSlug);
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ slug: subtopicSlug, ...lesson.data, content: lesson.content });
}
