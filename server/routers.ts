import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createSusuertRegistro, getAllSusuertRegistros, updateSusuertRegistro } from "./db";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  susuert: router({
    // Create a new registration
    createRegistro: publicProcedure
      .input(z.object({
        nombre: z.string().min(1),
        email: z.string().email(),
        telefono: z.string().optional(),
        documento: z.string().min(1),
        deviceType: z.string().optional(),
        browser: z.string().optional(),
        os: z.string().optional(),
        sessionId: z.string().optional(),
      }))
      .mutation(({ input }) => createSusuertRegistro(input)),

    // Get all registrations (only for admin users)
    getAllRegistros: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can view all registrations');
        }
        return getAllSusuertRegistros();
      }),

    // Update registration status
    updateRegistro: protectedProcedure
      .input(z.object({
        id: z.number(),
        verificado: z.enum(['pendiente', 'verificado', 'rechazado']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can update registrations');
        }
        return updateSusuertRegistro(input.id, { verificado: input.verificado });
      }),
  }),
});

export type AppRouter = typeof appRouter;
