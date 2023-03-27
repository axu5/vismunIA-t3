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
          role: {
            in: [UserRole.STUDENT, UserRole.SECRETARY_GENERAL],
          },
        },
      });

      // return a map of (userId => boolean)
      const attendance = new Set<string>();
      for (let i = 0; i < users.length; ++i) {
        const user = users[i];
        if (user == undefined) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
          });
        }
        const id = user.id;
        if (lesson?.attendance.some((u) => u == id)) attendance.add(id);
      }

      return attendance;
    }),

  getUsersByRole: protectedProcedureTeacher
    .input(z.array(userRoleType))
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          role: {
            in: input,
          },
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
          attendance: {
            hasSome: user.id,
          },
        },
      });

      const promises = lessons.map((lesson) => {
        return ctx.prisma.lesson.update({
          where: {
            id: lesson.id,
          },
          data: {
            attendance: lesson.attendance.filter((x) => x !== user.id),
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
