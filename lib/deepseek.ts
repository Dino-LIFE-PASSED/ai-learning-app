import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

function parseJSONResponse<T>(text: string): T {
  // Strip markdown code fences the model sometimes adds despite instructions
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fix literal control characters inside JSON string values
    const fixed = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, (c) =>
      `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`
    ).replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
    return JSON.parse(fixed) as T;
  }
}

export interface CurriculumMainTopic {
  title: string;
  description: string;
  subtopics: Array<{
    title: string;
    description: string;
  }>;
}

export interface GeneratedCurriculum {
  topicDescription: string;
  mainTopics: CurriculumMainTopic[];
}

export async function generateCurriculum(topic: string): Promise<GeneratedCurriculum> {
  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `คุณเป็นผู้เชี่ยวชาญด้านการออกแบบหลักสูตรการเรียนรู้
ตอบเป็น JSON เสมอ ห้ามมี markdown code block ห้ามมีข้อความนอก JSON`,
      },
      {
        role: "user",
        content: `วิเคราะห์หัวข้อ "${topic}" และสร้างหลักสูตรการเรียนรู้ที่ครอบคลุม

ส่งคืน JSON ในรูปแบบนี้:
{
  "topicDescription": "คำอธิบายภาพรวมของหัวข้อนี้ และทำไมควรเรียน (2-3 ประโยค)",
  "mainTopics": [
    {
      "title": "หัวข้อหลัก",
      "description": "อธิบายว่าหัวข้อนี้สอนอะไร ทำไมสำคัญ และช่วยให้เข้าใจอะไร (2-3 ประโยค)",
      "subtopics": [
        {
          "title": "หัวข้อย่อย",
          "description": "อธิบายสั้นๆ ว่าเรียนอะไรในบทนี้"
        }
      ]
    }
  ]
}

กฎ:
- สร้าง 4-6 หัวข้อหลัก
- แต่ละหัวข้อหลักมี 3-5 หัวข้อย่อย
- เรียงจากพื้นฐานไปขั้นสูง
- ตอบเป็นภาษาไทย`,
      },
    ],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content ?? "{}";
  return parseJSONResponse<GeneratedCurriculum>(text);
}

export async function generateLesson(
  topicTitle: string,
  mainTopicTitle: string,
  subtopicTitle: string,
  subtopicDescription: string
): Promise<{ content: string; keyInsights: string[]; questions: string[] }> {
  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `คุณเป็นครูผู้สอนที่เชี่ยวชาญ เขียนบทเรียนที่ชัดเจน น่าสนใจ และเข้าใจง่าย
ตอบเป็น JSON เสมอ ห้ามมี markdown code block ห้ามมีข้อความนอก JSON`,
      },
      {
        role: "user",
        content: `เขียนบทเรียนสำหรับ:
- วิชา: ${topicTitle}
- หัวข้อหลัก: ${mainTopicTitle}
- หัวข้อย่อย: ${subtopicTitle}
- คำอธิบาย: ${subtopicDescription}

ส่งคืน JSON ในรูปแบบนี้:
{
  "content": "เนื้อหาบทเรียนในรูปแบบ Markdown (อย่างน้อย 500 คำ มีหัวข้อย่อย ตัวอย่าง และคำอธิบายละเอียด)",
  "keyInsights": [
    "ประเด็นสำคัญ 1 ที่ควรจำ",
    "ประเด็นสำคัญ 2",
    "ประเด็นสำคัญ 3",
    "ประเด็นสำคัญ 4",
    "ประเด็นสำคัญ 5"
  ],
  "questions": [
    "คำถามเชิงวิเคราะห์ที่ 1 ที่กระตุ้นให้คิดลึกขึ้น",
    "คำถามเชิงวิเคราะห์ที่ 2",
    "คำถามเชิงวิเคราะห์ที่ 3"
  ]
}

กฎสำคัญสำหรับ content (Markdown):
- ใช้ ## สำหรับหัวข้อหลัก, ### สำหรับหัวข้อรอง, #### สำหรับหัวข้อย่อย
- ถ้ามีตารางเปรียบเทียบ ต้องใช้ Markdown table syntax เท่านั้น:
  | หัวคอลัมน์ 1 | หัวคอลัมน์ 2 |
  |-------------|-------------|
  | ข้อมูล      | ข้อมูล      |
  ห้ามใช้ plain text หรือ ASCII สำหรับตาราง
- ใช้ **ตัวหนา** สำหรับคำสำคัญ
- ใช้ > blockquote สำหรับข้อสังเกตสำคัญ
- เนื้อหาอย่างน้อย 600 คำ
- keyInsights ต้องเป็นประเด็นที่น่าสนใจและสำคัญจริงๆ
- questions ต้องกระตุ้นให้คิดวิเคราะห์ ไม่ใช่แค่ท่องจำ
- ตอบเป็นภาษาไทย`,
      },
    ],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content ?? "{}";
  return parseJSONResponse<{ content: string; keyInsights: string[]; questions: string[] }>(text);
}

export async function createAnswerEvaluationStream(
  question: string,
  userAnswer: string,
  lessonTitle: string,
  mainTopicTitle: string,
  webContext: string
) {
  const hasWeb = webContext.length > 0;

  return client.chat.completions.create({
    model: "deepseek-chat",
    stream: true,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `คุณเป็นอาจารย์ผู้เชี่ยวชาญที่ให้ feedback แก่ผู้เรียน
ช่วยให้ผู้เรียนเข้าใจเนื้อหาอย่างลึกซึ้ง ไม่ใช่แค่ท่องจำ ตอบเป็นภาษาไทย ใช้ Markdown
${hasWeb ? "คุณได้รับข้อมูลอ้างอิงจากอินเทอร์เน็ตเพื่อตรวจสอบความถูกต้อง" : ""}`,
      },
      {
        role: "user",
        content: `**บทเรียน:** ${lessonTitle} — ${mainTopicTitle}

**คำถามวิเคราะห์:**
${question}

**คำตอบของผู้เรียน:**
${userAnswer}
${hasWeb ? `\n**ข้อมูลอ้างอิงจากอินเทอร์เน็ต:**\n${webContext}\n` : ""}
กรุณาให้ feedback โดยใช้โครงสร้างนี้:

## ✅ สิ่งที่เข้าใจถูกต้อง
[ชี้จุดที่ดีในคำตอบ]

## 🔧 สิ่งที่ควรปรับหรือเพิ่มเติม
[แก้ไขหรือขยายความที่ขาดหายหรือไม่ครบ]

## 💡 ความรู้เพิ่มเติมที่น่าสนใจ
[แนะนำมุมมองหรือแนวคิดเชิงลึกเพิ่มเติม]`,
      },
    ],
  });
}
