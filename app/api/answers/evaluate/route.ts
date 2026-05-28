import { webSearch } from "@/lib/search";
import { createAnswerEvaluationStream } from "@/lib/deepseek";

export async function POST(req: Request) {
  const { question, answer, lessonTitle, mainTopicTitle } = await req.json() as {
    question: string;
    answer: string;
    lessonTitle: string;
    mainTopicTitle: string;
  };

  if (!question || !answer) {
    return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
  }

  // Search web for factual context
  const { results: webContext, hasResults } = await webSearch(
    `${mainTopicTitle} ${lessonTitle}`.slice(0, 100)
  );

  const stream = await createAnswerEvaluationStream(
    question,
    answer,
    lessonTitle,
    mainTopicTitle,
    webContext
  );

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Web-Search": hasResults ? "true" : "false",
    },
  });
}
