export { getSupabase, supabase } from './supabase/client';
export {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  getSession,
} from './supabase/auth';
export {
  fetchProfile,
  createProfile,
  updateProfile,
  isProfileComplete,
  type Profile,
  type ProfileInsert,
  type ProfileUpdate,
} from './supabase/profile';
export {
  fetchWorkoutPlans,
  fetchWorkoutPlan,
  createWorkoutPlan,
  deleteWorkoutPlan,
  fetchExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  type WorkoutPlan,
  type Exercise,
  type ExerciseInsert,
  type ExerciseUpdate,
} from './supabase/workouts';
export {
  finishWorkout,
  fetchCompletedWorkoutSessions,
  fetchWorkoutSessionDetails,
  deleteWorkoutSession,
  type WorkoutSession,
  type CompletedSet,
  type FinishWorkoutInput,
  type FinishWorkoutSetInput,
  type WorkoutSessionHistoryItem,
  type WorkoutSessionDetails,
  type CompletedSetWithExercise,
} from './supabase/workout-history';
export {
  fetchWorkoutSchedule,
  upsertWorkoutScheduleDay,
  WEEK_DAYS,
  type WorkoutSchedule,
  type WorkoutScheduleWithPlan,
} from './supabase/schedule';
export { sendCoachMessage, type CoachChatMessage, type CoachChatResponse } from './supabase/ai-coach';
