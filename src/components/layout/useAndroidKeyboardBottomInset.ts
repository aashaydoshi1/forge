import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

type Options = {
  /**
   * When true, subtracts the bottom safe-area inset so padding is not double-counted
   * inside a SafeAreaView that already applies `edges` including bottom.
   */
  subtractSafeArea?: boolean;
};

/** Extra lift so inputs clear the IME suggestion/accessory strip on Android. */
const ANDROID_KEYBOARD_EXTRA_CLEARANCE = 20;

/**
 * Android IME bottom inset for edge-to-edge layouts where window resize is unreliable.
 * Always returns 0 on iOS so existing KeyboardAvoidingView behavior stays unchanged.
 */
export function useAndroidKeyboardBottomInset(options: Options = {}): number {
  const { subtractSafeArea = true } = options;
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const updateHeight = (screenY: number, reportedHeight: number) => {
      const windowHeight = Dimensions.get('window').height;
      // Prefer overlap against the visible frame — more accurate with edge-to-edge.
      const overlapFromFrame = Math.max(0, frame.y + frame.height - screenY);
      const overlapFromWindow = Math.max(0, windowHeight - screenY);
      setKeyboardHeight(Math.max(reportedHeight, overlapFromFrame, overlapFromWindow));
    };

    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      updateHeight(event.endCoordinates.screenY, event.endCoordinates.height);
    });
    const changeSub = Keyboard.addListener('keyboardDidChangeFrame', (event) => {
      // Suggestion bar / floating IME can grow after the initial show event.
      if (event.endCoordinates.height <= 0) {
        setKeyboardHeight(0);
        return;
      }
      updateHeight(event.endCoordinates.screenY, event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      changeSub.remove();
      hideSub.remove();
    };
  }, [frame.height, frame.y]);

  if (Platform.OS !== 'android' || keyboardHeight <= 0) {
    return 0;
  }

  const safeAreaDeduction = subtractSafeArea ? insets.bottom : 0;
  return Math.max(0, keyboardHeight - safeAreaDeduction) + ANDROID_KEYBOARD_EXTRA_CLEARANCE;
}
