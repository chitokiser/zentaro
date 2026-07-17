"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  searchCjProducts,
  importCjProduct,
  fetchAllProductsAdmin,
  deleteProductAdmin,
  type CjSearchResultItem,
  type AdminProduct,
} from "@/lib/auth-client"

export default function AdminProductsPage() {
  const [keyword, setKeyword] = useState("")
  const [results, setResults] = useState<CjSearchResultItem[] | null>(null)
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({})
  const [products, setProducts] = useState<AdminProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

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
    if (!priceAp || priceAp <= 0) {
      setError("AP 가격을 입력해주세요.")
      return
    }
    setBusyId(item.cjProductId)
    setError(null)
    setMessage(null)
    try {
      await importCjProduct({
        cjProductId: item.cjProductId,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
        cjSellPrice: item.sellPrice,
        priceAp,
      })
      setMessage(`"${item.name}"을(를) 쇼핑몰에 추가했습니다.`)
      loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가에 실패했습니다.")
    } finally {
      setBusyId(null)
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
                <input
                  type="number"
                  min={1}
                  placeholder="AP 가격"
                  className="w-24 rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
                  value={priceInputs[item.cjProductId] ?? ""}
                  onChange={(e) =>
                    setPriceInputs((prev) => ({ ...prev, [item.cjProductId]: e.target.value }))
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
        <h3 className="font-display text-base font-medium">등록된 상품 ({products?.length ?? 0})</h3>
        <div className="mt-4 flex flex-col gap-2">
          {products?.map((product) => (
            <div key={product.id} className="flex items-center justify-between rounded-md border border-border/40 px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{product.name}</span>
                <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
                <span className="text-xs text-muted-foreground">{product.priceAp.toLocaleString()} AP</span>
                {product.cjProductId ? (
                  <Badge variant="secondary" className="text-[10px]">CJ</Badge>
                ) : null}
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
