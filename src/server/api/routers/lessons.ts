import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedureSecretaryGeneral,
  protectedProcedureTeacher,
  publicProcedure,
} from "../trpc";
import type { Lesson } from "@prisma/client";

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
      // ZOD data validation
      z.object({
        // Location is mandatory, and must be a strong.
        location: z.string().min(1),
        // Time when lesson will be, must be a date
        timestamp: z.date(),
        // TopicId must be a string, which links to a PostgresDB Id (CUID)
        topicId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 2 lessons can't exist on the same date
      const { location, timestamp, topicId } = input;
      const dateStrIdentifier = timestamp.toDateString();

      // Try to find a lesson with the same date string
      const exists = await ctx.prisma.lesson.findFirst({
        where: {
          dateStr: dateStrIdentifier,
        },
      });

      // If "exists" is not null, a lesson was found and this should throw an error
      if (exists !== null) {
        // Exit the function with keyword "throw"
        throw new TRPCError({
          code: "CONFLICT",
          // Return an appropriate error message
          message: `Lesson already exists on date ${dateStrIdentifier}`,
        });
      }

      // Create a new lesson in the database using prisma
      const newLesson = await ctx.prisma.lesson.create({
        data: {
          location,
          timestamp,
          dateStr: dateStrIdentifier,
          topicId,
        },
      });

      // Return this created lesson to client for updating UI
      return newLesson;
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
  setAttendanceData: protectedProcedureTeacher
    .input(
      z.object({
        lessonId: z.string().cuid(),
        users: z.array(z.string().cuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attendanceSet = new Set<string>(input.users);

      const _lesson = await ctx.prisma.lesson.update({
        where: {
          id: input.lessonId,
        },
        data: {
          attendance: Array.from(attendanceSet),
        },
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

      // lessons will be columns, get them in chronological order
      const slicedLessons = await ctx.prisma.lesson.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      });

      // Use set to handle duplicates
      const userIds: Set<string> = new Set();
      const lessons: Set<Lesson> = new Set();

      for (let i = 0; i < slicedLessons.length; ++i) {
        const lesson = slicedLessons[i];
        if (lesson == undefined) break;
        for (let j = 0; j < lesson.attendance.length; ++j) {
          const studentId = lesson.attendance[j];
          if (!studentId) break;
          userIds.add(studentId);
          lessons.add(lesson);
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
        lessons: Array.from(lessons),
        users: users,
      };
    }),
});
