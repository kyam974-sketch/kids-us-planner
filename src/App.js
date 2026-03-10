import React, { useState, useEffect } from "react";

const CS = [
  {id:"mousy",name:"Mousy",color:"#8CB43B",em:"\u{1F42D}"},
  {id:"linda",name:"Linda",color:"#F26522",em:"\u{1F431}"},
  {id:"sam",name:"Sam",color:"#00B3B0",em:"\u{1F9F8}"},
  {id:"emma",name:"Emma",color:"#E878A0",em:"\u{1F98B}"},
  {id:"oliver",name:"Oliver",color:"#00B3B0",em:"\u{1F438}"},
  {id:"marcia",name:"Marcia",color:"#E94E58",em:"\u{1F380}"}
];

export default function App() {
  const [view, setV] = useState("home");
  const [sc, setSc] = useState(null);
  const [sp, setSp] = useState("");
  const [sd, setSd] = useState(null);
  const [lessons, setL] = useState({});
  const [routines, setR] = useState({});
  const [txt, setTxt] = useState(""); // Testo da incollare
  const [scn, setScn] = useState(false);
  const [ss, setSs] = useState("");

  useEffect(() => {
    const r = localStorage.getItem("k_r");
    const l = localStorage.getItem("k_l");
    if (r) setR(JSON.parse(r));
    if (l) setL(JSON.parse(l));
  }, []);

  const processText = async (type) => {
    if (!txt.trim()) return;
    setScn(true);
    setSs("Claude sta riordinando le colonne...");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          messages: [{
            role: "user",
            content: `Ecco un testo estratto da una Teacher Guide Kids&Us (impaginazione a due colonne). 
              ${type === 'r' ? "Estrai Version A e Version B delle routine." : "Estrai le attività del Day (dal punto 2 in poi)."}
              Rispondi SOLO in JSON: 
              ${type === 'r' ? "{'a': [{'name','duration','desc'}], 'b': [{'name','duration','desc'}]}" : "[{'name','duration','desc','target'}]"}
              
              TESTO: ${txt}`
          }]
        })
      });

      const d = await res.json();
      const match = d.content[0].text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      const parsed = JSON.parse(match[0]);

      if (type === "r") {
        const newR = { ...routines, [`${sc.id}|${sp}`]: parsed };
        setR(newR);
        localStorage.setItem("k_r", JSON.stringify(newR));
        setSs("Routines salvate!");
      } else {
        const key = `${sc.id}|${sp}|${sd}`;
        const newL = { ...lessons, [key]: parsed };
        setL(newL);
        localStorage.setItem("k_l", JSON.stringify(newL));
        setSs("Lezione pronta!");
      }
      setTxt("");
    } catch (e) {
      setSs("Errore nell'analisi. Controlla il testo.");
    }
    setTimeout(() => setScn(false), 2000);
  };

  const curR = routines[`${sc?.id}|${sp}`];
  const ver = localStorage.getItem(`v|${sc?.id}|${sp}`) || "a";

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Nunito', sans-serif", background: "#FAFAF7", padding: 20 }}>
      {view === "home" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 900, marginBottom: 20 }}>Planner 👋</h2>
          {CS.map(c => (
            <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 20, marginBottom: 12, borderRadius: 18, borderLeft: `6px solid ${c.color}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 15, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: 30 }}>{c.em}</span>
              <b style={{ fontSize: 18 }}>{c.name}</b>
            </div>
          ))}
        </div>
      )}

      {view === "course" && sc && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("home")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800, color: sc.color }}>← HOME</button>
          <h2 style={{ color: sc.color, fontWeight: 900, marginBottom: 20 }}>{sc.name}</h2>
          {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
            <div key={p} style={{ background: "#fff", padding: 15, borderRadius: 15, marginBottom: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <b>{p}</b>
                <button onClick={() => { setSp(p); setV("routine_input"); }} style={{ fontSize: 11, background: routines[`${sc.id}|${p}`] ? "#E8F5E9" : "#eee", padding: "5px 10px", borderRadius: 8, border: "none" }}>
                  {routines[`${sc.id}|${p}`] ? "✅ Routine OK" : "➕ Incolla Routine"}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {[...Array(10)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i + 1); setV("lesson"); }} style={{ padding: 10, borderRadius: 10, border: "1px solid #eee", background: "#fdfdfd", fontWeight: 800 }}>{i + 1}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(view === "routine_input" || view === "lesson") && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("course")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800, color: sc.color }}>← TORNA INDIETRO</button>
          <div style={{ background: "#fff", padding: 25, borderRadius: 24, border: "1px solid #eee", marginBottom: 20 }}>
            <h3>{view === "routine_input" ? "Incolla Routine" : `Incolla Day ${sd}`}</h3>
            <p style={{fontSize: 12, color: "#888", marginBottom: 15}}>Apri il PDF, seleziona tutto il testo della pagina e incollalo qui sotto.</p>
            <textarea 
              value={txt} 
              onChange={(e) => setTxt(e.target.value)} 
              style={{ width: "100%", height: 150, padding: 15, borderRadius: 15, border: "1px solid #ddd", fontSize: 13, fontFamily: "sans-serif" }} 
              placeholder="Incolla il testo qui..."
            />
            <button onClick={() => processText(view === "routine_input" ? "r" : "l")} style={{ width: "100%", background: sc.color, color: "#fff", padding: "14px", borderRadius: 14, border: "none", fontWeight: 800, marginTop: 15 }}>
              🚀 GENERA PIANO
            </button>
            {scn && <div style={{ marginTop: 15, textAlign: "center", color: "#F26522", fontWeight: 800 }}>{ss}</div>}
          </div>
          
          {view === "lesson" && curR && (
            <div style={{ display: "flex", gap: 5, marginBottom: 20 }}>
              {["a", "b"].map(v => (
                <button key={v} onClick={() => { localStorage.setItem(`v|${sc.id}|${sp}`, v); setSs(v); }} style={{ flex: 1, padding: 10, borderRadius: 12, border: "none", background: ver === v ? "#3C3C3B" : "#ddd", color: "#fff", fontWeight: 700 }}>Version {v.toUpperCase()}</button>
              ))}
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            {(view === "lesson" && curR && curR[ver]) && curR[ver].map((r, i) => (
              <div key={i} style={{ background: "#fff", padding: 18, marginBottom: 12, borderRadius: 16, borderLeft: "5px solid #3C3C3B" }}>
                <b>{r.name}</b> <span style={{float:"right"}}>{r.duration}'</span>
                <p style={{ fontSize: 13, color: "#666", marginTop: 5 }}>{r.desc}</p>
              </div>
            ))}
            {lessons[`${sc.id}|${sp}|${sd}`]?.map((a, i) => (
              <div key={i} style={{ background: "#fff", padding: 18, marginBottom: 10, borderRadius: 16, borderLeft: `5px solid ${sc.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><b>{a.name}</b> <span>{a.duration}'</span></div>
                <p style={{ fontSize: 13, color: "#666", marginTop: 5 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
