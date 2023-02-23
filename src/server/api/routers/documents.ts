import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const documentsRouter = createTRPCRouter({
  getByCountry: protectedProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const documents = await ctx.prisma.document.findMany({
        where: {
          countryId: input,
        },
      });

      return documents;
    }),
});
