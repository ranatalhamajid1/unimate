/**
 * Entry Redirector Route.
 * Checks authentication status and safely directs to (tabs) or (auth)/login.
 */

import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { LoadingState } from "@/components/ui/LoadingState";
import { Screen } from "@/components/ui/Screen";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Screen style={{ justifyContent: "center", alignItems: "center" }}>
        <LoadingState message="Connecting to UniMate..." />
      </Screen>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
