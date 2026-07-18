"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  searchCjProducts,
  importCjProduct,
  createDirectProduct,
  fetchAllProductsAdmin,
  deleteProductAdmin,
  type CjSearchResultItem,
  type AdminProduct,
} from "@/lib/auth-client"
import { MALL_MAIN_CATEGORIES, getSubcategories } from "@/lib/mall-categories"

export default function AdminProductsPage() {
  const [keyword, setKeyword] = useState("")
  const [results, setResults] = useState<CjSearchResultItem[] | null>(null)
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({})
  const [costInputs, setCostInputs] = useState<Record<string, string>>({})
  const [mainCategoryInputs, setMainCategoryInputs] = useState<Record<string, string>>({})
  const [subCategoryInputs, setSubCategoryInputs] = useState<Record<string, string>>({})
  const [products, setProducts] = useState<AdminProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [directName, setDirectName] = useState("")
  const [directMainCategory, setDirectMainCategory] = useState("")
  const [directSubCategory, setDirectSubCategory] = useState("")
  const [directDescription, setDirectDescription] = useState("")
  const [directImageUrl, setDirectImageUrl] = useState("")
  const [directPriceAp, setDirectPriceAp] = useState("")
  const [directCostAp, setDirectCostAp] = useState("")
  const [directBusy, setDirectBusy] = useState(false)

  const loadProducts = useCallback(() => {
    fetchAllProductsAdmin()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setError(null)
    setMessage(null)
    try {
      const { items } = await searchCjProducts(keyword)
      setResults(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "검색에 실패했습니다.")
    } finally {
      setSearching(false)
    }
  }

  async function handleImport(item: CjSearchResultItem) {
    const priceAp = Number(priceInputs[item.cjProductId])
    const costAp = Number(costInputs[item.cjProductId])
    const mainCategory = mainCategoryInputs[item.cjProductId]
    const subs = mainCategory ? getSubcategories(mainCategory) : []
    const subCategory = subCategoryInputs[item.cjProductId] || (subs.length === 0 ? mainCategory : "")

    if (!mainCategory) {
      setError("카테고리(대분류)를 선택해주세요.")
      return
    }
    if (subs.length > 0 && !subCategory) {
      setError("세부 카테고리를 선택해주세요.")
      return
    }
    if (!priceAp || priceAp <= 0) {
      setError("AP 가격을 입력해주세요.")
      return
    }
    if (!costAp || costAp < 0 || costAp > priceAp) {
      setError("원가(AP)를 판매가 이하로 입력해주세요.")
      return
    }
    setBusyId(item.cjProductId)
    setError(null)
    setMessage(null)
    try {
      await importCjProduct({
        cjProductId: item.cjProductId,
        name: item.name,
        mainCategory,
        category: subCategory,
        imageUrl: item.imageUrl,
        cjSellPrice: item.sellPrice,
        priceAp,
        costAp,
      })
      setMessage(`"${item.name}"을(를) 쇼핑몰에 추가했습니다.`)
      loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가에 실패했습니다.")
    } finally {
      setBusyId(null)
    }
  }

  async function handleCreateDirect(e: React.FormEvent) {
    e.preventDefault()
    const priceAp = Number(directPriceAp)
    const costAp = Number(directCostAp)
    const subs = directMainCategory ? getSubcategories(directMainCategory) : []
    const subCategory = directSubCategory || (subs.length === 0 ? directMainCategory : "")

    if (!directMainCategory) {
      setError("카테고리(대분류)를 선택해주세요.")
      return
    }
    if (subs.length > 0 && !subCategory) {
      setError("세부 카테고리를 선택해주세요.")
      return
    }
    if (!priceAp || priceAp <= 0) {
      setError("AP 가격을 입력해주세요.")
      return
    }
    if (!costAp || costAp < 0 || costAp > priceAp) {
      setError("원가(AP)를 판매가 이하로 입력해주세요.")
      return
    }
    setDirectBusy(true)
    setError(null)
    setMessage(null)
    try {
      await createDirectProduct({
        name: directName,
        mainCategory: directMainCategory,
        category: subCategory,
        description: directDescription || undefined,
        imageUrl: directImageUrl || undefined,
        priceAp,
        costAp,
      })
      setMessage(`"${directName}"을(를) 직배송 상품으로 등록했습니다.`)
      setDirectName("")
      setDirectMainCategory("")
      setDirectSubCategory("")
      setDirectDescription("")
      setDirectImageUrl("")
      setDirectPriceAp("")
      setDirectCostAp("")
      loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.")
    } finally {
      setDirectBusy(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    setBusyId(id)
    setError(null)
    setMessage(null)
    try {
      await deleteProductAdmin(id)
      setMessage(`"${name}"을(를) 삭제했습니다.`)
      loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-xl font-semibold">상품 관리</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          CJ Dropshipping에서 상품을 검색해 ZENTARO Mall에 추가하거나, 등록된 상품을 삭제합니다.
        </p>
      </div>

      {message ? (
        <p className="rounded-md border border-primary/30 bg-secondary/40 px-4 py-2 text-sm text-primary">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="CJ Dropshipping 상품 검색 (영문 키워드, 예: gin glass)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          required
        />
        <Button type="submit" disabled={searching} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {searching ? "검색 중..." : "검색"}
        </Button>
      </form>

      {results ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
          ) : null}
          {results.map((item) => (
            <div key={item.cjProductId} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-3">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="aspect-square w-full rounded-md object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-md bg-secondary/60 text-xs text-muted-foreground">
                  이미지 없음
                </div>
              )}
              <Badge variant="outline" className="w-fit border-primary/40 text-[10px] text-primary">
                {item.category}
              </Badge>
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground">CJ 판매가: {item.sellPrice}</span>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground"
                  value={mainCategoryInputs[item.cjProductId] ?? ""}
                  onChange={(e) => {
                    const value = e.target.value
                    setMainCategoryInputs((prev) => ({ ...prev, [item.cjProductId]: value }))
                    setSubCategoryInputs((prev) => ({ ...prev, [item.cjProductId]: "" }))
                  }}
                >
                  <option value="">대분류 선택</option>
                  {MALL_MAIN_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {getSubcategories(mainCategoryInputs[item.cjProductId] ?? "").length > 0 ? (
                  <select
                    className="flex-1 rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground"
                    value={subCategoryInputs[item.cjProductId] ?? ""}
                    onChange={(e) =>
                      setSubCategoryInputs((prev) => ({ ...prev, [item.cjProductId]: e.target.value }))
                    }
                  >
                    <option value="">세부 카테고리</option>
                    {getSubcategories(mainCategoryInputs[item.cjProductId] ?? "").map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : null}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="AP 판매가"
                  className="w-20 rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
                  value={priceInputs[item.cjProductId] ?? ""}
                  onChange={(e) =>
                    setPriceInputs((prev) => ({ ...prev, [item.cjProductId]: e.target.value }))
                  }
                />
                <input
                  type="number"
                  min={0}
                  placeholder="원가(AP)"
                  className="w-20 rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
                  value={costInputs[item.cjProductId] ?? ""}
                  onChange={(e) =>
                    setCostInputs((prev) => ({ ...prev, [item.cjProductId]: e.target.value }))
                  }
                />
                <Button
                  size="sm"
                  disabled={busyId === item.cjProductId}
                  onClick={() => handleImport(item)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  몰에 추가
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="font-display text-base font-medium">직배송 상품 직접 등록</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          CJ Dropshipping을 거치지 않고 ZENTARO가 직접 재고를 보유·배송하는 상품(세계 유명 주류, ZENTARO 자체 제품)을 등록합니다.
        </p>
        <form onSubmit={handleCreateDirect} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            placeholder="상품명"
            value={directName}
            onChange={(e) => setDirectName(e.target.value)}
            required
          />
          <select
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            value={directMainCategory}
            onChange={(e) => {
              setDirectMainCategory(e.target.value)
              setDirectSubCategory("")
            }}
            required
          >
            <option value="">대분류 선택</option>
            {MALL_MAIN_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {getSubcategories(directMainCategory).length > 0 ? (
            <select
              className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
              value={directSubCategory}
              onChange={(e) => setDirectSubCategory(e.target.value)}
              required
            >
              <option value="">세부 카테고리 선택</option>
              {getSubcategories(directMainCategory).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ) : null}
          <input
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm sm:col-span-2"
            placeholder="설명 (선택)"
            value={directDescription}
            onChange={(e) => setDirectDescription(e.target.value)}
          />
          <input
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm sm:col-span-2"
            placeholder="이미지 URL (선택)"
            value={directImageUrl}
            onChange={(e) => setDirectImageUrl(e.target.value)}
          />
          <input
            type="number"
            min={1}
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            placeholder="AP 판매가"
            value={directPriceAp}
            onChange={(e) => setDirectPriceAp(e.target.value)}
            required
          />
          <input
            type="number"
            min={0}
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            placeholder="원가(AP)"
            value={directCostAp}
            onChange={(e) => setDirectCostAp(e.target.value)}
            required
          />
          <Button
            type="submit"
            disabled={directBusy}
            className="sm:col-span-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            직배송 상품 등록
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="font-display text-base font-medium">등록된 상품 ({products?.length ?? 0})</h3>
        <div className="mt-4 flex flex-col gap-2">
          {products?.map((product) => (
            <div key={product.id} className="flex items-center justify-between rounded-md border border-border/40 px-4 py-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">{product.name}</span>
                {product.mainCategory ? (
                  <Badge variant="outline" className="text-[10px]">{product.mainCategory}</Badge>
                ) : null}
                <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
                <span className="text-xs text-muted-foreground">
                  {product.priceAp.toLocaleString()} AP
                  {typeof product.costAp === "number" ? ` (원가 ${product.costAp.toLocaleString()})` : ""}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {product.fulfillmentType === "direct" ? "직배송" : "드랍쉬핑"}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={busyId === product.id}
                onClick={() => handleDelete(product.id, product.name)}
              >
                삭제
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
