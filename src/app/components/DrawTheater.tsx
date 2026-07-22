// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';

const POOLS = [
  { id:'spin',   name:'SPIN',   icon:'🎡', intervalH:1,  label:'EVERY HOUR',     entryUsd:2,  entryEth:'0.0008', poolEth:'0.0376', color:'#FF6633', darkBg:'#1a0800' },
  { id:'surge',  name:'SURGE',  icon:'🌊', intervalH:6,  label:'EVERY 6 HOURS',  entryUsd:5,  entryEth:'0.002',  poolEth:'0.166',  color:'#00DDAA', darkBg:'#001610' },
  { id:'twelve', name:'TWELVE', icon:'🔥', intervalH:12, label:'EVERY 12 HOURS', entryUsd:10, entryEth:'0.004',  poolEth:'0.380',  color:'#AA44FF', darkBg:'#0e0020' },
  { id:'mega',   name:'MEGA',   icon:'⚡', intervalH:24, label:'DAILY',          entryUsd:25, entryEth:'0.01',   poolEth:'0.290',  color:'#FFDD00', darkBg:'#1a1600' },
];

const PRIZE_SLOTS = [
  { label:'JACKPOT', icon:'🥇', color:'#FFD700', pct:50 },
  { label:'2ND',     icon:'🥈', color:'#C0C0C0', pct:25 },
  { label:'3RD',     icon:'🥉', color:'#CD7F32', pct:15 },
];

const POOL_POINTS = { 'spin':100,'surge':250,'twelve':500,'mega':1250 };
const WALLETS = ['0xa0b1...c2d3','0xf4e5...a6b7','0xa1b2...c3d4','0xb3c4...d5e6',
  '0xd5e6...e7f8','0xe7f8...f9a0','0x1234...5678','0x9abc...def0',
  '0x2468...1357','0xaced...bef0','0x5555...aaaa','0x7777...8888'];
const CONFETTI_COLORS = ['#1BF26A','#FFDD00','#FF6633','#AA44FF','#00DDAA','#FF4444','#44FF44'];

function fmtMs(ms) {
  if (ms <= 0) return '00:00:00';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return d > 0 ? `${d}d ${t}` : t;
}

function getNextDraw(intervalH) {
  const now = Date.now();
  const ms  = intervalH * 3600000;
  return Math.ceil(now / ms) * ms;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: Math.random() * 100, delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2, size: 6 + Math.random() * 8,
  }));
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2000, overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.left}%`, top:'-20px',
          width:p.size, height:p.size, background:p.color, borderRadius:'50%',
          animation:`confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
        }}/>
      ))}
    </div>
  );
}

const SEG_COLORS = ['#0d5e1e','#1a7a2e','#0f9e36','#1BF26A','#13c455','#0aad48',
  '#44FF44','#2ee870','#0d7a30','#26d95f','#0c6628','#3fff88','#0e8c35','#15b84d','#06522a','#52f098'];
const N_SEGS = 16;

function WheelSVG({ angle, spinning, winners }) {
  const cx = 120, cy = 120, r = 102;
  const winIdx = winners.map(w => w.segIndex);
  const seg = (i) => {
    const a1 = (i/N_SEGS)*2*Math.PI - Math.PI/2;
    const a2 = ((i+1)/N_SEGS)*2*Math.PI - Math.PI/2;
    return `M${cx},${cy} L${cx+r*Math.cos(a1)},${cy+r*Math.sin(a1)} A${r},${r} 0 0,1 ${cx+r*Math.cos(a2)},${cy+r*Math.sin(a2)}Z`;
  };
  const tp = (i) => {
    const a = ((i+0.5)/N_SEGS)*2*Math.PI - Math.PI/2;
    return { x: cx+r*0.68*Math.cos(a), y: cy+r*0.68*Math.sin(a) };
  };
  const LIGHT = new Set(['#1BF26A','#44FF44','#2ee870','#3fff88','#52f098','#26d95f']);
  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <div style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)', fontSize:20, color:'#FF4444', zIndex:5 }}>▼</div>
      <svg width="260" height="260" style={{
        transform:`rotate(${angle}deg)`,
        transition:spinning?'transform 7.2s cubic-bezier(0.22,1,0.36,1)':'none',
        filter:spinning?'drop-shadow(0 0 32px rgba(27,242,106,1))':'drop-shadow(0 0 16px rgba(27,242,106,.5))',
        display:'block',
      }}>
        <circle cx={cx} cy={cy} r={118} fill="rgba(0,0,0,0.3)"/>
        <circle cx={cx} cy={cy} r={112} fill="#0a2e10"/>
        <circle cx={cx} cy={cy} r={108} fill="#0d3e16"/>
        {Array.from({length:N_SEGS},(_,i) => {
          const wr = winIdx.indexOf(i);
          const fill = wr>=0 ? ['#FFD700','#C0C0C0','#CD7F32'][wr] : SEG_COLORS[i%SEG_COLORS.length];
          const pt = tp(i);
          const rot = ((i+0.5)/N_SEGS*360-90)+(pt.x<cx?180:0);
          return (
            <g key={i}>
              <path d={seg(i)} fill={fill} stroke={wr>=0?'#fff':'#0a2e10'} strokeWidth={wr>=0?2.5:1.5}/>
              <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle"
                fill={LIGHT.has(fill)?'#0a2e10':'#fff'} fontSize={6}
                fontFamily="'Press Start 2P',monospace"
                transform={`rotate(${rot},${pt.x},${pt.y})`}>{`#${i+1}`}</text>
            </g>
          );
        })}
        {Array.from({length:N_SEGS},(_,i) => {
          const a = (i/N_SEGS)*2*Math.PI-Math.PI/2;
          return <line key={i} x1={cx+(r+2)*Math.cos(a)} y1={cy+(r+2)*Math.sin(a)}
            x2={cx+(r+9)*Math.cos(a)} y2={cy+(r+9)*Math.sin(a)} stroke="#1BF26A" strokeWidth="2"/>;
        })}
        <circle cx={cx} cy={cy} r={20} fill="#0a2e10" stroke="#1BF26A" strokeWidth="3"/>
        <circle cx={cx} cy={cy} r={13} fill="#1BF26A"/>
        <circle cx={cx} cy={cy} r={6}  fill="#0a2e10"/>
      </svg>
    </div>
  );
}

export default function DrawTheater({ onClose, onPointsEarned, activePerks, userTickets = [], bgImage }) {
  const { address } = useAccount();
  const shortAddr = address ? `${address.slice(0,6)}...${address.slice(-4)}` : null;

  const [selectedPool, setSelectedPool] = useState(POOLS[0]);
  const [phase,    setPhase]    = useState('waiting');
  const [msLeft,   setMsLeft]   = useState(0);
  const [angle,    setAngle]    = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [results,  setResults]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [confetti, setConfetti] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const runDrawRef = useRef(null);
  const angleRef   = useRef(0);
  const phaseRef   = useRef('waiting');

  // ── runDraw — declared first so ref assignment below is valid ──
  const runDraw = useCallback(async () => {
    if (phaseRef.current === 'spinning') return;
    phaseRef.current = 'spinning';
    setPhase('spinning');
    setResults([]);
    setSpinning(true);
    setConfetti(false);

    const pf = parseFloat(selectedPool.poolEth);
    const drawn = [];
    let userWon = false;

    for (let i = 0; i < 3; i++) {
      const segIndex  = Math.floor(Math.random() * N_SEGS);
      const segCenter = (segIndex + 0.5) / N_SEGS * 360;
      const targetR   = (360 - segCenter + 360) % 360;
      const current   = ((angleRef.current % 360) + 360) % 360;
      const diff      = ((targetR - current) + 360) % 360;
      const target    = angleRef.current + diff + 8 * 360;
      angleRef.current = target;
      setAngle(target);
      await sleep(7600);

      const isUserWin = shortAddr && Math.random() < 0.25;
      if (isUserWin) userWon = true;
      const addr = isUserWin ? shortAddr : WALLETS[Math.floor(Math.random()*WALLETS.length)];
      drawn.push({ slot:PRIZE_SLOTS[i], segIndex, addr, eth:(pf*0.9*PRIZE_SLOTS[i].pct/100).toFixed(5), isUser:isUserWin });
      setResults([...drawn]);
      if (i < 2) await sleep(800);
    }

    setSpinning(false);
    phaseRef.current = 'complete';
    setPhase('complete');

    if (onPointsEarned && !userWon) {
      const base = selectedPool.id?.split('-')[0] || selectedPool.id || 'spin';
      const pts  = (POOL_POINTS[base]||100) * (activePerks?.includes('points-boost')?2:1);
      onPointsEarned(pts);
      setPointsEarned(pts);
      setTimeout(()=>setPointsEarned(0), 3000);
    }
    if (userWon) { setConfetti(true); setTimeout(()=>setConfetti(false), 5000); }
  }, [selectedPool, shortAddr]);

  // Assign ref AFTER runDraw is declared
  runDrawRef.current = runDraw;

  // Countdown
  useEffect(() => {
    phaseRef.current = 'waiting';
    setPhase('waiting');
    setResults([]);
    setSpinning(false);
    setConfetti(false);
    const tick = setInterval(() => {
      const rem = getNextDraw(selectedPool.intervalH) - Date.now();
      setMsLeft(rem);
      if (rem <= 0) {
        clearInterval(tick);
        setTimeout(() => { if (runDrawRef.current) runDrawRef.current(); }, 600);
      }
    }, 500);
    setMsLeft(getNextDraw(selectedPool.intervalH) - Date.now());
    return () => clearInterval(tick);
  }, [selectedPool.id]);

  // History
  useEffect(() => {
    const iMs = selectedPool.intervalH * 3600000;
    const pf  = parseFloat(selectedPool.poolEth);
    const now = Date.now();
    setHistory(Array.from({length:10},(_,i) => {
      const ts = now-(i+1)*iMs;
      const tx = '0x'+Array.from({length:16},()=>Math.floor(Math.random()*16).toString(16)).join('')+'...';
      return { id:100-i, pool:selectedPool,
        date:new Date(ts).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}),
        time:new Date(ts).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
        txHash:tx, txUrl:`https://explorer.robinhoodchain.com/tx/${tx}`,
        winners:PRIZE_SLOTS.map((slot,ri)=>({
          icon:slot.icon,color:slot.color,label:slot.label,
          addr:WALLETS[(i*3+ri)%WALLETS.length],
          eth:(pf*0.9*slot.pct/100).toFixed(5),
        })),
      };
    }));
  }, [selectedPool.id]);

  // User's tickets for this pool
  const myTickets = userTickets.filter(t =>
    t.poolId === selectedPool.id ||
    t.poolId?.startsWith(selectedPool.id+'-') ||
    t.poolId?.split('-')[0] === selectedPool.id
  );

  const urgent   = msLeft < 30000;
  const critical = msLeft < 10000;
  const totalMs  = selectedPool.intervalH * 3600000;
  const pct      = Math.max(0,Math.min(100,(1-msLeft/totalMs)*100));

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:1000,color:'#fff',
      fontFamily:"'Press Start 2P',monospace",
      display:'flex',flexDirection:'column',overflow:'auto',
    }}>
      {/* Penguin background — full scale */}
      {bgImage && (
        <div style={{
          position:'absolute',inset:0,zIndex:0,
          backgroundImage:`url(${bgImage})`,
          backgroundSize:'cover',backgroundPosition:'center top',
          backgroundRepeat:'no-repeat',
        }}>
          {/* Dark overlay for readability */}
          <div style={{position:'absolute',inset:0,background:'rgba(6,20,6,0.82)'}}/>
        </div>
      )}
      {!bgImage && <div style={{position:'absolute',inset:0,background:'#0d4a1e',zIndex:0}}/>}

      <Confetti active={confetti}/>
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',flex:1}}>

        {/* You won banner */}
        {confetti&&(
          <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2001,pointerEvents:'none'}}>
            <div style={{background:'rgba(6,20,6,.95)',border:'3px solid #FFD700',boxShadow:'0 0 60px rgba(255,215,0,.7)',padding:'32px 48px',textAlign:'center'}}>
              <div style={{fontSize:56,marginBottom:12}}>🏆</div>
              <div style={{color:'#FFD700',fontSize:16,letterSpacing:4,textShadow:'0 0 20px #FFD700',marginBottom:8}}>YOU WON!</div>
              <div style={{color:'#1BF26A',fontSize:10,letterSpacing:2,marginTop:12}}>CHECK PRIZE SLOTS BELOW</div>
            </div>
          </div>
        )}

        {/* Points toast */}
        {pointsEarned>0&&(
          <div style={{position:'fixed',bottom:24,right:24,background:'#1a1600',border:'2px solid #FFDD00',color:'#FFDD00',padding:'12px 18px',fontSize:11,fontFamily:"'Press Start 2P',monospace",zIndex:3000,boxShadow:'0 0 24px rgba(255,221,0,.4)'}}>
            🎡 +{pointsEarned.toLocaleString()} WHEEL PTS
          </div>
        )}

        {/* ── HEADER ── */}
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'12px 16px',
          background:'rgba(6,20,6,0.92)',
          borderBottom:'2px solid #1BF26A44',
          flexShrink:0,flexWrap:'wrap',gap:8,
          backdropFilter:'blur(8px)',
        }}>
          <span style={{color:'#FFDD00',fontSize:12,letterSpacing:2}}>🎲 DRAW ROOM</span>

          {/* Pool selector with dollar value */}
          <select value={selectedPool.id}
            onChange={e=>setSelectedPool(POOLS.find(p=>p.id===e.target.value)||POOLS[0])}
            style={{
              background:'rgba(20,84,20,0.9)',color:'#1BF26A',
              border:'2px solid #1BF26A',padding:'8px 14px',
              fontSize:10,fontFamily:"'Press Start 2P',monospace",
              cursor:'pointer',outline:'none',
              backdropFilter:'blur(4px)',
            }}>
            {POOLS.map(p=>(
              <option key={p.id} value={p.id}>
                {p.icon} {p.name} — ${p.entryUsd} · {p.label}
              </option>
            ))}
          </select>

          <button onClick={onClose} style={{background:'rgba(42,8,8,0.9)',border:'2px solid #FF4444',color:'#FF4444',padding:'8px 14px',cursor:'pointer',fontSize:10,fontFamily:"'Press Start 2P',monospace",outline:'none'}}>← BACK</button>
        </div>

        {/* ── BODY ── */}
        <div style={{display:'flex',flex:1,flexWrap:'wrap',overflow:'auto'}}>

          {/* ── LEFT ── */}
          <div style={{flex:'1 1 300px',padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>

            {/* Pool badge */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
              <div style={{
                background:`linear-gradient(135deg,${selectedPool.darkBg},rgba(0,0,0,0.6))`,
                border:`2px solid ${selectedPool.color}`,
                color:selectedPool.color,padding:'6px 16px',fontSize:11,
                backdropFilter:'blur(4px)',
              }}>
                {selectedPool.icon} {selectedPool.name}
                <span style={{color:'#9de8b4',fontSize:9,marginLeft:8}}>${selectedPool.entryUsd} entry</span>
              </div>
              <div style={{background:'rgba(10,32,16,0.7)',border:'1px solid #2a7a22',color:'#9de8b4',padding:'6px 14px',fontSize:9,backdropFilter:'blur(4px)'}}>
                Pool: {selectedPool.poolEth} ETH
              </div>
            </div>

            {/* Countdown */}
            {phase==='waiting'&&(
              <div style={{
                background:'rgba(5,13,5,0.85)',width:'100%',
                border:`2px solid ${critical?'#FF4444':urgent?'#FFDD00':selectedPool.color}`,
                padding:'18px',textAlign:'center',backdropFilter:'blur(8px)',
                boxShadow:`0 0 20px ${critical?'rgba(255,68,68,.3)':urgent?'rgba(255,221,0,.3)':`${selectedPool.color}33`}`,
              }}>
                <div style={{fontSize:10,marginBottom:8,letterSpacing:2,color:critical?'#FF4444':urgent?'#FFDD00':'#9de8b4'}}>
                  {critical?'⚡ DRAW STARTING!':urgent?'⏱ DRAW SOON':'⏱ NEXT DRAW IN'}
                </div>
                <div style={{fontSize:'clamp(28px,6vw,44px)',letterSpacing:6,fontFamily:"'VT323',monospace",color:critical?'#FF4444':urgent?'#FFDD00':selectedPool.color,lineHeight:1.1,marginBottom:10}}>
                  {fmtMs(Math.max(0,msLeft))}
                </div>
                <div style={{height:5,background:'rgba(10,26,10,0.8)',overflow:'hidden',marginBottom:6}}>
                  <div style={{width:`${pct}%`,height:'100%',background:critical?'#FF4444':urgent?'#FFDD00':selectedPool.color,transition:'width .5s linear'}}/>
                </div>
                <div style={{fontSize:9,color:'#3a7a22'}}>{selectedPool.label}</div>
              </div>
            )}

            {/* Wheel */}
            <WheelSVG angle={angle} spinning={spinning} winners={results.map(r=>({segIndex:r.segIndex}))}/>

            {/* Simulate button */}
            <button onClick={()=>runDrawRef.current&&runDrawRef.current()} disabled={phase==='spinning'}
              style={{
                padding:'12px 24px',
                background:phase==='spinning'?'rgba(10,32,16,0.7)':'rgba(20,84,20,0.85)',
                color:phase==='spinning'?'#3a7a22':'#1BF26A',
                border:`2px solid ${phase==='spinning'?'#3a7a22':'#1BF26A'}`,
                cursor:phase==='spinning'?'default':'pointer',
                fontSize:10,fontFamily:"'Press Start 2P',monospace",outline:'none',
                backdropFilter:'blur(4px)',
                boxShadow:phase!=='spinning'?'0 0 14px rgba(27,242,106,.3)':'none',
              }}>
              {phase==='spinning'?'⏳ SPINNING...':phase==='complete'?'🔄 SPIN AGAIN':'▶ SIMULATE DRAW'}
            </button>

            {/* Prize slots */}
            <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',width:'100%'}}>
              {PRIZE_SLOTS.map((slot,i)=>{
                const res=results[i];
                return(
                  <div key={i} style={{
                    flex:'1 1 90px',maxWidth:140,minWidth:85,
                    background:res?`linear-gradient(160deg,${slot.color}22,rgba(5,13,5,0.9))`:'rgba(5,13,5,0.7)',
                    border:`2px solid ${res?slot.color:'#2a5a2a'}`,
                    padding:'10px 6px',textAlign:'center',transition:'all .4s',
                    backdropFilter:'blur(6px)',
                    boxShadow:res?.isUser?`0 0 24px ${slot.color}`:res?`0 0 10px ${slot.color}44`:'none',
                  }}>
                    <div style={{fontSize:18,marginBottom:6}}>{slot.icon}</div>
                    <div style={{color:slot.color,fontSize:9,marginBottom:3}}>{slot.label}</div>
                    <div style={{color:'#3a7a22',fontSize:8,marginBottom:8}}>{slot.pct}%</div>
                    {res?(<>
                      {res.isUser&&<div style={{color:'#FFD700',fontSize:8,marginBottom:4,textShadow:'0 0 10px #FFD700'}}>⭐ YOU!</div>}
                      <div style={{fontSize:8,color:res.isUser?'#FFD700':'#9de8b4',fontFamily:'monospace',marginBottom:4,wordBreak:'break-all'}}>{res.addr}</div>
                      <div style={{color:slot.color,fontSize:16,fontFamily:"'VT323',monospace"}}>+{res.eth} ETH</div>
                    </>):(<div style={{color:'#2a5a2a',fontSize:22}}>?</div>)}
                  </div>
                );
              })}
            </div>

            {/* ── USER'S ACTIVE TICKETS FOR THIS POOL ── */}
            {myTickets.length>0&&(
              <div style={{
                width:'100%',
                background:'rgba(5,13,5,0.8)',
                border:`1px solid ${selectedPool.color}44`,
                padding:'12px 14px',
                backdropFilter:'blur(6px)',
              }}>
                <div style={{
                  color:selectedPool.color,fontSize:9,
                  fontFamily:"'Press Start 2P',monospace",
                  marginBottom:10,display:'flex',justifyContent:'space-between',
                }}>
                  <span>🎟 YOUR ENTRIES</span>
                  <span style={{color:'#9de8b4'}}>{myTickets.length} ticket{myTickets.length>1?'s':''}</span>
                </div>
                <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4}}>
                  {myTickets.map(t=>{
                    const ts=new Date(t.ts);
                    return(
                      <div key={t.id} style={{
                        flexShrink:0,
                        background:`linear-gradient(160deg,${selectedPool.darkBg},rgba(0,0,0,0.5))`,
                        border:`1px solid ${selectedPool.color}66`,
                        borderTop:`2px solid ${selectedPool.color}`,
                        padding:'8px 10px',minWidth:130,
                        fontFamily:"'Press Start 2P',monospace",
                      }}>
                        <div style={{color:selectedPool.color,fontSize:8,marginBottom:4}}>{t.id}</div>
                        <div style={{color:'#9de8b4',fontSize:10,fontFamily:"'VT323',monospace",marginBottom:2}}>${t.poolId?.split('-')[1]||selectedPool.entryUsd} entry</div>
                        <div style={{color:'#6aaa6a',fontSize:7,fontFamily:'monospace'}}>{ts.toLocaleDateString('en-GB')} {ts.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {myTickets.length===0&&(
              <div style={{
                width:'100%',textAlign:'center',
                background:'rgba(5,13,5,0.6)',
                border:`1px dashed ${selectedPool.color}33`,
                padding:'12px',
                color:'#3a7a22',fontSize:8,
                fontFamily:"'Press Start 2P',monospace",
                backdropFilter:'blur(4px)',
              }}>
                No active tickets in this pool
              </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div style={{
            flex:'0 0 270px',
            background:'rgba(6,20,6,0.85)',
            borderLeft:'1px solid rgba(27,242,106,0.15)',
            padding:'20px',overflowY:'auto',
            display:'flex',flexDirection:'column',gap:14,
            backdropFilter:'blur(10px)',
          }}>
            {/* Prize split */}
            <div>
              <div style={{color:'#FFDD00',fontSize:10,marginBottom:12,letterSpacing:1}}>💰 PRIZE SPLIT</div>
              {PRIZE_SLOTS.map(slot=>(
                <div key={slot.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,padding:'6px 0',borderBottom:'1px solid rgba(42,90,42,0.3)'}}>
                  <span style={{color:slot.color,fontSize:9}}>{slot.icon} {slot.label}</span>
                  <span style={{color:'#9de8b4',fontSize:11,fontFamily:"'VT323',monospace"}}>{(parseFloat(selectedPool.poolEth)*0.9*slot.pct/100).toFixed(5)} ETH</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4,paddingTop:6,borderTop:'1px solid rgba(42,90,42,0.5)',fontSize:9}}>
                <span style={{color:'#FF6644'}}>⚙ OPS + WHEELPOT</span>
                <span style={{color:'#FF6644',fontSize:11,fontFamily:"'VT323',monospace"}}>{(parseFloat(selectedPool.poolEth)*0.1).toFixed(5)} ETH</span>
              </div>
            </div>

            {/* Draw history */}
            <div>
              <div style={{color:'#FFDD00',fontSize:10,marginBottom:12,letterSpacing:1}}>📜 LAST 10 DRAWS</div>
              {history.map(draw=>(
                <div key={draw.id} style={{background:'rgba(10,42,10,0.7)',border:'1px solid rgba(42,90,42,0.5)',padding:'8px 10px',marginBottom:8,backdropFilter:'blur(4px)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{background:draw.pool.darkBg,border:`1px solid ${draw.pool.color}`,color:draw.pool.color,fontSize:7,padding:'2px 5px'}}>{draw.pool.icon} {draw.pool.name}</span>
                      <span style={{color:'#1BF26A',fontSize:7}}>#{draw.id}</span>
                    </div>
                    <span style={{color:'#3a7a22',fontSize:7,fontFamily:'monospace'}}>{draw.date} {draw.time}</span>
                  </div>
                  {draw.winners.map((w,wi)=>(
                    <div key={wi} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'2px 0',borderTop:wi>0?'1px solid rgba(42,90,42,0.4)':'none'}}>
                      <span style={{fontSize:9}}>{w.icon}</span>
                      <span style={{color:'#9de8b4',fontSize:7,fontFamily:'monospace',flex:1,marginLeft:4}}>{w.addr}</span>
                      <span style={{color:w.color,fontSize:11,fontFamily:"'VT323',monospace"}}>+{w.eth}</span>
                    </div>
                  ))}
                  <a href={draw.txUrl} target="_blank" rel="noopener noreferrer"
                    style={{display:'block',marginTop:6,color:'#1BF26A44',fontSize:7,textDecoration:'none',letterSpacing:1,borderTop:'1px solid rgba(27,242,106,.15)',paddingTop:5,transition:'color .2s'}}
                    onMouseOver={e=>e.target.style.color='#1BF26A'}
                    onMouseOut={e=>e.target.style.color='#1BF26A44'}>
                    🔍 VERIFY TX →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
