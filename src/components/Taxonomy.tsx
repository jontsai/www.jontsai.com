import type { Article } from "../lib/types";
import { PostList } from "./PostList";
export function Taxonomy({
  posts,
  kind,
}: {
  posts: Article[];
  kind: "tags" | "categories";
}) {
  const groups = new Map<string, Article[]>();
  for (const post of posts)
    for (const term of post[kind])
      groups.set(term, [...(groups.get(term) || []), post]);
  const entries = [...groups].sort(([a], [b]) => a.localeCompare(b));
  return (
    <>
      <div className="tags taxonomy-index">
        {entries.map(([term, articles]) => (
          <a key={term} href={`#${encodeURIComponent(term)}-ref`}>
            {term} <span>{articles.length}</span>
          </a>
        ))}
      </div>
      {entries.map(([term, articles]) => (
        <section key={term}>
          <h2 id={`${term}-ref`}>{term}</h2>
          <PostList posts={articles} />
        </section>
      ))}
    </>
  );
}
