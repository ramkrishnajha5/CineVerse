import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { registerTMDBProxy } from "./routes/tmdb-proxy";
import { registerOTPRoutes } from "./routes/otp";
import { registerGamesRoutes } from "./routes/games";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // TMDB API Proxy
  registerTMDBProxy(app);

  // OTP Routes for signup verification
  registerOTPRoutes(app);

  // Games API Routes (RAWG + GameBrain)
  registerGamesRoutes(app);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
