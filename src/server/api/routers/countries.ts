import { TRPCError } from "@trpc/server";
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
  /** 
   * @param topicId 
   * @returns All countries associated with the topicId provided
   */
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

      if (country === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Country with the id of ${input} was not found`,
        });
      }

      return country;
    }),

  getUserCountry: protectedProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const topicId = input;

      const countries = await ctx.prisma.country.findMany({
        where: {
          topicId,
        },
      });

      // get specific country
      const country = countries.find((country) => {
        return country.studentIds.includes(userId);
      });

      return country || null;
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

  addStudent: protectedProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const countryId = input;

      const country = await ctx.prisma.country.findUnique({
        where: { id: countryId },
      });
      if (!country) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const updatedCountry = await ctx.prisma.country.update({
        where: {
          id: countryId,
        },
        data: {
          studentIds: [...country.studentIds, userId],
        },
      });

      return updatedCountry;
    }),

  removeStudent: protectedProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const countryId = input;

      const country = await ctx.prisma.country.findUnique({
        where: {
          id: countryId,
        },
      });

      if (!country) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const studentIds = country.studentIds.filter(
        (studentId) => studentId !== userId
      );

      const updatedCountry = await ctx.prisma.country.update({
        where: {
          id: countryId,
        },
        data: {
          studentIds,
        },
      });

      return updatedCountry;
    }),

  delete: protectedProcedureSecretaryGeneral
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      const country = await ctx.prisma.country.delete({
        where: {
          id: input,
        },
      });

      return country;
    }),
});
