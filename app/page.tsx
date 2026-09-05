import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { TrustBar } from "@/components/trust-bar";
import { Features } from "@/components/features";
import { AIStudyBuddy } from "@/components/ai-study-buddy";
import { DashboardPreview } from "@/components/dashboard-preview";
import { HowItWorks } from "@/components/how-it-works";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <TrustBar />
      <Features />
      <AIStudyBuddy />
      <DashboardPreview />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
}