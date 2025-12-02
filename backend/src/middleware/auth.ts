// Re-export from auth.middleware.ts with expected names
import { authenticate, authorize, ROLES } from './auth.middleware';

// Export with the names expected by routes
export const authenticateToken = authenticate;
export const authorizeRole = (role: string) => authorize(role);

// Export everything else
export { authenticate, authorize, ROLES };
export * from './auth.middleware';
