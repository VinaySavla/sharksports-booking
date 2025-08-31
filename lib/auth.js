import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function withAuth(handler, allowedRoles = []) {
  return async (request, context) => {
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                   request.cookies.get('token')?.value;

      if (!token) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return Response.json({ error: 'Invalid token' }, { status: 401 });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Add user info to request
      request.user = decoded;
      return handler(request, context);
    } catch (error) {
      return Response.json({ error: 'Authentication failed' }, { status: 401 });
    }
  };
}
