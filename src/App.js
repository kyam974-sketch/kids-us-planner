import React, { useState, useEffect, useRef, useCallback } from "react";

const CS = [
  {id:"mousy",name:"Mousy",color:"#8CB43B",bg:"#F0F7E1",em:"\u{1F42D}",age:"1 anno",parts:["Part One","Part Two","Part Three","Part Four"],dp:10},
  {id:"linda",name:"Linda",color:"#F26522",bg:"#FFF0E6",em:"\u{1F431}",age:"2 anni",parts:["Part One","Part Two","Part Three","Part Four"],dp:10},
  {id:"sam",name:"Sam",color:"#00B3B0",bg:"#E0F7F7",em:"\u{1F9F8}",age:"3 anni",parts:["Story 1: Happy Birthday","Story 2: The Park","Story 3: The Zoo","Story 4: The Picnic"],dp:10},
  {id:"emma",name:"Emma",color:"#E878A0",bg:"#FFF0F5",em:"\u{1F98B}",age:"4 anni",parts:["Story 1: Sweets","Story 2: Eggs","Story 3: Bath","Story 4"],dp:10},
  {id:"oliver",name:"Oliver",color:"#00B3B0",bg:"#E0F7F7",em:"\u{1F438}",age:"5 anni",parts:["Story 1: Wobbly Tooth","Story 2: Flu","Story 3: Baby","Story 4"],dp:10},
  {id:"marcia",name:"Marcia",color:"#E94E58",bg:"#FFEBEE",em:"\u{1F380}",age:"6 anni",parts:["Story 1: The Alien","Story 2: Polly Goes to School","Story 3: The Ski Trip","Story 4: The Birthday Cake"],dp:10}
];

export default function App() {
  const [view, setV] = useState("home");
  const [lessons, setL] = useState({});
  const [sc, setSc] = useState(null);
  const [sp, setSp] = useState(null);
  const [sd, setSd] = useState(null);
  const [st, setSt] = useState("17:00");
  const [ld, setLd] = useState(false);
  const [el, setEl] = useState(0);
  const [lv, setLv] = useState(false);
  const [ci, setCi] = useState(0);
  const [dn, setDn] = useState(new Set());
  const [as2, setAs] = useState(false);
  const [pr, setPr] = useState(false);
  const [scn, setScn] = useState(false);
  const [ss, setSs] = useState("");
  const [exp, setExp] = useState(new Set());
  
  const fr = useRef(null);
  const tr = useRef(null);
  const ar = useRef(null);

  const cl = sc && sp != null && sd != null ? lessons[sc.id + "|" + sp + "|" + sd] : null;

  const svL = useCallback((l) => {
    setL(p => ({ ...p, [l.courseId + "|" + l.part + "|" + l.day]: l }));
  }, []);

  const gT = (a, s) => {
    const [h, m] = s.split(":").map(Number);
    let c = 0;
    return a.filter(x => !x.optional).map(x => {
      const t = h * 60 + m + c;
      c += x.duration;
      return { ...x, st: `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}` };
    });
  };

  const td = a => a.filter(x => !x.optional).reduce((s, x) => s + x.duration, 0);
  const ft = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const goH = () => { setV("home"); setSc(null); setSp(null); setSd(null); setLv(false); setDn(new Set()); };

  const scanD = async (files) => {
    if (!files || !files.length || !sc || !sp || !sd) return;
    setScn(true); setSs("Lettura documenti...");
    try {
      const imgs = [];
      for (const f of files) {
        const b = await new Promise((r, j) => {
          const rd = new FileReader();
          rd.onload = () => r(rd.result.split(",")[1]);
          rd.onerror = j;
          rd.readAsDataURL(f);
        });
        const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
        imgs.push({
          type: isPdf ? "document" : "image",
          source: { type: "base64", media_type: isPdf ? "application/pdf" : (f.type || "image/jpeg"), data: b }
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
              { type: "text", text: "Estrai le attività in JSON. Warm-up come blocco unico." }
            ]
          }]
        })
      });
      const d = await res.json();
      const txt = d.content[0].text;
      const parsed = JSON.parse(txt.match(/\[[\s\S]*\]/)[0]);
      const acts = parsed.map((p, i) => ({
        id: "s" + Date.now() + "_" + i,
        name: p.name || "?",
        duration: p.duration || 3,
        tracks: p.tracks || "",
        targetLanguage: p.target_language || "",
        description: p.description || "",
        materials: p.materials || "",
        optional: !!p.optional,
        sub: p.sub || null
      }));
      svL({ courseId: sc.id, part: sp, day: sd, activities: acts });
      setSs("Completato!");
      setTimeout(() => setScn(false), 3000);
    } catch (e) {
      setSs("Errore: " + e.message);
      setTimeout(() => setScn(false), 4000);
    }
  };

  if (ld) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}>Caricamento...</div>;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "Nunito, sans-serif", background: "#FAFAF7", color: "#3C3C3B" }}>
      {view === "home" && (
        <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 900, marginBottom: 20 }}>I tuoi Corsi 👋</h2>
          {CS.map(c => (
            <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 20, marginBottom: 12, borderRadius: 16, borderLeft: "6px solid " + c.color, cursor: "pointer", display: "flex", alignItems: "center", gap: 15 }}>
              <span style={{ fontSize: 28 }}>{c.em}</span>
              <div>
                <b style={{ fontSize: 18 }}>{c.name}</b>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{c.age}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "course" && sc && (
        <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
          <button onClick={goH} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800, cursor: "pointer" }}>← HOME</button>
          <h2 style={{ color: sc.color, fontWeight: 900 }}>{sc.em} {sc.name}</h2>
          {sc.parts.map(p => (
            <div key={p} style={{ marginTop: 20 }}>
              <h4 style={{ marginBottom: 10 }}>{p}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 8 }}>
                {[...Array(sc.dp)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i+1); setV("lesson"); }} style={{ padding: 10, borderRadius: 10, border: "1px solid #eee", background: "#fff", fontWeight: 800 }}>{i+1}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "lesson" && (
        <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("course")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800 }}>← CORSO</button>
          <div style={{ background: "#fff", padding: 30, borderRadius: 24, textAlign: "center", border: "1px solid #eee" }}>
            <h3 style={{ fontWeight: 900 }}>Day {sd}</h3>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>Carica la Teacher Guide</p>
            <input type="file" multiple onChange={(e) => scanD(e.target.files)} style={{ display: "none" }} ref={fr} accept="image/*,application/pdf" />
            <button onClick={() => fr.current.click()} style={{ background: sc.color, color: "#fff", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 800, cursor: "pointer" }}>📸 CARICA PDF / FOTO</button>
            {scn && <div style={{ marginTop: 15, fontWeight: 700, color: "#F26522" }}>{ss}</div>}
          </div>
          
          {cl && cl.activities.map((a, i) => (
            <div key={i} style={{ background: "#fff", padding: 15, marginTop: 10, borderRadius: 16, borderLeft: "4px solid " + sc.color }}>
              <b>{a.name}</b>
              <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{a.description}</p>
              {a.targetLanguage && <div style={{ marginTop: 8, padding: 8, background: "#FFFDE7", borderRadius: 8, fontSize: 11 }}><b>Target:</b> {a.targetLanguage}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
