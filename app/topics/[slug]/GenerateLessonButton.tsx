"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  topicSlug: string;
  mainTopicSlug: string;
  subtopicSlug: string;
}

export default function GenerateLessonButton({ topicSlug, mainTopicSlug, subtopicSlug }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/lessons/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicSlug, mainTopicSlug, subtopicSlug }),
      });
      if (!res.ok) throw new Error();
      router.push(`/topics/${topicSlug}/${mainTopicSlug}/${subtopicSlug}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          กำลังสร้าง...
        </>
      ) : (
        "✦ สร้างบทเรียน"
      )}
    </button>
  );
}
