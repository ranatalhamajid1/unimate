import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { ModalKeyboardContainer } from "@/components/ui/ModalKeyboardContainer";
import { Skeleton } from "@/components/ui/Skeleton";
import { triggerSelectionFeedback, triggerSuccessFeedback } from "@/lib/haptics";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import type { UniversityItem, UniversityListResponse } from "@/lib/types";

interface UniversityPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (university: UniversityItem | null) => void;
  selectedUniversityId?: string | null;
  defaultCountry?: string | null;
}

export function UniversityPickerModal({
  visible,
  onClose,
  onSelect,
  selectedUniversityId,
  defaultCountry,
}: UniversityPickerModalProps) {
  const { colors } = useTheme();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [country, setCountry] = useState(defaultCountry || "");
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Add custom university" sub-flow
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCountry, setCustomCountry] = useState(defaultCountry || "");
  const [customCity, setCustomCity] = useState("");
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Sync defaultCountry when modal opens
  useEffect(() => {
    if (visible) {
      if (defaultCountry && !country) {
        setCountry(defaultCountry);
      }
      if (defaultCountry && !customCountry) {
        setCustomCountry(defaultCountry);
      }
    }
  }, [visible, defaultCountry]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch universities whenever debouncedQuery or country changes
  const fetchUniversities = async () => {
    if (!visible) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (country.trim()) {
        const trimmed = country.trim();
        if (trimmed.length === 2) {
          params.set("countryCode", trimmed.toUpperCase());
        } else {
          params.set("country", trimmed);
        }
      }
      params.set("limit", "30");

      const res = await apiClient.get<UniversityListResponse>(
        `/api/universities?${params.toString()}`
      );
      if (res && res.universities) {
        setUniversities(res.universities);
      } else {
        setUniversities([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load universities. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchUniversities();
    }
  }, [visible, debouncedQuery, country]);

  const handleOpenAddCustom = (prefillName?: string) => {
    setCustomName(prefillName || query.trim());
    setCustomCountry(country.trim() || defaultCountry || "");
    setCustomCity("");
    setCustomError(null);
    setIsAddingCustom(true);
  };

  const handleCreateCustom = async () => {
    if (!customName.trim() || customName.trim().length < 3) {
      setCustomError("University name must be at least 3 characters.");
      return;
    }
    if (!customCountry.trim() || customCountry.trim().length < 2) {
      setCustomError("Please provide a valid country.");
      return;
    }

    setIsSubmittingCustom(true);
    setCustomError(null);

    try {
      const res = await apiClient.post<{
        success: boolean;
        university: UniversityItem;
        error?: string;
      }>("/api/universities", {
        name: customName.trim(),
        country: customCountry.trim(),
        city: customCity.trim() || undefined,
      });

      if (res.success && res.university) {
        triggerSuccessFeedback();
        onSelect(res.university);
        setIsAddingCustom(false);
        onClose();
      } else {
        setCustomError(res.error || "Failed to add university.");
      }
    } catch (err: any) {
      // If duplicate 409 with existing university returned, select it!
      if (err?.status === 409 && err?.errors?.university) {
        triggerSelectionFeedback();
        onSelect(err.errors.university);
        setIsAddingCustom(false);
        onClose();
        return;
      }
      setCustomError(err?.message || "Failed to add university. Please check details.");
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  const handleSelect = (uni: UniversityItem) => {
    triggerSelectionFeedback();
    onSelect(uni);
    onClose();
  };

  const handleClearSelection = () => {
    triggerSelectionFeedback();
    onSelect(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <ModalKeyboardContainer>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <AppText variant="h3" style={{ color: colors.textPrimary }}>
              {isAddingCustom ? "Add University" : "Select University"}
            </AppText>
            <AppText variant="caption" style={{ color: colors.textTertiary, marginTop: 2 }}>
              {isAddingCustom
                ? "Can't find yours? Add it to the directory"
                : "Search accredited & community institutions"}
            </AppText>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (isAddingCustom) {
                setIsAddingCustom(false);
              } else {
                onClose();
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceTertiary }]}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isAddingCustom ? (
          /* Custom University Form */
          <View style={styles.addForm}>
            <FormInput
              label="University Name *"
              value={customName}
              onChangeText={setCustomName}
              placeholder="e.g. Stanford University"
              autoFocus
            />

            <FormInput
              label="Country *"
              value={customCountry}
              onChangeText={setCustomCountry}
              placeholder="e.g. United States"
            />

            <FormInput
              label="City (optional)"
              value={customCity}
              onChangeText={setCustomCity}
              placeholder="e.g. Stanford"
            />

            {customError ? (
              <View style={[styles.errorBox, { backgroundColor: colors.destructiveSubtle }]}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <AppText variant="caption" style={{ color: colors.danger, marginLeft: 6, flex: 1 }}>
                  {customError}
                </AppText>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Back to Search"
                  variant="outline"
                  onPress={() => setIsAddingCustom(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Add & Select"
                  variant="primary"
                  onPress={handleCreateCustom}
                  loading={isSubmittingCustom}
                />
              </View>
            </View>
          </View>
        ) : (
          /* Search & List Mode */
          <View style={{ flex: 1 }}>
            {/* Search Input Bar */}
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name, acronym, or city..."
                placeholderTextColor={colors.textTertiary}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {query.length > 0 ? (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Clear selection option if selected */}
            {selectedUniversityId ? (
              <TouchableOpacity
                onPress={handleClearSelection}
                style={[styles.clearBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="close" size={14} color={colors.danger} />
                <AppText variant="caption" style={{ color: colors.danger, marginLeft: 4, fontWeight: "600" }}>
                  Clear Selected University
                </AppText>
              </TouchableOpacity>
            ) : null}

            {/* List States */}
            {isLoading ? (
              <View style={{ paddingVertical: spacing.sm }}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={{ paddingVertical: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
                    <Skeleton width="65%" height={15} borderRadius={4} />
                    <Skeleton width="35%" height={11} borderRadius={4} />
                  </View>
                ))}
              </View>
            ) : error ? (
              <View style={styles.centerBox}>
                <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
                <AppText variant="body" style={{ color: colors.textPrimary, marginTop: spacing.xs, textAlign: "center" }}>
                  {error}
                </AppText>
                <View style={{ marginTop: spacing.md, width: 140 }}>
                  <Button title="Retry" variant="outline" size="sm" onPress={fetchUniversities} />
                </View>
              </View>
            ) : universities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="school-outline" size={36} color={colors.textTertiary} />
                <AppText variant="body" style={{ color: colors.textPrimary, marginTop: spacing.xs, fontWeight: "600" }}>
                  No universities found
                </AppText>
                <AppText variant="caption" style={{ color: colors.textTertiary, textAlign: "center", marginTop: 4 }}>
                  {query.trim()
                    ? `No matching results for "${query.trim()}".`
                    : "Try searching by university name, short code, or city."}
                </AppText>

                {/* Add Custom University Trigger */}
                <TouchableOpacity
                  onPress={() => handleOpenAddCustom(query.trim())}
                  style={[styles.addCustomBtn, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}
                >
                  <Ionicons name="add-circle" size={18} color={colors.accent} />
                  <AppText variant="caption" style={{ color: colors.accent, marginLeft: 6, fontWeight: "700" }}>
                    Can&apos;t find yours? Add &quot;{query.trim() || "University"}&quot;
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ maxHeight: 380 }}>
                <FlatList
                  data={universities}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  renderItem={({ item }) => {
                    const isSelected = selectedUniversityId === item.id;
                    return (
                      <TouchableOpacity
                        onPress={() => handleSelect(item)}
                        style={[
                          styles.uniRow,
                          { borderBottomColor: colors.borderSubtle },
                          isSelected && { backgroundColor: colors.accentSubtle },
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: spacing.sm }}>
                          <View style={styles.titleRow}>
                            <AppText
                              variant="body"
                              style={[
                                styles.uniName,
                                { color: colors.textPrimary },
                                isSelected && { color: colors.accent, fontWeight: "700" },
                              ]}
                              numberOfLines={1}
                            >
                              {item.name}
                            </AppText>
                            {item.shortName ? (
                              <View
                                style={[
                                  styles.acronymBadge,
                                  { backgroundColor: colors.surfaceTertiary },
                                ]}
                              >
                                <AppText
                                  variant="caption"
                                  style={{ color: colors.textSecondary, fontSize: 10, fontWeight: "700" }}
                                >
                                  {item.shortName}
                                </AppText>
                              </View>
                            ) : null}
                          </View>

                          <View style={styles.metaRow}>
                            <AppText variant="caption" style={{ color: colors.textSecondary }}>
                              {[item.city, item.country].filter(Boolean).join(", ")}
                            </AppText>

                            {/* Badge */}
                            <View
                              style={[
                                styles.badge,
                                item.isVerified
                                  ? { backgroundColor: colors.successSubtle }
                                  : { backgroundColor: colors.surfaceTertiary },
                              ]}
                            >
                              <Ionicons
                                name={item.isVerified ? "checkmark-circle" : "people-outline"}
                                size={11}
                                color={item.isVerified ? colors.success : colors.textTertiary}
                              />
                              <AppText
                                variant="caption"
                                style={[
                                  styles.badgeText,
                                  item.isVerified
                                    ? { color: colors.success }
                                    : { color: colors.textTertiary },
                                ]}
                              >
                                {item.isVerified ? "Verified" : "Community"}
                              </AppText>
                            </View>
                          </View>
                        </View>

                        {isSelected ? (
                          <Ionicons name="checkmark" size={20} color={colors.accent} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  }}
                  ListFooterComponent={
                    <TouchableOpacity
                      onPress={() => handleOpenAddCustom(query.trim())}
                      style={[styles.listFooterAdd, { borderColor: colors.border }]}
                    >
                      <Ionicons name="add" size={16} color={colors.accent} />
                      <AppText variant="caption" style={{ color: colors.accent, marginLeft: 4, fontWeight: "600" }}>
                        Can&apos;t find your university? Add it here
                      </AppText>
                    </TouchableOpacity>
                  }
                />
              </View>
            )}
          </View>
        )}
      </ModalKeyboardContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    height: 42,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.xs,
    fontSize: 14,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: spacing.xs,
  },
  centerBox: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  addCustomBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: spacing.md,
  },
  uniRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  uniName: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  acronymBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  listFooterAdd: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  addForm: {
    paddingTop: spacing.xs,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
