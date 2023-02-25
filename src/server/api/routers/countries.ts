import { protectedProcedureSecretaryGeneral } from "./../trpc";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Position } from "@prisma/client";

const positionSchema = z.enum([
  Position.AGAINST,
  Position.FOR,
  Position.NEUTRAL,
]);

export const countriesRouter = createTRPCRouter({
  getByTopic: protectedProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const countries = await ctx.prisma.country.findMany({
        where: {
          topicId: input,
        },
      });

      return countries;
    }),

  getById: protectedProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const country = await ctx.prisma.country.findUnique({
        where: {
          id: input,
        },
      });

      return country;
    }),
  create: protectedProcedureSecretaryGeneral
    .input(
      z.object({
        name: z.string(),
        position: positionSchema,
        topicId: z.string().cuid(),
        studentIds: z.array(z.string().cuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const country = await ctx.prisma.country.create({
        data: {
          name: input.name,
          position: input.position,
          topicId: input.topicId,
          studentIds: input.studentIds,
        },
      });

      return country;
    }),
  update: protectedProcedureSecretaryGeneral
    .input(
      z.object({
        countryId: z.string().cuid(),
        data: z.object({
          name: z.string().min(1),
          position: positionSchema,
          students: z.array(z.string().cuid()),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const country = await ctx.prisma.country.update({
        where: {
          id: input.countryId,
        },
        data: {
          name: input.data.name,
          position: input.data.position,
          studentIds: input.data.students,
        },
      });

      return country;
    }),
});
