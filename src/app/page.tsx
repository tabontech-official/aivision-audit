import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { AuthModalProvider } from "@/components/marketing/auth-modal-context";
import {
  Hero,
  CredibilityStrip,
  Features,
  OtherFeatures,
  AiShiftSection,
  LatestWritings,
  FinalCta,
  MarketingFooter,
} from "@/components/marketing/sections";

export default async function HomePage() {
  const session = await auth();

  return (
    <AuthModalProvider isLoggedIn={!!session?.user}>
      <MarketingHeader isLoggedIn={!!session?.user} />
      <main>
        <Hero />
        <CredibilityStrip />
        <Features />
        <OtherFeatures />
        <AiShiftSection />
        <LatestWritings />
        <FinalCta />
      </main>
      <MarketingFooter />
    </AuthModalProvider>
  );
}
