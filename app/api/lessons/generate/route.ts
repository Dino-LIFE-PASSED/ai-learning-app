import { NextResponse } from "next/server";
import { generateLesson } from "@/lib/deepseek";
import { readLesson, writeLesson, readTopic, readMainTopic } from "@/lib/content";

export async function POST(req: Request) {
  const { topicSlug, mainTopicSlug, subtopicSlug } = await req.json();
  if (!topicSlug || !mainTopicSlug || !subtopicSlug) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const existing = await readLesson(topicSlug, mainTopicSlug, subtopicSlug);
  if (!existing) return NextResponse.json({ error: "Subtopic not found" }, { status: 404 });

  if (existing.content.trim().length > 0) {
    return NextResponse.json({ slug: subtopicSlug, ...existing.data, content: existing.content });
  }

  const [topic, mainTopic] = await Promise.all([
    readTopic(topicSlug),
    readMainTopic(topicSlug, mainTopicSlug),
  ]);

  const generated = await generateLesson(
    topic?.data.title ?? topicSlug,
    mainTopic?.data.title ?? mainTopicSlug,
    existing.data.title,
    existing.data.description
  );

  const updatedData = {
    ...existing.data,
    keyInsights: generated.keyInsights,
    questions: generated.questions,
  };

  await writeLesson(topicSlug, mainTopicSlug, subtopicSlug, updatedData, generated.content);

  return NextResponse.json({ slug: subtopicSlug, ...updatedData, content: generated.content });
}
