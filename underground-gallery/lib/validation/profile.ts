// lib/validation/profile.ts
import { z } from "zod";

// Bio — a real about, not a tagline
export const bioSchema = z
  .string()
  .max(1000, "Bio is too long (max 1000 characters)")
  .transform((s) => s.trim());

// Each build section has the same shape — free-text up to 800 chars
export const buildSectionSchema = z
  .string()
  .max(800, "Section is too long (max 800 characters)")
  .transform((s) => s.trim());

// Region update — must be a Google Places result, same shape as setup
export const regionSchema = z.object({
  placeId: z.string().min(1),
  label: z.string().min(1).max(200),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  country: z.string().min(2).max(3).optional(),
  admin1: z.string().max(100).optional(),
});

// Profile update payload — everything the user can edit on /me except photos
// (callsign deliberately excluded — admin only)
export const profileUpdateSchema = z.object({
  bio: bioSchema.optional(),
  region: regionSchema.optional(),
});
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

// Vehicle base info (year/make/model/trim/notes)
const currentYear = new Date().getFullYear();
export const vehicleEditSchema = z.object({
  year: z.number().int().min(1900).max(currentYear + 2),
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  trim: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type VehicleEdit = z.infer<typeof vehicleEditSchema>;

// Vehicle build sections (all optional, all max 800 chars)
export const vehicleBuildSchema = z.object({
  buildExterior:    buildSectionSchema.optional(),
  buildInterior:    buildSectionSchema.optional(),
  buildEngine:      buildSectionSchema.optional(),
  buildSuspension:  buildSectionSchema.optional(),
  buildWheelsTires: buildSectionSchema.optional(),
});
export type VehicleBuild = z.infer<typeof vehicleBuildSchema>;

// Photo upload payload — server gets a Blob via FormData, this validates the metadata
export const photoUploadInputSchema = z.object({
  subjectType: z.enum(["user", "vehicle"]),
  subjectId: z.string().min(1),
  isPrimary: z.boolean().optional().default(false),
});
export type PhotoUploadInput = z.infer<typeof photoUploadInputSchema>;
