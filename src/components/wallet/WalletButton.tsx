import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Wallet, LogOut, AlertTriangle, Loader2, ExternalLink, Copy, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ARC_NETWORK } from '@/config/arc-network'

function truncate(addr: string) {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const {
    address,
    isConnected,
    isConnecting,
    isSwitching,
    formattedBalance,
    isOnArcTestnet,
    isMetaMaskAvailable,
    connectMetaMask,
    switchToArc,
    disconnect,
  } = useWallet()
  const { toast } = useToast()

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({ title: 'Copied', description: 'Wallet address copied to clipboard.' })
    }
  }

  if (!isConnected) {
    return (
      <div className={cn('flex flex-col gap-1.5', compact && 'w-full')}>
        <Button
          onClick={connectMetaMask}
          disabled={isConnecting}
          className={cn(
            'bg-primary hover:bg-primary/90 text-white font-semibold',
            'shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]',
            'transition-all duration-200',
            compact && 'w-full justify-center'
          )}
        >
          {isConnecting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting…</>
          ) : (
            <><Wallet className="w-4 h-4 mr-2" /> Connect MetaMask</>
          )}
        </Button>
        {!isMetaMaskAvailable && (
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noreferrer"
            className={cn(
              'flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/50 transition-colors',
              compact ? 'justify-center' : 'justify-start'
            )}
          >
            <Download className="w-3 h-3" /> Install MetaMask
          </a>
        )}
      </div>
    )
  }

  if (!isOnArcTestnet) {
    return (
      <Button
        onClick={switchToArc}
        disabled={isSwitching}
        className={cn(
          'bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30',
          'font-semibold transition-all duration-200',
          compact && 'w-full justify-center'
        )}
      >
        {isSwitching ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Switching…</>
        ) : (
          <><AlertTriangle className="w-4 h-4 mr-2" /> Switch to Arc Testnet</>
        )}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-xl',
            'bg-card/60 backdrop-blur-xl border border-indigo-500/20',
            'hover:border-indigo-500/40 transition-all duration-200 cursor-pointer',
            'shadow-[0_2px_12px_rgba(0,0,0,0.3)]',
            compact && 'w-full'
          )}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" />
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="font-mono text-xs text-white leading-tight">{truncate(address!)}</span>
            <span className="text-[10px] text-indigo-300/70 leading-tight">
              {formattedBalance ?? '…'} USDC
            </span>
          </div>
          <Wallet className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 bg-[#0f1220]/95 backdrop-blur-xl border border-indigo-500/20 text-white shadow-2xl"
      >
        <div className="px-3 py-3 border-b border-white/5">
          <div className="text-xs text-indigo-300/60 mb-1">Connected wallet</div>
          <div className="font-mono text-xs text-white break-all">{address}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
            <span className="text-xs text-emerald-400 font-medium">
              Arc Testnet · Chain {ARC_NETWORK.chainId}
            </span>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-white/5">
          <div className="text-[10px] text-indigo-300/60 mb-0.5 uppercase tracking-wider">USDC Balance</div>
          <div className="font-mono font-bold text-white text-lg">
            {formattedBalance ?? '…'}{' '}
            <span className="text-xs text-indigo-300/60">USDC</span>
          </div>
        </div>

        <DropdownMenuItem
          onClick={copyAddress}
          className="cursor-pointer hover:bg-white/5 focus:bg-white/5 gap-2 text-sm"
        >
          <Copy className="w-3.5 h-3.5 text-indigo-400" /> Copy address
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={`${ARC_NETWORK.explorerUrl}/address/${address}`}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer hover:bg-white/5 focus:bg-white/5 gap-2 text-sm flex items-center px-2 py-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" /> View on ArcScan
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/5" />

        <DropdownMenuItem
          onClick={() => disconnect()}
          className="cursor-pointer text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-400 gap-2 text-sm"
        >
          <LogOut className="w-3.5 h-3.5" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
