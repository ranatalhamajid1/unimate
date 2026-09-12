/**
 * Settings & Student Profile Screen for UniMate Mobile.
 * Includes complete Student Identity & University affiliation management,
 * profile completion progress, interactive theme switcher, subscription badge, and secure logout.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { AvatarPicker } from "@/components/AvatarPicker";
import { UniversityPickerModal } from "@/components/UniversityPickerModal";
import { ProfileCompletionWidget } from "@/components/ui/ProfileCompletionWidget";
import { useAuth } from "@/hooks/use-auth";
import { useTheme, ThemePreference } from "@/hooks/use-theme";
import { apiClient } from "@/lib/api-client";
import { API_BASE_URL } from "@/lib/config";
import { triggerSuccessFeedback, triggerDestructiveFeedback } from "@/lib/haptics";
import { BorderRadius, Layout } from "@/constants/layout";
import { spacing } from "@/constants/spacing";
import type { MobileProfileResponse, UniversityItem } from "@/lib/types";

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, subscription, logout, refreshUser } = useAuth();
  const { colors, themePreference, setThemePreference } = useTheme();

  // Fetch full student profile
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["mobile-profile"],
    queryFn: async () => {
      const res = await apiClient.get<MobileProfileResponse>("/api/mobile/user/profile");
      return res;
    },
  });

  const profileUser = profileData?.user || user;
  const completion = profileData?.profileCompletion;

  // Form State
  const [name, setName] = useState(profileUser?.name || "");
  const [username, setUsername] = useState(profileUser?.username || "");
  const [bio, setBio] = useState(profileUser?.bio || "");
  const [country, setCountry] = useState(profileUser?.country || "");
  const [city, setCity] = useState(profileUser?.city || "");

  // University State
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityItem | null>(null);
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [isUniModalOpen, setIsUniModalOpen] = useState(false);

  // Academic Info
  const [degreeProgram, setDegreeProgram] = useState(profileUser?.degreeProgram || "");
  const [currentSemester, setCurrentSemester] = useState(profileUser?.currentSemester || "");
  const [graduationYear, setGraduationYear] = useState(
    profileUser?.graduationYear ? String(profileUser.graduationYear) : ""
  );

  // Tags & Links
  const [skillsText, setSkillsText] = useState((profileUser?.skills || []).join(", "));
  const [interestsText, setInterestsText] = useState((profileUser?.interests || []).join(", "));
  const [languagesText, setLanguagesText] = useState((profileUser?.languages || []).join(", "));
  const [githubUrl, setGithubUrl] = useState(profileUser?.socialLinks?.github || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profileUser?.socialLinks?.linkedin || "");
  const [portfolioUrl, setPortfolioUrl] = useState(profileUser?.socialLinks?.portfolio || "");

  // Privacy Toggle
  const [isPublicProfile, setIsPublicProfile] = useState(Boolean(profileUser?.isPublicProfile));

  // Sync state when profile data arrives
  useEffect(() => {
    if (profileData?.user) {
      const u = profileData.user;
      setName(u.name || "");
      setUsername(u.username || "");
      setBio(u.bio || "");
      setCountry(u.country || "");
      setCity(u.city || "");
      setDegreeProgram(u.degreeProgram || "");
      setCurrentSemester(u.currentSemester || "");
      setGraduationYear(u.graduationYear ? String(u.graduationYear) : "");
      setSkillsText((u.skills || []).join(", "));
      setInterestsText((u.interests || []).join(", "));
      setLanguagesText((u.languages || []).join(", "));
      setGithubUrl(u.socialLinks?.github || "");
      setLinkedinUrl(u.socialLinks?.linkedin || "");
      setPortfolioUrl(u.socialLinks?.portfolio || "");
      setIsPublicProfile(Boolean(u.isPublicProfile));

      if (u.university) {
        setSelectedUniversity({
          id: u.university.id,
          name: u.university.name,
          shortName: u.university.shortName,
          country: u.university.country,
          isVerified: u.university.isVerified,
        });
      }
      if (u.campus) setSelectedCampusId(u.campus.id);
      if (u.department) setSelectedDepartmentId(u.department.id);
    }
  }, [profileData]);

  // Update Profile Mutation
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        name: name.trim(),
        username: username.trim() ? username.trim().toLowerCase() : null,
        bio: bio.trim() || null,
        country: country.trim() || null,
        city: city.trim() || null,
        degreeProgram: degreeProgram.trim() || null,
        currentSemester: currentSemester.trim() || null,
        graduationYear: graduationYear.trim() ? parseInt(graduationYear.trim(), 10) : null,
        skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
        interests: interestsText.split(",").map((s) => s.trim()).filter(Boolean),
        languages: languagesText.split(",").map((s) => s.trim()).filter(Boolean),
        socialLinks: {
          github: githubUrl.trim() || undefined,
          linkedin: linkedinUrl.trim() || undefined,
          portfolio: portfolioUrl.trim() || undefined,
        },
        isPublicProfile,
      };

      if (selectedUniversity) {
        payload.universityId = selectedUniversity.id;
        payload.campusId = selectedCampusId || null;
        payload.departmentId = selectedDepartmentId || null;
      } else {
        payload.universityId = null;
        payload.campusId = null;
        payload.departmentId = null;
      }

      const res = await apiClient.patch<MobileProfileResponse>("/api/mobile/user/profile", payload);
      return res;
    },
    onSuccess: async () => {
      triggerSuccessFeedback();
      setSaveMessage({ type: "success", text: "Student profile saved successfully!" });
      await queryClient.invalidateQueries({ queryKey: ["mobile-profile"] });
      await refreshUser();
      setTimeout(() => setSaveMessage(null), 4000);
    },
    onError: (err: any) => {
      setSaveMessage({
        type: "error",
        text: err?.message || "Failed to update profile. Please check your inputs.",
      });
    },
  });

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of UniMate?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          triggerDestructiveFeedback();
          setIsLoggingOut(true);
          try {
            await logout();
            router.replace("/(auth)/login");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const themeOptions: { label: string; value: ThemePreference; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: "System", value: "system", icon: "phone-portrait-outline" },
    { label: "Light", value: "light", icon: "sunny-outline" },
    { label: "Dark", value: "dark", icon: "moon-outline" },
  ];

  return (
    <Screen scrollable>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h2" style={styles.title}>
          Settings & Identity
        </AppText>
      </View>

      {/* Profile Completion Progress */}
      {completion ? (
        <ProfileCompletionWidget
          percentage={completion.percentage}
          missingFieldPrompt={completion.nextAction}
        />
      ) : null}

      {/* STUDENT PROFILE SECTION */}
      <View style={styles.section}>
        <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
          Student Profile
        </AppText>

        <Card style={styles.studentCard}>
          {/* Avatar Picker & Header */}
          <View style={styles.avatarRow}>
            <AvatarPicker
              avatarUrl={profileUser?.avatarUrl}
              name={name || profileUser?.name}
              size={84}
              onAvatarChange={async () => {
                await refetchProfile();
                await refreshUser();
              }}
            />
            <View style={styles.avatarMeta}>
              <AppText variant="h3" style={{ color: colors.textPrimary }}>
                {name || "Student"}
              </AppText>
              {username ? (
                <AppText variant="caption" style={{ color: colors.accent, fontWeight: "600" }}>
                  @{username}
                </AppText>
              ) : null}
              <AppText variant="caption" style={{ color: colors.textTertiary, marginTop: 2 }}>
                {profileUser?.email}
              </AppText>
            </View>
          </View>

          {/* Form Inputs */}
          <View style={styles.formContent}>
            <FormInput
              label="Full Name *"
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
            />

            <FormInput
              label="Username / @handle"
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. alex_smith"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <FormInput
              label="Short Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Describe your academic focus or interests..."
              multiline
              numberOfLines={2}
            />

            <View style={styles.twoColumn}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Country"
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
                  placeholder="e.g. Canada"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="City"
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Toronto"
                />
              </View>
            </View>

            {/* University Affiliation Picker */}
            <View style={styles.fieldGroup}>
              <AppText variant="caption" style={{ color: colors.textSecondary, marginBottom: 6, fontWeight: "600" }}>
                UNIVERSITY / INSTITUTION
              </AppText>

              {selectedUniversity ? (
                <View style={[styles.uniSelectionBox, { borderColor: colors.accent, backgroundColor: colors.surfaceSecondary }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <AppText variant="body" style={{ color: colors.textPrimary, fontWeight: "700", flexShrink: 1 }}>
                        {selectedUniversity.name}
                      </AppText>
                      {selectedUniversity.shortName ? (
                        <View style={[styles.pill, { backgroundColor: colors.surfaceTertiary }]}>
                          <AppText variant="caption" style={{ fontSize: 10, fontWeight: "700" }}>
                            {selectedUniversity.shortName}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                      {[selectedUniversity.city, selectedUniversity.country].filter(Boolean).join(", ")}
                    </AppText>

                    <View style={[styles.badgePill, { backgroundColor: selectedUniversity.isVerified ? colors.successSubtle : colors.surfaceTertiary }]}>
                      <Ionicons
                        name={selectedUniversity.isVerified ? "checkmark-circle" : "people-outline"}
                        size={11}
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
                        {selectedUniversity.isVerified ? "Verified" : "Community"}
                      </AppText>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsUniModalOpen(true)}
                    style={[styles.smallBtn, { backgroundColor: colors.surfaceTertiary }]}
                  >
                    <AppText variant="caption" style={{ color: colors.accent, fontWeight: "600" }}>
                      Change
                    </AppText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setIsUniModalOpen(true)}
                  style={[styles.selectUniBox, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
                >
                  <Ionicons name="school-outline" size={18} color={colors.accent} />
                  <AppText variant="body" style={{ color: colors.textTertiary, marginLeft: 8, flex: 1 }}>
                    Select your university...
                  </AppText>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Academic Details */}
            <FormInput
              label="Degree Program"
              value={degreeProgram}
              onChangeText={setDegreeProgram}
              placeholder="e.g. B.S. Computer Science"
            />

            <View style={styles.twoColumn}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Current Semester"
                  value={currentSemester}
                  onChangeText={setCurrentSemester}
                  placeholder="e.g. Semester 4"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Graduation Year"
                  value={graduationYear}
                  onChangeText={setGraduationYear}
                  placeholder="e.g. 2027"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Skills & Interests */}
            <FormInput
              label="Skills (comma-separated)"
              value={skillsText}
              onChangeText={setSkillsText}
              placeholder="e.g. Python, React, Data Analysis"
            />

            <FormInput
              label="Interests (comma-separated)"
              value={interestsText}
              onChangeText={setInterestsText}
              placeholder="e.g. Machine Learning, Robotics, Debating"
            />

            <FormInput
              label="Languages (comma-separated)"
              value={languagesText}
              onChangeText={setLanguagesText}
              placeholder="e.g. English, Spanish, Mandarin"
            />

            {/* Social & Portfolio Links */}
            <FormInput
              label="GitHub URL or Username"
              value={githubUrl}
              onChangeText={setGithubUrl}
              placeholder="e.g. github.com/username"
              autoCapitalize="none"
            />

            <FormInput
              label="LinkedIn URL"
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              placeholder="e.g. linkedin.com/in/username"
              autoCapitalize="none"
            />

            <FormInput
              label="Personal Portfolio / Website"
              value={portfolioUrl}
              onChangeText={setPortfolioUrl}
              placeholder="e.g. https://portfolio.me"
              autoCapitalize="none"
            />

            {/* Public Profile Toggle */}
            <View style={[styles.toggleRow, { borderColor: colors.borderSubtle }]}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <AppText variant="bodyMedium" style={{ color: colors.textPrimary }}>
                  Public Student Profile
                </AppText>
                <AppText variant="caption" style={{ color: colors.textTertiary, marginTop: 2 }}>
                  Allow classmates to view your public bio, degree, and skills
                </AppText>
              </View>
              <Switch
                value={isPublicProfile}
                onValueChange={setIsPublicProfile}
                trackColor={{ false: colors.surfaceTertiary, true: colors.accent }}
              />
            </View>

            {/* Privacy Guarantee Box */}
            <View style={[styles.privacyBox, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <AppText variant="caption" style={{ color: colors.textPrimary, fontWeight: "700" }}>
                  Academic & Financial Privacy Guarantee
                </AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                  GPA, course grades, attendance, exam scores, and personal expenses are strictly private and NEVER shared or made public.
                </AppText>
              </View>
            </View>

            {/* Feedback Message */}
            {saveMessage ? (
              <View
                style={[
                  styles.statusAlert,
                  {
                    backgroundColor:
                      saveMessage.type === "success"
                        ? colors.successSubtle
                        : colors.destructiveSubtle,
                  },
                ]}
              >
                <Ionicons
                  name={saveMessage.type === "success" ? "checkmark-circle" : "alert-circle"}
                  size={16}
                  color={saveMessage.type === "success" ? colors.success : colors.danger}
                />
                <AppText
                  variant="caption"
                  style={{
                    marginLeft: 6,
                    color: saveMessage.type === "success" ? colors.success : colors.danger,
                    fontWeight: "600",
                    flex: 1,
                  }}
                >
                  {saveMessage.text}
                </AppText>
              </View>
            ) : null}

            {/* Save Button */}
            <Button
              title="Save Student Profile"
              variant="primary"
              onPress={() => updateMutation.mutate()}
              loading={updateMutation.isPending}
            />
          </View>
        </Card>
      </View>

      {/* Theme / Appearance Section */}
      <View style={styles.section}>
        <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
          Appearance
        </AppText>
        <Card style={styles.themeCard}>
          <View style={styles.themeOptionsRow}>
            {themeOptions.map((opt) => {
              const isSelected = themePreference === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.7}
                  onPress={() => setThemePreference(opt.value)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isSelected ? colors.surfaceSecondary : "transparent",
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${opt.label} theme`}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={isSelected ? colors.accent : colors.textSecondary}
                  />
                  <AppText
                    variant="caption"
                    style={[
                      styles.themeLabel,
                      isSelected ? { color: colors.accent, fontWeight: "600" } : undefined,
                    ]}
                  >
                    {opt.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </View>

      {/* Subscription Card */}
      <View style={styles.section}>
        <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
          Plan & Entitlements
        </AppText>
        <Card style={styles.subscriptionCard}>
          <View style={styles.subHeader}>
            <View style={styles.subLeft}>
              <View style={[styles.subIcon, { backgroundColor: colors.accentSubtle }]}>
                <Ionicons name="sparkles" size={18} color={colors.accent} />
              </View>
              <View>
                <AppText variant="bodyMedium">
                  {subscription?.plan === "PRO" ? "UniMate Pro" : "UniMate Free"}
                </AppText>
                <AppText colorRole="secondary" variant="caption">
                  Status: {subscription?.status || "Active"}
                </AppText>
              </View>
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor: subscription?.isPro
                    ? colors.accentSubtle
                    : colors.surfaceSecondary,
                },
              ]}
            >
              <AppText
                variant="label"
                colorRole={subscription?.isPro ? "accent" : "secondary"}
                style={styles.badgeText}
              >
                {subscription?.plan || "FREE"}
              </AppText>
            </View>
          </View>
        </Card>
      </View>

      {/* Integrations Section */}
      <View style={styles.section}>
        <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
          Integrations
        </AppText>
        <Card style={styles.serverCard}>
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => router.push("/integrations")}
            accessibilityRole="button"
            accessibilityLabel="Manage Integrations"
          >
            <View style={styles.legalLeft}>
              <Ionicons name="apps-outline" size={18} color={colors.accent} />
              <AppText variant="body" style={{ marginLeft: 10 }}>
                Integration Center
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* About & Legal */}
      <View style={styles.section}>
        <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
          About & Legal
        </AppText>
        <Card style={styles.serverCard}>
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => {
              if (API_BASE_URL) {
                WebBrowser.openBrowserAsync(`${API_BASE_URL}/privacy`);
              } else {
                Alert.alert("Privacy Policy", "Visit unimate.app/privacy for the full Privacy Policy.");
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Open Privacy Policy"
          >
            <View style={styles.legalLeft}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
              <AppText variant="body" style={{ marginLeft: 10 }}>
                Privacy Policy
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.legalDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => {
              if (API_BASE_URL) {
                WebBrowser.openBrowserAsync(`${API_BASE_URL}/terms`);
              } else {
                Alert.alert("Terms of Service", "Visit unimate.app/terms for the full Terms of Service.");
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Open Terms of Service"
          >
            <View style={styles.legalLeft}>
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
              <AppText variant="body" style={{ marginLeft: 10 }}>
                Terms of Service
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.legalDivider, { backgroundColor: colors.border }]} />

          <View style={styles.serverRow}>
            <AppText colorRole="secondary" variant="caption">
              Version
            </AppText>
            <AppText variant="caption" style={{ color: colors.textSecondary }}>
              1.0.0 (Build 1)
            </AppText>
          </View>
        </Card>
      </View>

      {/* Backend Connection Info */}
      <View style={styles.section}>
        <AppText variant="label" colorRole="tertiary" style={styles.sectionTitle}>
          Server Connection
        </AppText>
        <Card style={styles.serverCard}>
          <View style={styles.serverRow}>
            <AppText colorRole="secondary" variant="caption">
              API Endpoint
            </AppText>
            <AppText variant="caption" numberOfLines={1} style={styles.serverUrl}>
              {API_BASE_URL || "Not configured (Set EXPO_PUBLIC_API_URL)"}
            </AppText>
          </View>
        </Card>
      </View>

      {/* Sign Out Button */}
      <View style={styles.logoutSection}>
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          isLoading={isLoggingOut}
          icon={<Ionicons name="log-out-outline" size={18} color={colors.destructive} />}
          textStyle={{ color: colors.destructive }}
          style={[styles.logoutButton, { borderColor: colors.destructive }]}
        />
      </View>

      {/* University Picker Modal */}
      <UniversityPickerModal
        visible={isUniModalOpen}
        onClose={() => setIsUniModalOpen(false)}
        selectedUniversityId={selectedUniversity?.id}
        defaultCountry={country}
        onSelect={(uni) => {
          setSelectedUniversity(uni);
          if (uni?.country && !country) setCountry(uni.country);
          setSelectedCampusId(null);
          setSelectedDepartmentId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    marginBottom: 16,
  },
  backButton: {
    minWidth: Layout.minTouchTarget,
    minHeight: Layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  title: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 4,
  },
  studentCard: {
    padding: spacing.md,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatarMeta: {
    marginLeft: spacing.md,
    flex: 1,
  },
  formContent: {
    gap: spacing.xs,
  },
  twoColumn: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  fieldGroup: {
    marginBottom: spacing.sm,
  },
  selectUniBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
  },
  uniSelectionBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 10,
    padding: spacing.sm,
  },
  pill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  smallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: spacing.xs,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: spacing.xs,
  },
  privacyBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.xs,
  },
  statusAlert: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  themeCard: {
    padding: 12,
  },
  themeOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  themeLabel: {
    marginTop: 6,
  },
  subscriptionCard: {
    padding: 16,
  },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontWeight: "700",
  },
  serverCard: {
    padding: 14,
  },
  serverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serverUrl: {
    maxWidth: 220,
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    minHeight: Layout.minTouchTarget,
  },
  legalLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  legalDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  logoutSection: {
    marginTop: 12,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: "transparent",
  },
});
