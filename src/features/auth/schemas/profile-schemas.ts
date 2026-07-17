import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z
    .string()
    .min(1, 'Age is required')
    .refine((v) => !Number.isNaN(Number(v)), 'Enter a valid age')
    .transform((v) => Number(v))
    .pipe(z.number().int().min(13, 'Must be at least 13').max(120, 'Enter a valid age')),
  height: z
    .string()
    .min(1, 'Height is required')
    .refine((v) => !Number.isNaN(Number(v)), 'Enter a valid height')
    .transform((v) => Number(v))
    .pipe(z.number().int().min(100, 'Enter height in cm').max(250, 'Enter a valid height')),
  weight: z
    .string()
    .min(1, 'Weight is required')
    .refine((v) => !Number.isNaN(Number(v)), 'Enter a valid weight')
    .transform((v) => Number(v))
    .pipe(z.number().min(30, 'Enter weight in kg').max(300, 'Enter a valid weight')),
  goal: z.enum(['build_muscle', 'lose_fat', 'maintain'], {
    message: 'Select a fitness goal',
  }),
  experience: z.enum(['beginner', 'intermediate', 'advanced'], {
    message: 'Select your experience level',
  }),
});

export type ProfileFormInput = z.input<typeof profileSchema>;
export type ProfileForm = z.output<typeof profileSchema>;

export const GOAL_OPTIONS = [
  { value: 'build_muscle' as const, label: 'Build muscle' },
  { value: 'lose_fat' as const, label: 'Lose fat' },
  { value: 'maintain' as const, label: 'Maintain' },
];

export const EXPERIENCE_OPTIONS = [
  { value: 'beginner' as const, label: 'Beginner' },
  { value: 'intermediate' as const, label: 'Intermediate' },
  { value: 'advanced' as const, label: 'Advanced' },
];
