import NewsFeed from "@/components/dashboard/NewsFeed";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market News",
};

export default function NewsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Market News</h1>
        <p className="text-zinc-500 text-sm">
          Latest headlines from Indian financial markets
        </p>
      </div>
      <NewsFeed />
    </div>
  );
}
