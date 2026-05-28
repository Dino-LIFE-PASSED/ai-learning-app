import Link from "next/link";
import { notFound } from "next/navigation";
import { readTopic, readMainTopic, readLesson } from "@/lib/content";

export default async function CurriculumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = readTopic(slug);
  if (!topic) notFound();

  const mainTopics = (topic.data.mainTopics ?? [])
    .map((mtSlug) => {
      const mt = readMainTopic(slug, mtSlug);
      if (!mt) return null;
      const subtopics = (mt.data.subtopics ?? []).map((stSlug) => {
        const lesson = readLesson(slug, mtSlug, stSlug);
        return {
          slug: stSlug,
          title: lesson?.data.title ?? stSlug,
          description: lesson?.data.description ?? "",
          hasContent: (lesson?.content?.trim().length ?? 0) > 0,
        };
      });
      return { slug: mtSlug, ...mt.data, subtopics };
    })
    .filter(Boolean);

  const totalSubtopics = mainTopics.reduce((sum, mt) => sum + (mt?.subtopics.length ?? 0), 0);
  const generatedCount = mainTopics.reduce(
    (sum, mt) => sum + (mt?.subtopics.filter((s) => s.hasContent).length ?? 0),
    0
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-8 flex items-center gap-1.5 font-mono">
        <Link href="/topics" className="hover:text-gray-300 transition-colors">topics</Link>
        <span className="text-gray-700">/</span>
        <span className="text-gray-400">{topic.data.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-xs text-gray-600 mb-2">// curriculum</p>
        <h1 className="text-4xl font-bold mb-3">{topic.data.title}</h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
          {topic.data.description}
        </p>
        <div className="flex gap-3 mt-5 text-sm font-mono flex-wrap">
          <span className="bg-gray-800/60 text-gray-400 px-3 py-1 rounded-full border border-gray-700/50">
            {mainTopics.length} modules
          </span>
          <span className="bg-gray-800/60 text-gray-400 px-3 py-1 rounded-full border border-gray-700/50">
            {totalSubtopics} lessons
          </span>
          {generatedCount > 0 && (
            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full">
              {generatedCount} ready
            </span>
          )}
        </div>
      </div>

      {/* Curriculum Cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        {mainTopics.map((mt, index) =>
          mt ? (
            <div
              key={mt.slug}
              className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-gray-800/60">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 font-mono text-xs text-orange-500/70 bg-orange-500/10 border border-orange-500/20 rounded px-1.5 py-1 mt-0.5 min-w-[2rem] text-center">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="font-semibold text-base text-gray-100">{mt.title}</h2>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed line-clamp-2">
                      {mt.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subtopic List */}
              <ul className="flex-1 divide-y divide-gray-800/40">
                {mt.subtopics.map((st, stIndex) => (
                  <li key={st.slug}>
                    <Link
                      href={`/topics/${slug}/${mt.slug}/${st.slug}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/40 transition-colors group"
                    >
                      <span
                        className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-0.5 ${
                          st.hasContent ? "bg-orange-500" : "bg-gray-700"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 group-hover:text-white transition-colors truncate">
                          <span className="text-gray-600 text-xs mr-1.5 font-mono">
                            {index + 1}.{stIndex + 1}
                          </span>
                          {st.title}
                        </p>
                      </div>
                      <span className="text-gray-600 group-hover:text-orange-400 text-xs transition-colors shrink-0 font-mono">
                        {st.hasContent ? "read →" : "open →"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
