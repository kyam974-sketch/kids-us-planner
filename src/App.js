import React, { useState, useEffect, useRef, useCallback } from "react";

const CS = [
  {id:"mousy",name:"Mousy",color:"#8CB43B",bg:"#F0F7E1",em:"\u{1F42D}",age:"1 anno",parts:["Part One","Part Two","Part Three","Part Four"],dp:10},
  {id:"linda",name:"Linda",color:"#F26522",bg:"#FFF0E6",em:"\u{1F431}",age:"2 anni",parts:["Part One","Part Two","Part Three","Part Four"],dp:10},
  {id:"sam",name:"Sam",color:"#00B3B0",bg:"#E0F7F7",em:"\u{1F9F8}",age:"3 anni",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10},
  {id:"emma",name:"Emma",color:"#E878A0",bg:"#FFF0F5",em:"\u{1F98B}",age:"4 anni",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10},
  {id:"oliver",name:"Oliver",color:"#00B3B0",bg:"#E0F7F7",em:"\u{1F438}",age:"5 anni",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10},
  {id:"marcia",name:"Marcia",color:"#E94E58",bg:"#FFEBEE",em:"\u{1F380}",age:"6 anni",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10}
];

export default function App() {
  const [view, setV] = useState("home");
  const [lessons, setL] = useState({});
  const [sc, setSc] = useState(null);
  const [sp, setSp] = useState(null);
  const [sd, setSd] = useState(null);
  const [scn, setScn] = useState(false);
  const [ss, setSs] = useState("");
  const fr = useRef(null);

  const svL = useCallback((l) => {
    setL(p => ({ ...p, [l.courseId + "|" + l.part + "|" + l.day]: l }));
  }, []);

  const scanD = async (files) => {
    if (!files.length || !sc) return;
    setScn(true); setSs("Analisi PDF/Foto in corso...");
    try {
      const imgs = [];
      for (const f of files) {
        const b = await new Promise((r) => {
          const rd = new FileReader();
          rd.onload = () => r(rd.result.split(",")[1]);
          rd.readAsDataURL(f);
        });
        imgs.push({
          type: f.type === "application/pdf" ? "document" : "image",
          source: { type: "base64", media_type: f.type || "image/jpeg", data: b }
        });
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: [
              ...imgs,
              { type: "text", text: "Estrai la lezione Kids&Us. SEPARA sempre 'Warm-up Routines' come prima attività. Rispondi SOLO con un array JSON: [{\"name\": \"...\", \"duration\": 5, \"description\": \"...\", \"targetLanguage\": \"...\"}]" }
            ]
          }]
        })
      });
      const d = await res.json();
      const txt = d.content[0].text;
      const match = txt.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Dati non validi");
      const acts = JSON.parse(match[0]);
      svL({ courseId: sc.id, part: sp, day: sd, activities: acts });
      setSs("Caricato con successo!");
      setTimeout(() => setScn(false), 2000);
    } catch (e) {
      setSs("Errore: " + e.message);
      setTimeout(() => setScn(false), 4000);
    }
  };

  const cl = sc && sp && sd ? lessons[sc.id + "|" + sp + "|" + sd] : null;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "Nunito, sans-serif", background: "#FAFAF7", padding: 20 }}>
      {view === "home" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 900, marginBottom: 25, color: "#3C3C3B" }}>I tuoi corsi Kids&Us 👋</h2>
          {CS.map(c => (
            <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 20, marginBottom: 12, borderRadius: 18, borderLeft: "6px solid " + c.color, cursor: "pointer", display: "flex", alignItems: "center", gap: 15, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: 30 }}>{c.em}</span>
              <div>
                <b style={{ fontSize: 18, color: "#3C3C3B" }}>{c.name}</b>
                <p style={{ margin: 0, fontSize: 13, color: "#888" }}>{c.age}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "course" && sc && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("home")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800, color: sc.color, cursor: "pointer" }}>← HOME</button>
          <h2 style={{ color: sc.color, fontWeight: 900, marginBottom: 20 }}>{sc.em} {sc.name}</h2>
          {sc.parts.map(p => (
            <div key={p} style={{ marginBottom: 25 }}>
              <h4 style={{ marginBottom: 10, color: "#555" }}>{p}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(55px, 1fr))", gap: 8 }}>
                {[...Array(sc.dp)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i+1); setV("lesson"); }} style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", background: "#fff", fontWeight: 800, cursor: "pointer" }}>{i + 1}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "lesson" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("course")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800, color: sc.color, cursor: "pointer" }}>← CORSO</button>
          <div style={{ background: "#fff", padding: 30, borderRadius: 24, textAlign: "center", border: "1px solid #eee", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
             <h3 style={{ fontWeight: 900, color: sc.color }}>{sc.name} - Day {sd}</h3>
             <p style={{ color: "#888", fontSize: 13, marginTop: 5, marginBottom: 25 }}>{sp}</p>
             <input type="file" multiple onChange={e => scanD(e.target.files)} ref={fr} style={{display:"none"}} accept="image/*,application/pdf" />
             <button onClick={() => fr.current.click()} style={{ background: sc.color, color: "#fff", border: "none", padding: "14px 28px", borderRadius: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 15px " + sc.color + "44" }}>📸 SCANSIONA TG</button>
             {scn && <div style={{ marginTop: 20, fontWeight: 700, color: "#F26522" }}>{ss}</div>}
          </div>

          {cl && (
            <div style={{ marginTop: 30 }}>
              <h4 style={{ marginBottom: 15, fontWeight: 800, color: "#3C3C3B" }}>Programma della lezione:</h4>
              {cl.activities.map((a, i) => (
                <div key={i} style={{ background: "#fff", padding: 18, marginBottom: 12, borderRadius: 16, borderLeft: "5px solid " + (a.name.toLowerCase().includes("warm-up") ? "#3C3C3B" : sc.color), boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <b style={{ fontSize: 15 }}>{a.name}</b>
                    <span style={{ fontSize: 13, fontWeight: 800, color: sc.color }}>{a.duration}'</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#666", lineHeight: "1.4" }}>{a.description}</p>
                  {a.targetLanguage && (
                    <div style={{ marginTop: 10, padding: 10, background: "#FFFDE7", borderRadius: 8, fontSize: 12, borderLeft: "3px solid #FFD600" }}>
                      <b>Target Language:</b> {a.targetLanguage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
