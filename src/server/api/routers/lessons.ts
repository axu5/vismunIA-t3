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
  getById: publicProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.lesson.findFirst({
        where: {
          id: input,
        },
      });
      if (lesson === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson not found",
        });
      }
      const topic = await ctx.prisma.topic.findFirst({
        where: {
          id: lesson.topicId,
        },
      });
      if (topic === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Topic not found",
        });
      }
      return {
        lesson,
        topic,
      };
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
      const exists = await ctx.prisma.lesson.findFirst({
        where: {
          dateStr: dateStrIdentifier,
        },
      });
      if (exists !== null) {
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
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.lesson.delete({
        where: {
          id: input,
        },
      });
    }),

  edit: protectedProcedureSecretaryGeneral
    .input(
      z.object({
        id: z.string().cuid(),
        data: z.object({
          location: z.string(),
          date: z.date(),
          topicId: z.string().cuid(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // edit
      if (input.data.date) {
        const dateStr = makeDateStr(input.data.date);
        const lesson = await ctx.prisma.lesson.findFirst({
          where: {
            dateStr,
          },
        });
        if (lesson !== null && lesson.id !== input.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Lesson already exists on that day",
          });
        }
      }

      return await ctx.prisma.lesson.update({
        where: { id: input.id },
        data: input.data,
      });
    }),
});

function makeDateStr(date: Date) {
  return date.toDateString();
}
