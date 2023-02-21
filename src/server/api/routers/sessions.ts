import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedureSecretaryGeneral,
  publicProcedure,
} from "./../trpc";

export const sessionsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.mUNSession.findMany();
  }),

  create: protectedProcedureSecretaryGeneral
    .input(
      z.object({
        sessionName: z.string().min(1),
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
        topicTitle: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // validate topicName as existing topic
      const { topicTitle } = input;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const topic = await ctx.prisma.topic.findFirst({
        where: {
          title: topicTitle,
        },
      });

      if (!topic) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Topic not found",
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const session = await ctx.prisma.mUNSession.create({
        data: {
          // auto fill
          location: input.location,
          // auto fill
          date: input.date,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      //   await ctx.prisma.topic.update({
      //     where: {
      //       title: topicTitle,
      //     },
      //     data: {
      //       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      //       sessions: topic,
      //     },
      //   });
    }),

  delete: protectedProcedureSecretaryGeneral
    .input(z.string().min(1))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.mUNSession.delete({
        where: {
          id: input,
        },
      });
    }),
});
