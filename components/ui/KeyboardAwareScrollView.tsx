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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const lastFocusedRef = useRef<React.RefObject<any> | null>(null);

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

      // Small delay to allow keyboard animation / layout measurement to settle
      setTimeout(() => {
        if (!inputRef.current?.measureInWindow) return;

        inputRef.current.measureInWindow(
          (x: number, y: number, width: number, height: number) => {
            if (typeof y !== "number") return;

            const windowHeight = Dimensions.get("window").height;
            // On Android with resize, windowHeight shrinks, so keyboardTop is the visible bottom
            const effectiveKeyboardTop =
              Platform.OS === "android"
                ? windowHeight
                : windowHeight - keyboardHeight;

            const inputBottom = y + height + extraOffset;
            const diff = inputBottom - effectiveKeyboardTop;

            if (diff > 0) {
              // Input is hidden or too close to the keyboard: scroll down
              scrollRef.current?.scrollTo({
                y: scrollYRef.current + diff,
                animated: true,
              });
            } else if (y < 60) {
              // Input is scrolled too far above top / under header
              scrollRef.current?.scrollTo({
                y: Math.max(0, scrollYRef.current + y - 60),
                animated: true,
              });
            }
          }
        );
      }, Platform.OS === "ios" ? 100 : 150);
    },
    [extraScrollHeight, keyboardHeight, scrollRef]
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setIsKeyboardVisible(true);
      const kh = e.endCoordinates?.height || 0;
      setKeyboardHeight(kh);

      // If an input was already focused when keyboard opened, ensure it is scrolled into view
      if (lastFocusedRef.current) {
        scrollToFocusedInput(lastFocusedRef.current);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      lastFocusedRef.current = null;
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToFocusedInput]);

  // Flatten contentContainerStyle to check and override justifyContent when keyboard is open
  const flattenedStyle = StyleSheet.flatten(contentContainerStyle) || {};
  const adjustedContentContainerStyle: ViewStyle = {
    ...flattenedStyle,
    // When keyboard is open, change justifyContent from 'center' to 'flex-start'
    // to prevent centering from clipping the top of the form and pushing bottom fields off-screen
    ...(isKeyboardVisible && flattenedStyle.justifyContent === "center"
      ? { justifyContent: "flex-start" }
      : {}),
    // Provide comfortable bottom spacing when keyboard is open so bottom-most fields can be scrolled up
    ...(isKeyboardVisible
      ? {
          paddingBottom: Math.max(
            typeof flattenedStyle.paddingBottom === "number"
              ? flattenedStyle.paddingBottom
              : 0,
            Platform.OS === "ios" ? 40 : 50
          ),
        }
      : {}),
  };

  return (
    <KeyboardAwareContext.Provider
      value={{ isKeyboardVisible, keyboardHeight, scrollToFocusedInput }}
    >
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
