import { Pressable, Text, View } from 'react-native';

interface Option {
  value: string;
  label: string;
}

interface OptionPickerProps {
  label: string;
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function OptionPicker({ label, options, value, onChange, error }: OptionPickerProps) {
  return (
    <View>
      <Text className="text-forge-300 text-sm mb-2">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`rounded-xl px-4 py-3 border ${
                selected ? 'bg-accent border-accent' : 'bg-forge-900 border-forge-700'
              }`}
            >
              <Text className={selected ? 'text-white font-semibold' : 'text-forge-200'}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="text-red-400 text-sm mt-1">{error}</Text> : null}
    </View>
  );
}
