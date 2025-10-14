import { Express, Request, Response } from 'express';
import { OTPManager } from '../lib/otp-manager';
import { sendOtpEmail } from '../email';

export function registerOTPRoutes(app: Express) {
  /**
   * POST /api/otp/send
   * Send OTP to user's email for signup verification
   */
  app.post('/api/otp/send', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ 
          error: 'Email is required' 
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Invalid email address' 
        });
      }

      // Rate limiting: check if OTP already exists
      if (OTPManager.hasActiveOTP(email)) {
        const remainingTime = Math.ceil(OTPManager.getRemainingTime(email) / 1000);
        return res.status(429).json({ 
          error: `OTP already sent. Please wait ${remainingTime} seconds or use the existing code.`,
          remainingTime 
        });
      }

      // Generate OTP
      const code = OTPManager.createOTP(email);

      // Send email
      try {
        await sendOtpEmail(email, code);
        console.log(`[OTP API] Sent OTP to ${email}`);
      } catch (emailError: any) {
        console.error('[OTP API] Failed to send email:', emailError);
        return res.status(500).json({ 
          error: 'Failed to send OTP email. Please try again later.' 
        });
      }

      res.json({ 
        success: true,
        message: 'OTP sent to your email. Valid for 10 minutes.',
        expiresIn: 600 // seconds
      });
    } catch (error: any) {
      console.error('[OTP API] Error in /api/otp/send:', error);
      res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  });

  /**
   * POST /api/otp/verify
   * Verify OTP code before account creation
   */
  app.post('/api/otp/verify', async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ 
          error: 'Email and OTP code are required' 
        });
      }

      if (typeof email !== 'string' || typeof code !== 'string') {
        return res.status(400).json({ 
          error: 'Invalid request format' 
        });
      }

      // Verify OTP
      const result = OTPManager.verifyOTP(email, code);

      if (!result.valid) {
        return res.status(400).json({ 
          error: result.message,
          valid: false 
        });
      }

      console.log(`[OTP API] OTP verified successfully for ${email}`);
      
      res.json({ 
        success: true,
        valid: true,
        message: result.message 
      });
    } catch (error: any) {
      console.error('[OTP API] Error in /api/otp/verify:', error);
      res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  });
}
