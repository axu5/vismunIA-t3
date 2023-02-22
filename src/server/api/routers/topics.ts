import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedureSecretaryGeneral,
  publicProcedure,
} from "./../trpc";

export const topicsRouter = createTRPCRouter({
  getByTitle: publicProcedure
    .input(z.string().min(1))
    .query(async ({ input, ctx }) => {
      if (!input) {
        return new TRPCError({
          code: "BAD_REQUEST",
          message: "TITLE needs to be defined",
        });
      }

      return await ctx.prisma.topic.findFirst({
        where: {
          title: input,
        },
      });
    }),
  getById: publicProcedure
    .input(z.string().cuid())
    .query(async ({ input, ctx }) => {
      if (!input)
        return new TRPCError({
          code: "BAD_REQUEST",
          message: "ID needs to be defined",
        });
      return await ctx.prisma.topic.findFirst({
        where: {
          id: input,
        },
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.topic.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          title: "asc",
        },
      ],
    });
  }),

  create: protectedProcedureSecretaryGeneral
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // validate topicName as existing topic
      const { title, description } = input;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const topic = await ctx.prisma.topic.findFirst({
        where: {
          title,
        },
      });

      if (topic) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Topic already exists",
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const item = await ctx.prisma.topic.create({
        data: {
          title,
          description,
        },
      });

      return item;
    }),

  delete: protectedProcedureSecretaryGeneral
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const deletion = await ctx.prisma.topic.delete({
        where: {
          id: input,
        },
      });

      return deletion;
    }),

  edit: protectedProcedureSecretaryGeneral
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.topic.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.title,
          description: input.description,
        },
      });
    }),
});
