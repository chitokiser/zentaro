"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  createDirectProduct,
  updateProductAdmin,
  type AdminProduct,
} from "@/lib/auth-client"
import { MALL_MAIN_CATEGORIES, getSubcategories } from "@/lib/mall-categories"

interface MallAdminFormProps {
  editingProduct: AdminProduct | null
  onSaved: () => void
  onCancelEdit: () => void
}

export function MallAdminForm({ editingProduct, onSaved, onCancelEdit }: MallAdminFormProps) {
  const [name, setName] = useState(editingProduct?.name ?? "")
  const [mainCategory, setMainCategory] = useState(editingProduct?.mainCategory ?? "")
  const [subCategory, setSubCategory] = useState(editingProduct?.category ?? "")
  const [description, setDescription] = useState(editingProduct?.description ?? "")
  const [showTranslations, setShowTranslations] = useState(
    Boolean(editingProduct?.nameEn || editingProduct?.nameVi || editingProduct?.descriptionEn || editingProduct?.descriptionVi),
  )
  const [nameEn, setNameEn] = useState(editingProduct?.nameEn ?? "")
  const [nameVi, setNameVi] = useState(editingProduct?.nameVi ?? "")
  const [descriptionEn, setDescriptionEn] = useState(editingProduct?.descriptionEn ?? "")
  const [descriptionVi, setDescriptionVi] = useState(editingProduct?.descriptionVi ?? "")
  const [imageUrl, setImageUrl] = useState(editingProduct?.imageUrl ?? "")
  const [badges, setBadges] = useState((editingProduct?.badges ?? []).join(", "))
  const [priceAp, setPriceAp] = useState(editingProduct ? String(editingProduct.priceAp ?? "") : "")
  const [costAp, setCostAp] = useState(editingProduct ? String(editingProduct.costAp ?? "") : "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subs = mainCategory ? getSubcategories(mainCategory) : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const priceVal = Number(priceAp)
    const costVal = Number(costAp)
    const finalSubCategory = subCategory || (subs.length === 0 ? mainCategory : "")

    if (!mainCategory) {
      setError("카테고리(대분류)를 선택해주세요.")
      return
    }
    if (subs.length > 0 && !finalSubCategory) {
      setError("세부 카테고리를 선택해주세요.")
      return
    }
    if (!priceVal || priceVal <= 0) {
      setError("ZP 가격을 입력해주세요.")
      return
    }
    if (!costVal || costVal < 0 || costVal > priceVal) {
      setError("원가(ZP)를 판매가 이하로 입력해주세요.")
      return
    }

    setBusy(true)
    try {
      const payload = {
        name,
        mainCategory,
        category: finalSubCategory,
        description: description || undefined,
        nameEn: nameEn.trim() || undefined,
        nameVi: nameVi.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        descriptionVi: descriptionVi.trim() || undefined,
        imageUrl: imageUrl || undefined,
        badges: badges ? badges.split(",").map((b) => b.trim()).filter(Boolean) : undefined,
        priceAp: priceVal,
        costAp: costVal,
      }
      if (editingProduct) {
        await updateProductAdmin(editingProduct.id, payload)
      } else {
        await createDirectProduct(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-card p-5">
      <h3 className="font-display text-base font-medium">
        {editingProduct ? `상품 수정 — ${editingProduct.name}` : "새 상품 등록"}
      </h3>
      {error ? (
        <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="상품명"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
          value={mainCategory}
          onChange={(e) => {
            setMainCategory(e.target.value)
            setSubCategory("")
          }}
          required
        >
          <option value="">대분류 선택</option>
          {MALL_MAIN_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {subs.length > 0 ? (
          <select
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground sm:col-span-2"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            required
          >
            <option value="">세부 카테고리 선택</option>
            {subs.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : null}
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm sm:col-span-2"
          placeholder="설명 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Badge
          variant={showTranslations ? "default" : "outline"}
          className="w-fit cursor-pointer text-[10px] sm:col-span-2"
          onClick={() => setShowTranslations((v) => !v)}
        >
          영어/베트남어 번역 {showTranslations ? "숨기기" : "입력 (선택)"}
        </Badge>
        {showTranslations ? (
          <div className="grid grid-cols-1 gap-2 rounded-md border border-border/40 bg-background/40 p-3 sm:col-span-2 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground">English</span>
              <input
                className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                placeholder="Product name (English)"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
              />
              <input
                className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                placeholder="Description (English)"
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Tiếng Việt</span>
              <input
                className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                placeholder="Tên sản phẩm (Tiếng Việt)"
                value={nameVi}
                onChange={(e) => setNameVi(e.target.value)}
              />
              <input
                className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                placeholder="Mô tả (Tiếng Việt)"
                value={descriptionVi}
                onChange={(e) => setDescriptionVi(e.target.value)}
              />
            </div>
          </div>
        ) : null}
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm sm:col-span-2"
          placeholder="이미지 URL (선택)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm sm:col-span-2"
          placeholder="배지 (쉼표로 구분, 예: 싱글 몰트, 셰리 캐스크)"
          value={badges}
          onChange={(e) => setBadges(e.target.value)}
        />
        <input
          type="number"
          min={1}
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="ZP 판매가"
          value={priceAp}
          onChange={(e) => setPriceAp(e.target.value)}
          required
        />
        <input
          type="number"
          min={0}
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="원가(ZP)"
          value={costAp}
          onChange={(e) => setCostAp(e.target.value)}
          required
        />
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "저장 중..." : editingProduct ? "수정 저장" : "상품 등록"}
          </Button>
          {editingProduct ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={onCancelEdit}>
              취소
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
