import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedureTeacher } from "../trpc";
import { UserRole } from "@prisma/client";

const userRoleType = z.enum([
  UserRole.STUDENT,
  UserRole.SECRETARY_GENERAL,
  UserRole.TEACHER,
]);

export const usersRouter = createTRPCRouter({
  getAttendance: protectedProcedureTeacher
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.lesson.findUnique({
        where: {
          id: input,
        },
      });
      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      const users = await ctx.prisma.user.findMany({
        where: {
          role: "STUDENT",
        },
        orderBy: {
          name: "asc",
        },
      });

      // return a map of (userId => boolean)
      const attendance = new Map<string, boolean>();
      for (let i = 0; i < users.length; ++i) {
        const user = users[i];
        if (user == undefined) break;
        const id = user.id;
        attendance.set(
          id,
          lesson?.attendance.some((u) => u == id)
        );
      }

      return attendance;
    }),
  setAttendance: protectedProcedureTeacher
    .input(
      z.object({
        lessonId: z.string().cuid(),
        userId: z.string().cuid(),
        present: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: input.userId,
        },
      });
      if (user == undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      const lesson = await ctx.prisma.lesson.findUnique({
        where: {
          id: input.lessonId,
        },
      });
      if (lesson == undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      if (!input.present) {
        // update user to be absent
        await ctx.prisma.user.update({
          where: {
            id: input.userId,
          },
          data: {
            attendance: user.attendance.filter(
              (lessonId) => lessonId !== input.lessonId
            ),
          },
        });
        await ctx.prisma.lesson.update({
          where: {
            id: input.lessonId,
          },
          data: {
            attendance: lesson.attendance.filter(
              (studentId) => studentId !== input.userId
            ),
          },
        });
      } else {
        await ctx.prisma.user.update({
          where: {
            id: input.userId,
          },
          data: {
            attendance: user.attendance.concat(input.lessonId),
          },
        });
        await ctx.prisma.lesson.update({
          where: {
            id: input.lessonId,
          },
          data: {
            attendance: lesson.attendance.concat(input.userId),
          },
        });
      }

      return true;
    }),
  getUsersByRole: protectedProcedureTeacher
    .input(userRoleType)
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          role: input,
        },
        orderBy: {
          name: "asc",
        },
      });

      return users;
    }),

  // protect user data to only teachers
  getAll: protectedProcedureTeacher.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany();
    return users;
  }),
  delete: protectedProcedureTeacher
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.delete({
        where: {
          id: input,
        },
      });

      // remove their attendance from lessons
      const lessons = await ctx.prisma.lesson.findMany({
        where: {
          id: { in: user.attendance },
        },
      });

      // get attendance and delete from users
      const promises = user.attendance.map((lessonId, i) => {
        const lesson = lessons[i];
        if (lesson == undefined) return;
        return ctx.prisma.user.update({
          where: {
            id: lessonId,
          },
          data: {
            attendance: lesson.attendance.filter(
              (lessonId) => lessonId !== input
            ),
          },
        });
      });

      await Promise.all(promises);

      return user;
    }),
  updateRole: protectedProcedureTeacher
    .input(
      z.object({
        id: z.string().cuid(),
        role: userRoleType,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: {
          id: input.id,
        },
        data: {
          role: input.role,
        },
      });

      return user;
    }),
});
