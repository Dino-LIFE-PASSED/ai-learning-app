export interface SearchResult {
  results: string;
  hasResults: boolean;
}

export async function webSearch(query: string): Promise<SearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { results: "", hasResults: false };

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 4,
        search_depth: "basic",
        include_answer: true,
      }),
    });

    if (!res.ok) return { results: "", hasResults: false };

    const data = await res.json() as {
      answer?: string;
      results?: Array<{ title: string; content: string; url: string }>;
    };

    const answer = data.answer ? `สรุป: ${data.answer}\n\n` : "";
    const snippets = (data.results ?? [])
      .map((r) => `**${r.title}** (${r.url})\n${r.content}`)
      .join("\n\n");

    const combined = (answer + snippets).trim();
    return { results: combined, hasResults: combined.length > 0 };
  } catch {
    return { results: "", hasResults: false };
  }
}
