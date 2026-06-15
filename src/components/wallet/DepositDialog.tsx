import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWallet } from '@/hooks/useWallet'
import { useUserBalance } from '@/hooks/useUserBalance'
import { Copy, Zap, CheckCircle2, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ARC_NETWORK } from '@/config/arc-network'

const TREASURY_ADDRESS = '0x48f40e29eb0aef155c3dac794d7a34d95bddc918'

interface DepositDialogProps {
  open: boolean
  onClose: () => void
}

export function DepositDialog({ open, onClose }: DepositDialogProps) {
  const { address, isConnected } = useWallet()
  const { userBalance, fetchBalance, recordDeposit } = useUserBalance()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'input' | 'sending' | 'success'>('input')
  const [txHash, setTxHash] = useState('')

  const copyAddress = () => {
    navigator.clipboard.writeText(TREASURY_ADDRESS)
    toast({ title: 'Copied!', description: 'Treasury address copied.' })
  }

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setStep('sending')

    try {
      const { ethereum } = window as any
      if (!ethereum) throw new Error('MetaMask not found')

      const USDC_ADDRESS = '0x3600000000000000000000000000000000000000'
      const amountInUnits = BigInt(Math.floor(parseFloat(amount) * 1000000))
      const amountHex = amountInUnits.toString(16).padStart(64, '0')

      const transferFn = '0xa9059cbb'
      const paddedAddress = TREASURY_ADDRESS.slice(2).padStart(64, '0')
      const data = transferFn + paddedAddress + amountHex

      const tx = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: USDC_ADDRESS,
          data,
          gas: '0x15F90',
        }],
      })

      setTxHash(tx)
      await recordDeposit(parseFloat(amount), tx)
      await fetchBalance()
      setStep('success')
      toast({ title: 'Deposit Successful!', description: amount + ' USDC deposited!' })
    } catch (err: any) {
      setStep('input')
      toast({ title: 'Transaction failed', description: err.message || 'Please try again.', variant: 'destructive' })
    }
  }

  const handleClose = () => {
    setStep('input')
    setAmount('')
    setTxHash('')
    onClose()
  }

  const explorerUrl = ARC_NETWORK.explorerUrl + '/tx/' + txHash

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] glass-panel-elevated border-cyan-500/20">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Fund Auto-Payments
          </DialogTitle>
          <DialogDescription className="text-white/40">
            Deposit USDC to enable automatic payments from your agents.
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-5 py-2">
            <div className="glass-panel rounded-xl p-4 border border-cyan-500/20">
              <div className="text-xs text-white/40 mb-1">Your Current Balance</div>
              <div className="text-2xl font-black text-cyan-400">
                {userBalance ? parseFloat(userBalance.balance.toString()).toFixed(4) + ' USDC' : '0.0000 USDC'}
              </div>
              <div className="text-xs text-white/30 mt-1">
                {'Total deposited: ' + (userBalance ? parseFloat(userBalance.total_deposited.toString()).toFixed(4) : '0') + ' USDC'}
                {' · Total spent: ' + (userBalance ? parseFloat(userBalance.total_spent.toString()).toFixed(4) : '0') + ' USDC'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Treasury Wallet</Label>
              <div className="flex items-center gap-2 glass-panel rounded-xl p-3 border border-white/10">
                <span className="font-mono text-xs text-white/60 flex-1 truncate">{TREASURY_ADDRESS}</span>
                <button onClick={copyAddress} className="text-white/30 hover:text-cyan-400 transition-colors shrink-0">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Amount to Deposit (USDC)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.1"
                className="glass-panel border-cyan-500/20 text-white h-11 rounded-xl focus-visible:ring-cyan-500/40 text-lg font-bold"
              />
              <div className="flex gap-2">
                {['10', '24', '50', '100'].map(q => (
                  <button
                    key={q}
                    onClick={() => setAmount(q)}
                    className="flex-1 text-xs py-1.5 rounded-lg glass-panel border border-white/10 text-white/50 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
              {amount && parseFloat(amount) > 0 && (
                <p className="text-xs text-white/30">
                  {'Funds ' + Math.floor(parseFloat(amount)) + ' hours of 1 USDC/hr payments'}
                </p>
              )}
            </div>

            <Button
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0 || !isConnected}
              className="w-full h-11 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-xl font-bold disabled:opacity-40"
            >
              <Zap className="w-4 h-4 mr-2" />
              {'Deposit ' + (amount ? amount + ' USDC' : 'USDC')}
            </Button>
          </div>
        )}

        {step === 'sending' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Sending Transaction...</p>
              <p className="text-white/40 text-sm mt-1">Please confirm in MetaMask</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Deposit Successful!</p>
              <p className="text-white/40 text-sm mt-1">{amount + ' USDC added to your balance'}</p>
            </div>
            {txHash && (
  <button
    onClick={() => window.open(explorerUrl, '_blank')}
    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
  >
    View on Arcscan <ExternalLink className="w-3 h-3" />
  </button>
)}
            <Button onClick={handleClose} className="w-full h-11 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-bold">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
