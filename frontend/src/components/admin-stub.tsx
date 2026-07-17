export function AdminStub({ title }: { title: string }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">준비 중입니다.</p>
    </div>
  )
}
