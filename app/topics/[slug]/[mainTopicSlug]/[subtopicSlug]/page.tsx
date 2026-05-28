import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { readLesson, readTopic, readMainTopic } from "@/lib/content";
import AutoGenerateLesson from "./AutoGenerateLesson";
import ReflectionSection from "./ReflectionSection";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; mainTopicSlug: string; subtopicSlug: string }>;
}) {
  const { slug, mainTopicSlug, subtopicSlug } = await params;

  const lesson = readLesson(slug, mainTopicSlug, subtopicSlug);
  if (!lesson) notFound();

  const topic = readTopic(slug);
  const mainTopic = readMainTopic(slug, mainTopicSlug);

  if (!lesson.content.trim()) {
    return (
      <AutoGenerateLesson
        topicSlug={slug}
        mainTopicSlug={mainTopicSlug}
        subtopicSlug={subtopicSlug}
        title={lesson.data.title}
        description={lesson.data.description}
        mainTopicTitle={mainTopic?.data.title ?? mainTopicSlug}
        topicTitle={topic?.data.title ?? slug}
        backHref={`/topics/${slug}`}
      />
    );
  }

  const contentHtml = await marked(lesson.content);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-8 flex flex-wrap gap-1.5 items-center font-mono">
        <Link href="/topics" className="hover:text-gray-300 transition-colors">topics</Link>
        <span className="text-gray-700">/</span>
        <Link href={`/topics/${slug}`} className="hover:text-gray-300 transition-colors">
          {topic?.data.title ?? slug}
        </Link>
        <span className="text-gray-700">/</span>
        <span className="text-gray-500">{mainTopic?.data.title ?? mainTopicSlug}</span>
        <span className="text-gray-700">/</span>
        <span className="text-gray-300">{lesson.data.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
        {/* Main Content */}
        <div>
          <div className="mb-8">
            <p className="text-orange-400 text-sm mb-2 font-mono">{mainTopic?.data.title}</p>
            <h1 className="text-3xl font-bold mb-3">{lesson.data.title}</h1>
            <p className="text-gray-400">{lesson.data.description}</p>
          </div>

          <article
            className="lesson-content prose prose-invert prose-slate max-w-none
              prose-p:text-slate-300 prose-p:leading-[1.85]
              prose-li:text-slate-300 prose-li:leading-[1.75]
              prose-strong:text-white
              prose-blockquote:border-orange-500 prose-blockquote:bg-slate-900/50 prose-blockquote:text-slate-400
              prose-code:text-orange-300 prose-code:bg-slate-800/80 prose-code:rounded prose-code:px-1.5
              prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl
              prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {(lesson.data.questions?.length ?? 0) > 0 && (
            <ReflectionSection
              questions={lesson.data.questions}
              lessonTitle={lesson.data.title}
              mainTopicTitle={mainTopic?.data.title ?? mainTopicSlug}
            />
          )}

          <div className="mt-12 pt-8 border-t border-gray-800/60">
            <Link href={`/topics/${slug}`} className="text-sm text-orange-400 hover:underline font-mono">
              ← back to curriculum
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {(lesson.data.keyInsights?.length ?? 0) > 0 && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 sticky top-20">
              <h3 className="font-semibold text-orange-400 mb-4 flex items-center gap-2 font-mono text-sm">
                <span className="text-orange-500/50">//</span> key_insights
              </h3>
              <ul className="space-y-3">
                {lesson.data.keyInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="text-orange-500/60 mt-0.5 shrink-0 font-mono">--</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>

              {(lesson.data.relatedTopics?.length ?? 0) > 0 && (
                <div className="mt-5 pt-5 border-t border-orange-500/10">
                  <p className="text-xs text-gray-600 mb-2 font-mono">// related</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lesson.data.relatedTopics.map((rt) => (
                      <Link
                        key={rt}
                        href={`/topics/${rt}`}
                        className="text-xs border border-gray-700 text-gray-400 hover:border-orange-500/40 hover:text-orange-300 px-2.5 py-1 rounded-full transition-colors font-mono"
                      >
                        {rt}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
