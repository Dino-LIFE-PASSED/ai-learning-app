import { NextResponse } from "next/server";
import { generateCurriculum } from "@/lib/deepseek";
import {
  toSlug,
  listTopics,
  writeTopic,
  writeMainTopic,
  writeLesson,
  TopicFrontmatter,
  MainTopicFrontmatter,
  LessonFrontmatter,
} from "@/lib/content";

export async function GET() {
  const topics = listTopics();
  return NextResponse.json(topics);
}

export async function POST(req: Request) {
  const { title } = await req.json();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const curriculum = await generateCurriculum(title);
  if (!curriculum.mainTopics?.length) {
    return NextResponse.json({ error: "AI ไม่สามารถสร้างหลักสูตรได้ กรุณาลองใหม่" }, { status: 500 });
  }

  const now = new Date().toISOString();

  // Generate unique slugs — deduplicate if multiple titles produce the same slug
  function uniqueSlugs(titles: string[], prefix: string): string[] {
    const used = new Set<string>();
    return titles.map((title, i) => {
      let base = toSlug(title) || `${prefix}-${i + 1}`;
      let candidate = base;
      let n = 2;
      while (used.has(candidate)) candidate = `${base}-${n++}`;
      used.add(candidate);
      return candidate;
    });
  }

  const topicSlug = toSlug(title) || `topic-${Date.now()}`;
  const mainTopicSlugs = uniqueSlugs(curriculum.mainTopics.map((mt) => mt.title), "section");

  const topicData: TopicFrontmatter = {
    id: topicSlug,
    type: "topic",
    title,
    description: curriculum.topicDescription,
    createdAt: now,
    mainTopics: mainTopicSlugs,
  };
  writeTopic(topicSlug, topicData);

  curriculum.mainTopics.forEach((mt, i) => {
    const mtSlug = mainTopicSlugs[i];
    const subtopicSlugs = uniqueSlugs(
      (mt.subtopics ?? []).map((st) => st.title),
      `lesson-${i + 1}`
    );

    const mtData: MainTopicFrontmatter = {
      id: mtSlug,
      type: "mainTopic",
      title: mt.title,
      description: mt.description,
      order: i + 1,
      topic: topicSlug,
      subtopics: subtopicSlugs,
    };
    writeMainTopic(topicSlug, mtSlug, mtData);

    // Write subtopic stub files (no lesson content yet)
    (mt.subtopics ?? []).forEach((st, j) => {
      const stSlug = subtopicSlugs[j];
      const stData: LessonFrontmatter = {
        id: stSlug,
        type: "lesson" as const,
        title: st.title,
        description: st.description,
        order: j + 1,
        mainTopic: mtSlug,
        topic: topicSlug,
        relatedTopics: [] as string[],
        keyInsights: [] as string[],
        questions: [] as string[],
      };
      writeLesson(topicSlug, mtSlug, stSlug, stData, "");
    });
  });

  return NextResponse.json({ slug: topicSlug, ...topicData });
}
