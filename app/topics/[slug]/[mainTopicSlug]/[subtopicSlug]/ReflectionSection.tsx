"use client";

import { useState } from "react";
import { marked } from "marked";

interface Props {
  questions: string[];
  lessonTitle: string;
  mainTopicTitle: string;
}

export default function ReflectionSection({ questions, lessonTitle, mainTopicTitle }: Props) {
  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-orange-400 font-mono text-sm font-bold">?</span>
        <h2 className="text-xl font-bold text-orange-400">คำถามเพื่อคิดวิเคราะห์</h2>
      </div>
      <p className="text-gray-600 text-sm -mt-3 font-mono">
        -- ลองตอบคำถาม AI จะวิเคราะห์และให้ feedback
      </p>
      {questions.map((q, i) => (
        <QuestionBlock
          key={i}
          question={q}
          index={i}
          lessonTitle={lessonTitle}
          mainTopicTitle={mainTopicTitle}
        />
      ))}
    </div>
  );
}

function QuestionBlock({
  question,
  index,
  lessonTitle,
  mainTopicTitle,
}: {
  question: string;
  index: number;
  lessonTitle: string;
  mainTopicTitle: string;
}) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [usedWebSearch, setUsedWebSearch] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || isLoading) return;

    setIsLoading(true);
    setFeedback("");
    setError("");

    try {
      const res = await fetch("/api/answers/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, lessonTitle, mainTopicTitle }),
      });

      if (!res.ok) throw new Error("API error");
      setUsedWebSearch(res.headers.get("X-Web-Search") === "true");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setFeedback((prev) => prev + decoder.decode(value, { stream: true }));
      }

      setIsSubmitted(true);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setAnswer("");
    setFeedback("");
    setIsSubmitted(false);
    setUsedWebSearch(false);
    setError("");
  }

  const feedbackHtml = feedback ? (marked.parse(feedback) as string) : "";

  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden">
      {/* Question Header */}
      <div className="p-5 border-b border-gray-800/60">
        <div className="flex gap-3">
          <span className="flex-shrink-0 font-mono text-xs text-orange-500/70 bg-orange-500/10 border border-orange-500/20 rounded px-1.5 py-1 mt-0.5 min-w-[2rem] text-center">
            Q{index + 1}
          </span>
          <p className="text-gray-200 leading-relaxed">{question}</p>
        </div>
      </div>

      {/* Answer Form */}
      {!isSubmitted && (
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="// พิมพ์คำตอบหรือความเข้าใจของคุณที่นี่..."
            disabled={isLoading}
            rows={4}
            className="w-full bg-gray-800/60 border border-gray-700 focus:border-orange-500/60 rounded-xl px-4 py-3 text-base text-gray-200 placeholder-gray-600 resize-none outline-none transition-colors disabled:opacity-60"
          />
          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
          <button
            type="submit"
            disabled={!answer.trim() || isLoading}
            className="w-full sm:w-auto sm:self-end flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-40 disabled:pointer-events-none text-white font-medium px-5 py-3.5 rounded-xl transition-colors min-h-[48px]"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                AI กำลังวิเคราะห์...
              </>
            ) : (
              <span className="font-mono">submit →</span>
            )}
          </button>
        </form>
      )}

      {/* Submitted answer preview */}
      {isSubmitted && (
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 font-mono">// your answer</span>
            <button
              onClick={handleReset}
              className="text-xs text-gray-600 hover:text-gray-300 transition-colors font-mono"
            >
              reset →
            </button>
          </div>
          <p className="text-sm text-gray-400 bg-gray-800/40 rounded-lg px-3 py-2 whitespace-pre-wrap">
            {answer}
          </p>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-gray-800/80" />
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-orange-400">// AI feedback</span>
              {usedWebSearch && (
                <span className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                  web verified
                </span>
              )}
              {isLoading && (
                <span className="flex items-center gap-1 text-gray-600">
                  <span className="inline-block w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="inline-block w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="inline-block w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              )}
            </div>
            <div className="flex-1 h-px bg-gray-800/80" />
          </div>
          <div
            className="feedback-content"
            dangerouslySetInnerHTML={{ __html: feedbackHtml }}
          />
        </div>
      )}
    </div>
  );
}
