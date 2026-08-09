import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/config/wagmi";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TransactionProvider } from "@/context/TransactionContext";
import { AgentHealthProvider } from "@/context/AgentHealthContext";
import { TxStatusWatcher } from "@/components/TxStatusWatcher";
import { useAgents } from "@/hooks/useAgents";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Agents from "@/pages/Agents";
import AgentDetail from "@/pages/AgentDetail";
import Rules from "@/pages/Rules";
import Activity from "@/pages/Activity";
import Analytics from "@/pages/Analytics";
import MultiSend from "@/pages/MultiSend";
import PayPage from "@/pages/PayPage";
import X402Demo from "@/pages/X402Demo";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/agents" component={Agents} />
      <Route path="/agents/:id" component={AgentDetail} />
      <Route path="/rules" component={Rules} />
      <Route path="/multi-send" component={MultiSend} />
      <Route path="/activity" component={Activity} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/x402-demo" component={X402Demo} />
      <Route path="/pay/:address" component={PayPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithHealth() {
  const { agents } = useAgents();
  return (
    <AgentHealthProvider agents={agents}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <TxStatusWatcher />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </AgentHealthProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <TransactionProvider>
            <AppWithHealth />
          </TransactionProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

export default App;
