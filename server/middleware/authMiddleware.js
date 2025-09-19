import supabase from "../config/supabaseClient.js";

/**
 * Middleware to verify Supabase JWT token and extract user info
 * Only uses Supabase for auth token validation
 */
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token with Supabase - ONLY used for Google auth token validation
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication service error' });
  }
};

/**
 * Middleware to check if user exists in local database and get their info
 */
export const getUserInfo = (db) => {
  return (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user info from local SQLite database
      const stmt = db.prepare("SELECT * FROM users WHERE auth_uuid = ?");
      const user = stmt.get(req.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found in local database' });
      }

      req.userInfo = user;
      next();
    } catch (error) {
      console.error('Get user info error:', error);
      return res.status(500).json({ error: 'Database error while fetching user info' });
    }
  };
};

/**
 * Middleware to check if user is an organiser
 */
export const requireOrganiser = (req, res, next) => {
  if (!req.userInfo) {
    return res.status(401).json({ error: 'User info not available' });
  }

  if (!req.userInfo.is_organiser) {
    return res.status(403).json({ error: 'Access denied: Organiser privileges required' });
  }

  next();
};

/**
 * Middleware to check if user owns the resource (for updates/deletes)
 */
export const requireOwnership = (db, table, idField, ownerField = 'auth_uuid') => {
  return (req, res, next) => {
    try {
      const resourceId = req.params[idField] || req.params.id;
      
      if (!resourceId) {
        return res.status(400).json({ error: `${idField} parameter is required` });
      }

      // Check if resource exists and belongs to user
      const stmt = db.prepare(`SELECT * FROM ${table} WHERE ${idField} = ?`);
      const resource = stmt.get(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: `${table.slice(0, -1)} not found` });
      }

      if (resource[ownerField] !== req.userId) {
        return res.status(403).json({ error: 'Access denied: You can only modify your own resources' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ error: 'Database error while checking ownership' });
    }
  };
};

/**
 * Optional authentication - allows both authenticated and anonymous users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if there's an error
    next();
  }
};