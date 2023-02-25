import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const documentsRouter = createTRPCRouter({
  getByCountry: protectedProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const documents = await ctx.prisma.document.findMany({
        where: {
          countryId: input,
        },
      });

      return documents;
    }),
  getById: protectedProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: {
          id: input,
        },
      });

      return document;
    }),
  create: protectedProcedure
    .input(
      z.object({
        countryId: z.string().cuid(),
        uri: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // make sure user is a part of the country they're trying to mutate
      const { id } = ctx.session.user;

      const country = await ctx.prisma.country.findUnique({
        where: {
          id: input.countryId,
        },
      });

      const error = new TRPCError({
        code: "UNAUTHORIZED",
        message: "Country doesn't have you added",
      });

      if (
        country === null ||
        !country.studentIds ||
        country.studentIds.length === 0
      )
        throw error;

      if (!country.studentIds.includes(id)) throw error;

      // if all was successful create document with reference to the country
      const document = await ctx.prisma.document.create({
        data: {
          countryId: input.countryId,
          uri: input.uri,
        },
      });

      return document;
    }),
});
