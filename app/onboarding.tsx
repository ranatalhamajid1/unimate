import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { Card } from "@/components/ui/Card";
import { UniversityPickerModal } from "@/components/UniversityPickerModal";
import { AvatarPicker } from "@/components/AvatarPicker";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { triggerSelectionFeedback, triggerSuccessFeedback } from "@/lib/haptics";
import { spacing } from "@/constants/spacing";
import type { UniversityItem } from "@/lib/types";

const GOAL_PRESETS = [
  "Ace my GPA (3.8+)",
  "Master technical skills",
  "Balance study & life",
  "Prepare for graduate school",
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Academic Identity
  const [country, setCountry] = useState(user?.country || "");
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityItem | null>(null);
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [isUniModalVisible, setIsUniModalVisible] = useState(false);

  // Step 2: Degree & Timeline
  const [degreeProgram, setDegreeProgram] = useState(user?.degreeProgram || "");
  const [currentSemester, setCurrentSemester] = useState(user?.currentSemester || "");
  const [graduationYear, setGraduationYear] = useState(
    user?.graduationYear ? String(user.graduationYear) : "2027"
  );

  // Step 3: Personal Identity
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null);
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [primaryGoal, setPrimaryGoal] = useState("Ace my GPA (3.8+)");

  // Flow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-seed university affiliation if user already has one
  useEffect(() => {
    if (user?.university && !selectedUniversity) {
      setSelectedUniversity({
        id: user.university.id,
        name: user.university.name,
        shortName: user.university.shortName,
        country: user.university.country,
        isVerified: user.university.isVerified,
      });
      if (user.country && !country) setCountry(user.country);
    }
    if (user?.username && !username) setUsername(user.username);
    if (user?.bio && !bio) setBio(user.bio);
    if (user?.avatarUrl && !avatarUrl) setAvatarUrl(user.avatarUrl);
  }, [user]);

  // Validation per step
  const handleNextFromStep1 = () => {
    setErrorMessage(null);
    if (!selectedUniversity) {
      setErrorMessage("Please select your university to continue.");
      return;
    }
    if (!country.trim()) {
      setErrorMessage("Please enter your country.");
      return;
    }
    triggerSelectionFeedback();
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setErrorMessage(null);
    if (!degreeProgram.trim()) {
      setErrorMessage("Please enter your degree program (e.g. Computer Science).");
      return;
    }
    if (!currentSemester.trim()) {
      setErrorMessage("Please enter your current semester (e.g. Semester 3).");
      return;
    }
    const gradYearNum = parseInt(graduationYear.trim(), 10);
    if (isNaN(gradYearNum) || gradYearNum < 2000 || gradYearNum > 2100) {
      setErrorMessage("Please enter a valid graduation year (e.g. 2027).");
      return;
    }
    triggerSelectionFeedback();
    setStep(3);
  };

  const handleCompleteOnboarding = async () => {
    setErrorMessage(null);

    // Validate username if provided
    if (username.trim()) {
      const cleanUser = username.trim().toLowerCase();
      if (cleanUser.length < 3 || cleanUser.length > 30) {
        setErrorMessage("Username must be between 3 and 30 characters.");
        return;
      }
      if (!/^[a-z0-9_]+$/.test(cleanUser)) {
        setErrorMessage("Username may only contain lowercase letters, numbers, and underscores.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        universityId: selectedUniversity?.id,
        country: country.trim(),
        campusId: selectedCampusId || undefined,
        departmentId: selectedDepartmentId || undefined,
        degreeProgram: degreeProgram.trim(),
        currentSemester: currentSemester.trim(),
        graduationYear: parseInt(graduationYear.trim(), 10),
        bio: bio.trim() || undefined,
        primaryGoal: primaryGoal || undefined,
      };

      if (username.trim()) {
        payload.username = username.trim().toLowerCase();
      }

      const res = await apiClient.post<{ success: boolean; error?: string }>(
        "/api/mobile/user/onboarding",
        payload
      );

      if (res && res.success) {
        triggerSuccessFeedback();
        await refreshUser();
        router.replace("/(tabs)");
      } else {
        setErrorMessage(res?.error || "Failed to complete onboarding.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen scrollable>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.stepBadge}>
          <AppText variant="caption" style={{ color: colors.accent, fontWeight: "700" }}>
            STEP {step} OF 3
          </AppText>
        </View>
        <AppText variant="h2" style={{ color: colors.textPrimary, marginTop: 6 }}>
          {step === 1 && "Academic Identity"}
          {step === 2 && "Degree & Timeline"}
          {step === 3 && "Personal Identity"}
        </AppText>
        <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
          {step === 1 && "Connect your accredited or community university institution"}
          {step === 2 && "Help UniMate organize your courses, schedule, and semesters"}
          {step === 3 && "Customize your avatar, unique handle, and study goals"}
        </AppText>

        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
          <View
            style={[
              styles.progressBar,
              {
                width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
                backgroundColor: colors.accent,
              },
            ]}
          />
        </View>
      </View>

      {/* Error Alert */}
      {errorMessage ? (
        <View style={[styles.errorContainer, { backgroundColor: colors.destructiveSubtle }]}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <AppText variant="caption" style={{ color: colors.danger, marginLeft: 8, flex: 1 }}>
            {errorMessage}
          </AppText>
        </View>
      ) : null}

      {/* STEP 1: Academic Identity */}
      {step === 1 && (
        <View style={styles.stepContent}>
          <FormInput
            label="Country *"
            value={country}
            onChangeText={(text) => {
              setCountry(text);
              if (selectedUniversity) {
                const code = selectedUniversity.countryCode?.toLowerCase();
                const name = selectedUniversity.country?.toLowerCase();
                const norm = text.trim().toLowerCase();
                if (code !== norm && name !== norm) {
                  setSelectedUniversity(null);
                  setSelectedCampusId(null);
                  setSelectedDepartmentId(null);
                }
              }
            }}
            placeholder="e.g. United States, United Kingdom, Pakistan"
          />

          {/* University Selector Card */}
          <View style={styles.fieldGroup}>
            <AppText variant="caption" style={{ color: colors.textSecondary, marginBottom: 6, fontWeight: "600" }}>
              UNIVERSITY / INSTITUTION *
            </AppText>

            {selectedUniversity ? (
              <Card style={[styles.selectedUniCard, { borderColor: colors.accent }]}>
                <View style={styles.selectedUniContent}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.uniTitleRow}>
                      <AppText variant="body" style={{ color: colors.textPrimary, fontWeight: "700" }}>
                        {selectedUniversity.name}
                      </AppText>
                      {selectedUniversity.shortName ? (
                        <View style={[styles.shortNamePill, { backgroundColor: colors.surfaceTertiary }]}>
                          <AppText variant="caption" style={{ color: colors.textSecondary, fontSize: 10, fontWeight: "700" }}>
                            {selectedUniversity.shortName}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                      {[selectedUniversity.city, selectedUniversity.country].filter(Boolean).join(", ")}
                    </AppText>

                    <View style={[styles.verifiedPill, { backgroundColor: selectedUniversity.isVerified ? colors.successSubtle : colors.surfaceTertiary }]}>
                      <Ionicons
                        name={selectedUniversity.isVerified ? "checkmark-circle" : "people-outline"}
                        size={12}
                        color={selectedUniversity.isVerified ? colors.success : colors.textTertiary}
                      />
                      <AppText
                        variant="caption"
                        style={{
                          fontSize: 10,
                          fontWeight: "600",
                          color: selectedUniversity.isVerified ? colors.success : colors.textTertiary,
                          marginLeft: 3,
                        }}
                      >
                        {selectedUniversity.isVerified ? "Verified Institution" : "Community University"}
                      </AppText>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsUniModalVisible(true)}
                    style={[styles.changeBtn, { backgroundColor: colors.surfaceTertiary }]}
                  >
                    <AppText variant="caption" style={{ color: colors.accent, fontWeight: "600" }}>
                      Change
                    </AppText>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : (
              <TouchableOpacity
                onPress={() => setIsUniModalVisible(true)}
                activeOpacity={0.7}
                style={[
                  styles.selectUniButton,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="school-outline" size={20} color={colors.accent} />
                <AppText variant="body" style={{ color: colors.textTertiary, marginLeft: 8, flex: 1 }}>
                  Tap to search and select university...
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Campus selection if university has campuses */}
          {selectedUniversity?.campuses && selectedUniversity.campuses.length > 0 ? (
            <View style={styles.fieldGroup}>
              <AppText variant="caption" style={{ color: colors.textSecondary, marginBottom: 6, fontWeight: "600" }}>
                CAMPUS (OPTIONAL)
              </AppText>
              <View style={styles.pillRow}>
                {selectedUniversity.campuses.map((c) => {
                  const isSelected = selectedCampusId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCampusId(isSelected ? null : c.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.surfaceSecondary,
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        style={{
                          color: isSelected ? "#fff" : colors.textSecondary,
                          fontWeight: isSelected ? "700" : "500",
                        }}
                      >
                        {c.name} {c.isMain ? "(Main)" : ""}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Department selection if university has departments */}
          {selectedUniversity?.departments && selectedUniversity.departments.length > 0 ? (
            <View style={styles.fieldGroup}>
              <AppText variant="caption" style={{ color: colors.textSecondary, marginBottom: 6, fontWeight: "600" }}>
                DEPARTMENT / FACULTY (OPTIONAL)
              </AppText>
              <View style={styles.pillRow}>
                {selectedUniversity.departments.map((d) => {
                  const isSelected = selectedDepartmentId === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => setSelectedDepartmentId(isSelected ? null : d.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.surfaceSecondary,
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        style={{
                          color: isSelected ? "#fff" : colors.textSecondary,
                          fontWeight: isSelected ? "700" : "500",
                        }}
                      >
                        {d.name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Step 1 Actions */}
          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}>
              <Button
                title="Next: Degree & Timeline"
                variant="primary"
                onPress={handleNextFromStep1}
              />
            </View>
          </View>
        </View>
      )}

      {/* STEP 2: Degree & Timeline */}
      {step === 2 && (
        <View style={styles.stepContent}>
          <FormInput
            label="Degree Program *"
            value={degreeProgram}
            onChangeText={setDegreeProgram}
            placeholder="e.g. B.S. Computer Science, Mechanical Eng"
          />

          <FormInput
            label="Current Semester / Year *"
            value={currentSemester}
            onChangeText={setCurrentSemester}
            placeholder="e.g. Semester 3, Year 2, Spring 2026"
          />

          <FormInput
            label="Expected Graduation Year *"
            value={graduationYear}
            onChangeText={setGraduationYear}
            placeholder="e.g. 2027"
            keyboardType="number-pad"
          />

          {/* Step 2 Actions */}
          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}>
              <Button
                title="Back"
                variant="outline"
                onPress={() => {
                  setErrorMessage(null);
                  setStep(1);
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Next: Personal Identity"
                variant="primary"
                onPress={handleNextFromStep2}
              />
            </View>
          </View>
        </View>
      )}

      {/* STEP 3: Personal Identity */}
      {step === 3 && (
        <View style={styles.stepContent}>
          {/* Avatar Upload */}
          <View style={styles.avatarSection}>
            <AvatarPicker
              avatarUrl={avatarUrl}
              name={user?.name || "Student"}
              size={96}
              onAvatarChange={(newUrl) => setAvatarUrl(newUrl)}
            />
            <AppText variant="caption" style={{ color: colors.textTertiary, marginTop: 8 }}>
              Tap photo to upload or take a new avatar
            </AppText>
          </View>

          <FormInput
            label="Username / @handle"
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. alex_student"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <FormInput
            label="Bio (optional)"
            value={bio}
            onChangeText={setBio}
            placeholder="A brief sentence about your academic goals..."
            multiline
            numberOfLines={3}
          />

          {/* Primary Study Goal Presets */}
          <View style={styles.fieldGroup}>
            <AppText variant="caption" style={{ color: colors.textSecondary, marginBottom: 6, fontWeight: "600" }}>
              PRIMARY STUDY GOAL
            </AppText>
            <View style={styles.pillRow}>
              {GOAL_PRESETS.map((g) => {
                const isSelected = primaryGoal === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setPrimaryGoal(g)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.surfaceSecondary,
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: isSelected ? "#fff" : colors.textSecondary,
                        fontWeight: isSelected ? "700" : "500",
                      }}
                    >
                      {g}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Privacy Note */}
          <View style={[styles.privacyNote, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
            <AppText variant="caption" style={{ color: colors.textSecondary, marginLeft: 6, flex: 1 }}>
              Your grades, GPA, attendance, exam scores, and expenses are always 100% private.
            </AppText>
          </View>

          {/* Step 3 Actions */}
          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}>
              <Button
                title="Back"
                variant="outline"
                onPress={() => {
                  setErrorMessage(null);
                  setStep(2);
                }}
                disabled={isSubmitting}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Complete Setup"
                variant="primary"
                onPress={handleCompleteOnboarding}
                loading={isSubmitting}
              />
            </View>
          </View>
        </View>
      )}

      {/* University Picker Modal */}
      <UniversityPickerModal
        visible={isUniModalVisible}
        onClose={() => setIsUniModalVisible(false)}
        selectedUniversityId={selectedUniversity?.id}
        defaultCountry={country}
        onSelect={(uni) => {
          setSelectedUniversity(uni);
          if (uni?.country) {
            setCountry(uni.country);
          }
          setSelectedCampusId(null);
          setSelectedDepartmentId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    paddingVertical: spacing.md,
  },
  stepBadge: {
    alignSelf: "flex-start",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  stepContent: {
    paddingTop: spacing.xs,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  selectUniButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  selectedUniCard: {
    borderWidth: 1.5,
  },
  selectedUniContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uniTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  shortNamePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: spacing.sm,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: spacing.md,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingBottom: spacing.xl,
  },
});
