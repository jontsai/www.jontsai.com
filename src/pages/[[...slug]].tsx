import type { GetStaticPaths, GetStaticProps } from "next";
import { PageView } from "../components/PageView";
import { getPageData, getRoutes } from "../lib/content";
import type { PageData } from "../lib/types";
export default PageView;
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getRoutes().map((route) => ({
    params: { slug: route.path.split("/").filter(Boolean) },
  })),
  fallback: false,
});
export const getStaticProps: GetStaticProps<PageData> = async ({ params }) => ({
  props: getPageData("/" + ((params?.slug as string[]) || []).join("/")),
});
