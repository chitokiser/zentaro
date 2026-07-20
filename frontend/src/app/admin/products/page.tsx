"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  searchCjProducts,
  importCjProduct,
  createDirectProduct,
  updateProductAdmin,
  fetchAllProductsAdmin,
  deleteProductAdmin,
  fetchCjProductDetail,
  type CjSearchResultItem,
  type CjProductDetail,
  type AdminProduct,
} from "@/lib/auth-client"
import { MALL_MAIN_CATEGORIES, getSubcategories } from "@/lib/mall-categories"

const AP_PER_USD = 10000

function parseUsdPrice(sellPrice: string): number | null {
  const nums = sellPrice.match(/[\d.]+/g)?.map(Number).filter((n) => !Number.isNaN(n)) ?? []
  if (nums.length === 0) return null
  return Math.max(...nums)
}

function calcApFromUsd(usd: number): { costAp: number; priceAp: number } {
  const costAp = Math.round((usd * AP_PER_USD) / 100) * 100
  return { costAp, priceAp: costAp * 2 }
}

export default function AdminProductsPage() {
  const [keyword, setKeyword] = useState("")
  const [results, setResults] = useState<CjSearchResultItem[] | null>(null)
  const [searchPage, setSearchPage] = useState(1)
  const [searchTotal, setSearchTotal] = useState(0)
  const SEARCH_PAGE_SIZE = 20
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({})
  const [costInputs, setCostInputs] = useState<Record<string, string>>({})
  const [mainCategoryInputs, setMainCategoryInputs] = useState<Record<string, string>>({})
  const [subCategoryInputs, setSubCategoryInputs] = useState<Record<string, string>>({})
  const [products, setProducts] = useState<AdminProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [importResults, setImportResults] = useState<Record<string, { ok: boolean; text: string }>>({})

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<CjProductDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [directName, setDirectName] = useState("")
  const [directMainCategory, setDirectMainCategory] = useState("")
  const [directSubCategory, setDirectSubCategory] = useState("")
  const [directDescription, setDirectDescription] = useState("")
  const [directImageUrl, setDirectImageUrl] = useState("")
  const [directBadges, setDirectBadges] = useState("")
  const [directPriceAp, setDirectPriceAp] = useState("")
  const [directCostAp, setDirectCostAp] = useState("")
  const [directSupplierName, setDirectSupplierName] = useState("")
  const [directSupplierContact, setDirectSupplierContact] = useState("")
  const [directSupplierCostKrw, setDirectSupplierCostKrw] = useState("")
  const [directBusy, setDirectBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [listSearch, setListSearch] = useState("")
  const [listCategoryFilter, setListCategoryFilter] = useState("")
  const [listSortBy, setListSortBy] = useState<"default" | "category" | "name">("default")

  const listCategories = useMemo(() => {
    const set = new Set<string>()
    products?.forEach((p) => {
      if (p.mainCategory) set.add(p.mainCategory)
    })
    return Array.from(set).sort()
  }, [products])

  const visibleProducts = useMemo(() => {
    let list = products ?? []
    const keyword = listSearch.trim().toLowerCase()
    if (keyword) {
      list = list.filter((p) => p.name.toLowerCase().includes(keyword))
    }
    if (listCategoryFilter) {
      list = list.filter((p) => p.mainCategory === listCategoryFilter)
    }
    if (listSortBy === "category") {
      list = [...list].sort((a, b) => {
        const mainCmp = (a.mainCategory ?? "").localeCompare(b.mainCategory ?? "", "ko")
        if (mainCmp !== 0) return mainCmp
        return a.category.localeCompare(b.category, "ko")
      })
    } else if (listSortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"))
    }
    return list
  }, [products, listSearch, listCategoryFilter, listSortBy])

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
    await runSearch(1)
  }

  async function runSearch(page: number) {
    setSearching(true)
    setError(null)
    setMessage(null)
    try {
      const { items, total } = await searchCjProducts(keyword, page)
      setResults(items)
      setSearchTotal(total)
      setSearchPage(page)

      const prefillCost: Record<string, string> = {}
      const prefillPrice: Record<string, string> = {}
      for (const item of items) {
        const usd = parseUsdPrice(item.sellPrice)
        if (usd === null) continue
        const { costAp, priceAp } = calcApFromUsd(usd)
        prefillCost[item.cjProductId] = String(costAp)
        prefillPrice[item.cjProductId] = String(priceAp)
      }
      setCostInputs((prev) => ({ ...prev, ...prefillCost }))
      setPriceInputs((prev) => ({ ...prev, ...prefillPrice }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "검색에 실패했습니다.")
    } finally {
      setSearching(false)
    }
  }

  async function handleViewDetail(cjProductId: string) {
    setDetailLoading(cjProductId)
    setDetailError(null)
    try {
      const detail = await fetchCjProductDetail(cjProductId)
      setDetailItem(detail)
      setDetailOpen(true)
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "상세 정보를 불러오지 못했습니다.")
    } finally {
      setDetailLoading(null)
    }
  }

  async function handleImport(item: CjSearchResultItem) {
    const priceAp = Number(priceInputs[item.cjProductId])
    const costAp = Number(costInputs[item.cjProductId])
    const mainCategory = mainCategoryInputs[item.cjProductId]
    const subs = mainCategory ? getSubcategories(mainCategory) : []
    const subCategory = subCategoryInputs[item.cjProductId] || (subs.length === 0 ? mainCategory : "")

    setImportResults((prev) => {
      const next = { ...prev }
      delete next[item.cjProductId]
      return next
    })

    if (!mainCategory) {
      setImportResults((prev) => ({ ...prev, [item.cjProductId]: { ok: false, text: "카테고리(대분류)를 선택해주세요." } }))
      return
    }
    if (subs.length > 0 && !subCategory) {
      setImportResults((prev) => ({ ...prev, [item.cjProductId]: { ok: false, text: "세부 카테고리를 선택해주세요." } }))
      return
    }
    if (!priceAp || priceAp <= 0) {
      setImportResults((prev) => ({ ...prev, [item.cjProductId]: { ok: false, text: "AP 가격을 입력해주세요." } }))
      return
    }
    if (!costAp || costAp < 0 || costAp > priceAp) {
      setImportResults((prev) => ({ ...prev, [item.cjProductId]: { ok: false, text: "원가(AP)를 판매가 이하로 입력해주세요." } }))
      return
    }
    setBusyId(item.cjProductId)
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
      setImportResults((prev) => ({ ...prev, [item.cjProductId]: { ok: true, text: "추가 완료" } }))
      loadProducts()
    } catch (err) {
      setImportResults((prev) => ({
        ...prev,
        [item.cjProductId]: { ok: false, text: err instanceof Error ? err.message : "추가에 실패했습니다." },
      }))
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
      const payload = {
        name: directName,
        mainCategory: directMainCategory,
        category: subCategory,
        description: directDescription || undefined,
        imageUrl: directImageUrl || undefined,
        badges: directBadges
          ? directBadges.split(",").map((b) => b.trim()).filter(Boolean)
          : undefined,
        priceAp,
        costAp,
        supplierName: directSupplierName || undefined,
        supplierContact: directSupplierContact || undefined,
        supplierCostKrw: directSupplierCostKrw ? Number(directSupplierCostKrw) : undefined,
      }
      if (editingId) {
        await updateProductAdmin(editingId, payload)
        setMessage(`"${directName}"을(를) 수정했습니다.`)
      } else {
        await createDirectProduct(payload)
        setMessage(`"${directName}"을(를) 직배송 상품으로 등록했습니다.`)
      }
      setEditingId(null)
      setDirectName("")
      setDirectMainCategory("")
      setDirectSubCategory("")
      setDirectDescription("")
      setDirectImageUrl("")
      setDirectBadges("")
      setDirectPriceAp("")
      setDirectCostAp("")
      setDirectSupplierName("")
      setDirectSupplierContact("")
      setDirectSupplierCostKrw("")
      loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.")
    } finally {
      setDirectBusy(false)
    }
  }

  function handleEdit(product: AdminProduct) {
    setEditingId(product.id)
    setDirectName(product.name)
    setDirectMainCategory(product.mainCategory ?? "")
    setDirectSubCategory(product.category ?? "")
    setDirectDescription(product.description ?? "")
    setDirectImageUrl(product.imageUrl ?? "")
    setDirectBadges((product.badges ?? []).join(", "))
    setDirectPriceAp(String(product.priceAp ?? ""))
    setDirectCostAp(String(product.costAp ?? ""))
    setDirectSupplierName(product.supplierName ?? "")
    setDirectSupplierContact(product.supplierContact ?? "")
    setDirectSupplierCostKrw(product.supplierCostKrw ? String(product.supplierCostKrw) : "")
    setMessage(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setDirectName("")
    setDirectMainCategory("")
    setDirectSubCategory("")
    setDirectDescription("")
    setDirectImageUrl("")
    setDirectBadges("")
    setDirectPriceAp("")
    setDirectCostAp("")
    setDirectSupplierName("")
    setDirectSupplierContact("")
    setDirectSupplierCostKrw("")
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
        <p className="mt-1 text-xs text-muted-foreground">
          원가는 CJ 판매가(USD) 기준 10,000 AP = $1로 자동 계산되고, 판매가는 원가의 2배로 자동 설정됩니다. 필요하면 직접 수정할 수 있습니다. (EXP 결제는 마진의 최대 80%까지 자동 적용됩니다.)
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
      {detailError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {detailError}
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
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              전체 {searchTotal.toLocaleString()}건 중 {(searchPage - 1) * SEARCH_PAGE_SIZE + 1}
              -{(searchPage - 1) * SEARCH_PAGE_SIZE + results.length}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={searching || searchPage <= 1}
                onClick={() => runSearch(searchPage - 1)}
              >
                이전
              </Button>
              <span className="px-1 py-1">{searchPage} 페이지</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={searching || searchPage * SEARCH_PAGE_SIZE >= searchTotal}
                onClick={() => runSearch(searchPage + 1)}
              >
                다음
              </Button>
            </div>
          </div>
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
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={detailLoading === item.cjProductId}
                onClick={() => handleViewDetail(item.cjProductId)}
              >
                {detailLoading === item.cjProductId ? "불러오는 중..." : "상세보기"}
              </Button>
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
                  {busyId === item.cjProductId ? "추가 중..." : "몰에 추가"}
                </Button>
              </div>
              {importResults[item.cjProductId] ? (
                <p className={importResults[item.cjProductId].ok ? "text-[11px] text-primary" : "text-[11px] text-destructive"}>
                  {importResults[item.cjProductId].text}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="font-display text-base font-medium">
          {editingId ? "상품 수정" : "직배송 상품 직접 등록"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {editingId
            ? "아래 항목을 수정하고 저장하세요."
            : "CJ Dropshipping을 거치지 않고 ZENTARO가 직접 재고를 보유·배송하는 상품(세계 유명 주류, ZENTARO 자체 제품)을 등록합니다."}
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
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm sm:col-span-2"
            placeholder="배지 (쉼표로 구분, 예: 싱글 몰트, 셰리 캐스크, 피트·스모키)"
            value={directBadges}
            onChange={(e) => setDirectBadges(e.target.value)}
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
          <p className="mt-2 text-xs font-medium text-muted-foreground sm:col-span-2">공급업체 정보 (선택)</p>
          <input
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            placeholder="제조사 / 공급업체명"
            value={directSupplierName}
            onChange={(e) => setDirectSupplierName(e.target.value)}
          />
          <input
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            placeholder="연락처 (전화/이메일)"
            value={directSupplierContact}
            onChange={(e) => setDirectSupplierContact(e.target.value)}
          />
          <input
            type="number"
            min={0}
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm sm:col-span-2"
            placeholder="공급원가 (원)"
            value={directSupplierCostKrw}
            onChange={(e) => setDirectSupplierCostKrw(e.target.value)}
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button
              type="submit"
              disabled={directBusy}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {directBusy ? "저장 중..." : editingId ? "수정 저장" : "직배송 상품 등록"}
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" disabled={directBusy} onClick={handleCancelEdit}>
                취소
              </Button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="font-display text-base font-medium">
          등록된 상품 ({visibleProducts.length}{visibleProducts.length !== (products?.length ?? 0) ? ` / 전체 ${products?.length ?? 0}` : ""})
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-[180px] flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            placeholder="상품명 검색"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
          />
          <select
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            value={listCategoryFilter}
            onChange={(e) => setListCategoryFilter(e.target.value)}
          >
            <option value="">전체 카테고리</option>
            {listCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            value={listSortBy}
            onChange={(e) => setListSortBy(e.target.value as "default" | "category" | "name")}
          >
            <option value="default">등록순</option>
            <option value="category">카테고리순</option>
            <option value="name">이름순</option>
          </select>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {visibleProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">조건에 맞는 상품이 없습니다.</p>
          ) : null}
          {visibleProducts.map((product) => {
            const hasSupplierInfo = product.supplierName || product.supplierContact || product.supplierCostKrw
            return (
              <div key={product.id} className="flex flex-col gap-1 rounded-md border border-border/40 px-4 py-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 shrink-0 rounded-md border border-border/40 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary/60 text-[9px] text-muted-foreground">
                        없음
                      </div>
                    )}
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
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === product.id}
                      onClick={() => handleEdit(product)}
                    >
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === product.id}
                      onClick={() => handleDelete(product.id, product.name)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
                {hasSupplierInfo ? (
                  <p className="pl-[52px] text-[11px] text-muted-foreground">
                    공급업체: {product.supplierName || "-"} · 연락처: {product.supplierContact || "-"} · 공급원가:{" "}
                    {typeof product.supplierCostKrw === "number" ? `${product.supplierCostKrw.toLocaleString()}원` : "-"}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{detailItem?.name || "상품 상세"}</SheetTitle>
          </SheetHeader>
          {detailItem ? (
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                {detailItem.category ? (
                  <Badge variant="outline" className="text-[10px]">{detailItem.category}</Badge>
                ) : null}
                <span className="text-xs text-muted-foreground">CJ 판매가: {detailItem.sellPrice}</span>
              </div>

              {detailItem.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {detailItem.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt={`${detailItem.name} ${i + 1}`}
                      className="aspect-square w-full rounded-md border border-border/40 object-cover"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">이미지가 없습니다.</p>
              )}

              {detailItem.variants.length > 0 ? (
                <div>
                  <h4 className="mb-2 text-sm font-medium">옵션 ({detailItem.variants.length})</h4>
                  <div className="flex flex-col gap-1">
                    {detailItem.variants.map((v) => (
                      <div
                        key={v.vid || v.sku}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/40 px-3 py-2 text-xs"
                      >
                        <span>{v.name || v.sku}</span>
                        <span className="text-muted-foreground">{v.sellPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {detailItem.descriptionHtml ? (
                <div>
                  <h4 className="mb-2 text-sm font-medium">상세 설명</h4>
                  <iframe
                    title="CJ product description"
                    srcDoc={detailItem.descriptionHtml}
                    sandbox=""
                    className="h-96 w-full rounded-md border border-border/40 bg-white"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
