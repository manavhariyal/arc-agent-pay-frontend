import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSendPayment } from '@/hooks/useSendPayment'
import { useTransactions } from '@/hooks/useTransactions'
import { useAgents } from '@/hooks/useAgents'
import { useWallet } from '@/hooks/useWallet'
import { useToast } from '@/hooks/use-toast'
import { ARC_NETWORK } from '@/config/arc-network'
import { cn, truncateAddress } from '@/lib/utils'
import { Send, Loader2, CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react'
import { formatUnits } from 'viem'

interface SendPaymentDialogProps {
  open: boolean
  onClose: () => void
  prefilledAddress?: string
  prefilledAgentId?: string
}

export function SendPaymentDialog({ open, onClose, prefilledAddress, prefilledAgentId }: SendPaymentDialogProps) {
  const { toast } = useToast()
  const { address, isConnected, isOnArcTestnet, formattedBalance } = useWallet()
  const { agents } = useAgents()
  const { addTransaction } = useTransactions()
  const { send, hash, isPending, isConfirming, isConfirmed, error, reset } = useSendPayment()

  const [recipient, setRecipient] = useState(prefilledAddress ?? '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState(prefilledAgentId ?? '')
  const [savedHash, setSavedHash] = useState<string | undefined>()

  useEffect(() => {
    if (open) {
      setRecipient(prefilledAddress ?? '')
      setSelectedAgentId(prefilledAgentId ?? '')
    }
  }, [open, prefilledAddress, prefilledAgentId])

  useEffect(() => {
    if (hash && !savedHash) {
      setSavedHash(hash)
      const agent = agents.find(a => a.id === selectedAgentId)
      addTransaction({
        hash,
        fromAddress: address!,
        toAddress: recipient,
        amount: (parseFloat(amount) * 1e18).toString(),
        agentId: agent?.id,
        agentName: agent?.name,
        note: note || undefined,
        timestamp: Date.now(),
        status: 'pending',
      })
    }
  }, [hash])

  useEffect(() => {
    if (isConfirmed && savedHash) {
      toast({
        title: 'Payment confirmed!',
        description: `${amount} USDC sent to ${truncateAddress(recipient)}`,
      })
    }
  }, [isConfirmed])

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  useEffect(() => {
    if (selectedAgent) {
      setRecipient(selectedAgent.address)
    }
  }, [selectedAgentId])

  const handleClose = () => {
    reset()
    setSavedHash(undefined)
    setRecipient(prefilledAddress ?? '')
    setAmount('')
    setNote('')
    setSelectedAgentId(prefilledAgentId ?? '')
    onClose()
  }

  const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(recipient)
  const isValidAmount = parseFloat(amount) > 0 && !isNaN(parseFloat(amount))
  const canSend = isValidAddress && isValidAmount && isConnected && isOnArcTestnet && !isPending && !isConfirming

  const handleSend = () => {
    if (!canSend) return
    send(recipient as `0x${string}`, amount)
  }

  if (!isConnected) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="glass-panel-elevated border-[#0A84FF]/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">Send USDC</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400" />
            <p className="text-white/60">Connect your MetaMask wallet to send payments on Arc Testnet.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!isOnArcTestnet) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="glass-panel-elevated border-[#0A84FF]/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">Send USDC</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400" />
            <p className="text-white/60">Switch to Arc Testnet (Chain ID: {ARC_NETWORK.chainId}) to send payments.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-panel-elevated border-[#0A84FF]/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
            <Send className="w-5 h-5 text-[#3AB4FF]" /> Send USDC
          </DialogTitle>
        </DialogHeader>

        {isConfirmed && savedHash ? (
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <div>
              <div className="text-white font-bold text-xl mb-1">Payment Sent!</div>
              <div className="text-white/50 text-sm">{amount} USDC → {truncateAddress(recipient)}</div>
            </div>
            <a
              href={`${ARC_NETWORK.explorerUrl}/tx/${savedHash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-[#3AB4FF] hover:text-[#22F0FF] transition-colors text-sm font-semibold"
            >
              View on ArcScan <ExternalLink className="w-4 h-4" />
            </a>
            <Button onClick={handleClose} className="w-full bg-[#0B3FD1] hover:bg-[#072E9E] text-white rounded-xl h-11">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between text-xs text-white/40 bg-white/[0.03] rounded-xl px-4 py-2.5 border border-white/[0.06]">
              <span>Your balance</span>
              <span className="font-mono font-bold text-[#22F0FF]">{formattedBalance ?? '—'} USDC</span>
            </div>

            {agents.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                  Quick-select Agent (optional)
                </Label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger className="glass-panel border-[#0A84FF]/20 text-white h-11 rounded-xl">
                    <SelectValue placeholder="Select an agent address…" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel-elevated border-[#0A84FF]/20 rounded-xl">
                    <SelectItem value="none" className="text-white/50 rounded-lg">No agent</SelectItem>
                    {agents.map(a => (
                      <SelectItem key={a.id} value={a.id} className="text-white rounded-lg">
                        {a.name} — {truncateAddress(a.address)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                Recipient Address
              </Label>
              <Input
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="0x…"
                className={cn(
                  "glass-panel border-[#0A84FF]/20 text-white font-mono h-11 rounded-xl focus-visible:ring-[#0A84FF]/40",
                  recipient && !isValidAddress && "border-rose-500/40 focus-visible:ring-rose-500/30"
                )}
              />
              {recipient && !isValidAddress && (
                <p className="text-rose-400 text-xs">Invalid Ethereum address</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                Amount (USDC)
              </Label>
              <Input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                type="number"
                min="0"
                step="0.001"
                className="glass-panel border-[#0A84FF]/20 text-white h-11 rounded-xl focus-visible:ring-[#0A84FF]/40"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                Note (optional)
              </Label>
              <Input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="What's this for?"
                className="glass-panel border-[#0A84FF]/20 text-white h-11 rounded-xl focus-visible:ring-[#0A84FF]/40"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error.message?.slice(0, 100) || 'Transaction failed'}</span>
              </div>
            )}

            {(isPending || isConfirming) && (
              <div className="flex items-center gap-3 text-sm text-white/60 bg-[#0A84FF]/5 border border-[#0A84FF]/20 rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-[#3AB4FF] shrink-0" />
                <span>
                  {isPending ? 'Waiting for MetaMask confirmation…' : 'Broadcasting transaction…'}
                </span>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full h-12 bg-gradient-to-r from-[#0B3FD1] to-[#049CAE] hover:from-[#072E9E] hover:to-[#037685] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(10,132,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending || isConfirming ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending…</span>
              ) : (
                <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Send {amount ? `${amount} USDC` : 'USDC'}</span>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
