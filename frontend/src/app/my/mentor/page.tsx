export default function MentorPage() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {["추천인", "추천받은 회원", "조직"].map((label) => (
        <div key={label} className="rounded-lg border border-border/60 bg-card p-5">
          <h3 className="font-display text-base font-medium">{label}</h3>
          <p className="mt-2 text-xs text-muted-foreground">준비 중입니다.</p>
        </div>
      ))}
    </div>
  )
}
