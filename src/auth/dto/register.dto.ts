import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterSchema = z.object({
  email: z.email({ message: 'Invalid email' }),

  password: z.string().min(6, 'Password must be at least 6 characters'),

  firstName: z.string().min(1, 'First name is required'),

  lastName: z.string().min(1, 'Last name is required'),

  phone: z.string().min(1, 'Phone is required'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
