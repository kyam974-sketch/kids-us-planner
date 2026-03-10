import React, { useState, useRef } from "react";

const CS = [
  {id:"mousy",name:"Mousy",color:"#8CB43B",bg:"#F0F7E1",em:"\u{1F42D}",parts:["Part One","Part Two","Part Three","Part Four"],dp:10},
  {id:"linda",name:"Linda",color:"#F26522",bg:"#FFF0E6",em:"\u{1F431}",parts:["Part One","Part Two","Part Three","Part Four"],dp:10},
  {id:"sam",name:"Sam",color:"#00B3B0",bg:"#E0F7F7",em:"\u{1F9F8}",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10},
  {id:"emma",name:"Emma",color:"#E878A0",bg:"#FFF0F5",em:"\u{1F98B}",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10},
  {id:"oliver",name:"Oliver",color:"#00B3B0",bg:"#E0F7F7",em:"\u{1F438}",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10},
  {id:"marcia",name:"Marcia",color:"#E94E58",bg:"#FFEBEE",em:"\u{1F380}",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10}
];

export default function App() {
  const [view, setV] = useState("home");
  const [sc, setSc] = useState(null);
  const [sp, setSp] = useState(null);
  const [sd, setSd] = useState(null);
  const [lessons, setL] = useState({});
  const [routines, setR] = useState({}); // Memoria Routine per Storia
  const [rVer, setRVer] = useState("A");
  const [scn, setScn] = useState(false);
  const [ss, setSs] = useState("");
  const fr = useRef(null);

  const scanFile = async (files, type) => {
    if (!files.length) return;
    setScn(true); setSs("Analisi AI in corso...");
    try {
      const imgs = [];
      for (let f of files) {
        const b = await new Promise(r => {
          const rd = new FileReader();
          rd.onload = () => r(rd.result.split(',')[1]);
          rd.readAsDataURL(f);
        });
        imgs.push({ type: f.type === "application/pdf" ? "document" : "image", source: { type: "base64", media_type: f.type || "image/jpeg", data: b } });
      }

      const prompt = type === "routine" 
        ? "Analizza queste routine Kids&Us. Estrai Version A e Version B in JSON: {a: [{name, duration, description}], b: [{name, duration, description}]}"
        : "Analizza la Teacher Guide. Estrai le attività dal punto 2 in poi in JSON: [{name, duration, description, targetLanguage}]";

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", messages: [{ role: "user", content: [...imgs, { type: "text", text: prompt }] }] })
      });

      const d = await res.json();
      const txt = d.content[0].text;
      const match = txt.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      const parsed = JSON.parse(match[0]);

      if (type === "routine") {
        setR(prev => ({ ...prev, [`${sc.id}|${sp}`]: parsed }));
        setSs("Routine salvate per questa storia!");
      } else {
        setL(prev => ({ ...prev, [`${sc.id}|${sp}|${sd}`]: parsed }));
        setSs("Lezione caricata!");
      }
      setTimeout(() => setScn(false), 2000);
    } catch (e) {
      setSs("Errore: riprova con un file più piccolo o una foto.");
      setTimeout(() => setScn(false), 4000);
    }
  };

  const currentR = sc && sp ? routines[`${sc.id}|${sp}`] : null;
  const currentL = sc && sp && sd ? lessons[`${sc.id}|${sp}|${sd}`] : null;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Nunito', sans-serif", background: "#FAFAF7", padding: 20 }}>
      {view === "home" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 900, marginBottom: 20 }}>Kids&Us Planner 👋</h2>
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
          <h2 style={{ color: sc.color, fontWeight: 900 }}>{sc.em} {sc.name}</h2>
          {sc.parts.map(p => (
            <div key={p} style={{ marginBottom: 25, background: "#fff", padding: 15, borderRadius: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ color: "#555" }}>{p}</h4>
                <button onClick={() => { setSp(p); fr.current.click(); }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, border: "1px solid " + sc.color, color: sc.color, background: "none", fontWeight: 700 }}>
                  {routines[`${sc.id}|${p}`] ? "✅ Routine OK" : "➕ Carica Routine"}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))", gap: 8 }}>
                {[...Array(sc.dp)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i + 1); setV("lesson"); }} style={{ padding: 10, borderRadius: 10, border: "1px solid #eee", background: "#fdfdfd", fontWeight: 800 }}>{i + 1}</button>
                ))}
              </div>
            </div>
          ))}
          <input type="file" ref={fr} style={{ display: "none" }} onChange={e => scanFile(e.target.files, "routine")} />
          {scn && <div style={{ position: "fixed", bottom: 20, right: 20, background: "#3C3C3B", color: "#fff", padding: "10px 20px", borderRadius: 10 }}>{ss}</div>}
        </div>
      )}

      {view === "lesson" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("course")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800, color: sc.color }}>← STORIA</button>
          
          <div style={{ background: "#fff", padding: 25, borderRadius: 24, border: "1px solid #eee", marginBottom: 20 }}>
             <h3 style={{ fontWeight: 900, color: sc.color }}>{sp} - Day {sd}</h3>
             
             <div style={{ marginTop: 15, background: "#f9f9f9", padding: 10, borderRadius: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>Routine Version:</p>
                <div style={{ display: "flex", gap: 5 }}>
                   <button onClick={() => setRVer("A")} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: rVer === "A" ? sc.color : "#ddd", color: "#fff", fontWeight: 700 }}>A</button>
                   <button onClick={() => setRVer("B")} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: rVer === "B" ? sc.color : "#ddd", color: "#fff", fontWeight: 700 }}>B</button>
                </div>
             </div>

             <button onClick={() => fr.current.click()} style={{ width: "100%", background: sc.color, color: "#fff", border: "none", padding: "14px", borderRadius: 14, fontWeight: 800, marginTop: 15 }}>📸 SCANSIONA DAY {sd}</button>
             <input type="file" ref={fr} style={{ display: "none" }} onChange={e => scanFile(e.target.files, "lesson")} />
          </div>

          <div style={{ marginTop: 20 }}>
            {/* Visualizzazione Routine Salvate */}
            {currentR && currentR[rVer.toLowerCase()]?.map((r, i) => (
              <div key={"r"+i} style={{ background: "#fff", padding: 15, marginBottom: 10, borderRadius: 15, borderLeft: "5px solid #3C3C3B", opacity: 0.8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><b>{r.name}</b> <span>{r.duration}'</span></div>
                <p style={{ fontSize: 12, color: "#666" }}>{r.description}</p>
              </div>
            ))}

            {/* Visualizzazione Lezione */}
            {currentL?.map((a, i) => (
              <div key={i} style={{ background: "#fff", padding: 18, marginBottom: 10, borderRadius: 15, borderLeft: "5px solid " + sc.color }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><b>{a.name}</b> <span>{a.duration}'</span></div>
                <p style={{ fontSize: 13, color: "#666" }}>{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
