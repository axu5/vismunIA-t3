import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedureSecretaryGeneral,
  publicProcedure,
} from "./../trpc";

export const sessionsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.mUNSession.findMany();
  }),

  create: protectedProcedureSecretaryGeneral
    .input(
      z.object({
        sessionName: z.string().min(1),
        /*
         * Not mandatory as default behaviour
         * pulls from last session's location
         */
        location: z.string().min(1),
        /*
         * Not mandatory as default behaviour is
         * 1 week plus from last session's date
         */
        date: z.date(),
        /*
         * Topic is mandatory as it cannot be
         * auto generate. Needs to be validated
         * as an existing topic.
         */
        topicId: z.string().min(1),
      })
    )
    // TODO: functionality
    .mutation(({ ctx, input }) => {
      const { topicId } = input;
      return true;
    }),

  delete: protectedProcedureSecretaryGeneral
    .input(z.string().min(1))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.mUNSession.delete({
        where: {
          id: input,
        },
      });
    }),
});
