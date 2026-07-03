import { useWallet } from '@/hooks/useWallet'
import { useConnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Wallet, LogOut, AlertTriangle, Loader2, ExternalLink, Copy, Download, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ARC_NETWORK, arcTestnet } from '@/config/arc-network'

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
    switchToArc,
    disconnect,
  } = useWallet()

  const { connectors, connect } = useConnect()
  const { toast } = useToast()

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({ title: 'Copied', description: 'Wallet address copied.' })
    }
  }

  // 🔥 SAFE CONNECT FUNCTION
  const handleConnect = async () => {
    try {
      const metaMaskConnector = connectors.find(c => c.name === 'MetaMask')

      if (!metaMaskConnector) {
        toast({
          title: 'MetaMask not found',
          description: 'Please install MetaMask first.',
        })
        return
      }

      await connect({
        connector: metaMaskConnector,
        chainId: arcTestnet.id,
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Connection failed',
        description: err?.message || 'Something went wrong',
      })
    }
  }

  // =========================
  // NOT CONNECTED
  // =========================
  if (!isConnected) {
    const availableConnectors = connectors.filter(
      (c, i, self) => self.findIndex(x => x.name === c.name) === i
    )

    const hasMultipleWallets = availableConnectors.length > 1

    // ✅ SINGLE BUTTON
    if (!hasMultipleWallets) {
      return (
        <div className={cn('flex flex-col gap-1.5', compact && 'w-full')}>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className={cn(
              'bg-primary hover:bg-primary/90 text-white font-semibold',
              'shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]',
              compact && 'w-full justify-center'
            )}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting…
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
              </>
            )}
          </Button>

          {!isMetaMaskAvailable && (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className={cn(
                'flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/70',
                compact ? 'justify-center' : 'justify-start'
              )}
            >
              <Download className="w-3 h-3" /> Install MetaMask
            </a>
          )}
        </div>
      )
    }

    // =========================
    // MULTIPLE CONNECTORS
    // =========================
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting…
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56">
          {availableConnectors.map((connector) => (
            <DropdownMenuItem
              key={connector.id}
              onClick={() =>
                connect({ connector, chainId: arcTestnet.id })
              }
            >
              {connector.name}
            </DropdownMenuItem>
          ))}

          {!isMetaMaskAvailable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="w-3 h-3 mr-2" /> Install MetaMask
                </a>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // =========================
  // WRONG NETWORK
  // =========================
  if (!isOnArcTestnet) {
    return (
      <Button onClick={switchToArc} disabled={isSwitching}>
        {isSwitching ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Switching…
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 mr-2" /> Switch Network
          </>
        )}
      </Button>
    )
  }

  // =========================
  // CONNECTED STATE
  // =========================
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 border rounded">
          <span>{truncate(address!)}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64">
        <div className="p-3 border-b">
          <div className="text-xs mb-1">Connected wallet</div>
          <div className="text-xs break-all">{address}</div>
        </div>

        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="w-3 h-3 mr-2" /> Copy address
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={`${ARC_NETWORK.explorerUrl}/address/${address}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="w-3 h-3 mr-2" /> View Explorer
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => disconnect()}>
          <LogOut className="w-3 h-3 mr-2" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
