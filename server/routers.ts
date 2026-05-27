import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createSusuertRegistro, getAllSusuertRegistros, updateSusuertRegistro, searchSusuertRegistros, filterSusuertRegistros, createEmailVerificationToken, verifyEmailToken, deleteEmailVerificationToken, getSusuertRegistroById, deleteAllSusuertRegistros, createUserEvent, getAllUserEvents, deleteAllUserEvents } from "./db";
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
        password: z.string().optional(),
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

    searchRegistros: protectedProcedure
      .input(z.object({
        query: z.string().min(1),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can search registrations');
        }
        return searchSusuertRegistros(input.query);
      }),

    filterRegistros: protectedProcedure
      .input(z.object({
        status: z.enum(['pendiente', 'verificado', 'rechazado']).optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can filter registrations');
        }
        return filterSusuertRegistros(input.status);
      }),

    requestEmailVerification: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const allRegistros = await getAllSusuertRegistros();
        const registro = allRegistros.find((r: any) => r.email === input.email);
        
        if (!registro) {
          throw new Error('Registration not found');
        }
        
        const result = await createEmailVerificationToken(registro.id, input.email);
        if (!result) {
          throw new Error('Failed to create verification token');
        }
        
        return {
          success: true,
          token: result.token,
          expiresAt: result.expiresAt,
        };
      }),

    verifyEmail: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .mutation(async ({ input }) => {
        const tokenRecord = await verifyEmailToken(input.token);
        if (!tokenRecord) {
          throw new Error('Invalid or expired verification token');
        }
        
        await updateSusuertRegistro(tokenRecord.registroId, { verificado: 'verificado' });
        await deleteEmailVerificationToken(input.token);
        
        return {
          success: true,
          message: 'Email verified successfully',
        };
      }),

    deleteAllRegistros: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can delete registrations');
        }
        return deleteAllSusuertRegistros();
      }),

    // Events management
    createEvent: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        eventType: z.string(),
        timestamp: z.string(),
        ipPublica: z.string().optional(),
        ipPrivada: z.string().optional(),
        userAgent: z.string().optional(),
        navegador: z.string().optional(),
        sistemaOperativo: z.string().optional(),
        dispositivo: z.string().optional(),
        tiempoActivo: z.number().optional(),
        paginaVisitada: z.string().optional(),
        email: z.string().optional(),
        nombre: z.string().optional(),
        detalles: z.any().optional(),
      }))
      .mutation(({ input }) => createUserEvent(input)),

    getAllEvents: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can view events');
        }
        return getAllUserEvents();
      }),

    deleteAllEvents: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can delete events');
        }
        return deleteAllUserEvents();
      }),
  }),
});

export type AppRouter = typeof appRouter;
