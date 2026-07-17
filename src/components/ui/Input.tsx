import { Text, TextInput, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <>
      {label ? <Text className="text-forge-300 text-sm mb-2">{label}</Text> : null}
      <TextInput
        className={`bg-forge-900 border border-forge-700 rounded-xl px-4 py-3 text-white text-base ${error ? 'border-red-500' : ''} ${className}`}
        placeholderTextColor="#7a7a8f"
        {...props}
      />
      {error ? <Text className="text-red-400 text-sm mt-1">{error}</Text> : null}
    </>
  );
}
