"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"

const ELEMENT_ID = "ztro-qr-reward-scanner"

interface QrRewardScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

export function QrRewardScanner({ onScan, onClose }: QrRewardScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID)
    scannerRef.current = scanner
    let stopped = false

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        (decodedText) => {
          if (stopped) return
          stopped = true
          scanner
            .stop()
            .catch(() => undefined)
            .finally(() => onScan(decodedText))
        },
        () => {
          // per-frame decode failures — expected while the camera is searching, ignore
        },
      )
      .catch(() => {
        setCameraError("카메라를 시작할 수 없습니다. 카메라 권한을 허용했는지 확인해주세요.")
      })

    return () => {
      stopped = true
      if (scanner.isScanning) {
        scanner.stop().catch(() => undefined)
      }
    }
  }, [onScan])

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4">
      {cameraError ? (
        <p className="text-sm text-destructive">{cameraError}</p>
      ) : (
        <p className="text-xs text-muted-foreground">QR 코드를 카메라 화면 안에 맞춰주세요.</p>
      )}
      <div id={ELEMENT_ID} className="mx-auto w-full max-w-xs overflow-hidden rounded-md" />
      <Button type="button" variant="outline" onClick={onClose}>
        닫기
      </Button>
    </div>
  )
}
