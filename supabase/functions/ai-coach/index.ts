// Forge AI Coach — Supabase Edge Function
// Keeps GROQ_API_KEY server-side. Set with:
//   supabase secrets set GROQ_API_KEY=...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ChatRole = 'user' | 'assistant' | 'system';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ProfileRow = {
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  goal: string | null;
  experience: string | null;
};

type CompletedSetRow = {
  weight: number | null;
  reps: number;
  set_number: number;
  exercises: { exercise_name: string } | null;
};

type WorkoutSessionRow = {
  completed_at: string | null;
  workout_plans: { name: string } | null;
  completed_sets: CompletedSetRow[] | null;
};

const GOAL_LABELS: Record<string, string> = {
  build_muscle: 'Build muscle',
  lose_fat: 'Lose fat',
  maintain: 'Maintain',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function formatSessionDate(value: string | null): string {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSet(set: CompletedSetRow): string {
  const load = set.weight != null ? `${set.weight}kg` : 'BW';
  return `${load}x${set.reps}`;
}

/** Concise plain-text summary of recent sessions for the system prompt. */
function formatWorkoutSummary(sessions: WorkoutSessionRow[]): string {
  if (sessions.length === 0) {
    return 'No completed workouts logged yet.';
  }

  const lines: string[] = ['Recent workouts (newest first):'];

  for (const session of sessions) {
    const planName = session.workout_plans?.name?.trim() || 'Workout';
    lines.push(`- ${formatSessionDate(session.completed_at)} — ${planName}`);

    const sets = [...(session.completed_sets ?? [])].sort(
      (a, b) => a.set_number - b.set_number,
    );

    if (sets.length === 0) {
      lines.push('  (no sets logged)');
      continue;
    }

    const byExercise = new Map<string, CompletedSetRow[]>();
    for (const set of sets) {
      const name = set.exercises?.exercise_name?.trim() || 'Exercise';
      const group = byExercise.get(name) ?? [];
      group.push(set);
      byExercise.set(name, group);
    }

    for (const [exerciseName, exerciseSets] of byExercise) {
      // Cap sets per exercise to keep the prompt small.
      const shown = exerciseSets.slice(0, 6);
      const setText = shown.map(formatSet).join(', ');
      const extra =
        exerciseSets.length > shown.length ? ` (+${exerciseSets.length - shown.length} more)` : '';
      lines.push(`  ${exerciseName}: ${setText}${extra}`);
    }
  }

  return lines.join('\n');
}

function buildSystemPrompt(profile: ProfileRow | null, workoutSummary: string): string {
  const name = profile?.name?.trim() || 'Athlete';
  const age = profile?.age != null ? String(profile.age) : 'unknown';
  const height = profile?.height != null ? `${profile.height} cm` : 'unknown';
  const weight = profile?.weight != null ? `${profile.weight} kg` : 'unknown';
  const goal = profile?.goal ? (GOAL_LABELS[profile.goal] ?? profile.goal) : 'not set';
  const experience = profile?.experience
    ? (EXPERIENCE_LABELS[profile.experience] ?? profile.experience)
    : 'not set';

  return [
    'You are Forge AI Coach, a concise and practical fitness coach inside the Forge training app.',
    'Give actionable advice on training, recovery, programming, and form.',
    'Be encouraging but direct. Keep answers focused and useful.',
    'Do not invent medical diagnoses. Suggest seeing a professional for injury or health concerns.',
    '',
    'Athlete context:',
    `- Name: ${name}`,
    `- Age: ${age}`,
    `- Height: ${height}`,
    `- Weight: ${weight}`,
    `- Fitness goal: ${goal}`,
    `- Experience level: ${experience}`,
    '',
    'Workout history:',
    workoutSummary,
    '',
    'Personalize advice to this athlete’s goal, experience level, and recent training.',
  ].join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const groqApiKey = Deno.env.get('GROQ_API_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: 'Supabase environment is not configured' }, 500);
    }

    if (!groqApiKey) {
      return jsonResponse({ error: 'GROQ_API_KEY secret is not configured' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json().catch(() => null);
    const incomingMessages = Array.isArray(body?.messages) ? body.messages : null;

    if (!incomingMessages || incomingMessages.length === 0) {
      return jsonResponse({ error: 'messages array is required' }, 400);
    }

    const sanitizedMessages: ChatMessage[] = incomingMessages
      .filter(
        (message: unknown): message is ChatMessage =>
          !!message &&
          typeof message === 'object' &&
          'role' in message &&
          'content' in message &&
          ((message as ChatMessage).role === 'user' ||
            (message as ChatMessage).role === 'assistant') &&
          typeof (message as ChatMessage).content === 'string' &&
          (message as ChatMessage).content.trim().length > 0,
      )
      .map((message: ChatMessage) => ({
        role: message.role,
        content: message.content.trim(),
      }))
      .slice(-20);

    if (sanitizedMessages.length === 0) {
      return jsonResponse({ error: 'No valid chat messages provided' }, 400);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, age, height, weight, goal, experience')
      .eq('id', user.id)
      .maybeSingle();

    const { data: recentSessions } = await supabase
      .from('workout_sessions')
      .select(
        'completed_at, workout_plans(name), completed_sets(weight, reps, set_number, exercises(exercise_name))',
      )
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5);

    const workoutSummary = formatWorkoutSummary(
      (recentSessions ?? []) as WorkoutSessionRow[],
    );

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(profile as ProfileRow | null, workoutSummary),
          },
          ...sanitizedMessages,
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq error:', groqResponse.status, errorText);
      return jsonResponse({ error: 'AI provider request failed' }, 502);
    }

    const completion = await groqResponse.json();
    const reply = completion?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return jsonResponse({ error: 'Empty AI response' }, 502);
    }

    return jsonResponse({ reply, provider: 'groq' });
  } catch (error) {
    console.error('ai-coach error:', error);
    return jsonResponse({ error: 'Unexpected server error' }, 500);
  }
});
