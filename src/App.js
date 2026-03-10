import React, { useState, useCallback, useRef } from "react";

const CS = [
  {id:"mousy",name:"Mousy",color:"#8CB43B",bg:"#F0F7E1",em:"\u{1F42D}",age:"1 anno",parts:["Part One","Part Two"],dp:10},
  {id:"linda",name:"Linda",color:"#F26522",bg:"#FFF0E6",em:"\u{1F431}",age:"2 anni",parts:["Part One","Part Two"],dp:10},
  {id:"sam",name:"Sam",color:"#00B3B0",bg:"#E0F7F7",em:"\u{1F9F8}",age:"3 anni",parts:["Story 1","Story 2"],dp:10}
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
    setScn(true); setSs("Analisi...");
    try {
      const imgs = [];
      for (const f of files) {
        const b = await new Promise((r) => {
          const rd = new FileReader();
          rd.onload = () => r(rd.result.split(",")[1]);
          rd.readAsDataURL(f);
        });
        const isPdf = f.type === "application/pdf";
        imgs.push({
          type: isPdf ? "document" : "image",
          source: { type: "base64", media_type: isPdf ? "application/pdf" : "image/jpeg", data: b }
        });
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2000,
          messages: [{role: "user", content: [...imgs, {type:"text", text:"JSON: [{name, duration, description}]"}]}]
        })
      });
      const d = await res.json();
      const acts = JSON.parse(d.content[0].text.match(/\[[\s\S]*\]/)[0]);
      svL({ courseId: sc.id, part: sp, day: sd, activities: acts });
      setSs("Fatto!");
      setTimeout(() => setScn(false), 2000);
    } catch (e) {
      setSs("Errore");
      setTimeout(() => setScn(false), 2000);
    }
  };

  const cl = sc && sp && sd ? lessons[sc.id + "|" + sp + "|" + sd] : null;

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      {view === "home" && (
        <div>
          <h2>Kids&Us Planner 👋</h2>
          {CS.map(c => (
            <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ padding: 15, background: "#fff", marginBottom: 10, borderRadius: 10, borderLeft: "5px solid "+c.color, cursor: "pointer" }}>
              {c.em} {c.name}
            </div>
          ))}
        </div>
      )}
      {view === "course" && sc && (
        <div>
          <button onClick={() => setV("home")}>Indietro</button>
          <h3>{sc.name}</h3>
          {sc.parts.map(p => (
            <div key={p}>
              <p>{p}</p>
              {[...Array(sc.dp)].map((_, i) => (
                <button key={i} onClick={() => { setSp(p); setSd(i+1); setV("lesson"); }}>{i+1}</button>
              ))}
            </div>
          ))}
        </div>
      )}
      {view === "lesson" && (
        <div>
          <button onClick={() => setV("course")}>Indietro</button>
          <h3>Day {sd}</h3>
          <input type="file" multiple onChange={e => scanD(e.target.files)} ref={fr} style={{display:"none"}} />
          <button onClick={() => fr.current.click()} style={{padding:10, background:sc.color, color:"#fff", border:"none", borderRadius:8}}>CARICA TG</button>
          {scn && <p>{ss}</p>}
          {cl && cl.activities.map((a, i) => (
            <div key={i} style={{background:"#fff", padding:10, marginTop:5, borderRadius:8}}>
              <b>{a.name}</b> ({a.duration}m)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
