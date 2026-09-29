export interface Article {
  title: string;
  description: string;
  tagline: string;
  url: string;
  html: string;
  date: string;
  tags: string[];
  categories: string[];
  source: string;
  disqusIdentifier?: string;
}
export interface PageContent {
  title: string;
  description: string;
  tagline: string;
  html: string;
}
export interface SiteRoute {
  path: string;
  canonical: string;
  title: string;
  kind:
    | "home"
    | "content"
    | "post"
    | "blog"
    | "archive"
    | "tags"
    | "categories"
    | "pages";
  source?: string;
  page?: number;
  postUrl?: string;
}
export interface PageData {
  route: SiteRoute;
  content: PageContent | null;
  posts: Article[];
  post: Article | null;
  previous: Article | null;
  next: Article | null;
  totalPages: number;
}
