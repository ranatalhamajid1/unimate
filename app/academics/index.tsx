import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { StatusChip } from "@/components/ui/StatusChip";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { spacing } from "@/constants/spacing";
import type { MobileAcademicData, MobileCourseAcademicItem } from "@/lib/types";

const GRADE_LIST = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "F",
];

export default function AcademicsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // Modals
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<MobileCourseAcademicItem | null>(null);

  // Form states
  const [selectedGrade, setSelectedGrade] = useState("A");
  const [totalClasses, setTotalClasses] = useState("");
  const [attendedClasses, setAttendedClasses] = useState("");
  const [formError, setFormError] = useState("");

  const {
    data: academicData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["academics"],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; academics: MobileAcademicData }>(
        "/api/mobile/academics"
      );
      return res.academics;
    },
  });

  // Grade mutations
  const updateGradeMutation = useMutation({
    mutationFn: async ({ courseId, grade }: { courseId: string; grade: string }) => {
      return await apiClient.post<{ success: boolean }>("/api/mobile/academics/grades", { courseId, grade });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setGradeModalVisible(false);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to update grade.");
    },
  });

  const deleteGradeMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiClient.delete<{ success: boolean }>(`/api/mobile/academics/grades/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setGradeModalVisible(false);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to remove grade.");
    },
  });

  // Attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({
      courseId,
      total,
      attended,
    }: {
      courseId: string;
      total: number;
      attended: number;
    }) => {
      return await apiClient.post<{ success: boolean }>("/api/mobile/academics/attendance", {
        courseId,
        totalClasses: total,
        attendedClasses: attended,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setAttendanceModalVisible(false);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to update attendance.");
    },
  });

  const openGradeModal = (item: MobileCourseAcademicItem) => {
    setSelectedCourse(item);
    setSelectedGrade(item.grade || "A");
    setFormError("");
    setGradeModalVisible(true);
  };

  const openAttendanceModal = (item: MobileCourseAcademicItem) => {
    setSelectedCourse(item);
    setTotalClasses(String(item.totalClasses || 0));
    setAttendedClasses(String(item.attendedClasses || 0));
    setFormError("");
    setAttendanceModalVisible(true);
  };

  const handleSaveGrade = () => {
    if (!selectedCourse) return;
    updateGradeMutation.mutate({ courseId: selectedCourse.courseId, grade: selectedGrade });
  };

  const handleSaveAttendance = () => {
    if (!selectedCourse) return;
    const tot = Number(totalClasses);
    const att = Number(attendedClasses);
    if (isNaN(tot) || tot < 0 || !Number.isInteger(tot)) {
      setFormError("Total classes must be a positive integer.");
      return;
    }
    if (isNaN(att) || att < 0 || !Number.isInteger(att)) {
      setFormError("Attended classes must be a positive integer.");
      return;
    }
    if (att > tot) {
      setFormError("Attended classes cannot exceed total classes.");
      return;
    }

    updateAttendanceMutation.mutate({
      courseId: selectedCourse.courseId,
      total: tot,
      attended: att,
    });
  };

  if (isLoading && !isRefetching) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Academics", headerBackTitle: "More" }} />
        <LoadingState message="Loading academic standing..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Academics", headerBackTitle: "More" }} />
        <ErrorState message="Failed to load academic records." onRetry={() => refetch()} />
      </Screen>
    );
  }

  const courses = academicData?.courses || [];

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ title: "Academics", headerBackTitle: "More" }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <AppText variant="h2">Academic Standing</AppText>
          <AppText colorRole="secondary" variant="caption">
            GPA calculation & attendance tracking
          </AppText>
        </View>

        {/* Overview Stats (2 cards) */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="trophy-outline" size={20} color={colors.primary} />
            </View>
            <AppText variant="h2" style={styles.statValue}>
              {academicData?.gpaString || "—"}
            </AppText>
            <AppText variant="caption" colorRole="secondary">
              {academicData?.gpaSub || "Cumulative GPA"}
            </AppText>
            <AppText variant="caption" style={{ color: colors.textTertiary, marginTop: 2 }}>
              {academicData?.gradedCredits || 0} / {academicData?.totalCredits || 0} Graded Credits
            </AppText>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="school-outline" size={20} color={colors.success} />
            </View>
            <AppText variant="h2" style={styles.statValue}>
              {academicData?.attendanceString || "—"}
            </AppText>
            <AppText variant="caption" colorRole="secondary">
              {academicData?.attendanceSub || "Overall Attendance"}
            </AppText>
            <StatusChip
              label={academicData?.attendanceStatus || "Standing"}
              variant={
                (academicData?.overallAttendance ?? 0) >= 80
                  ? "success"
                  : (academicData?.overallAttendance ?? 0) >= 75
                  ? "warning"
                  : "danger"
              }
              size="sm"
            />
          </Card>
        </View>

        {/* Course Performance List */}
        <AppText variant="h3" style={styles.sectionTitle}>
          Course Performance ({courses.length})
        </AppText>

        {courses.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="school-outline" size={48} color={colors.accent} />}
            title="No academic records"
            description="Add your enrolled courses to start tracking grades and lecture attendance."
          />
        ) : (
          courses.map((item: MobileCourseAcademicItem) => (
            <Card key={item.courseId} style={styles.courseCard}>
              <View style={styles.courseTop}>
                <View style={styles.codeRow}>
                  <View style={[styles.dot, { backgroundColor: item.color || colors.primary }]} />
                  <AppText variant="h3">{item.courseName}</AppText>
                </View>
                <AppText variant="caption" colorRole="secondary">
                  {item.creditHours} Credits
                </AppText>
              </View>

              <AppText variant="caption" colorRole="secondary" style={styles.codeSubtitle}>
                {item.courseCode} {item.semester ? `• ${item.semester}` : ""}
              </AppText>

              {/* Grade & Attendance Split */}
              <View style={styles.metricsRow}>
                {/* Grade Section */}
                <TouchableOpacity
                  onPress={() => openGradeModal(item)}
                  style={[styles.metricBox, { backgroundColor: colors.surfaceHover }]}
                  activeOpacity={0.7}
                  accessibilityLabel="Edit course grade"
                >
                  <View style={styles.boxHeader}>
                    <AppText variant="caption" colorRole="secondary">
                      Grade
                    </AppText>
                    <Ionicons name="create-outline" size={14} color={colors.textSecondary} />
                  </View>
                  <AppText variant="h3" style={{ color: item.grade ? colors.primary : colors.textTertiary }}>
                    {item.grade ? `${item.grade} (${item.gradePoints?.toFixed(2)})` : "Not graded"}
                  </AppText>
                </TouchableOpacity>

                {/* Attendance Section */}
                <TouchableOpacity
                  onPress={() => openAttendanceModal(item)}
                  style={[styles.metricBox, { backgroundColor: colors.surfaceHover }]}
                  activeOpacity={0.7}
                  accessibilityLabel="Edit course attendance"
                >
                  <View style={styles.boxHeader}>
                    <AppText variant="caption" colorRole="secondary">
                      Attendance
                    </AppText>
                    <Ionicons name="create-outline" size={14} color={colors.textSecondary} />
                  </View>
                  <View style={styles.attValueRow}>
                    <AppText variant="h3">
                      {item.attendancePercentage !== null
                        ? `${item.attendancePercentage}%`
                        : "No record"}
                    </AppText>
                    {item.totalClasses > 0 ? (
                      <AppText variant="caption" colorRole="secondary">
                        ({item.attendedClasses}/{item.totalClasses})
                      </AppText>
                    ) : null}
                  </View>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Grade Modal */}
      <Modal
        visible={gradeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">Record Grade: {selectedCourse?.courseCode}</AppText>
              <TouchableOpacity onPress={() => setGradeModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {formError ? (
              <AppText variant="caption" style={{ color: colors.danger, marginBottom: spacing.sm }}>
                {formError}
              </AppText>
            ) : null}

            <AppText variant="caption" colorRole="secondary" style={{ marginBottom: spacing.md }}>
              Select your letter grade (4.0 scale):
            </AppText>

            <View style={styles.gradeGrid}>
              {GRADE_LIST.map((g) => {
                const isSelected = selectedGrade === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setSelectedGrade(g)}
                    style={[
                      styles.gradeCell,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceHover,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <AppText
                      variant="bodySmall"
                      style={{ color: isSelected ? "#fff" : colors.textPrimary, fontWeight: "700" }}
                    >
                      {g}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              {selectedCourse?.grade ? (
                <View style={{ flex: 1 }}>
                  <Button
                    title="Remove"
                    variant="danger"
                    onPress={() =>
                      selectedCourse && deleteGradeMutation.mutate(selectedCourse.courseId)
                    }
                    loading={deleteGradeMutation.isPending}
                  />
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => setGradeModalVisible(false)}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Button
                  title="Save Grade"
                  variant="primary"
                  onPress={handleSaveGrade}
                  loading={updateGradeMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        visible={attendanceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAttendanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">Update Attendance: {selectedCourse?.courseCode}</AppText>
              <TouchableOpacity onPress={() => setAttendanceModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {formError ? (
              <AppText variant="caption" style={{ color: colors.danger, marginBottom: spacing.sm }}>
                {formError}
              </AppText>
            ) : null}

            <AppText variant="caption" colorRole="secondary" style={{ marginBottom: spacing.md }}>
              Record total lectures conducted and how many you attended:
            </AppText>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Total Classes"
                  value={totalClasses}
                  onChangeText={setTotalClasses}
                  placeholder="e.g. 24"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Attended Classes"
                  value={attendedClasses}
                  onChangeText={setAttendedClasses}
                  placeholder="e.g. 21"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setAttendanceModalVisible(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Save Attendance"
                  variant="primary"
                  onPress={handleSaveAttendance}
                  loading={updateAttendanceMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
  },
  statIconWrapper: {
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 2,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  courseCard: {
    marginBottom: spacing.md,
  },
  courseTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  codeSubtitle: {
    marginTop: 2,
    marginBottom: spacing.md,
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metricBox: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 8,
  },
  boxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  attValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  gradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  gradeCell: {
    width: "22%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
