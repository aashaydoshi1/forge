import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from 'expo-router';

import { KeyboardAvoidingLayout } from '@/components/layout/KeyboardAvoidingLayout';
import { useAuth } from '@/features/auth/context/AuthProvider';
import { sendCoachMessage } from '@/lib/supabase/ai-coach';
import { fetchChatMessages, saveChatMessage } from '@/lib/supabase/chat';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildWelcomeMessage(name?: string | null): ChatMessage {
  const greetingName = name?.trim() || 'Athlete';
  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hey ${greetingName} — I'm your Forge AI Coach. Ask me about training, recovery, or programming and I'll personalize advice using your profile.`,
  };
}

export default function CoachScreen() {
  const navigation = useNavigation();
  const { profile } = useAuth();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    buildWelcomeMessage(profile?.name),
  ]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const scrollToLatest = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const saved = await fetchChatMessages();
        if (cancelled || saved.length === 0) return;

        setMessages(
          saved.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
          })),
        );
      } catch {
        // Keep the welcome message if history fails to load.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const timeout = setTimeout(scrollToLatest, 50);
    return () => clearTimeout(timeout);
  }, [messages, isSending]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || isSending) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setError(null);
    setIsSending(true);

    try {
      await saveChatMessage('user', content);

      const history = nextMessages
        .filter((message) => message.id !== 'welcome')
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      const { reply } = await sendCoachMessage(history);

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: reply,
        },
      ]);

      await saveChatMessage('assistant', reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get a coach reply');
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content:
            "I couldn't reach the coaching service just now. Check that the ai-coach function is deployed and try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const canSend = !!draft.trim() && !isSending;

  return (
    <KeyboardAvoidingLayout
      className="pt-2"
      footerClassName="border-t border-forge-800 bg-forge-950"
      footer={
        <View className="gap-3">
          {error ? (
            <View className="rounded-2xl border border-forge-700 bg-forge-900 px-3 py-2">
              <Text className="text-sm text-red-400">{error}</Text>
            </View>
          ) : null}

          <View className="flex-row items-end gap-3">
            <View className="min-h-[48px] flex-1 overflow-hidden rounded-2xl border border-forge-700 bg-forge-900">
              <TextInput
                className="max-h-28 px-4 py-3.5 text-base text-white"
                placeholder="Ask Forge Coach..."
                placeholderTextColor="#5c5c72"
                value={draft}
                onChangeText={setDraft}
                multiline
                editable={!isSending}
                textAlignVertical="top"
                blurOnSubmit={false}
                onFocus={scrollToLatest}
                onSubmitEditing={() => {
                  void handleSend();
                }}
              />
            </View>
            <Pressable
              className={`h-12 min-w-[76px] items-center justify-center rounded-2xl px-4 ${
                canSend ? 'bg-accent active:bg-accent-dark' : 'bg-forge-800 opacity-45'
              }`}
              disabled={!canSend}
              onPress={() => {
                void handleSend();
              }}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              {isSending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-sm font-bold text-white">Ask</Text>
              )}
            </Pressable>
          </View>
        </View>
      }
    >
      <View className="gap-5 pb-3 pt-1">
        <View className="flex-row items-center gap-3.5">
          <View className="h-12 w-12 items-center justify-center rounded-2xl border border-accent/40 bg-accent/15">
            <Text className="text-base font-black text-accent">AI</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
              Forge AI Coach
            </Text>
            <Text className="text-xl font-bold text-white">Training intelligence</Text>
          </View>
        </View>

        <View className="overflow-hidden rounded-2xl border border-forge-700 bg-forge-900">
          <View className="h-1 w-full bg-accent" />
          <View className="px-4 py-3">
            <Text className="text-sm leading-5 text-forge-300">
              Built around your profile — form, recovery, and programming advice when you need it.
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        className="flex-1"
        contentContainerClassName="gap-3.5 pb-4 grow justify-end"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToLatest}
        onLayout={scrollToLatest}
        ListFooterComponent={
          isSending ? (
            <View className="mt-1 items-start">
              <View className="flex-row items-center gap-2.5 overflow-hidden rounded-2xl border border-forge-700 bg-forge-900 px-4 py-3">
                <View className="h-2 w-2 rounded-full bg-accent" />
                <ActivityIndicator color="#ff6b35" />
                <Text className="text-sm font-medium text-forge-300">Coach is analyzing...</Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isUser = item.role === 'user';

          return (
            <View className={`w-full ${isUser ? 'items-end' : 'items-start'}`}>
              {!isUser ? (
                <Text className="mb-1.5 ml-1 text-[10px] font-bold uppercase tracking-[1.5px] text-accent">
                  Forge Coach
                </Text>
              ) : null}
              <View
                className={`max-w-[86%] overflow-hidden rounded-2xl ${
                  isUser
                    ? 'rounded-br-md bg-accent'
                    : 'rounded-bl-md border border-forge-700 bg-forge-900'
                }`}
              >
                {!isUser ? <View className="h-0.5 w-full bg-accent/80" /> : null}
                <View className="px-4 py-3.5">
                  {isUser ? (
                    <Text className="mb-1 text-[10px] font-bold uppercase tracking-wide text-white/70">
                      You
                    </Text>
                  ) : null}
                  <Text className="text-base leading-6 text-white">{item.content}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </KeyboardAvoidingLayout>
  );
}
