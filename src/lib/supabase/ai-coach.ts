import { getSupabase } from './client';

export type CoachChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type CoachChatResponse = {
  reply: string;
  provider?: string;
};

export async function sendCoachMessage(
  messages: CoachChatMessage[],
): Promise<CoachChatResponse> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase.functions.invoke<{
    reply?: string;
    provider?: string;
    error?: string;
  }>('ai-coach', {
    body: { messages },
  });

  if (error) {
    const serverMessage =
      typeof data === 'object' && data && 'error' in data && typeof data.error === 'string'
        ? data.error
        : error.message;
    throw new Error(serverMessage || 'Failed to reach AI Coach');
  }

  if (!data?.reply?.trim()) {
    throw new Error(data?.error || 'AI Coach returned an empty response');
  }

  return {
    reply: data.reply.trim(),
    provider: data.provider,
  };
}
