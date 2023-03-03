import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedureSecretaryGeneral,
  protectedProcedureTeacher,
  publicProcedure,
} from "../trpc";
import isBefore from "date-fns/isBefore";
import isAfter from "date-fns/isAfter";

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
      const dateStrIdentifier = date.toDateString();
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
      const lesson = await ctx.prisma.lesson.delete({
        where: {
          id: input,
        },
      });

      const users = await ctx.prisma.user.findMany({
        where: {
          id: { in: lesson.attendance },
        },
      });
      // get attendance and delete from users
      const promises = lesson.attendance.map((studentId, i) => {
        const user = users[i];
        if (user == undefined) return;
        return ctx.prisma.user.update({
          where: {
            id: studentId,
          },
          data: {
            attendance: user.attendance.filter(
              (lessonId) => lessonId !== input
            ),
          },
        });
      });

      await Promise.all(promises);

      return lesson;
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
        const dateStr = input.data.date.toDateString();
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
  getAttendanceData: protectedProcedureTeacher
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      // lessons will be columns
      const lessons = await ctx.prisma.lesson.findMany({});

      // get start and end index based on the query

      let start = 0;
      let end = lessons.length;
      while (
        isBefore((lessons[start] || { date: new Date() }).date, startDate)
      ) {
        start++;
      }

      while (
        lessons[end] != undefined &&
        end > start &&
        isAfter((lessons[end] || { date: new Date() }).date, endDate)
      ) {
        end--;
      }

      const slicedLessons = lessons.slice(start, end);
      const userIds: Set<string> = new Set();

      for (let i = 0; i < lessons.length; ++i) {
        const lesson = lessons[i];
        if (lesson == undefined) break;
        for (let j = 0; j < lesson.attendance.length; ++j) {
          const studentId = lesson.attendance[j];
          if (!studentId) break;
          userIds.add(studentId);
        }
      }

      // get users as they will be rows to our table
      const users = await ctx.prisma.user.findMany({
        where: {
          id: {
            in: Array.from(userIds),
          },
        },
      });

      return {
        lessons: slicedLessons,
        users: users,
      };
    }),
});
