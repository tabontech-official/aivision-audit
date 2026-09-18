import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
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
    <>
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
    </>
  );
}
