import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const documentsRouter = createTRPCRouter({
  getByCountry: publicProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const documents = await ctx.prisma.document.findMany({
        where: {
          countryId: input,
        },
      });

      return documents;
    }),
  getByTopic: publicProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const documents = await ctx.prisma.document.findMany({
        where: {
          topicId: input,
        },
      });

      return documents;
    }),
  getById: publicProcedure
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
        topicId: z.string().cuid(),
        uri: z.string().url(),
        name: z.string().min(1),
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
          topicId: input.topicId,
          uri: input.uri,
          name: input.name,
        },
      });

      return document;
    }),

  delete: protectedProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      const documentId = input;

      const document = await ctx.prisma.document.findUnique({
        where: {
          id: documentId,
        },
      });

      if (document === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document could not be found",
        });
      }

      const userId = ctx.session.user.id;

      // make sure user is a part of the country which document belongs to
      const country = await ctx.prisma.country.findUnique({
        where: {
          id: document.countryId,
        },
      });

      if (country === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Country could not be found",
        });
      }

      if (!country.studentIds.includes(userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of that country",
        });
      }

      await ctx.prisma.document.delete({
        where: {
          id: documentId,
        },
      });

      return document;
    }),
});
