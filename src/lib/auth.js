import jwt from 'jsonwebtoken';
import dbConnect from './dbConnect';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'lmartSuperSecret2024';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export async function authenticate(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    await dbConnect();
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch {
    return null;
  }
}
