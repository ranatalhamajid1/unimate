/**
 * Reusable KeyboardAwareScrollView and context for UniMate.
 * Uses first-party React Native APIs to ensure focused inputs remain visible above the keyboard.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  ScrollView,
  ScrollViewProps,
  Keyboard,
  Platform,
  Dimensions,
  StyleSheet,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

interface KeyboardAwareContextType {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  scrollToFocusedInput: (
    inputRef: React.RefObject<any>,
    extraOffset?: number
  ) => void;
}

const KeyboardAwareContext = createContext<KeyboardAwareContextType>({
  isKeyboardVisible: false,
  keyboardHeight: 0,
  scrollToFocusedInput: () => {},
});

export const useKeyboardAware = () => useContext(KeyboardAwareContext);

export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  extraScrollHeight?: number;
}

export const KeyboardAwareScrollView = React.forwardRef<
  ScrollView,
  KeyboardAwareScrollViewProps
>(function KeyboardAwareScrollView(
  {
    children,
    style,
    contentContainerStyle,
    extraScrollHeight = 48,
    onScroll,
    ...props
  },
  forwardedRef
) {
  const innerRef = useRef<ScrollView>(null);
  const scrollRef = (forwardedRef as React.RefObject<ScrollView>) || innerRef;
  const scrollYRef = useRef(0);
  const isKeyboardVisibleRef = useRef(false);
  const keyboardHeightRef = useRef(0);
  const lastFocusedRef = useRef<React.RefObject<any> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = e.nativeEvent.contentOffset.y;
      onScroll?.(e);
    },
    [onScroll]
  );

  const scrollToFocusedInput = useCallback(
    (inputRef: React.RefObject<any>, extraOffset: number = extraScrollHeight) => {
      if (!inputRef?.current) return;
      lastFocusedRef.current = inputRef;

      // On Android, windowSoftInputMode="adjustResize" (configured via softwareKeyboardLayoutMode: "resize")
      // natively resizes the window and scrolls the focused EditText into view.
      // Calling programmatic scrollTo on Android interrupts the EditText focus pass and causes
      // the soft keyboard to immediately dismiss (regression).
      if (Platform.OS === "android") {
        return;
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Small delay to allow keyboard animation / layout measurement to settle
      scrollTimeoutRef.current = setTimeout(() => {
        if (!inputRef.current?.measureInWindow) return;

        inputRef.current.measureInWindow(
          (x: number, y: number, width: number, height: number) => {
            if (typeof y !== "number" || typeof height !== "number") return;

            const windowHeight = Dimensions.get("window").height;
            const currentKbHeight = keyboardHeightRef.current;
            const effectiveKeyboardTop = windowHeight - currentKbHeight;

            const inputBottom = y + height + extraOffset;
            const diff = inputBottom - effectiveKeyboardTop;

            if (diff > 0) {
              // Input is hidden or too close to the keyboard: scroll down
              scrollRef.current?.scrollTo({
                y: scrollYRef.current + diff,
                animated: true,
              });
            } else if (y < 60 && scrollYRef.current > 0) {
              // Input is scrolled too far above top / under header
              scrollRef.current?.scrollTo({
                y: Math.max(0, scrollYRef.current + y - 60),
                animated: true,
              });
            }
          }
        );
      }, 100);
    },
    [extraScrollHeight, scrollRef]
  );

  useEffect(() => {
    // Only subscribe to keyboard events on iOS where programmatic adjustment is needed.
    // On Android, windowSoftInputMode="adjustResize" handles layout natively.
    // Setting state or re-rendering on Android during keyboard display causes ReactScrollView
    // to call requestLayout(), which clears child focus and bounces focus between inputs.
    if (Platform.OS !== "ios") {
      return;
    }

    const showSub = Keyboard.addListener("keyboardWillShow", (e) => {
      isKeyboardVisibleRef.current = true;
      const kh = e.endCoordinates?.height || 0;
      keyboardHeightRef.current = kh;

      if (lastFocusedRef.current) {
        scrollToFocusedInput(lastFocusedRef.current);
      }
    });

    const hideSub = Keyboard.addListener("keyboardWillHide", () => {
      isKeyboardVisibleRef.current = false;
      keyboardHeightRef.current = 0;
      lastFocusedRef.current = null;
    });

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToFocusedInput]);

  // Keep contentContainerStyle structurally stable with useMemo.
  // Never flip layout properties (e.g. justifyContent) conditionally based on keyboard visibility,
  // as dynamic layout flips trigger Android clearChildFocus and immediately collapse the keyboard.
  const adjustedContentContainerStyle: ViewStyle = React.useMemo(() => {
    const flattenedStyle = StyleSheet.flatten(contentContainerStyle) || {};
    return {
      ...flattenedStyle,
      paddingBottom: Math.max(
        typeof flattenedStyle.paddingBottom === "number"
          ? flattenedStyle.paddingBottom
          : 0,
        Platform.OS === "ios" ? 40 : 48
      ),
    };
  }, [contentContainerStyle]);

  const contextValue = React.useMemo(
    () => ({
      get isKeyboardVisible() {
        return isKeyboardVisibleRef.current;
      },
      get keyboardHeight() {
        return keyboardHeightRef.current;
      },
      scrollToFocusedInput,
    }),
    [scrollToFocusedInput]
  );

  return (
    <KeyboardAwareContext.Provider value={contextValue}>
      <ScrollView
        ref={scrollRef}
        style={[styles.container, style]}
        contentContainerStyle={adjustedContentContainerStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAwareContext.Provider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
