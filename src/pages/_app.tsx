import type { AppProps } from "next/app";
import Head from "next/head";
import { ThemeProvider } from "@hacktoolkit/nextjs-htk/context";
import "../styles/site.css";
export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
