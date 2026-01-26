import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const LogoutSchema = z.object({
  email: z.email({ message: 'Invalid email' }),
});

export class LogoutDto extends createZodDto(LogoutSchema) {}
