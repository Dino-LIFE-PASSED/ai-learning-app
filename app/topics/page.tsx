import Link from "next/link";
import { listTopics } from "@/lib/content";

export default function TopicsPage() {
  const topics = listTopics();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs text-gray-600 mb-1">// all topics</p>
          <h1 className="text-3xl font-bold">หัวข้อทั้งหมด</h1>
          <p className="text-gray-500 mt-1 font-mono text-sm">{topics.length} topics</p>
        </div>
        <Link
          href="/"
          className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          + หัวข้อใหม่
        </Link>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="font-mono text-4xl mb-4 text-gray-700">{ }</p>
          <p className="text-lg">ยังไม่มีหัวข้อ</p>
          <p className="text-sm mt-2">เริ่มต้นด้วยการสร้างหัวข้อแรกของคุณ</p>
          <Link
            href="/"
            className="inline-block mt-6 text-orange-400 hover:underline text-sm font-mono"
          >
            -- สร้างหัวข้อแรก →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              className="group bg-gray-900/60 border border-gray-800/80 hover:border-orange-500/40 rounded-2xl p-6 transition-all hover:bg-gray-800/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg group-hover:text-orange-400 transition-colors truncate">
                    {topic.title}
                  </h2>
                  <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                    {topic.description}
                  </p>
                </div>
                <span className="text-gray-600 group-hover:text-orange-400 transition-colors mt-1 shrink-0 font-mono">
                  →
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-600 font-mono">
                <span>{topic.mainTopics?.length ?? 0} modules</span>
                <span className="text-gray-700">||</span>
                <span>{new Date(topic.createdAt).toLocaleDateString("th-TH")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
