"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/mall/product-card"
import { MallAdminForm } from "@/components/mall/mall-admin-form"
import { useI18n } from "@/lib/i18n/i18n-context"
import { fetchMe, fetchAllProductsAdmin, deleteProductAdmin, type AdminProduct } from "@/lib/auth-client"
import { MALL_MAIN_CATEGORIES } from "@/lib/mall-categories"
import { localizedCategory } from "@/lib/i18n/mall-categories-i18n"
import { ZP_VND_RATE_LABEL } from "@/lib/currency"
import { ZtaroBenefitBanner } from "@/components/ztaro-benefit-banner"
import type { Product } from "@/lib/api"

function toProduct(p: AdminProduct): Product {
  return { ...p, description: p.description ?? "" }
}

export function MallPageContent({
  initialProducts,
  category,
}: {
  initialProducts: Product[]
  category?: string
}) {
  const { t, locale } = useI18n()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminProducts, setAdminProducts] = useState<AdminProduct[] | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const loadAdminProducts = useCallback(() => {
    fetchAllProductsAdmin()
      .then(setAdminProducts)
      .catch(() => setAdminProducts(null))
  }, [])

  useEffect(() => {
    fetchMe()
      .then((me) => {
        const admin = me.adminLevel !== null && me.adminLevel <= 2
        setIsAdmin(admin)
        if (admin) loadAdminProducts()
      })
      .catch(() => setIsAdmin(false))
  }, [loadAdminProducts])

  const products = useMemo(() => {
    let list: Product[] = []
    if (isAdmin && adminProducts) {
      const filtered = category ? adminProducts.filter((p) => p.mainCategory === category) : adminProducts
      list = filtered.map(toProduct)
    } else {
      list = initialProducts
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((p) => {
        const nameKo = (p.name || "").toLowerCase()
        const nameEn = (p.nameEn || "").toLowerCase()
        const nameVi = (p.nameVi || "").toLowerCase()
        const descKo = (p.description || "").toLowerCase()
        const descEn = (p.descriptionEn || "").toLowerCase()
        const descVi = (p.descriptionVi || "").toLowerCase()
        const cat = (p.category || "").toLowerCase()
        const mainCat = (p.mainCategory ?? "").toLowerCase()
        return (
          nameKo.includes(q) ||
          nameEn.includes(q) ||
          nameVi.includes(q) ||
          descKo.includes(q) ||
          descEn.includes(q) ||
          descVi.includes(q) ||
          cat.includes(q) ||
          mainCat.includes(q)
        )
      })
    }

    return list
  }, [isAdmin, adminProducts, category, initialProducts, searchQuery])

  function handleEdit(product: Product) {
    const source = adminProducts?.find((p) => p.id === product.id)
    if (!source) return
    setEditingProduct(source)
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleDelete(product: Product) {
    if (!confirm(`"${product.name}"을(를) 삭제하시겠습니까?`)) return
    setDeletingId(product.id)
    try {
      await deleteProductAdmin(product.id)
      setMessage(`"${product.name}"을(를) 삭제했습니다.`)
      loadAdminProducts()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "삭제에 실패했습니다.")
    } finally {
      setDeletingId(null)
    }
  }

  function handleSaved() {
    setMessage(editingProduct ? "상품을 수정했습니다." : "새 상품을 등록했습니다.")
    setEditingProduct(null)
    setShowAddForm(false)
    loadAdminProducts()
  }

  return (
    <div>
      <PageHeader
        eyebrow={t.mall.eyebrow}
        title={t.mall.title}
        description={
          <>
            {t.mall.descriptionPrefix}
            <span className="notranslate">EXP</span>
            {t.mall.descriptionSuffix}
          </>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="mb-4 text-xs text-muted-foreground">환율: {ZP_VND_RATE_LABEL} (참고용, 결제는 ZP/ZTARO로만 진행됩니다)</p>
        <ZtaroBenefitBanner className="mb-6" />
        {/* 상품 검색창 */}
        <div className="mb-8 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder={locale === "ko" ? "상품명, 설명 또는 카테고리 검색..." : locale === "vi" ? "Tìm kiếm sản phẩm..." : "Search products..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border/80 bg-background px-4 py-2.5 pl-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <svg
              className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Link href="/mall">
              <Badge variant={!category ? "default" : "outline"} className="cursor-pointer">
                {t.mall.allCategory}
              </Badge>
            </Link>
            {MALL_MAIN_CATEGORIES.map((c) => (
              <Link key={c} href={`/mall?category=${encodeURIComponent(c)}`}>
                <Badge variant={category === c ? "default" : "outline"} className="cursor-pointer">
                  {localizedCategory(locale, c)}
                </Badge>
              </Link>
            ))}
          </div>
          {isAdmin ? (
            <Button
              size="sm"
              variant={showAddForm ? "outline" : "default"}
              onClick={() => {
                if (showAddForm) {
                  setShowAddForm(false)
                  setEditingProduct(null)
                } else {
                  setEditingProduct(null)
                  setShowAddForm(true)
                }
              }}
            >
              {showAddForm ? "닫기" : "+ 새 상품 등록"}
            </Button>
          ) : null}
        </div>

        {message ? (
          <p className="mb-4 rounded-md border border-primary/30 bg-secondary/40 px-4 py-2 text-sm text-primary">
            {message}
          </p>
        ) : null}

        {isAdmin && showAddForm ? (
          <div className="mb-8">
            <MallAdminForm
              editingProduct={editingProduct}
              onSaved={handleSaved}
              onCancelEdit={() => {
                setEditingProduct(null)
                setShowAddForm(false)
              }}
            />
          </div>
        ) : null}

        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.mall.empty}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdmin={isAdmin}
                onEdit={() => handleEdit(product)}
                onDelete={() => handleDelete(product)}
                deleteBusy={deletingId === product.id}
                onRefresh={loadAdminProducts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
