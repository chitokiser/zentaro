import { PageHeader, Section } from "@/components/page-header"

const UNITS = [
  { id: "dry-gin", name: "Dry Gin", description: "ZENTARO Original Dry Gin, Citrus Gin, Floral Gin, Lotus Gin, Yuzu Gin" },
  { id: "whisky", name: "Whisky", description: "숙성 프로그램을 거친 ZENTARO 시그니처 위스키" },
  { id: "liqueur", name: "Liqueur", description: "Strawberry, Mango, Passion Fruit, Lychee, Dragon Fruit, Coffee, Coconut Liqueur" },
  { id: "makgeolli-soju", name: "Makgeolli & Soju", description: "전통 발효주 라인업" },
  { id: "functional-beverage", name: "Functional Beverage", description: "기능성 음료 라인" },
  { id: "herb-food", name: "Herb Food", description: "Herb Salt, Herb Pepper 등 허브 식품" },
  { id: "herb-deli", name: "Herb Deli", description: "Herb Cheese, Herb Ham, Herb Salami" },
  { id: "herb-cosmetics", name: "Herb Cosmetics", description: "Herb Soap, Herb Shampoo" },
  { id: "experience-center", name: "Experience Center", description: "증류소 투어 및 체험 프로그램" },
]

export default function BusinessPage() {
  return (
    <div>
      <PageHeader eyebrow="ZENTARO 소개" title="Business" description="사업부 소개" />
      <Section title="사업 영역">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {UNITS.map((unit) => (
            <div
              key={unit.id}
              id={unit.id}
              className="scroll-mt-24 rounded-lg border border-border/60 bg-card p-5"
            >
              <h3 className="font-display text-lg font-medium text-primary">
                {unit.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {unit.description}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
