"use client";

import { useAccount, useDisconnect, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useState, useEffect } from "react";
import { WalletModal } from "./WalletModal";

// ── Main connect button (burger menu) ─────────────────────────
export function ConnectButton() {
  const { address, status } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
    <>
      <button
        onClick={() => setShowModal(true)}
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
      {showModal && <WalletModal onClose={() => setShowModal(false)} />}
    </>
  );
}

// ── Compact wallet / connect — shown inline next to logo ───────
export function CompactWallet() {
  const { address, status } = useAccount();
  const { data: balance } = useBalance({ address });
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
    <>
      <button
        onClick={() => setShowModal(true)}
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
      {showModal && <WalletModal onClose={() => setShowModal(false)} />}
    </>
  );
}

// ── Burger wallet — connect/disconnect in menu ─────────────────
export function BurgerWallet({ onClose }: { onClose: () => void }) {
  const { address, status } = useAccount();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            flex: 1, background: "#0d4a1e", color: "#1BF26A",
            border: "2px solid #1BF26A", padding: "10px", cursor: "pointer",
            fontSize: 10, fontFamily: "'Press Start 2P',monospace", outline: "none",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
        >⚡ CONNECT WALLET</button>
      </div>
      {showModal && <WalletModal onClose={() => { setShowModal(false); onClose(); }} />}
    </>
  );
}
