import { z } from 'zod';

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    display_name: z.string().optional(),
    image_url: z.string().optional(),
});