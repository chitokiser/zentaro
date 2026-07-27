"use client"

import { useEffect, useState, useCallback } from "react"
import { ethers } from "ethers"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, ShieldAlert, Sparkles, RefreshCw, Layers, ArrowUpRight, Vote, Check, X, Megaphone } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

// opBNB details
declare global {
    interface Window {
        ethereum?: any
    }
}

const OPBNB_CHAIN_ID = "0xcc" // 204
const OPBNB_RPC_URL = "https://opbnb-rpc.publicnode.com"
const OPBNB_EXPLORER_URL = "https://opbnbscan.com"

// Contract Addresses
const ZTRO_TOKEN_ADDRESS = "0xF4E758D3461886f7dD5af3E86f622e171113A568"
const ZTRO_VAULT_CONTRACT_ADDRESS = "0x58d567c90865EF5ccBF8291553D51d38DC63A7B1"

// ABIs
const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
]

const VAULT_ABI = [
    "function stake(uint256 amount, uint256 lockDays) external returns (uint256)",
    "function unstake(uint256 stakeId) external",
    "function transferOut(uint256 stakeId, address recipient) external",
    "function getAllStakes(address user) external view returns (uint256[] memory)",
    "function stakes(uint256 stakeId) external view returns (uint256 stakeId, uint256 amount, uint256 lockedUntil, uint256 createdAt, bool active, bool unstaked, bool transferred)",
    "function totalStaked() external view returns (uint256)",
    "function adminReserve() external view returns (uint256)",
    "function withdrawApproved(address user) external view returns (bool)",
    "function transferApproved(address user) external view returns (bool)",
    // Proposal functions mapping
    "function owner() external view returns (address)",
    "function proposalCounter() external view returns (uint256)",
    "function proposals(uint256 proposalId) external view returns (uint256 proposalId, address recipient, uint256 amount, uint256 createdAt, uint256 deadline, bool executed, bool cancelled, uint256 yesVotes, uint256 noVotes, uint256 snapshotTotalStake)",
    "function vote(uint256 proposalId, bool support) external",
    "function hasVoted(uint256 proposalId, address staker) external view returns (bool)",
    "function voteChoice(uint256 proposalId, address staker) external view returns (bool)",
    "function createProposal(address recipient, uint256 amount) external returns (uint256)",
    "function executeProposal(uint256 proposalId) external",
    "function cancelProposal(uint256 proposalId) external",
]

interface StakePosition {
    stakeId: number
    amount: number
    lockedUntil: Date
    createdAt: Date
    active: boolean
    unstaked: boolean
    transferred: boolean
    isUnlocked: boolean
}

interface ProposalItem {
    proposalId: number
    recipient: string
    amount: number
    createdAt: Date
    deadline: Date
    executed: boolean
    cancelled: boolean
    yesVotes: number
    noVotes: number
    snapshotTotalStake: number
    userHasVoted: boolean
    userVoteChoice: boolean
}

export default function DaoStakingPage() {
    const { t } = useI18n()
    const [account, setAccount] = useState<string | null>(null)
    const [chainId, setChainId] = useState<string | null>(null)
    const [clientInit, setClientInit] = useState(false)

    // Contract data
    const [ztroBalance, setZtroBalance] = useState<string>("0")
    const [lockedContractZtro, setLockedContractZtro] = useState<string>("0") // Staked total + reserve
    const [totalStaked, setTotalStaked] = useState<string>("0")
    const [userStakingPower, setUserStakingPower] = useState<string>("0")
    const [userStakes, setUserStakes] = useState<StakePosition[]>([])

    // DAO Proposal data
    const [isOwner, setIsOwner] = useState<boolean>(false)
    const [proposals, setProposals] = useState<ProposalItem[]>([])
    const [proposalRecipient, setProposalRecipient] = useState<string>("")
    const [proposalAmount, setProposalAmount] = useState<string>("")

    // Staking Input
    const [stakeAmount, setStakeAmount] = useState<string>("")
    const [lockDays, setLockDays] = useState<number>(30)
    const [allowance, setAllowance] = useState<string>("0")

    // Approvals status
    const [withdrawApprovedFlag, setWithdrawApprovedFlag] = useState<boolean>(false)
    const [transferApprovedFlag, setTransferApprovedFlag] = useState<boolean>(false)

    // UI state
    const [busy, setBusy] = useState<boolean>(false)
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null)

    // Helper check for SSR safety
    useEffect(() => {
        setClientInit(true)
        if (typeof window !== "undefined" && window.ethereum) {
            // Get current accounts and chain ID
            window.ethereum.request({ method: "eth_accounts" })
                .then((accounts: any) => {
                    if (accounts && accounts.length > 0) {
                        setAccount(accounts[0])
                    }
                })
            window.ethereum.request({ method: "eth_chainId" })
                .then((id: any) => {
                    setChainId(id)
                })

            // Setup event listeners
            const handleAccountsChanged = (accounts: any) => {
                if (accounts && accounts.length > 0) {
                    setAccount(accounts[0])
                } else {
                    setAccount(null)
                }
            }
            const handleChainChanged = (id: any) => {
                setChainId(id)
            }

            window.ethereum.on("accountsChanged", handleAccountsChanged)
            window.ethereum.on("chainChanged", handleChainChanged)

            return () => {
                if (window.ethereum.removeListener) {
                    window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
                    window.ethereum.removeListener("chainChanged", handleChainChanged)
                }
            }
        }
    }, [])

    // Check and switch/add opBNB chain
    const connectAndSwitchToOpBnb = async () => {
        if (typeof window === "undefined" || !window.ethereum) {
            setMessage({ text: "메타마스크 설치가 필요합니다.", type: "error" })
            return
        }
        setBusy(true)
        setMessage(null)
        try {
            // Request account connect
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
            setAccount(accounts[0])

            // Switch to opBNB
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: OPBNB_CHAIN_ID }],
                })
            } catch (switchError: any) {
                // If chain not exist, add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: OPBNB_CHAIN_ID,
                                chainName: "opBNB Mainnet",
                                nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
                                rpcUrls: [OPBNB_RPC_URL],
                                blockExplorerUrls: [OPBNB_EXPLORER_URL],
                            },
                        ],
                    })
                } else {
                    throw switchError
                }
            }
        } catch (err: any) {
            console.error(err)
            setMessage({ text: err.message || "지갑 연결 도중 오류가 발생했습니다.", type: "error" })
        } finally {
            setBusy(false)
        }
    }

    // Load contract details (both public metrics and user-specific states)
    const refreshStakingDetails = useCallback(async () => {
        if (typeof window === "undefined" || !window.ethereum || !account) return

        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any)

            const ztroContract = new ethers.Contract(ZTRO_TOKEN_ADDRESS, ERC20_ABI, provider)
            const vaultContract = new ethers.Contract(ZTRO_VAULT_CONTRACT_ADDRESS, VAULT_ABI, provider)

            // Fetch contract metrics
            const [
                contractBalance,
                totalStakedWei,
                userZtroBalanceWei,
                userAllowanceWei,
                withdrawFlag,
                transferFlag,
                stakeIdsLists,
                contractOwner,
                proposalCountRaw
            ] = await Promise.all([
                ztroContract.balanceOf(ZTRO_VAULT_CONTRACT_ADDRESS),
                vaultContract.totalStaked(),
                ztroContract.balanceOf(account),
                ztroContract.allowance(account, ZTRO_VAULT_CONTRACT_ADDRESS),
                vaultContract.withdrawApproved(account),
                vaultContract.transferApproved(account),
                vaultContract.getAllStakes(account),
                vaultContract.owner(),
                vaultContract.proposalCounter()
            ])

            setLockedContractZtro(ethers.formatEther(contractBalance))
            setTotalStaked(ethers.formatEther(totalStakedWei))
            setZtroBalance(ethers.formatEther(userZtroBalanceWei))
            setAllowance(ethers.formatEther(userAllowanceWei))

            setWithdrawApprovedFlag(withdrawFlag)
            setTransferApprovedFlag(transferFlag)
            setIsOwner(contractOwner.toLowerCase() === account.toLowerCase())

            // Fetch user stakes positions lists
            const positions: StakePosition[] = []
            let tempUserStakingPower = 0

            for (let i = 0; i < stakeIdsLists.length; i++) {
                const sid = stakeIdsLists[i]
                const rawStake = await vaultContract.stakes(sid)
                const amountEth = Number(ethers.formatEther(rawStake[1]))
                const lockedUntilSec = Number(rawStake[2])
                const createdAtSec = Number(rawStake[3])

                if (rawStake[4]) {
                    tempUserStakingPower += amountEth
                }

                positions.push({
                    stakeId: Number(rawStake[0]),
                    amount: amountEth,
                    lockedUntil: new Date(lockedUntilSec * 1000),
                    createdAt: new Date(createdAtSec * 1000),
                    active: rawStake[4],
                    unstaked: rawStake[5],
                    transferred: rawStake[6],
                    isUnlocked: Date.now() >= lockedUntilSec * 1000
                })
            }

            setUserStakingPower(tempUserStakingPower.toString())
            setUserStakes(positions.sort((a, b) => b.stakeId - a.stakeId))

            // Fetch and parse proposals details from contract
            const proposalItems: ProposalItem[] = []
            const propCount = Number(proposalCountRaw)
            for (let i = propCount; i >= 1; i--) {
                try {
                    const rawProp = await vaultContract.proposals(i)
                    let userVoted = false
                    let userChoice = false
                    try {
                        userVoted = await vaultContract.hasVoted(i, account)
                        if (userVoted) {
                            userChoice = await vaultContract.voteChoice(i, account)
                        }
                    } catch (voteErr) {
                        console.warn(`Failed to inspect user vote on proposal #${i}:`, voteErr)
                    }

                    proposalItems.push({
                        proposalId: Number(rawProp[0]),
                        recipient: rawProp[1],
                        amount: Number(ethers.formatEther(rawProp[2])),
                        createdAt: new Date(Number(rawProp[3]) * 1000),
                        deadline: new Date(Number(rawProp[4]) * 1000),
                        executed: rawProp[5],
                        cancelled: rawProp[6],
                        yesVotes: Number(ethers.formatEther(rawProp[7])),
                        noVotes: Number(ethers.formatEther(rawProp[8])),
                        snapshotTotalStake: Number(ethers.formatEther(rawProp[9])),
                        userHasVoted: userVoted,
                        userVoteChoice: userChoice
                    })
                } catch (e) {
                    console.error(`Failed to load details for proposal #${i}:`, e)
                }
            }
            setProposals(proposalItems)

        } catch (err) {
            console.error("Failed to query smart contract states:", err)
        }
    }, [account])

    // Trigger loads upon account or chain updates
    useEffect(() => {
        if (account && chainId === OPBNB_CHAIN_ID) {
            refreshStakingDetails()
        }
    }, [account, chainId, refreshStakingDetails])

    // Execute ERC-20 Approve
    const handleApprove = async () => {
        if (typeof window === "undefined" || !window.ethereum || !account) return
        setBusy(true)
        setMessage({ text: "인가 금액 승인을 조율 중입니다. 지갑 확인 필요...", type: "info" })
        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const ztroContract = new ethers.Contract(ZTRO_TOKEN_ADDRESS, ERC20_ABI, signer)

            // Unlimited approve
            const tx = await ztroContract.approve(ZTRO_VAULT_CONTRACT_ADDRESS, ethers.MaxUint256)

            setMessage({ text: "트랜잭션이 블록에 포함되길 기다리는 중입니다...", type: "info" })
            await tx.wait()

            setMessage({ text: "사용 승인 완료!", type: "success" })
            refreshStakingDetails()
        } catch (err: any) {
            console.error(err)
            setMessage({ text: err.reason || err.message || "Approve 실패", type: "error" })
        } finally {
            setBusy(false)
        }
    }

    // Execute Staking
    const handleStaking = async () => {
        if (!stakeAmount || isNaN(Number(stakeAmount)) || Number(stakeAmount) <= 0) {
            setMessage({ text: "올바른 스테이킹 수량을 지정해 주세요.", type: "error" })
            return
        }
        if (typeof window === "undefined" || !window.ethereum || !account) return
        setBusy(true)
        setMessage({ text: "스테이킹 트랜잭션을 준비 중입니다. 지갑 확인 필요...", type: "info" })
        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const vaultContract = new ethers.Contract(ZTRO_VAULT_CONTRACT_ADDRESS, VAULT_ABI, signer)

            const amountWei = ethers.parseEther(stakeAmount)
            const tx = await vaultContract.stake(amountWei, lockDays)

            setMessage({ text: "스테이킹 트랜잭션을 전송하여 승인 대기 중입니다...", type: "info" })
            await tx.wait()

            setMessage({ text: "ZTRO 스테이킹 성공!", type: "success" })
            setStakeAmount("")
            refreshStakingDetails()
        } catch (err: any) {
            console.error(err)
            setMessage({ text: err.reason || err.message || "Staking 트랜잭션 실패", type: "error" })
        } finally {
            setBusy(false)
        }
    }

    // Execute Unstake
    const handleUnstake = async (stakeId: number) => {
        if (typeof window === "undefined" || !window.ethereum || !account) return
        setBusy(true)
        setMessage({ text: `스테이킹 #${stakeId} 언스테이킹 승인 조율 중...`, type: "info" })
        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const vaultContract = new ethers.Contract(ZTRO_VAULT_CONTRACT_ADDRESS, VAULT_ABI, signer)

            const tx = await vaultContract.unstake(stakeId)
            setMessage({ text: "트랜잭션 블록 대기 중입니다...", type: "info" })
            await tx.wait()

            setMessage({ text: "언스테이킹 성공! 이제 토큰 회수가 가능합니다.", type: "success" })
            refreshStakingDetails()
        } catch (err: any) {
            console.error(err)
            setMessage({ text: err.reason || err.message || "Unstake 트랜잭션 실패", type: "error" })
        } finally {
            setBusy(false)
        }
    }

    // Execute Transfer Out (Claim Back tokens)
    const handleTransferOut = async (stakeId: number) => {
        if (typeof window === "undefined" || !window.ethereum || !account) return
        setBusy(true)
        setMessage({ text: `스테이킹 #${stakeId} 자산 내 지갑 환원 중...`, type: "info" })
        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const vaultContract = new ethers.Contract(ZTRO_VAULT_CONTRACT_ADDRESS, VAULT_ABI, signer)

            const tx = await vaultContract.transferOut(stakeId, account)
            setMessage({ text: "트랜잭션 승인을 확인 중입니다...", type: "info" })
            await tx.wait()

            setMessage({ text: "자산 회수가 성공적으로 끝났습니다!", type: "success" })
            refreshStakingDetails()
        } catch (err: any) {
            console.error(err)
            setMessage({ text: err.reason || err.message || "Transfer Out 실패", type: "error" })
        } finally {
            setBusy(false)
        }
    }

    // Execute Create Proposal
    const handleCreateProposal = async () => {
        if (!proposalRecipient || !ethers.isAddress(proposalRecipient)) {
            setMessage({ text: "올바른 대상 지갑 주소를 입력대조해 주세요.", type: "error" })
            return
        }
        if (!proposalAmount || isNaN(Number(proposalAmount)) || Number(proposalAmount) <= 0) {
            setMessage({ text: "올바른 인출 수량을 지정해 주세요.", type: "error" })
            return
        }
        if (typeof window === "undefined" || !window.ethereum || !account) return
        setBusy(true)
        setMessage({ text: "신규 안건 발의 트랜잭션을 준비 중입니다. 지갑 확인 필요...", type: "info" })
        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const vaultContract = new ethers.Contract(ZTRO_VAULT_CONTRACT_ADDRESS, VAULT_ABI, signer)

            const amountWei = ethers.parseEther(proposalAmount)
            const tx = await vaultContract.createProposal(proposalRecipient, amountWei)

            setMessage({ text: "안건 발의 트랜잭션을 전송하여 승인 대기 중입니다...", type: "info" })
            await tx.wait()

            setMessage({ text: "DAO 거버넌스 안건 발의 성공!", type: "success" })
            setProposalRecipient("")
            setProposalAmount("")
            refreshStakingDetails()
        } catch (err: any) {
            console.error(err)
            setMessage({ text: err.reason || err.message || "안건 발의 실패 (컨트랙트 소유자 권한 점검 요망)", type: "error" })
        } finally {
            setBusy(false)
        }
    }

    // Execute Vote
    const handleVote = async (proposalId: number, support: boolean) => {
        if (typeof window === "undefined" || !window.ethereum || !account) return
        setBusy(true)
        setMessage({ text: `안건 #${proposalId}에 대한 투표를 진행 중입니다. 지갑 승인 필요...`, type: "info" })
        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const vaultContract = new ethers.Contract(ZTRO_VAULT_CONTRACT_ADDRESS, VAULT_ABI, signer)

            const tx = await vaultContract.vote(proposalId, support)
            setMessage({ text: "투표 트랜잭션이 블록에 포함되길 기다리는 중입니다...", type: "info" })
            await tx.wait()

            setMessage({ text: `안건 #${proposalId} 투표 성공!`, type: "success" })
            refreshStakingDetails()
        } catch (err: any) {
            console.error(err)
            setMessage({ text: err.reason || err.message || "투표 트스크 실패 (투표 가중치 파워 점검 요망)", type: "error" })
        } finally {
            setBusy(false)
        }
    }

    // Execute Proposal
    const handleExecuteProposal = async (proposalId: number) => {
        if (typeof window === "undefined" || !window.ethereum || !account) return
        setBusy(true)
        setMessage({ text: `안건 #${proposalId} 실행을 준비 중입니다. 지갑 확인 필요...`, type: "info" })
        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const vaultContract = new ethers.Contract(ZTRO_VAULT_CONTRACT_ADDRESS, VAULT_ABI, signer)

            const tx = await vaultContract.executeProposal(proposalId)
            setMessage({ text: "실행 트랜잭션의 승인을 확인 중입니다...", type: "info" })
            await tx.wait()

            setMessage({ text: `안건 #${proposalId} 실행 성공! 금고 자산 인출 완료.`, type: "success" })
            refreshStakingDetails()
        } catch (err: any) {
            console.error(err)
            setMessage({ text: err.reason || err.message || "안건 실행 실패 (가결 기준 및 소유자 권한 점검)", type: "error" })
        } finally {
            setBusy(false)
        }
    }

    // Cancel Proposal
    const handleCancelProposal = async (proposalId: number) => {
        if (typeof window === "undefined" || !window.ethereum || !account) return
        setBusy(true)
        setMessage({ text: `안건 #${proposalId} 취소를 조율 중입니다. 지갑 확인 필요...`, type: "info" })
        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const vaultContract = new ethers.Contract(ZTRO_VAULT_CONTRACT_ADDRESS, VAULT_ABI, signer)

            const tx = await vaultContract.cancelProposal(proposalId)
            setMessage({ text: "취소 트랜잭션 처리 중입니다...", type: "info" })
            await tx.wait()

            setMessage({ text: `안건 #${proposalId} 취소 완료!`, type: "success" })
            refreshStakingDetails()
        } catch (err: any) {
            console.error(err)
            setMessage({ text: err.reason || err.message || "안건 취소 실패 (소유자 권한 점검)", type: "error" })
        } finally {
            setBusy(false)
        }
    }

    const isChainCorrect = chainId === OPBNB_CHAIN_ID
    const isApproved = Number(allowance) >= Number(stakeAmount || "0")

    if (!clientInit) {
        return <div className="p-10 text-center text-muted-foreground">Initializing Web3...</div>
    }

    return (
        <div className="min-h-screen bg-[#07090e] text-slate-100">
            <PageHeader
                eyebrow="DAO Governance"
                title="ZTRO Vault DAO Staking"
                description="700,000,000 ZTRO 보증 기금을 기반으로 가동되는 개인 메타마스크 지갑 전용 온체인 스테이킹. ZTRO를 잠금하여 거버넌스 투표권 및 배당 청구 권리를 확보하세요."
            />

            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">

                {/* Top summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-xl border border-blue-500/20 bg-slate-900/60 p-6 backdrop-blur-md">
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400/80">
                            총 Reserve (계약 보유량)
                        </span>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-bold font-mono tracking-tight text-white">
                                {Number(lockedContractZtro).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-sm font-medium text-slate-400">ZTRO</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                            재원 보조용 7억 개 포함 계약에 속해있는 전체 가용 규모
                        </p>
                    </div>

                    <div className="rounded-xl border border-indigo-500/20 bg-slate-900/60 p-6 backdrop-blur-md">
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400/80">
                            전체 스테이킹 총합 (totalStaked)
                        </span>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-bold font-mono tracking-tight text-white">
                                {Number(totalStaked).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-sm font-medium text-slate-400">ZTRO</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                            현재 풀 내 다수 거버너들이 예치 중인 총량
                        </p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-6 backdrop-blur-md">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">
                            나의 Staking Power (활성)
                        </span>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-bold font-mono tracking-tight text-white">
                                {Number(userStakingPower).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-sm font-medium text-slate-400">ZTRO</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                            현재 참여 중인 내 온체인 투표 영향력 규모
                        </p>
                    </div>
                </div>

                {/* Setup messages */}
                {message && (
                    <div className={`p-4 rounded-xl text-sm border ${message.type === "success"
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                        : message.type === "error"
                            ? "bg-rose-950/20 border-rose-500/30 text-rose-400"
                            : "bg-slate-900 border-slate-700 text-slate-400"
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* main interactive core */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Staking interaction form */}
                    <div className="lg:col-span-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-6 flex flex-col gap-6 backdrop-blur-xl">
                        <h3 className="font-display text-lg font-semibold flex items-center gap-2 text-white">
                            <Sparkles className="h-5 w-5 text-indigo-400" />
                            ZTRO 스테이킹 액션
                        </h3>

                        {/* Wallet switch check */}
                        {!account || !isChainCorrect ? (
                            <div className="rounded-xl bg-orange-950/15 border border-orange-500/30 p-4 text-xs text-orange-400/90 flex flex-col gap-3">
                                <div className="flex items-start gap-2">
                                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block mb-0.5">네트워크 또는 지갑 연결 없음</span>
                                        온체인 지갑이 감지되지 않았거나 타 체인 정보로 수배되었습니다. opBNB 네트워크(Chain ID: 204)로의 세팅을 조율해 주세요.
                                    </div>
                                </div>
                                <Button
                                    onClick={connectAndSwitchToOpBnb}
                                    disabled={busy}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs mt-1"
                                >
                                    <Wallet className="h-4 w-4 mr-2" />
                                    지갑 연결 및 opBNB 전환
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-xs space-y-2">
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>연결된 계정:</span>
                                    <span className="font-mono text-white text-[11px] bg-slate-800 py-0.5 px-2 rounded">
                                        {account.slice(0, 6)}...{account.slice(-4)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>내 ZTRO 잔액:</span>
                                    <span className="font-semibold text-emerald-400">
                                        {Number(ztroBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} ZTRO
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>금고 승인 한도:</span>
                                    <span className="font-mono text-slate-300">
                                        {Number(allowance).toLocaleString(undefined, { maximumFractionDigits: 2 })} ZTRO
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Stake Input options */}
                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col gap-1 text-xs text-slate-400">
                                스테이킹 금액 (ZTRO)
                                <input
                                    type="text"
                                    placeholder="0.0"
                                    className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                                    value={stakeAmount}
                                    onChange={(e) => setStakeAmount(e.target.value)}
                                    disabled={busy || !account || !isChainCorrect}
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-xs text-slate-400">
                                락업 기간 선택 (정확형 30일 배수)
                                <select
                                    className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    value={lockDays}
                                    onChange={(e) => setLockDays(Number(e.target.value))}
                                    disabled={busy || !account || !isChainCorrect}
                                >
                                    <option value={30}>30일 (1개월)</option>
                                    <option value={90}>90일 (3개월)</option>
                                    <option value={180}>180일 (6개월)</option>
                                    <option value={365}>365일 (12개월)</option>
                                    <option value={1095}>1095일 (36개월 / 3년)</option>
                                </select>
                            </label>

                            <div className="pt-2">
                                {!isApproved ? (
                                    <Button
                                        onClick={handleApprove}
                                        disabled={busy || !account || !isChainCorrect || !stakeAmount}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5"
                                    >
                                        {busy ? "인증 로컬 조율 중..." : "1단계: ZTRO 토큰 사용 승인 (Approve)"}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleStaking}
                                        disabled={busy || !account || !isChainCorrect || !stakeAmount}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5"
                                    >
                                        {busy ? "트랜잭션 처리 중..." : "2단계: 금고 스테이킹 실행 (Stake)"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Withdraw/Transfer flags advisory */}
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-[11px] text-slate-400 space-y-2">
                            <span className="font-semibold block text-slate-200">금고 출금 승인 권한 (Advisory)</span>
                            <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                                <div className="p-2 rounded bg-slate-950 border border-slate-800 flex flex-col gap-0.5">
                                    <span className="text-[10px] text-slate-500">인출(Unstake) 권한</span>
                                    <span className={withdrawApprovedFlag ? "text-emerald-400 font-bold" : "text-rose-400"}>
                                        {withdrawApprovedFlag ? "승인완료" : "미승인"}
                                    </span>
                                </div>
                                <div className="p-2 rounded bg-slate-950 border border-slate-800 flex flex-col gap-0.5">
                                    <span className="text-[10px] text-slate-500">배출(Transfer) 권한</span>
                                    <span className={transferApprovedFlag ? "text-emerald-400 font-bold" : "text-rose-400"}>
                                        {transferApprovedFlag ? "승인완료" : "미승인"}
                                    </span>
                                </div>
                            </div>
                            <p className="leading-relaxed">
                                ※ 해킹 및 자금 탈취 보안 방지를 위해 법정 락업 만료 후 언스테이킹(Unstake)과 자금 인출(transferOut)에는 관리자의 온체인 화이트리스트 사전 승인이 요구됩니다 (동작에 미승인이 조율될 경우 관리자 채널에 화이트리스트 갱신을 건의해 주세요).
                            </p>
                        </div>

                    </div>

                    {/* Staking positions lists summary */}
                    <div className="lg:col-span-7 flex flex-col gap-6">

                        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-6 flex flex-col gap-4 backdrop-blur-xl">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-indigo-400" />
                                    나의 온체인 스테이킹 목록
                                </h3>
                                <Button
                                    onClick={refreshStakingDetails}
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-slate-800 text-slate-400 hover:text-white"
                                    title="새로고침"
                                    disabled={busy}
                                >
                                    <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                                </Button>
                            </div>

                            {!account ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                                    <div className="text-xs text-slate-500 max-w-sm">
                                        나의 ZTRO 스테이킹 수량, 락업 만기 현황 및 최종 자산 인출을 확인하려면 개인 Web3 지갑 연동이 필요합니다.
                                    </div>
                                    <Button
                                        onClick={connectAndSwitchToOpBnb}
                                        disabled={busy}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-2 flex items-center gap-2"
                                    >
                                        <Wallet className="h-4 w-4" />
                                        개인 지갑 연결 (Connect MetaMask)
                                    </Button>
                                </div>
                            ) : userStakes.length === 0 ? (
                                <div className="py-12 text-center text-xs text-slate-500">
                                    현재 지갑 주소로 참여한 ZTRO 금고 스테이킹 내역이 없습니다.
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 select-none">
                                    {userStakes.map((pos) => (
                                        <div
                                            key={pos.stakeId}
                                            className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${!pos.active
                                                ? "bg-slate-900/30 border-slate-800/40 opacity-70"
                                                : pos.isUnlocked
                                                    ? "bg-indigo-950/10 border-indigo-500/30"
                                                    : "bg-slate-900/70 border-slate-800"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-semibold text-slate-400">ID: #{pos.stakeId}</span>
                                                    {pos.active ? (
                                                        pos.isUnlocked ? (
                                                            <Badge className="bg-indigo-600/20 text-indigo-400 border-indigo-500/20 text-[10px]">락업해제 (만기)</Badge>
                                                        ) : (
                                                            <Badge className="bg-orange-600/10 text-orange-400 border-orange-500/20 text-[10px]">잠금중</Badge>
                                                        )
                                                    ) : pos.transferred ? (
                                                        <Badge className="bg-slate-800 text-slate-500 border-slate-800 text-[10px]">회수완료</Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-600/10 text-emerald-400 border-emerald-500/20 text-[10px]">반환됨 (Unstaked)</Badge>
                                                    )}
                                                </div>
                                                <span className="font-mono text-sm font-bold text-white">
                                                    {pos.amount.toLocaleString()} ZTRO
                                                </span>
                                            </div>

                                            {/* Timeline */}
                                            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                                                <div>
                                                    <span className="block text-[10px] text-slate-600">예치 시작일</span>
                                                    <span>{pos.createdAt.toLocaleDateString()}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-600">락업 만기일</span>
                                                    <span>{pos.lockedUntil.toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {/* Actions within current stake card */}
                                            <div className="flex justify-end gap-2 border-t border-slate-800/80 pt-3">
                                                {pos.active ? (
                                                    <Button
                                                        onClick={() => handleUnstake(pos.stakeId)}
                                                        disabled={busy || !pos.isUnlocked || !withdrawApprovedFlag}
                                                        className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs py-1.5 px-3.5 h-8"
                                                    >
                                                        {!pos.isUnlocked
                                                            ? "락업 잠금 해제 대기"
                                                            : !withdrawApprovedFlag
                                                                ? "출금 승인 대기"
                                                                : "언스테이킹 실행 (Unstake)"}
                                                    </Button>
                                                ) : !pos.transferred ? (
                                                    <Button
                                                        onClick={() => handleTransferOut(pos.stakeId)}
                                                        disabled={busy || !transferApprovedFlag}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-1.5 px-3.5 h-8 flex items-center gap-1"
                                                    >
                                                        <ArrowUpRight className="h-3 w.3" />
                                                        {!transferApprovedFlag ? "이체 승인 대기" : "내 지갑으로 출금 (Withdraw)"}
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-slate-600 py-1">자산 회수 및 이체가 정비되었습니다.</span>
                                                )}
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Extra DAO Voting Info banner */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-xs text-slate-400 space-y-2">
                            <h4 className="font-semibold text-slate-200">ZTRO 거버너 위상 및 역할</h4>
                            <p className="leading-relaxed">
                                Vault DAO 의 모든 투표권(Voting Power)은 해당 지갑의 누적 활성 스테이킹 ZTRO 수량의 가중치로 구성됩니다. 제안(Proposals)이 발의될 경우, 거버너는 서명 권리를 통해 해당 인출 또는 안건에 찬반 의사를 행사할 수 있습니다. 30일 배수로 락업 기간이 높을수록 리워드 획득 비율과 생태계 참여 지위가 강화됩니다.
                            </p>
                        </div>

                        {/* DAO Proposals Section */}
                        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-6 flex flex-col gap-6 backdrop-blur-xl">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                                    <Vote className="h-5 w-5 text-indigo-400" />
                                    {t.daoStakingPage.proposalSectionTitle}
                                </h3>
                                <Button
                                    onClick={refreshStakingDetails}
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-slate-800 text-slate-400 hover:text-white"
                                    title="새로고침"
                                    disabled={busy}
                                >
                                    <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                                </Button>
                            </div>

                            {/* Create Proposal Form - Admin Only view, normal users see guidelines */}
                            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 space-y-4">
                                <span className="text-xs font-semibold text-slate-200 block flex items-center gap-1.5">
                                    <Megaphone className="h-4 w-4 text-indigo-400" />
                                    {t.daoStakingPage.proposalCreateTitle}
                                </span>
                                {isOwner ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="flex flex-col gap-1 text-xs text-slate-400">
                                            {t.daoStakingPage.proposalRecipientLabel}
                                            <input
                                                type="text"
                                                placeholder="0x..."
                                                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                                                value={proposalRecipient}
                                                onChange={(e) => setProposalRecipient(e.target.value)}
                                                disabled={busy}
                                            />
                                        </label>
                                        <div className="flex gap-3 items-end">
                                            <label className="flex-1 flex flex-col gap-1 text-xs text-slate-400">
                                                {t.daoStakingPage.proposalAmountLabel}
                                                <input
                                                    type="text"
                                                    placeholder="0.0"
                                                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                                                    value={proposalAmount}
                                                    onChange={(e) => setProposalAmount(e.target.value)}
                                                    disabled={busy}
                                                />
                                            </label>
                                            <Button
                                                onClick={handleCreateProposal}
                                                disabled={busy || !proposalRecipient || !proposalAmount}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-[34px]"
                                            >
                                                {t.daoStakingPage.proposalSubmitButton}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-400 italic">
                                        {t.daoStakingPage.proposalOwnerOnlyAlert}
                                    </p>
                                )}
                            </div>

                            {/* Proposals list */}
                            {!account ? (
                                <div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
                                    <div className="text-xs text-slate-500 max-w-sm">
                                        지갑을 온체인 연결하시면 DAO 제안 목록 조회 및 거버넌스 투표 참여가 가능합니다.
                                    </div>
                                    <Button
                                        onClick={connectAndSwitchToOpBnb}
                                        disabled={busy}
                                        className="bg-indigo-600/90 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-2 flex items-center gap-2"
                                    >
                                        <Wallet className="h-4 w-4" />
                                        개인 지갑 연결 (Connect MetaMask)
                                    </Button>
                                </div>
                            ) : proposals.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-500">
                                    {t.daoStakingPage.proposalListEmpty}
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 select-none">
                                    {proposals.map((prop) => {
                                        const now = Date.now()
                                        const deadlineMs = prop.deadline.getTime()
                                        const isExpired = now >= deadlineMs
                                        const totalVotes = prop.yesVotes + prop.noVotes
                                        const yesPercent = totalVotes > 0 ? (prop.yesVotes / totalVotes) * 100 : 0
                                        const noPercent = totalVotes > 0 ? (prop.noVotes / totalVotes) * 100 : 0

                                        let statusBadge = (
                                            <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/20 text-[10px]">
                                                {t.daoStakingPage.proposalStatusActive}
                                            </Badge>
                                        )
                                        if (prop.executed) {
                                            statusBadge = (
                                                <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/20 text-[10px]">
                                                    {t.daoStakingPage.proposalStatusExecuted}
                                                </Badge>
                                            )
                                        } else if (prop.cancelled) {
                                            statusBadge = (
                                                <Badge className="bg-slate-800 text-slate-500 border-slate-800 text-[10px]">
                                                    {t.daoStakingPage.proposalStatusCancelled}
                                                </Badge>
                                            )
                                        } else if (isExpired) {
                                            statusBadge = (
                                                <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/20 text-[10px]">
                                                    {t.daoStakingPage.proposalStatusPassed}
                                                </Badge>
                                            )
                                        }

                                        return (
                                            <div
                                                key={prop.proposalId}
                                                className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col gap-3 transition-colors hover:border-slate-700/80"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs font-semibold text-slate-400">ID: #{prop.proposalId}</span>
                                                            {statusBadge}
                                                        </div>
                                                        <span className="block text-[10px] text-slate-500 font-mono">
                                                            Recipient: {prop.recipient}
                                                        </span>
                                                    </div>
                                                    <span className="font-mono text-sm font-bold text-white">
                                                        {prop.amount.toLocaleString()} ZTRO
                                                    </span>
                                                </div>

                                                {/* Progress Bar for vote weights */}
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-[10px] text-slate-400">
                                                        <span>{t.daoStakingPage.voteStatusLabel.replace("{yes}", prop.yesVotes.toLocaleString()).replace("{no}", prop.noVotes.toLocaleString())}</span>
                                                        <span>투표 가중치: {totalVotes.toLocaleString()} ZTRO</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden flex">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${yesPercent}%` }} />
                                                        <div className="h-full bg-rose-500" style={{ width: `${noPercent}%` }} />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-[10px] text-slate-500">
                                                    <span>발의일: {prop.createdAt.toLocaleString()}</span>
                                                    <span className={isExpired ? "text-amber-500" : ""}>
                                                        마감일: {prop.deadline.toLocaleString()} {isExpired && "(만료)"}
                                                    </span>
                                                </div>

                                                {/* Voting actions */}
                                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleVote(prop.proposalId, true)}
                                                            disabled={busy || isExpired || prop.executed || prop.cancelled || prop.userHasVoted}
                                                            className={`text-xs px-3 py-1.5 h-8 flex items-center gap-1 ${prop.userHasVoted && prop.userVoteChoice
                                                                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                                                                : "bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800"
                                                                }`}
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            {t.daoStakingPage.voteYesButton}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleVote(prop.proposalId, false)}
                                                            disabled={busy || isExpired || prop.executed || prop.cancelled || prop.userHasVoted}
                                                            className={`text-xs px-3 py-1.5 h-8 flex items-center gap-1 ${prop.userHasVoted && !prop.userVoteChoice
                                                                ? "bg-rose-600/20 text-rose-400 border border-rose-500/30"
                                                                : "bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800"
                                                                }`}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                            {t.daoStakingPage.voteNoButton}
                                                        </Button>
                                                    </div>

                                                    {/* Admin proposal controls */}
                                                    {isOwner && !prop.executed && !prop.cancelled && (
                                                        <div className="flex gap-2 ml-auto">
                                                            <Button
                                                                onClick={() => handleExecuteProposal(prop.proposalId)}
                                                                disabled={busy}
                                                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] px-3 py-1 h-8"
                                                            >
                                                                {t.daoStakingPage.executeButton}
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleCancelProposal(prop.proposalId)}
                                                                disabled={busy}
                                                                className="bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-900/30 text-[11px] px-3 py-1 h-8"
                                                            >
                                                                {t.daoStakingPage.cancelButton}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                    </div>

                </div>

            </div>
        </div>
    )
}
