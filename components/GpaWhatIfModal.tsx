import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ModalKeyboardContainer } from "@/components/ui/ModalKeyboardContainer";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius } from "@/constants/layout";
import { apiPost } from "@/lib/api-client";
import { triggerSelectionFeedback, triggerSuccessFeedback } from "@/lib/haptics";

const GRADE_OPTIONS = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"];

type CourseItem = {
  courseId: string;
  courseName: string;
  courseCode: string;
  creditHours: number;
  currentGrade: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  courses: CourseItem[];
  currentGpa: string | null;
  targetGpa: number | null;
  isPro: boolean;
};

export function GpaWhatIfModal({
  visible,
  onClose,
  courses,
  currentGpa,
  targetGpa,
  isPro,
}: Props) {
  const { colors, isDark } = useTheme();
  const [selectedGrades, setSelectedGrades] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectGrade = (courseId: string, grade: string) => {
    triggerSelectionFeedback();
    setSelectedGrades((prev) => ({
      ...prev,
      [courseId]: prev[courseId] === grade ? "" : grade,
    }));
  };

  const handleSimulate = async () => {
    if (Object.keys(selectedGrades).length === 0) {
      setError("Select at least one prospective grade to simulate.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const scenarios = Object.entries(selectedGrades).map(([courseId, grade]) => ({
        courseId,
        simulatedGrade: grade,
      }));

      const res = await apiPost<{ success: boolean; data: any }>(
        "/api/intelligence/gpa-simulator",
        { scenarios }
      );

      if (res.success) {
        setResult(res.data);
        triggerSuccessFeedback();
      } else {
        setError("Could not complete simulation.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to calculate simulation scenario.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedGrades({});
    setResult(null);
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <ModalKeyboardContainer
        cardStyle={styles.sheet}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Top Grabber & Header */}
        <View style={styles.header}>
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          <View style={styles.titleRow}>
            <View style={styles.titleMeta}>
              <AppText variant="h3" style={{ color: colors.textPrimary }}>
                GPA What-If Simulator
              </AppText>
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                Test prospective grade combinations
              </AppText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Close simulation sheet"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {!isPro ? (
              <View style={[styles.proGateBox, { backgroundColor: isDark ? "#1E1338" : "#F5F3FF", borderColor: colors.aiSubtle }]}>
                <Ionicons name="lock-closed" size={28} color={colors.ai} />
                <AppText variant="bodyMedium" style={{ fontWeight: "700", color: colors.textPrimary, marginTop: 8 }}>
                  UniMate Pro Feature
                </AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, textAlign: "center", marginTop: 4, lineHeight: 16 }}>
                  GPA What-If Simulation lets you model grade scenarios and project honors without touching your records.
                </AppText>
              </View>
            ) : (
              <View style={styles.formContent}>
                {/* Non-mutating disclaimer */}
                <View style={[styles.infoBanner, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
                  <AppText variant="caption" style={{ color: colors.textSecondary, flex: 1, fontSize: 11 }}>
                    Strictly read-only simulation. Your real course grades remain unchanged.
                  </AppText>
                </View>

                {/* Courses & grade selectors */}
                <View style={styles.courseList}>
                  {courses.map((c) => {
                    const currentSim = selectedGrades[c.courseId] || "";

                    return (
                      <View
                        key={c.courseId}
                        style={[styles.courseRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]}
                      >
                        <View style={styles.courseMeta}>
                          <AppText variant="bodyMedium" style={{ fontWeight: "600", color: colors.textPrimary }}>
                            {c.courseCode}
                          </AppText>
                          <AppText variant="caption" style={{ color: colors.textSecondary }}>
                            {c.courseName} ({c.creditHours} cr)
                          </AppText>
                          <AppText variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>
                            Current: {c.currentGrade || "Not graded"}
                          </AppText>
                        </View>

                        {/* Grade selection pills */}
                        <View style={styles.pillsScroll}>
                          {GRADE_OPTIONS.slice(0, 5).map((g) => (
                            <TouchableOpacity
                              key={g}
                              onPress={() => handleSelectGrade(c.courseId, g)}
                              style={[
                                styles.gradePill,
                                {
                                  backgroundColor: currentSim === g ? colors.accent : colors.surface,
                                  borderColor: currentSim === g ? colors.accent : colors.border,
                                },
                              ]}
                            >
                              <AppText
                                variant="caption"
                                style={{
                                  color: currentSim === g ? "#FFFFFF" : colors.textPrimary,
                                  fontWeight: currentSim === g ? "700" : "500",
                                  fontSize: 11,
                                }}
                              >
                                {g}
                              </AppText>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Results Section */}
                {result && (
                  <View style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <View style={styles.resultGrid}>
                      <View style={[styles.resultBox, { backgroundColor: colors.surface }]}>
                        <AppText variant="caption" style={{ color: colors.textSecondary, fontSize: 10 }}>
                          Current
                        </AppText>
                        <AppText variant="bodyMedium" style={{ fontWeight: "800", color: colors.textPrimary }}>
                          {result.currentGpaString}
                        </AppText>
                      </View>

                      <View style={[styles.resultBox, { backgroundColor: colors.accentSubtle }]}>
                        <AppText variant="caption" style={{ color: colors.accent, fontSize: 10, fontWeight: "600" }}>
                          Projected
                        </AppText>
                        <AppText variant="bodyMedium" style={{ fontWeight: "800", color: colors.accent }}>
                          {result.projectedGpaString}
                        </AppText>
                      </View>

                      <View style={[styles.resultBox, { backgroundColor: colors.surface }]}>
                        <AppText variant="caption" style={{ color: colors.textSecondary, fontSize: 10 }}>
                          Delta
                        </AppText>
                        <AppText
                          variant="bodyMedium"
                          style={{
                            fontWeight: "800",
                            color: result.delta > 0 ? colors.success : colors.textPrimary,
                          }}
                        >
                          {result.deltaString}
                        </AppText>
                      </View>
                    </View>

                    {result.targetFeasibility && (
                      <View
                        style={[
                          styles.targetBanner,
                          {
                            backgroundColor: colors.surfaceSecondary,
                            borderColor: colors.borderSubtle,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <AppText
                            variant="caption"
                            style={{
                              fontWeight: "700",
                              color:
                                result.targetFeasibility.status === "ALREADY_MET"
                                  ? colors.success
                                  : result.targetFeasibility.status === "ACHIEVABLE"
                                  ? colors.primary
                                  : result.targetFeasibility.status === "CHALLENGING"
                                  ? colors.warning
                                  : colors.destructive,
                            }}
                          >
                            Target: {result.targetFeasibility.status.replace("_", " ")}
                          </AppText>
                          <AppText
                            variant="caption"
                            style={{ color: colors.textSecondary, marginTop: 2, fontSize: 11 }}
                          >
                            {result.targetFeasibility.explanation}
                          </AppText>
                        </View>
                      </View>
                    )}

                    {result.targetGpa && (
                      <View
                        style={[
                          styles.targetBanner,
                          {
                            backgroundColor: result.targetMet ? colors.successSubtle : colors.warningSubtle,
                          },
                        ]}
                      >
                        <Ionicons
                          name={result.targetMet ? "checkmark-circle" : "alert-circle"}
                          size={16}
                          color={result.targetMet ? colors.success : colors.warning}
                        />
                        <AppText
                          variant="caption"
                          style={{
                            color: result.targetMet ? colors.success : colors.warning,
                            fontWeight: "600",
                            fontSize: 11,
                            flex: 1,
                          }}
                        >
                          {result.targetMet
                            ? `Achieves your target goal of ${result.targetGpaString}!`
                            : `Below target goal of ${result.targetGpaString}`}
                        </AppText>
                      </View>
                    )}
                  </View>
                )}

                {error && (
                  <View style={[styles.errorBanner, { backgroundColor: colors.destructiveSubtle }]}>
                    <AppText variant="caption" style={{ color: colors.destructive }}>
                      {error}
                    </AppText>
                  </View>
                )}

                {/* Simulation Action Buttons */}
                <View style={styles.actionRow}>
                  <Button
                    title="Reset"
                    variant="ghost"
                    size="md"
                    onPress={handleReset}
                    disabled={isLoading || Object.keys(selectedGrades).length === 0}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Calculate"
                    variant="primary"
                    size="md"
                    onPress={handleSimulate}
                    loading={isLoading}
                    disabled={Object.keys(selectedGrades).length === 0}
                    style={{ flex: 2 }}
                  />
                </View>
              </View>
            )}
          </ModalKeyboardContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleMeta: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  proGateBox: {
    padding: 24,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
    marginVertical: 16,
  },
  formContent: {
    gap: 12,
    paddingTop: 4,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  courseList: {
    gap: 8,
  },
  courseRow: {
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  courseMeta: {
    flex: 1,
  },
  pillsScroll: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 4,
  },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  resultCard: {
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  resultGrid: {
    flexDirection: "row",
    gap: 8,
  },
  resultBox: {
    flex: 1,
    padding: 8,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  targetBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: BorderRadius.sm,
  },
  errorBanner: {
    padding: 10,
    borderRadius: BorderRadius.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
});
