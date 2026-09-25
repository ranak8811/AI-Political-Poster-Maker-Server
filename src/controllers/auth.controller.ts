import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Generate a signed JWT token
 */
function generateToken(userId: string, email: string, role: string): string {
  const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ userId, email, role }, jwtSecret, {
    expiresIn,
  } as jwt.SignOptions);
}

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
    });

    // Generate JWT
    const token = generateToken(
      newUser._id.toString(),
      newUser.email,
      newUser.role
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/v1/auth/login
 * Authenticate existing user and return JWT
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate JWT
    const token = generateToken(user._id.toString(), user.email, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/v1/auth/me
 * Get current authenticated user profile
 */
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const user = await User.findById(req.user.userId).select('-passwordHash');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching user profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
