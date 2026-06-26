import { z } from 'zod';

export const authFormSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Use at least 6 characters.'),
});

export type AuthFormValues = z.infer<typeof authFormSchema>;
