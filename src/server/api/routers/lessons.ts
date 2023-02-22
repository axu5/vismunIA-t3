import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedureSecretaryGeneral,
  publicProcedure,
} from "../trpc";

export const lessonsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.lesson.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  create: protectedProcedureSecretaryGeneral
    .input(
      z.object({
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
    .mutation(async ({ ctx, input }) => {
      //   await ctx.prisma.lesson
      const { location, date, topicId } = input;
      const document = await ctx.prisma.lesson.create({
        data: {
          location,
          date,
          topicId,
        },
      });
      return document;
    }),

  delete: protectedProcedureSecretaryGeneral
    .input(z.string().min(1))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.lesson.delete({
        where: {
          id: input,
        },
      });
    }),
});
