import { Router } from 'express';
import { tenantRoutes } from './tenantRoutes.js';
import { authRoutes } from './authRoutes.js';
import { creditRoutes } from './creditRoutes.js';
import { skillsRoutes } from './skillsRoutes.js';

export const routes = Router();

// Public routes
routes.use('/auth', authRoutes);

// Protected routes (require authentication)
routes.use('/tenants', tenantRoutes);
routes.use('/credits', creditRoutes);
routes.use('/skills', skillsRoutes);

// Health check is in index.ts
