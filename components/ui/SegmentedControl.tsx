import React from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { AppText } from "./AppText";
import { useTheme } from "../../hooks/use-theme";
import { spacing } from "../../constants/spacing";

interface Option<T> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T> {
  options: Option<T>[];
  selectedValue?: T;
  value?: T;
  onSelect?: (value: T) => void;
  onChange?: (value: T) => void;
  scrollable?: boolean;
}

export function SegmentedControl<T extends string | number>({
  options,
  selectedValue,
  value,
  onSelect,
  onChange,
  scrollable = false,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const currentVal = (value !== undefined ? value : selectedValue) as T;
  const handleChange = onChange || onSelect || (() => {});

  const content = options.map((opt) => {
    const isSelected = opt.value === currentVal;
    return (
      <TouchableOpacity
        key={String(opt.value)}
        onPress={() => handleChange(opt.value)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        style={[
          styles.item,
          scrollable && styles.scrollableItem,
          isSelected && {
            backgroundColor: colors.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: 2,
          },
        ]}
      >
        <AppText
          variant="bodySmall"
          style={{
            fontWeight: isSelected ? "700" : "500",
            color: isSelected ? colors.primary : colors.textSecondary,
          }}
        >
          {opt.label}
        </AppText>
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.container, { backgroundColor: colors.surfaceHover }]}
        style={styles.scrollWrapper}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceHover }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollWrapper: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  container: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  item: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    minHeight: 38,
  },
  scrollableItem: {
    flex: undefined,
    paddingHorizontal: spacing.md,
  },
});
