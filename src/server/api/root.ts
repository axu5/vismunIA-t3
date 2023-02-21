import { createTRPCRouter } from "./trpc";

import { sessionsRouter } from "./routers/sessions";
import { topicsRouter } from "./routers/topics";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  sessions: sessionsRouter,
  topics: topicsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
