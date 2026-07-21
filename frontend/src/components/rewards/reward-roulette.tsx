export function RewardRoulette() {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="relative h-32 w-32">
        <div
          className="h-32 w-32 animate-spin rounded-full border-4 border-border/60"
          style={{
            background:
              "conic-gradient(var(--primary) 0deg 45deg, var(--secondary) 45deg 90deg, var(--primary) 90deg 135deg, var(--secondary) 135deg 180deg, var(--primary) 180deg 225deg, var(--secondary) 225deg 270deg, var(--primary) 270deg 315deg, var(--secondary) 315deg 360deg)",
            animationDuration: "0.8s",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-background bg-card" />
        </div>
        <div className="absolute -top-1 left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-destructive" />
      </div>
      <p className="text-sm text-muted-foreground">ZTRO 보상 확인 중...</p>
    </div>
  )
}
