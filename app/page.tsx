"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: topic.trim() }),
      });
      if (!res.ok) throw new Error("เกิดข้อผิดพลาด");
      const data = await res.json();
      router.push(`/topics/${data.slug}`);
    } catch {
      setError("ไม่สามารถสร้างหลักสูตรได้ กรุณาตรวจสอบ API Key และลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-4">
      <div className="w-full max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm px-4 py-1.5 rounded-full mb-6 font-mono">
            <span className="text-orange-500/50">//</span>
            <span>AI-Powered Learning</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            อยากเรียนเรื่องอะไร?
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            พิมพ์หัวข้อที่อยากเรียน AI จะสร้างหลักสูตรและบทเรียนให้คุณโดยอัตโนมัติ
          </p>
          <p className="font-mono text-xs text-gray-700 mt-3 tracking-wide">
            -- const lesson = <span className="text-orange-800">await</span> lrn.generate(topic)
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-orange-500/50 font-mono text-sm select-none">{">"}</span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="เช่น Machine Learning, การลงทุน, Python..."
              className="w-full bg-gray-900/80 border border-gray-700/80 rounded-2xl pl-9 pr-5 py-4 text-base sm:text-lg placeholder-gray-600 focus:outline-none focus:border-orange-500/70 transition-colors"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 disabled:pointer-events-none text-white font-semibold px-6 py-4 rounded-2xl transition-colors text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                กำลังสร้างหลักสูตร...
              </>
            ) : (
              "สร้างหลักสูตร →"
            )}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-red-400 text-sm text-center">{error}</p>
        )}

        {/* Examples */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {["Machine Learning", "การลงทุน", "React.js", "จิตวิทยา", "Blockchain"].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setTopic(ex)}
              className="font-mono text-sm text-gray-500 border border-gray-700/60 hover:border-orange-500/40 hover:text-orange-300 active:border-orange-400 px-4 py-2 rounded-full transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
