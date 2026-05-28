import { Pool } from "pg";
import slugify from "slugify";

// ── Connection pool (singleton) ───────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global._pgPool) {
    global._pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return global._pgPool;
}

// ── Table init (idempotent) ───────────────────────────────

let _inited = false;

async function ensureInit() {
  if (_inited) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS topics (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at  TEXT NOT NULL,
      main_topics JSONB NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS main_topics (
      id          TEXT NOT NULL,
      topic_id    TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order  INTEGER NOT NULL DEFAULT 0,
      subtopics   JSONB NOT NULL DEFAULT '[]',
      PRIMARY KEY (topic_id, id)
    );
    CREATE TABLE IF NOT EXISTS lessons (
      id             TEXT NOT NULL,
      main_topic_id  TEXT NOT NULL,
      topic_id       TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      title          TEXT NOT NULL,
      description    TEXT NOT NULL DEFAULT '',
      content        TEXT NOT NULL DEFAULT '',
      key_insights   JSONB NOT NULL DEFAULT '[]',
      questions      JSONB NOT NULL DEFAULT '[]',
      related_topics JSONB NOT NULL DEFAULT '[]',
      sort_order     INTEGER NOT NULL DEFAULT 0,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (topic_id, main_topic_id, id)
    );
  `);
  _inited = true;
}

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

export async function readTopic(
  topicSlug: string
): Promise<{ data: TopicFrontmatter; content: string } | null> {
  await ensureInit();
  const { rows } = await getPool().query("SELECT * FROM topics WHERE id = $1", [topicSlug]);
  if (!rows.length) return null;
  const r = rows[0];
  return {
    data: {
      id: r.id,
      type: "topic",
      title: r.title,
      description: r.description,
      createdAt: r.created_at,
      mainTopics: r.main_topics,
    },
    content: "",
  };
}

export async function readMainTopic(
  topicSlug: string,
  mainTopicSlug: string
): Promise<{ data: MainTopicFrontmatter; content: string } | null> {
  await ensureInit();
  const { rows } = await getPool().query(
    "SELECT * FROM main_topics WHERE topic_id = $1 AND id = $2",
    [topicSlug, mainTopicSlug]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    data: {
      id: r.id,
      type: "mainTopic",
      title: r.title,
      description: r.description,
      order: r.sort_order,
      topic: r.topic_id,
      subtopics: r.subtopics,
    },
    content: "",
  };
}

export async function readLesson(
  topicSlug: string,
  mainTopicSlug: string,
  subtopicSlug: string
): Promise<{ data: LessonFrontmatter; content: string } | null> {
  await ensureInit();
  const { rows } = await getPool().query(
    "SELECT * FROM lessons WHERE topic_id = $1 AND main_topic_id = $2 AND id = $3",
    [topicSlug, mainTopicSlug, subtopicSlug]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    data: {
      id: r.id,
      type: "lesson",
      title: r.title,
      description: r.description,
      order: r.sort_order,
      mainTopic: r.main_topic_id,
      topic: r.topic_id,
      relatedTopics: r.related_topics,
      keyInsights: r.key_insights,
      questions: r.questions,
    },
    content: r.content ?? "",
  };
}

export async function listTopics(): Promise<TopicFrontmatter[]> {
  await ensureInit();
  const { rows } = await getPool().query("SELECT * FROM topics ORDER BY created_at DESC");
  return rows.map((r) => ({
    id: r.id,
    type: "topic" as const,
    title: r.title,
    description: r.description,
    createdAt: r.created_at,
    mainTopics: r.main_topics,
  }));
}

// ── Writers ───────────────────────────────────────────────

export async function writeTopic(topicSlug: string, data: TopicFrontmatter) {
  await ensureInit();
  await getPool().query(
    `INSERT INTO topics (id, title, description, created_at, main_topics)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       main_topics = EXCLUDED.main_topics`,
    [topicSlug, data.title, data.description, data.createdAt, JSON.stringify(data.mainTopics)]
  );
}

export async function writeMainTopic(
  topicSlug: string,
  mainTopicSlug: string,
  data: MainTopicFrontmatter
) {
  await ensureInit();
  await getPool().query(
    `INSERT INTO main_topics (id, topic_id, title, description, sort_order, subtopics)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (topic_id, id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       sort_order = EXCLUDED.sort_order,
       subtopics = EXCLUDED.subtopics`,
    [mainTopicSlug, topicSlug, data.title, data.description, data.order, JSON.stringify(data.subtopics)]
  );
}

export async function writeLesson(
  topicSlug: string,
  mainTopicSlug: string,
  subtopicSlug: string,
  data: LessonFrontmatter,
  content: string
) {
  await ensureInit();
  await getPool().query(
    `INSERT INTO lessons (id, main_topic_id, topic_id, title, description, content, key_insights, questions, related_topics, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (topic_id, main_topic_id, id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       content = EXCLUDED.content,
       key_insights = EXCLUDED.key_insights,
       questions = EXCLUDED.questions,
       related_topics = EXCLUDED.related_topics,
       sort_order = EXCLUDED.sort_order`,
    [
      subtopicSlug, mainTopicSlug, topicSlug,
      data.title, data.description, content,
      JSON.stringify(data.keyInsights ?? []),
      JSON.stringify(data.questions ?? []),
      JSON.stringify(data.relatedTopics ?? []),
      data.order,
    ]
  );
}
