import { type ReactNode } from 'react';
import { View } from 'react-native';

type SkeletonBlockProps = {
  className?: string;
};

/** Muted placeholder block for Forge skeletons. */
export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return <View className={`rounded-md bg-forge-800 ${className}`} />;
}

type SkeletonCardProps = {
  className?: string;
  children: ReactNode;
};

/** Forge card shell matching loaded screens. */
export function SkeletonCard({ className = '', children }: SkeletonCardProps) {
  return (
    <View className={`rounded-xl bg-forge-900 border border-forge-700 p-4 ${className}`}>
      {children}
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View className="gap-5">
      <View className="gap-2">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-9 w-48" />
        <SkeletonBlock className="h-4 w-56" />
      </View>

      <View className="flex-row gap-3">
        <SkeletonCard className="flex-1 gap-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-9 w-14" />
        </SkeletonCard>
        <SkeletonCard className="flex-1 gap-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-9 w-14" />
        </SkeletonCard>
      </View>

      <SkeletonCard className="gap-3">
        <SkeletonBlock className="h-3 w-32" />
        <View className="flex-row gap-3">
          <View className="flex-1 gap-2">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-8 w-12" />
          </View>
          <View className="flex-1 gap-2">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-8 w-16" />
          </View>
        </View>
      </SkeletonCard>

      <SkeletonCard className="gap-3">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-12 w-full rounded-xl" />
        <SkeletonBlock className="h-12 w-full rounded-xl" />
      </SkeletonCard>

      <SkeletonCard className="gap-2">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="h-3 w-28" />
      </SkeletonCard>
    </View>
  );
}

export function WorkoutsScreenSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="gap-4">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} className="flex-row items-center gap-3">
          <SkeletonBlock className="h-5 flex-1" />
          <SkeletonBlock className="h-8 w-16 rounded-lg" />
        </SkeletonCard>
      ))}
    </View>
  );
}

export function ProgressScreenSkeleton() {
  return (
    <View className="gap-4">
      <View className="flex-row gap-3">
        <SkeletonCard className="flex-1 gap-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-9 w-14" />
        </SkeletonCard>
        <SkeletonCard className="flex-1 gap-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-9 w-14" />
        </SkeletonCard>
      </View>

      <SkeletonCard className="gap-2">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-9 w-20" />
        <SkeletonBlock className="h-3 w-full" />
      </SkeletonCard>

      <SkeletonBlock className="h-3 w-28" />

      {Array.from({ length: 3 }, (_, index) => (
        <SkeletonCard key={`pr-${index}`} className="gap-2">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-3 w-16" />
        </SkeletonCard>
      ))}

      <SkeletonBlock className="h-3 w-28" />

      {Array.from({ length: 3 }, (_, index) => (
        <SkeletonCard key={`history-${index}`} className="gap-2">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-3 w-32" />
        </SkeletonCard>
      ))}
    </View>
  );
}
