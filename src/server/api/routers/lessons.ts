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
          timestamp: input,
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
        timestamp: z.date(),
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
      const { location, timestamp, topicId } = input;
      const dateStrIdentifier = timestamp.toDateString();
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
          timestamp,
          dateStr: dateStrIdentifier,
          topicId,
        },
      });
      return document;
    }),

  delete: protectedProcedureSecretaryGeneral
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.lesson.delete({
        where: {
          id: input,
        },
      });

      return lesson;
    }),

  /**
   * @description Edit a given lesson is a restricted procedure to only
   * secretary generals or teachers.
   */
  edit: protectedProcedureSecretaryGeneral
    .input(
      z.object({
        id: z.string().cuid(),
        data: z.object({
          location: z.string(),
          timestamp: z.date(),
          topicId: z.string().cuid(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // edit
      if (input.data.timestamp) {
        const dateStr = input.data.timestamp.toDateString();
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
