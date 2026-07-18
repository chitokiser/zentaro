const PARAGRAPHS = [
  "오늘날 우리는 빠른 속도와 효율을 추구하는 시대를 살아가고 있습니다. 그러나 진정한 가치는 서두름이 아닌 시간, 정성, 그리고 장인정신 속에서 탄생한다고 믿습니다. 이러한 믿음이 바로 ZENTARO의 시작이었습니다.",
  "ZENTARO의 이름에는 우리의 철학이 담겨 있습니다.",
  "ZEN은 균형(Balance), 장인정신(Craftsmanship), 절제(Restraint)를 의미합니다. 좋은 위스키는 조급함이 아닌 기다림 속에서 완성되며, 절제된 과정 속에서 깊은 품격을 얻습니다.",
  "TARO는 Taste, Aroma, Refined, Origin을 의미합니다. 뛰어난 맛과 향, 세련된 품질, 그리고 원산지와 원료에 대한 진정성을 가장 중요한 가치로 삼고 있습니다.",
  "우리는 단순히 술을 제조하는 기업이 아닙니다. 한 잔의 위스키를 통해 사람과 사람을 연결하고, 시간을 음미하며, 삶의 품격을 높이는 문화를 만들어가는 브랜드가 되고자 합니다.",
  "비록 작은 증류소에서 시작했지만, 우리의 꿈은 결코 작지 않습니다. ZENTARO는 앞으로 동남아시아를 대표하는 크래프트 증류 연구소이자 체험형 증류 문화공간으로 성장하여, 누구나 위스키가 만들어지는 과정과 장인의 철학을 직접 경험할 수 있는 브랜드를 만들어가겠습니다.",
  "또한 끊임없는 연구와 혁신을 통해 지역의 우수한 원료를 발굴하고, 전통적인 증류 기술과 현대적인 기술을 조화롭게 접목하여 세계 시장에서도 인정받는 프리미엄 위스키를 선보이겠습니다.",
]

export function CeoMessage() {
  return (
    <div className="flex flex-col gap-6">
      <blockquote className="border-l-2 border-primary/60 pl-5 font-display text-lg italic text-foreground sm:text-xl">
        &ldquo;좋은 위스키는 시간을 담고, 좋은 브랜드는 철학을 담습니다.&rdquo;
      </blockquote>

      <p>안녕하십니까.</p>
      <p>ZENTARO를 찾아주신 모든 분들께 진심으로 감사드립니다.</p>

      {PARAGRAPHS.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <p>
        우리에게 위스키는 단순한 술이 아닙니다.
        <br />
        한 병에는 기다림이 담겨 있고, 한 잔에는 사람의 이야기가 담겨 있으며,
        한 순간에는 인생의 여유가 담겨 있습니다.
      </p>

      <p>
        앞으로도 ZENTARO는 정직한 원료, 투명한 제조 과정, 타협하지 않는 품질,
        그리고 끊임없는 연구개발을 바탕으로 고객 여러분의 신뢰에 보답하겠습니다.
      </p>

      <p>시간이 흐를수록 더욱 깊어지는 향처럼, ZENTARO 역시 오래도록 사랑받는 브랜드가 되겠습니다.</p>

      <div className="mt-2 text-right">
        <p>감사합니다.</p>
        <p className="mt-3 font-display text-base font-medium text-primary">ZENTARO CEO</p>
      </div>
    </div>
  )
}
