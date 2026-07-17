import { Hero } from "@/components/home/hero";
import { CfVideo } from "@/components/home/cf-video";
import { BrandStory } from "@/components/home/brand-story";
import { BusinessCards } from "@/components/home/business-cards";
import { ShoppingMall } from "@/components/home/shopping-mall";
import { RewardEcosystem } from "@/components/home/reward-ecosystem";
import { ExperienceCenter } from "@/components/home/experience-center";
import { Community } from "@/components/home/community";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <CfVideo />
      <BrandStory />
      <BusinessCards />
      <ShoppingMall />
      <RewardEcosystem />
      <ExperienceCenter />
      <Community />
    </div>
  );
}
