import { z } from "zod";
import { createTRPCRouter, protectedProcedureTeacher } from "../trpc";
import { UserRole } from "@prisma/client";

export const usersRouter = createTRPCRouter({
  getUsersByRole: protectedProcedureTeacher
    .input(
      z.enum([UserRole.STUDENT, UserRole.SECRETARY_GENERAL, UserRole.TEACHER])
    )
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
});
