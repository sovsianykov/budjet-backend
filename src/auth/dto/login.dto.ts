import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const LoginSchema = z.object({
  email: z.email({ message: 'Invalid email' }),

  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export class LoginDto extends createZodDto(LoginSchema) {}
