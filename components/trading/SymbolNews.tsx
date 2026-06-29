"use client";

import { useEffect, useState } from "react";
import { Newspaper, ExternalLink } from "lucide-react";

interface NewsArticle {
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
}

export default function SymbolNews({ symbol }: { symbol: string }) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetch(`/api/market/news?symbol=${encodeURIComponent(symbol)}`);
        if (res.ok) {
          const data = await res.json();
          setNews(data.news || []);
        }
      } catch (err) {
        console.error("Failed to load symbol news:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, [symbol]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-emerald-400" />
          Stock News
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex flex-col gap-2">
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Newspaper className="w-4.5 h-4.5 text-emerald-400" />
        Latest News
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((item, index) => {
          // Sometimes providerPublishTime is a Date instance or standard number timestamp (Yahoo Finance news search vs. RSS)
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
              className="p-4 rounded-xl border border-white/[0.05] bg-surface hover:border-emerald-500/30 hover:bg-emerald-500/[0.01] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-relaxed">
                  {item.title}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
                <span className="font-medium text-zinc-400">{item.publisher}</span>
                <span className="flex items-center gap-1 font-mono">
                  {pubDate}
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
