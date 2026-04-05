import type { Express } from 'express';
import { createServer, type Server } from 'http';

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes added here when backend is ready
  return createServer(app);
}
