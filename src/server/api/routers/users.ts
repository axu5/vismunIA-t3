import { z } from "zod";
import { createTRPCRouter, protectedProcedureTeacher } from "../trpc";
import { UserRole } from "@prisma/client";

const userRoleType = z.enum([
  UserRole.STUDENT,
  UserRole.SECRETARY_GENERAL,
  UserRole.TEACHER,
]);

export const usersRouter = createTRPCRouter({
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
