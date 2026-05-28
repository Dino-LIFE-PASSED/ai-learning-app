import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import slugify from "slugify";

// ── DB setup ──────────────────────────────────────────────

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "lrn.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS topics (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL,
    main_topics TEXT NOT NULL DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS main_topics (
    id          TEXT NOT NULL,
    topic_id    TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    subtopics   TEXT NOT NULL DEFAULT '[]',
    PRIMARY KEY (topic_id, id)
  );
  CREATE TABLE IF NOT EXISTS lessons (
    id              TEXT NOT NULL,
    main_topic_id   TEXT NOT NULL,
    topic_id        TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    content         TEXT NOT NULL DEFAULT '',
    key_insights    TEXT NOT NULL DEFAULT '[]',
    questions       TEXT NOT NULL DEFAULT '[]',
    related_topics  TEXT NOT NULL DEFAULT '[]',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (topic_id, main_topic_id, id)
  );
`);

// ── Types ─────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────

export function toSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, locale: "th" });
}

// ── Readers ───────────────────────────────────────────────

export function readTopic(topicSlug: string): { data: TopicFrontmatter; content: string } | null {
  const row = db.prepare("SELECT * FROM topics WHERE id = ?").get(topicSlug) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    data: {
      id: row.id as string,
      type: "topic",
      title: row.title as string,
      description: row.description as string,
      createdAt: row.created_at as string,
      mainTopics: JSON.parse(row.main_topics as string),
    },
    content: "",
  };
}

export function readMainTopic(
  topicSlug: string,
  mainTopicSlug: string
): { data: MainTopicFrontmatter; content: string } | null {
  const row = db
    .prepare("SELECT * FROM main_topics WHERE topic_id = ? AND id = ?")
    .get(topicSlug, mainTopicSlug) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    data: {
      id: row.id as string,
      type: "mainTopic",
      title: row.title as string,
      description: row.description as string,
      order: row.sort_order as number,
      topic: row.topic_id as string,
      subtopics: JSON.parse(row.subtopics as string),
    },
    content: "",
  };
}

export function readLesson(
  topicSlug: string,
  mainTopicSlug: string,
  subtopicSlug: string
): { data: LessonFrontmatter; content: string } | null {
  const row = db
    .prepare("SELECT * FROM lessons WHERE topic_id = ? AND main_topic_id = ? AND id = ?")
    .get(topicSlug, mainTopicSlug, subtopicSlug) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    data: {
      id: row.id as string,
      type: "lesson",
      title: row.title as string,
      description: row.description as string,
      order: row.sort_order as number,
      mainTopic: row.main_topic_id as string,
      topic: row.topic_id as string,
      relatedTopics: JSON.parse(row.related_topics as string),
      keyInsights: JSON.parse(row.key_insights as string),
      questions: JSON.parse(row.questions as string),
    },
    content: (row.content as string) ?? "",
  };
}

export function listTopics(): TopicFrontmatter[] {
  const rows = db.prepare("SELECT * FROM topics ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id as string,
    type: "topic" as const,
    title: row.title as string,
    description: row.description as string,
    createdAt: row.created_at as string,
    mainTopics: JSON.parse(row.main_topics as string),
  }));
}

// ── Writers ───────────────────────────────────────────────

export function writeTopic(topicSlug: string, data: TopicFrontmatter, _content = "") {
  db.prepare(`
    INSERT INTO topics (id, title, description, created_at, main_topics)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      main_topics = excluded.main_topics
  `).run(topicSlug, data.title, data.description, data.createdAt, JSON.stringify(data.mainTopics));
}

export function writeMainTopic(
  topicSlug: string,
  mainTopicSlug: string,
  data: MainTopicFrontmatter,
  _content = ""
) {
  db.prepare(`
    INSERT INTO main_topics (id, topic_id, title, description, sort_order, subtopics)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(topic_id, id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      sort_order = excluded.sort_order,
      subtopics = excluded.subtopics
  `).run(mainTopicSlug, topicSlug, data.title, data.description, data.order, JSON.stringify(data.subtopics));
}

export function writeLesson(
  topicSlug: string,
  mainTopicSlug: string,
  subtopicSlug: string,
  data: LessonFrontmatter,
  content: string
) {
  db.prepare(`
    INSERT INTO lessons (id, main_topic_id, topic_id, title, description, content, key_insights, questions, related_topics, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(topic_id, main_topic_id, id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      content = excluded.content,
      key_insights = excluded.key_insights,
      questions = excluded.questions,
      related_topics = excluded.related_topics,
      sort_order = excluded.sort_order
  `).run(
    subtopicSlug,
    mainTopicSlug,
    topicSlug,
    data.title,
    data.description,
    content,
    JSON.stringify(data.keyInsights ?? []),
    JSON.stringify(data.questions ?? []),
    JSON.stringify(data.relatedTopics ?? []),
    data.order
  );
}
