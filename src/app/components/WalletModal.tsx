"use client";

import { useConnectors, useConnect, useSwitchChain } from "wagmi";
import { useState, useEffect } from "react";
import { robinhoodChain } from "./agw-provider";

// ── Popular wallets with mobile deep-link schemes ────────────────
// Used as a fallback when no extension is detected (mobile browsers)
const MOBILE_WALLET_LINKS = [
  { name: "MetaMask",       icon: "🦊", scheme: (url: string) => `https://metamask.app.link/dapp/${url}` },
  { name: "Coinbase Wallet",icon: "🔵", scheme: (url: string) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(`https://${url}`)}` },
  { name: "Trust Wallet",   icon: "🛡️", scheme: (url: string) => `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(`https://${url}`)}` },
  { name: "Rainbow",        icon: "🌈", scheme: (url: string) => `https://rnbwapp.com/dapp?url=${encodeURIComponent(`https://${url}`)}` },
];

function isMobile() {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

async function ensureChain(switchChainAsync: any) {
  setTimeout(async () => {
    try {
      await switchChainAsync({ chainId: robinhoodChain.id });
    } catch {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: `0x${robinhoodChain.id.toString(16)}`,
              chainName: robinhoodChain.name,
              nativeCurrency: robinhoodChain.nativeCurrency,
              rpcUrls: [robinhoodChain.rpcUrls.default.http[0]],
              blockExplorerUrls: [robinhoodChain.blockExplorers.default.url],
            }],
          });
        } catch (e) { console.error("Failed to add chain:", e); }
      }
    }
  }, 400);
}

export function WalletModal({ onClose }: { onClose: () => void }) {
  const connectors = useConnectors();
  const { connect } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Filter to real, ready, injected wallets only (dedupe by name, skip generic "Injected" if named ones exist)
  const detected = connectors.filter(c => c.type === "injected" && c.name !== "Injected");
  const hasGenericInjected = connectors.some(c => c.type === "injected" && c.name === "Injected");
  const showGeneric = detected.length === 0 && hasGenericInjected;

  const handleConnect = async (connector: any) => {
    setError("");
    try {
      await connect({ connector });
      ensureChain(switchChainAsync);
      onClose();
    } catch (err: any) {
      setError(err?.message?.slice(0, 70) || "Connection failed");
    }
  };

  const mobile = mounted && isMobile();
  const currentUrl = mounted ? window.location.href.replace(/^https?:\/\//, "") : "";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 900, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0e2a0e", border: "2px solid #1BF26A",
          padding: 20, maxWidth: 340, width: "100%",
          boxShadow: "0 0 40px rgba(27,242,106,.3)",
          fontFamily: "'Press Start 2P',monospace",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ color: "#1BF26A", fontSize: 12 }}>CONNECT WALLET</span>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid #FF444466",
            color: "#FF4444", width: 26, height: 26, cursor: "pointer",
            fontSize: 12, outline: "none",
          }}>✕</button>
        </div>

        {/* Detected browser extension wallets (EIP-6963) */}
        {detected.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: mobile ? 16 : 0 }}>
            {detected.map(c => (
              <button
                key={c.uid}
                onClick={() => handleConnect(c)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#0d4a1e", border: "1px solid #1BF26A66",
                  color: "#1BF26A", padding: "10px 12px", cursor: "pointer",
                  fontSize: 10, fontFamily: "'Press Start 2P',monospace",
                  textAlign: "left", outline: "none", width: "100%",
                }}
              >
                {c.icon
                  ? <img src={c.icon} alt="" style={{ width: 20, height: 20 }} />
                  : <span style={{ fontSize: 16 }}>🔌</span>}
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Generic injected fallback — single unnamed provider present */}
        {showGeneric && (
          <button
            onClick={() => handleConnect(connectors.find(c => c.name === "Injected"))}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              background: "#0d4a1e", border: "1px solid #1BF26A66",
              color: "#1BF26A", padding: "10px 12px", cursor: "pointer",
              fontSize: 10, fontFamily: "'Press Start 2P',monospace",
              textAlign: "left", outline: "none", marginBottom: mobile ? 16 : 0,
            }}
          >
            <span style={{ fontSize: 16 }}>🔌</span> Browser Wallet
          </button>
        )}

        {/* Mobile: deep links to popular wallet apps if none detected */}
        {mobile && detected.length === 0 && !showGeneric && (
          <div>
            <div style={{ color: "#9de8b4", fontSize: 8, marginBottom: 10, lineHeight: 1.8 }}>
              No wallet detected. Open this site inside your wallet app:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {MOBILE_WALLET_LINKS.map(w => (
                <a
                  key={w.name}
                  href={w.scheme(currentUrl)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "#0d4a1e", border: "1px solid #1BF26A44",
                    color: "#1BF26A", padding: "10px 12px",
                    fontSize: 10, fontFamily: "'Press Start 2P',monospace",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{w.icon}</span> {w.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {!mobile && detected.length === 0 && !showGeneric && (
          <div style={{ color: "#9de8b4", fontSize: 9, lineHeight: 2 }}>
            No wallet extension detected. Install MetaMask, Coinbase Wallet,
            Rainbow, or another EVM wallet browser extension to connect.
          </div>
        )}

        {error && (
          <div style={{ color: "#FF4444", fontSize: 8, marginTop: 12, lineHeight: 1.8 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
