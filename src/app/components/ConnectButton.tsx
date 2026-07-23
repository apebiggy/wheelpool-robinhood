"use client";

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { formatUnits } from "viem";
import { useState, useEffect } from "react";
import { robinhoodChain } from "./agw-provider";

// ── Detect mobile without an injected wallet browser ───────────
function isMobileWithoutWallet() {
  if (typeof window === "undefined") return false;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const hasProvider = typeof (window as any).ethereum !== "undefined";
  return isMobile && !hasProvider;
}

// ── Deep link into MetaMask's in-app browser ────────────────────
function openInMetaMask() {
  const url = window.location.href.replace(/^https?:\/\//, "");
  window.location.href = `https://metamask.app.link/dapp/${url}`;
}

// ── Connect + auto add/switch to Robinhood Chain ────────────────
async function safeConnect(connect: any, switchChainAsync: any, setError: (s: string) => void) {
  setError("");
  if (isMobileWithoutWallet()) {
    openInMetaMask();
    return;
  }
  try {
    await connect({ connector: injected() });
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
          } catch (addErr) {
            console.error("Failed to add Robinhood Chain:", addErr);
          }
        }
      }
    }, 400);
  } catch (err: any) {
    console.error("Wallet connect failed:", err);
    setError(err?.message?.slice(0, 60) || "Connection failed — try again");
  }
}

// ── Main connect button (burger menu) ─────────────────────────
export function ConnectButton() {
  const { address, status } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setMounted(true), []);

  const isConnected = mounted && status === "connected" && !!address;
  const eth = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(3)
    : "0.000";
  const short = (a: string) => `${a.slice(0, 5)}...${a.slice(-3)}`;

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div className="wallet-desktop" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            background: "#0f5422", border: "1px solid #44FF44",
            color: "#44FF44", padding: "4px 7px", fontSize: 10,
            fontFamily: "'Press Start 2P',monospace", whiteSpace: "nowrap",
          }}>{eth} ETH</div>
          <div style={{
            background: "#0d4a1e", border: "1px solid #44FF44",
            color: "#44FF44", padding: "4px 7px", fontSize: 10,
            fontFamily: "'Press Start 2P',monospace", whiteSpace: "nowrap",
          }}>{short(address)}</div>
        </div>
        <div className="wallet-mobile" style={{
          background: "#0d4a1e", border: "1px solid #44FF44",
          color: "#44FF44", padding: "3px 6px", fontSize: 8,
          fontFamily: "'Press Start 2P',monospace", whiteSpace: "nowrap",
          display: "none",
        }}>{short(address)}</div>
        <button
          onClick={() => disconnect()}
          style={{
            height: 28, width: 28, flexShrink: 0,
            background: "#2a0808", border: "1px solid #FF4444",
            color: "#FF4444", cursor: "pointer", fontSize: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            outline: "none",
          }}
        >✕</button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => safeConnect(connect, switchChainAsync, setError)}
        style={{
          background: "#0d4a1e", border: "2px solid #1BF26A",
          color: "#1BF26A", padding: "7px 12px",
          cursor: "pointer", fontSize: "clamp(8px,2vw,10px)",
          fontFamily: "'Press Start 2P',monospace",
          whiteSpace: "nowrap", outline: "none",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        CONNECT WALLET
      </button>
      {error && (
        <div style={{ color: "#FF4444", fontSize: 8, marginTop: 4, fontFamily: "'Press Start 2P',monospace" }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ── Compact wallet / connect — shown inline next to logo ───────
export function CompactWallet() {
  const { address, status } = useAccount();
  const { connect } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setMounted(true), []);

  const isConnected = mounted && status === "connected" && !!address;
  const eth = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(3)
    : "0.000";
  const short = (a: string) => `${a.slice(0, 5)}...${a.slice(-3)}`;

  if (!mounted) return null;

  if (isConnected && address) {
    return (
      <div style={{
        background: "#0d4a1e", border: "1px solid #44FF4466",
        color: "#44FF44", padding: "4px 10px",
        fontSize: "clamp(8px,1.8vw,10px)",
        fontFamily: "'Press Start 2P',monospace",
        whiteSpace: "nowrap", lineHeight: 1.6,
      }}>
        <div>{short(address)}</div>
        <div style={{ color: "#9de8b4", fontSize: "clamp(7px,1.5vw,9px)" }}>{eth} ETH</div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => safeConnect(connect, switchChainAsync, setError)}
        style={{
          background: "#0d4a1e", border: "2px solid #1BF26A",
          color: "#1BF26A", padding: "6px 12px",
          cursor: "pointer", fontSize: "clamp(8px,1.8vw,10px)",
          fontFamily: "'Press Start 2P',monospace",
          whiteSpace: "nowrap", outline: "none",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        CONNECT
      </button>
      {error && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#2a0808", color: "#FF4444",
          fontSize: 7, padding: "4px 6px", marginTop: 2,
          fontFamily: "'Press Start 2P',monospace", zIndex: 500,
          whiteSpace: "nowrap",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ── Burger wallet — connect/disconnect in menu ─────────────────
export function BurgerWallet({ onClose }: { onClose: () => void }) {
  const { address, status } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setMounted(true), []);

  const isConnected = mounted && status === "connected" && !!address;
  const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ color: "#44FF44", fontSize: 9, fontFamily: "'Press Start 2P',monospace", marginBottom: 3 }}>CONNECTED</div>
          <div style={{ color: "#9de8b4", fontSize: 10, fontFamily: "monospace" }}>{short(address)}</div>
        </div>
        <button onClick={() => { disconnect(); onClose(); }} style={{
          background: "#2a0808", color: "#FF4444", border: "1px solid #FF4444",
          padding: "7px 12px", cursor: "pointer", fontSize: 9,
          fontFamily: "'Press Start 2P',monospace", outline: "none", flexShrink: 0,
        }}>LOG OUT</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => safeConnect(connect, switchChainAsync, setError)}
          style={{
            flex: 1, background: "#0d4a1e", color: "#1BF26A",
            border: "2px solid #1BF26A", padding: "10px", cursor: "pointer",
            fontSize: 10, fontFamily: "'Press Start 2P',monospace", outline: "none",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
        >⚡ CONNECT WALLET</button>
      </div>
      {error && (
        <div style={{ color: "#FF4444", fontSize: 8, marginTop: 6, fontFamily: "'Press Start 2P',monospace", lineHeight: 1.6 }}>
          {error}
        </div>
      )}
    </div>
  );
}
