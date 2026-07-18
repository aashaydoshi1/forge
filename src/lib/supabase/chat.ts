import { getSupabase } from './client';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
};

/** Narrow client for chat_messages until Database types include the table. */
function chatMessages() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  return (
    supabase as unknown as {
      from: (relation: 'chat_messages') => {
        select: (columns: string) => {
          order: (
            column: string,
            options: { ascending: boolean },
          ) => PromiseLike<{ data: ChatMessage[] | null; error: Error | null }>;
        };
        insert: (values: { user_id: string; role: ChatRole; content: string }) => {
          select: (columns: string) => {
            single: () => PromiseLike<{ data: ChatMessage | null; error: Error | null }>;
          };
        };
      };
      auth: typeof supabase.auth;
    }
  ).from('chat_messages');
}

export async function fetchChatMessages(): Promise<ChatMessage[]> {
  const { data, error } = await chatMessages()
    .select('id, role, content, created_at')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function saveChatMessage(role: ChatRole, content: string): Promise<ChatMessage> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to save chat messages');

  const { data, error } = await chatMessages()
    .insert({
      user_id: user.id,
      role,
      content,
    })
    .select('id, role, content, created_at')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to save chat message');
  return data;
}
