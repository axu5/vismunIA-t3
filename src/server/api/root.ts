import { createTRPCRouter } from "./trpc";

import { lessonsRouter } from "./routers/lessons";
import { topicsRouter } from "./routers/topics";
import { usersRouter } from "./routers/users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  lessons: lessonsRouter,
  topics: topicsRouter,
  users: usersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
