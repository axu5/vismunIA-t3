import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { api } from "../utils/api";

import "../styles/globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/Toaster";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => (
  <SessionProvider session={session}>
    <Head>
      <title>VIS MUN</title>
      {/*   TODO: Optimize SEO, however this is fine for this purpose
            Write a unique title tag for each page; Be brief, but descriptive;
            Avoid generic and vague titles;
            Use sentence case or title case;
            Create something click-worthy—not clickbait;
            Match search intent;
            Include your target keyword where it makes sense;
            Keep it under 60 characters. */}
      <meta title="Verdala International School - Model United Nations" />
      <meta
        name="description"
        content="MUN for Verdala is a place to gather meeting information and previous session data, see all the lessons that the VIS MUN team have made!"
      />
      <meta name="robots" content="index, follow" />
      <link rel="icon" type="image/icon" href="/favicon.ico"></link>
    </Head>
    <Navbar />
    <main className="mx-auto w-4/5">
      <Component {...pageProps} />
      <Analytics />
    </main>
    <Toaster />
  </SessionProvider>
);

export default api.withTRPC(MyApp);
