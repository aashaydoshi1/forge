import type { ExperienceLevel, FitnessGoal } from '@/types/database';

import { upsertWorkoutScheduleDay } from './supabase/schedule';
import { createExercise, createWorkoutPlan, type WorkoutPlan } from './supabase/workouts';

export type StarterProgramId = 'ppl' | 'upper_lower' | 'full_body';

type StarterExercise = {
  name: string;
  sets: number;
  reps: string;
};

type StarterDay = {
  name: string;
  exercises: StarterExercise[];
};

export type StarterProgram = {
  id: StarterProgramId;
  title: string;
  subtitle: string;
  daysPerWeek: number;
  bestFor: string;
  days: StarterDay[];
  /** day_of_week (0=Mon … 6=Sun) → day index in `days` */
  schedule: Record<number, number>;
};

function scaleSets(base: number, experience: ExperienceLevel | null | undefined): number {
  if (experience === 'beginner') return Math.max(2, base - 1);
  if (experience === 'advanced') return base + 1;
  return base;
}

function withExperience(
  days: StarterDay[],
  experience: ExperienceLevel | null | undefined,
): StarterDay[] {
  return days.map((day) => ({
    ...day,
    exercises: day.exercises.map((exercise) => ({
      ...exercise,
      sets: scaleSets(exercise.sets, experience),
    })),
  }));
}

const PPL_DAYS: StarterDay[] = [
  {
    name: 'Push',
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '6–8' },
      { name: 'Overhead Press', sets: 3, reps: '8–10' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8–12' },
      { name: 'Lateral Raises', sets: 3, reps: '12–15' },
      { name: 'Tricep Pushdowns', sets: 3, reps: '10–12' },
    ],
  },
  {
    name: 'Pull',
    exercises: [
      { name: 'Barbell Row', sets: 4, reps: '6–8' },
      { name: 'Lat Pulldown', sets: 3, reps: '8–12' },
      { name: 'Seated Cable Row', sets: 3, reps: '10–12' },
      { name: 'Face Pulls', sets: 3, reps: '12–15' },
      { name: 'Dumbbell Curls', sets: 3, reps: '10–12' },
    ],
  },
  {
    name: 'Legs',
    exercises: [
      { name: 'Back Squat', sets: 4, reps: '6–8' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8–10' },
      { name: 'Leg Press', sets: 3, reps: '10–12' },
      { name: 'Walking Lunges', sets: 3, reps: '10/leg' },
      { name: 'Calf Raises', sets: 3, reps: '12–15' },
    ],
  },
];

const UPPER_LOWER_DAYS: StarterDay[] = [
  {
    name: 'Upper Body',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '6–8' },
      { name: 'Barbell Row', sets: 4, reps: '6–8' },
      { name: 'Overhead Press', sets: 3, reps: '8–10' },
      { name: 'Lat Pulldown', sets: 3, reps: '8–12' },
      { name: 'Lateral Raises', sets: 3, reps: '12–15' },
      { name: 'Dumbbell Curls', sets: 2, reps: '10–12' },
      { name: 'Tricep Pushdowns', sets: 2, reps: '10–12' },
    ],
  },
  {
    name: 'Lower Body',
    exercises: [
      { name: 'Back Squat', sets: 4, reps: '6–8' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8–10' },
      { name: 'Leg Press', sets: 3, reps: '10–12' },
      { name: 'Leg Curl', sets: 3, reps: '10–12' },
      { name: 'Calf Raises', sets: 3, reps: '12–15' },
      { name: 'Plank', sets: 3, reps: '30–45s' },
    ],
  },
];

const FULL_BODY_DAYS: StarterDay[] = [
  {
    name: 'Full Body',
    exercises: [
      { name: 'Goblet Squat', sets: 3, reps: '8–12' },
      { name: 'Dumbbell Bench Press', sets: 3, reps: '8–12' },
      { name: 'One-Arm Dumbbell Row', sets: 3, reps: '8–12' },
      { name: 'Dumbbell Shoulder Press', sets: 3, reps: '8–12' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8–12' },
      { name: 'Plank', sets: 3, reps: '20–40s' },
    ],
  },
];

export function getStarterPrograms(
  experience?: ExperienceLevel | null,
): StarterProgram[] {
  return [
    {
      id: 'ppl',
      title: 'Push Pull Legs',
      subtitle: 'Three focused sessions. Classic hypertrophy split.',
      daysPerWeek: 3,
      bestFor: 'Muscle building · Intermediate+',
      days: withExperience(PPL_DAYS, experience),
      schedule: { 0: 0, 2: 1, 4: 2 }, // Mon Push, Wed Pull, Fri Legs
    },
    {
      id: 'upper_lower',
      title: 'Upper Lower',
      subtitle: 'Two workouts that cover your whole body across the week.',
      daysPerWeek: 4,
      bestFor: 'Balanced strength · Flexible schedule',
      days: withExperience(UPPER_LOWER_DAYS, experience),
      schedule: { 0: 0, 1: 1, 3: 0, 4: 1 }, // Mon/Thu Upper, Tue/Fri Lower
    },
    {
      id: 'full_body',
      title: 'Beginner Full Body',
      subtitle: 'One efficient session. Train the whole body each visit.',
      daysPerWeek: 3,
      bestFor: 'Beginners · Simple & effective',
      days: withExperience(FULL_BODY_DAYS, experience),
      schedule: { 0: 0, 2: 0, 4: 0 }, // Mon/Wed/Fri
    },
  ];
}

export function getRecommendedStarterProgramId(
  goal?: FitnessGoal | null,
  experience?: ExperienceLevel | null,
): StarterProgramId {
  if (experience === 'beginner' || !experience) {
    return 'full_body';
  }

  if (goal === 'build_muscle' || experience === 'advanced') {
    return 'ppl';
  }

  return 'upper_lower';
}

export async function createStarterProgram(
  userId: string,
  programId: StarterProgramId,
  experience?: ExperienceLevel | null,
): Promise<WorkoutPlan[]> {
  const program = getStarterPrograms(experience).find((item) => item.id === programId);
  if (!program) {
    throw new Error('Unknown starter program');
  }

  const createdPlans: WorkoutPlan[] = [];

  for (const day of program.days) {
    const plan = await createWorkoutPlan(userId, day.name);
    createdPlans.push(plan);

    for (const exercise of day.exercises) {
      await createExercise({
        workout_plan_id: plan.id,
        exercise_name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
      });
    }
  }

  for (const [dayOfWeekRaw, dayIndex] of Object.entries(program.schedule)) {
    const plan = createdPlans[dayIndex];
    if (!plan) continue;
    await upsertWorkoutScheduleDay(userId, Number(dayOfWeekRaw), plan.id);
  }

  return createdPlans;
}
