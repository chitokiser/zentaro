"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Lock, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { setPaymentPassword } from "@/lib/auth-client";

interface PaymentPinDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (pin: string) => Promise<void> | void;
    title?: string;
    description?: string;
    hasPinSet?: boolean; // If user has NO PIN set, we guide them to set it first
    onPinSetSuccess?: () => void; // Triggered when new PIN is set successfully
}

export function PaymentPinDialog({
    isOpen,
    onClose,
    onSuccess,
    title = "결제 비밀번호 승인",
    description = "보안 자산 이체 및 거래를 위해 6자리 결제 비밀번호를 입력해주세요.",
    hasPinSet = true,
    onPinSetSuccess,
}: PaymentPinDialogProps) {
    const [pin, setPin] = useState<string[]>(Array(6).fill(""));
    const [isSettingMode, setIsSettingMode] = useState<boolean>(!hasPinSet);
    const [confirmPin, setConfirmPin] = useState<string[]>(Array(6).fill(""));
    const [isConfirmStep, setIsConfirmStep] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        setIsSettingMode(!hasPinSet);
        setPin(Array(6).fill(""));
        setConfirmPin(Array(6).fill(""));
        setIsConfirmStep(false);
        setError(null);
    }, [hasPinSet, isOpen]);

    useEffect(() => {
        if (isOpen) {
            // Focus first input when dialog opens
            setTimeout(() => {
                inputsRef.current[0]?.focus();
            }, 100);
        }
    }, [isOpen, isConfirmStep, isSettingMode]);

    if (!isOpen) return null;

    const handleInputChange = (
        value: string,
        index: number,
        targetArray: string[],
        setTargetArray: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newArr = [...targetArray];
        newArr[index] = value;
        setTargetArray(newArr);
        setError(null);

        // Auto focus next
        if (value !== "" && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        index: number,
        targetArray: string[],
        setTargetArray: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        if (e.key === "Backspace") {
            if (targetArray[index] === "" && index > 0) {
                const newArr = [...targetArray];
                newArr[index - 1] = "";
                setTargetArray(newArr);
                inputsRef.current[index - 1]?.focus();
            } else {
                const newArr = [...targetArray];
                newArr[index] = "";
                setTargetArray(newArr);
            }
            setError(null);
        }
    };

    const handlePaste = (
        e: React.ClipboardEvent<HTMLInputElement>,
        setTargetArray: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        if (!/^\d{6}$/.test(pastedData)) return;

        const digits = pastedData.split("");
        setTargetArray(digits);
        inputsRef.current[5]?.focus();
    };

    const handleBackToFirstStep = () => {
        setIsConfirmStep(false);
        setConfirmPin(Array(6).fill(""));
        setError(null);
    };

    const handleSubmit = async () => {
        const pinStr = pin.join("");
        if (pinStr.length !== 6) {
            setError("6자리 비밀번호를 모두 입력해주세요.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isSettingMode) {
                if (!isConfirmStep) {
                    // Proceed to confirm step
                    setIsConfirmStep(true);
                    setLoading(false);
                    return;
                }

                // Compare confirm PIN
                const confirmStr = confirmPin.join("");
                if (pinStr !== confirmStr) {
                    setError("입력한 비밀번호가 일치하지 않습니다. 다시 입력해주세요.");
                    setConfirmPin(Array(6).fill(""));
                    setLoading(false);
                    return;
                }

                // Call setup pin API
                await setPaymentPassword(pinStr);
                setLoading(false);
                setIsSettingMode(false);
                setIsConfirmStep(false);
                if (onPinSetSuccess) onPinSetSuccess();

                // Auto submit the transaction since we now have the valid PIN
                await onSuccess(pinStr);
            } else {
                // Normal verification check on parent action
                await onSuccess(pinStr);
            }
        } catch (err: any) {
            setError(err instanceof Error ? err.message : "작업 도중 오류가 발생했습니다.");
            // Clear inputs on error so user can retry
            if (!isSettingMode) {
                setPin(Array(6).fill(""));
                inputsRef.current[0]?.focus();
            } else {
                setConfirmPin(Array(6).fill(""));
            }
        } finally {
            setLoading(false);
        }
    };

    const activeArray = isConfirmStep ? confirmPin : pin;
    const setActiveArray = isConfirmStep ? setConfirmPin : setPin;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={loading ? undefined : onClose}
            />

            {/* Dialog container */}
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl p-6 md:p-8 animate-scale-in">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    type="button"
                    disabled={loading}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Brand Icon / Header */}
                <div className="flex flex-col items-center text-center mt-2 mb-6">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-4">
                        {isSettingMode ? <Lock className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                    </div>

                    <h2 className="text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                        {isSettingMode
                            ? (isConfirmStep ? "비밀번호 확인" : "결제 비밀번호 설정")
                            : title
                        }
                    </h2>
                    <p className="text-sm text-zinc-400 mt-2 max-w-xs">
                        {isSettingMode
                            ? (isConfirmStep
                                ? "입력하신 비밀번호의 검증을 위해 한 번 더 동일하게 입력해 주세요."
                                : "자산 보호를 위해 6자리 결제 비밀번호(PIN)를 최초 등록합니다."
                            )
                            : description
                        }
                    </p>
                </div>

                {/* Input Blocks */}
                <div className="flex justify-between gap-2 max-w-xs mx-auto mb-6">
                    {activeArray.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputsRef.current[index] = el; }}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            autoComplete="new-password"
                            disabled={loading}
                            onChange={(e) => handleInputChange(e.target.value, index, activeArray, setActiveArray)}
                            onKeyDown={(e) => handleKeyDown(e, index, activeArray, setActiveArray)}
                            onPaste={(e) => index === 0 ? handlePaste(e, setActiveArray) : undefined}
                            className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-zinc-800 bg-zinc-950 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all text-amber-400"
                        />
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-lg text-sm mb-6 animate-shake">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || activeArray.some(d => d === "")}
                        className="w-full h-11 flex items-center justify-center font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:from-amber-500 disabled:to-amber-600"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-black" />
                        ) : (
                            isSettingMode
                                ? (isConfirmStep ? "설정 완료" : "다음 단계")
                                : "비밀번호 확인"
                        )}
                    </button>

                    {isConfirmStep && (
                        <button
                            onClick={handleBackToFirstStep}
                            disabled={loading}
                            className="w-full h-10 border border-zinc-850 hover:bg-zinc-800/50 rounded-xl text-sm transition-all"
                        >
                            이전 단계로
                        </button>
                    )}

                    {!isSettingMode && !hasPinSet && (
                        <p className="text-xs text-center text-zinc-500 mt-2">
                            최초 거래를 위해 결제 비밀번호 설정을 먼저 완료해야 합니다.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
