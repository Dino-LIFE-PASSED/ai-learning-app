"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  topicSlug: string;
  mainTopicSlug: string;
  subtopicSlug: string;
  title: string;
  description: string;
  mainTopicTitle: string;
  topicTitle: string;
  backHref: string;
}

export default function AutoGenerateLesson({
  topicSlug,
  mainTopicSlug,
  subtopicSlug,
  title,
  description,
  mainTopicTitle,
  topicTitle,
  backHref,
}: Props) {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    fetch("/api/lessons/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicSlug, mainTopicSlug, subtopicSlug }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "เกิดข้อผิดพลาด");
        }
        // hard reload so server component re-renders with new lesson content
        window.location.reload();
      })
      .catch((err: Error) => {
        setStatus("error");
        setErrorMsg(err.message);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-8 flex flex-wrap gap-1.5 items-center font-mono">
        <Link href="/topics" className="hover:text-gray-300 transition-colors">topics</Link>
        <span className="text-gray-700">/</span>
        <Link href={backHref} className="hover:text-gray-300 transition-colors">{topicTitle}</Link>
        <span className="text-gray-700">/</span>
        <span className="text-gray-500">{mainTopicTitle}</span>
        <span className="text-gray-700">/</span>
        <span className="text-gray-300">{title}</span>
      </nav>

      <div className="mb-8">
        <p className="text-orange-400 text-sm mb-2 font-mono">{mainTopicTitle}</p>
        <h1 className="text-3xl font-bold mb-3">{title}</h1>
        <p className="text-gray-400">{description}</p>
      </div>

      {status === "loading" ? (
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-10 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-orange-400 font-mono text-sm font-bold">fn</span>
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-200">AI กำลังสร้างบทเรียน...</p>
            <p className="text-gray-600 text-sm mt-1 font-mono">-- generating content, please wait 10–30s</p>
          </div>
          <div className="w-full max-w-lg space-y-3 mt-2">
            {[100, 90, 95, 70, 85].map((w, i) => (
              <div
                key={i}
                className="h-3 bg-gray-800/80 rounded-full animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 text-center">
          <p className="text-red-400 font-medium mb-2 font-mono">// error: cannot generate</p>
          <p className="text-gray-500 text-sm mb-5">{errorMsg}</p>
          <button
            onClick={() => {
              setStatus("loading");
              setErrorMsg("");
              window.location.reload();
            }}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg transition-colors font-mono"
          >
            retry →
          </button>
        </div>
      )}
    </div>
  );
}
