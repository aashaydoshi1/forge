// Forge AI Coach — Supabase Edge Function stub (Phase 0)
// OpenAI calls will be proxied here in Phase 3. Provider is swappable.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      message: 'AI Coach edge function stub — implement in Phase 3',
      provider: 'openai',
    }),
    { status: 501, headers: { 'Content-Type': 'application/json' } },
  );
});
