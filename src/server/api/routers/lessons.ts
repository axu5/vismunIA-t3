import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedureSecretaryGeneral,
  publicProcedure,
} from "../trpc";

export const lessonsRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.enum(["asc", "desc"]).default("desc"))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.lesson.findMany({
        orderBy: {
          date: input,
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
        topicId: z.string().cuid(),
      })
    )
    // TODO: functionality
    .mutation(async ({ ctx, input }) => {
      // 2 lessons can't exist on the same date
      const { location, date, topicId } = input;
      const dateStrIdentifier = makeDateStr(date);
      const sameDate = await ctx.prisma.lesson.findFirst({
        where: {
          dateStr: dateStrIdentifier,
        },
      });
      console.log(sameDate);
      if (sameDate !== null) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Lesson already exists on date ${dateStrIdentifier}`,
        });
      }
      const document = await ctx.prisma.lesson.create({
        data: {
          location,
          date,
          dateStr: dateStrIdentifier,
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

function makeDateStr(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDay()}`;
}
