import fs from "fs";
import path from "path";
import matter from "gray-matter";
import slugify from "slugify";

const CONTENT_DIR = path.join(process.cwd(), "content", "topics");

export function toSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, locale: "th" });
}

export function getTopicDir(topicSlug: string) {
  return path.join(CONTENT_DIR, topicSlug);
}

export function getMainTopicDir(topicSlug: string, mainTopicSlug: string) {
  return path.join(CONTENT_DIR, topicSlug, mainTopicSlug);
}

export function getLessonPath(topicSlug: string, mainTopicSlug: string, subtopicSlug: string) {
  return path.join(CONTENT_DIR, topicSlug, mainTopicSlug, `${subtopicSlug}.md`);
}

// --- Types ---

export interface TopicFrontmatter {
  id: string;
  type: "topic";
  title: string;
  description: string;
  createdAt: string;
  mainTopics: string[];
}

export interface MainTopicFrontmatter {
  id: string;
  type: "mainTopic";
  title: string;
  description: string;
  order: number;
  topic: string;
  subtopics: string[];
}

export interface LessonFrontmatter {
  id: string;
  type: "lesson";
  title: string;
  description: string;
  order: number;
  mainTopic: string;
  topic: string;
  relatedTopics: string[];
  keyInsights: string[];
  questions: string[];
}

// --- Readers ---

export function readTopic(topicSlug: string): { data: TopicFrontmatter; content: string } | null {
  const filePath = path.join(getTopicDir(topicSlug), "index.md");
  if (!fs.existsSync(filePath)) return null;
  const { data, content } = matter(fs.readFileSync(filePath, "utf-8"));
  return { data: data as TopicFrontmatter, content };
}

export function readMainTopic(
  topicSlug: string,
  mainTopicSlug: string
): { data: MainTopicFrontmatter; content: string } | null {
  const filePath = path.join(getMainTopicDir(topicSlug, mainTopicSlug), "index.md");
  if (!fs.existsSync(filePath)) return null;
  const { data, content } = matter(fs.readFileSync(filePath, "utf-8"));
  return { data: data as MainTopicFrontmatter, content };
}

export function readLesson(
  topicSlug: string,
  mainTopicSlug: string,
  subtopicSlug: string
): { data: LessonFrontmatter; content: string } | null {
  const filePath = getLessonPath(topicSlug, mainTopicSlug, subtopicSlug);
  if (!fs.existsSync(filePath)) return null;
  const { data, content } = matter(fs.readFileSync(filePath, "utf-8"));
  return { data: data as LessonFrontmatter, content };
}

export function listTopics(): TopicFrontmatter[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((slug) => {
      const indexPath = path.join(CONTENT_DIR, slug, "index.md");
      return fs.existsSync(indexPath);
    })
    .map((slug) => readTopic(slug)!.data)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// --- Writers ---

export function writeTopic(topicSlug: string, data: TopicFrontmatter, content = "") {
  const dir = getTopicDir(topicSlug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.md"), matter.stringify(content, data as unknown as Record<string, unknown>));
}

export function writeMainTopic(topicSlug: string, mainTopicSlug: string, data: MainTopicFrontmatter, content = "") {
  const dir = getMainTopicDir(topicSlug, mainTopicSlug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.md"), matter.stringify(content, data as unknown as Record<string, unknown>));
}

export function writeLesson(
  topicSlug: string,
  mainTopicSlug: string,
  subtopicSlug: string,
  data: LessonFrontmatter,
  content: string
) {
  const filePath = getLessonPath(topicSlug, mainTopicSlug, subtopicSlug);
  fs.writeFileSync(filePath, matter.stringify(content, data as unknown as Record<string, unknown>));
}
