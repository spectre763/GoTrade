"use client";

import { useEffect, useState } from "react";
import { Newspaper, ExternalLink } from "lucide-react";

interface NewsArticle {
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetch("/api/market/news");
        if (res.ok) {
          const data = await res.json();
          setNews(data.news || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard news:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, []);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
        <Newspaper className="w-4.5 h-4.5 text-emerald-400" />
        <h2 className="font-semibold text-white">Market News</h2>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 animate-pulse flex flex-col gap-2">
              <div className="h-4 bg-zinc-800 rounded w-5/6" />
              <div className="h-3 bg-zinc-800 rounded w-1/4" />
            </div>
          ))
        ) : news.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-zinc-600">
            No market news available at the moment.
          </div>
        ) : (
          news.map((item, index) => {
            const timestamp = typeof item.providerPublishTime === "string"
              ? new Date(item.providerPublishTime).getTime() / 1000
              : item.providerPublishTime;
            const pubDate = new Date(timestamp * 1000).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
            return (
              <a
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col justify-between p-4 hover:bg-white/[0.015] transition-colors group"
              >
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-relaxed">
                    {item.title}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-400">{item.publisher}</span>
                  <span className="flex items-center gap-1 font-mono">
                    {pubDate}
                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
