"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";
import { useState, type ReactNode, useEffect } from "react";
import { reconnect } from "wagmi/actions";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    // Reconnect to previously connected wallet on mount
    reconnect(config);
  }, []);

  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
