import type { Article } from "../lib/types";
export function PostList({ posts }: { posts: Article[] }) {
  return (
    <ol className="post-list">
      {posts.map((post) => (
        <li key={post.url}>
          <time dateTime={post.date}>{post.date}</time>
          <a href={post.url}>
            {post.title}
            <span aria-hidden="true">↗</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
export function PostTags({ post }: { post: Article }) {
  return (
    <div className="tags">
      {post.tags.map((tag) => (
        <a key={tag} href={`/tags.html#${encodeURIComponent(tag)}-ref`}>
          {tag}
        </a>
      ))}
    </div>
  );
}
