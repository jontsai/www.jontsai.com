import { SiteLayout } from "../components/SiteLayout";
export default function NotFound() {
  return (
    <SiteLayout title="Page not found" canonical="/404.html">
      <div className="page-heading">
        <span className="eyebrow">404 / A wrong turn</span>
        <h1>
          Nothing here<span className="accent">.</span>
        </h1>
      </div>
      <p>
        This page could not be found. Try the{" "}
        <a href="/archive.html">blog archive</a>, or <a href="/">head home</a>.
      </p>
    </SiteLayout>
  );
}
