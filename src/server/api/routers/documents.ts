import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const documentsRouter = createTRPCRouter({
  /**
   * @param {String} countryId
   * @returns Returns all documents associated with a given country
   */
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

  /**
   * @param {String} topicId
   * @returns Returns all documents that were found to be associated with this topic
   */
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

  /**
   * Get a document by its ID
   * @param {String} documentId Fetch a document from the database based on this CUID
   */
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

  /**
   * @description Creating a document can be done by any logged in user. However: The user must be a
   * member of the country in which they wish to make a document. FIX: could add functionality
   * to ignore this for secretary generals and teachers.
   * @param {String} countryId The CUID of the country this document is associated with
   * @param {String} topicId The CUID of the topic this document is associated with (FIX: could be derived through country)
   * @param {String} uri The URI of the document (example: a google docs link)
   * @param {String} name The alias of the document (example: Opening speech)
   */
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

  deleteById: protectedProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      // get document associated country
      // TODO: In the future you could check if
      // user is associated with the country.
      // As this is a small scale project
      // this is a potential risk I am willing
      // to take to save DB queries.
      const document = await ctx.prisma.document.delete({
        where: {
          id: input,
        },
      });
      if (document == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      return document;
    }),
});
