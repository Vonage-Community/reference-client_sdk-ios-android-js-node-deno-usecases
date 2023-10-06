import { z } from 'zod';

const SupabaseUserSchema = z.object({
  id: z.string(),
  aud: z.string(),
  role: z.string(),
  email: z.string(),
  raw_user_meta_data: z
    .object({
      name: z.string().optional(),
      avatar_url: z.string().url().optional(),
      vonage_user_id: z.string().optional(),
    })
    .passthrough(),
  raw_app_meta_data: z.object({}).passthrough(),
});

export type SupabaseUser = z.infer<typeof SupabaseUserSchema>;

const SupabaseWebhookSchema = z.object({
  type: z.string(),
  table: z.string(),
  schema: z.string(),
  record: z.object({}).passthrough(),
  old_record: z.object({}).passthrough(),
});

export type SupabaseWebhook = z.infer<typeof SupabaseWebhookSchema>;

const SupabaseUserWebhookBaseSchema = SupabaseWebhookSchema.extend({
  table: z.literal('users'),
  schema: z.literal('auth'),
  record: SupabaseUserSchema.nullable(),
  old_record: SupabaseUserSchema.nullable(),
});

const SupabaseUserInsertWebhookSchema = SupabaseUserWebhookBaseSchema.extend({
  type: z.literal('INSERT'),
  record: SupabaseUserSchema,
  old_record: z.null(),
});
export type SupabaseUserInsertWebhook = z.infer<
  typeof SupabaseUserInsertWebhookSchema
>;

const SupabaseUserUpdateWebhookSchema = SupabaseUserWebhookBaseSchema.extend({
  type: z.literal('UPDATE'),
  record: SupabaseUserSchema,
  old_record: SupabaseUserSchema,
});
export type SupabaseUserUpdateWebhook = z.infer<
  typeof SupabaseUserUpdateWebhookSchema
>;

const SupabaseUserDeleteWebhookSchema = SupabaseUserWebhookBaseSchema.extend({
  type: z.literal('DELETE'),
  record: z.null(),
  old_record: SupabaseUserSchema,
});
export type SupabaseUserDeleteWebhook = z.infer<
  typeof SupabaseUserDeleteWebhookSchema
>;

const SupabaseUserWebhookSchema = z.discriminatedUnion('type', [
  SupabaseUserInsertWebhookSchema,
  SupabaseUserUpdateWebhookSchema,
  SupabaseUserDeleteWebhookSchema,
]);
export type SupabaseUserWebhook = z.infer<typeof SupabaseUserWebhookSchema>;

export { SupabaseUserSchema, SupabaseUserWebhookSchema };
