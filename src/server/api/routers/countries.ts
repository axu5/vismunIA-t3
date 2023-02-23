import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const countriesRouter = createTRPCRouter({
  getByTopic: protectedProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const countries = await ctx.prisma.country.findMany({
        where: {
          topicId: input,
        },
      });

      return countries;
    }),
});
