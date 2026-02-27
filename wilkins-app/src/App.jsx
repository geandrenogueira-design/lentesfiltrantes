import { useState, useEffect, useRef } from "react";

// ─── Color Science ─────────────────────────────────────────────────────────
const hslToHex = (h, s, l) => {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const getContrastColor = hex => {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return (0.299*r + 0.587*g + 0.114*b) / 255 > 0.5 ? "#1a1a2e" : "#f5f0e8";
};

// ─── Data ──────────────────────────────────────────────────────────────────
const COLOR_FAMILIES = [
  { name: "Violeta",      hue: 270, description: "Enxaqueca, fotofobia intensa" },
  { name: "Azul",         hue: 220, description: "Distorções em texto, fadiga" },
  { name: "Ciano",        hue: 185, description: "Sensibilidade a luz fluorescente" },
  { name: "Verde",        hue: 140, description: "Síndrome de Irlen, dislexia" },
  { name: "Amarelo-verde",hue:  80, description: "Contraste e velocidade de leitura" },
  { name: "Amarelo",      hue:  50, description: "Dificuldade de rastreamento" },
  { name: "Laranja",      hue:  30, description: "Cefaleia por esforço visual" },
  { name: "Vermelho",     hue:   0, description: "Sensibilidade a padrões listrados" },
  { name: "Rosa",         hue: 330, description: "Distorção e instabilidade visual" },
];

const SATURATION_LEVELS = [
  { label: "Muito baixa", value: 15, desc: "Quase neutro" },
  { label: "Baixa",       value: 30, desc: "Leve tintagem" },
  { label: "Moderada",    value: 50, desc: "Uso geral" },
  { label: "Alta",        value: 70, desc: "Sensibilidade elevada" },
  { label: "Muito alta",  value: 90, desc: "Fotofobia severa" },
];

const SYMPTOMS = [
  { id: "words_move",      text: "Palavras parecem se mover ou tremular ao ler",              category: "visual"   },
  { id: "letters_blur",    text: "Letras ficam borradas ou desfocadas durante a leitura",     category: "visual"   },
  { id: "halos",           text: "Enxerga halos ou brilho excessivo ao redor das letras",     category: "visual"   },
  { id: "lines_merge",     text: "Linhas de texto parecem se misturar ou pular",              category: "visual"   },
  { id: "headache_reading",text: "Dor de cabeça ao ler ou usar telas",                       category: "pain"     },
  { id: "eye_pain",        text: "Dor ou ardência nos olhos durante leitura",                category: "pain"     },
  { id: "light_sensitivity",text:"Sensibilidade à luz (fotofobia)",                          category: "light"    },
  { id: "fluorescent",     text: "Desconforto com luz fluorescente ou LED",                  category: "light"    },
  { id: "striped_patterns",text: "Desconforto ao ver padrões listrados ou xadrez",           category: "pattern"  },
  { id: "slow_reading",    text: "Leitura lenta ou necessidade de reler trechos",            category: "function" },
  { id: "lose_place",      text: "Perde o lugar na linha ao ler",                            category: "function" },
  { id: "concentration",   text: "Dificuldade de concentração em texto por mais de 10 min", category: "function" },
];

const SEVERITY = [
  { value: 0, label: "Nunca"     },
  { value: 1, label: "Raramente" },
  { value: 2, label: "Às vezes"  },
  { value: 3, label: "Frequente" },
  { value: 4, label: "Sempre"    },
];

const PATTERN_SYMPTOMS = [
  { id: "ps_blur",     text: "Borramento ou desfoque das listras"   },
  { id: "ps_color",    text: "Cores falsas nas bordas das listras"  },
  { id: "ps_move",     text: "Listras parecem se mover ou vibrar"   },
  { id: "ps_3d",       text: "Efeito 3D ou profundidade ilusória"   },
  { id: "ps_disappear",text: "Listras desaparecem ou agrupam"       },
  { id: "ps_headache", text: "Dor de cabeça ou desconforto ocular"  },
  { id: "ps_nausea",   text: "Náusea ou tontura"                    },
];

const GRATINGS = [
  { id:"low",  label:"Baixa frequência",   cycles:"~1 ciclo/grau",  stripeWidth:48, description:"Faixas largas — raramente provoca sintomas (controle)"          },
  { id:"mid",  label:"Frequência média",   cycles:"~3 ciclos/grau", stripeWidth:16, description:"Faixas médias — máxima sensibilidade cortical (Wilkins)"         },
  { id:"high", label:"Alta frequência",    cycles:"~12 ciclos/grau",stripeWidth:4,  description:"Faixas finas — referência de comparação"                         },
];

const READING_WORDS = [
  "the","an","in","at","on","it","he","is","go","do",
  "up","me","my","we","be","by","no","so","to","or",
  "as","of","if","am","us","ox","via","ago","few","saw",
  "big","can","did","eat","fun","got","hit","ink","job","kit",
];

const STEPS = ["Início","Paciente","Sintomas","Pattern Glare","Leitura Base","Cor","Saturação","Validação","Resultado"];

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]                       = useState(0);
  const [patient, setPatient]                 = useState({ name:"", age:"", complaint:"" });
  const [symptoms, setSymptoms]               = useState({});
  const [patternSymptoms, setPatternSymptoms] = useState({});
  const [activeGrating, setActiveGrating]     = useState(null);
  const [baselineWPM, setBaselineWPM]         = useState(null);
  const [tintedWPM, setTintedWPM]             = useState(null);
  const [selectedFamily, setSelectedFamily]   = useState(null);
  const [selectedSat, setSelectedSat]         = useState(2);
  const [isReading, setIsReading]             = useState(false);
  const [readingTimer, setReadingTimer]       = useState(60);
  const [wordCount, setWordCount]             = useState(0);
  const [readingPhase, setReadingPhase]       = useState("baseline");
  const [overlay, setOverlay]                 = useState(false);
  const timerRef                              = useRef(null);

  const currentColor = selectedFamily !== null
    ? { hue: COLOR_FAMILIES[selectedFamily].hue, sat: SATURATION_LEVELS[selectedSat].value }
    : null;

  // Scroll to top on step change
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  // Reading timer
  useEffect(() => {
    if (isReading && readingTimer > 0) {
      timerRef.current = setTimeout(() => setReadingTimer(t => t - 1), 1000);
    } else if (isReading && readingTimer === 0) {
      setIsReading(false);
      setOverlay(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [isReading, readingTimer]);

  const startReading = phase => {
    setReadingPhase(phase);
    setWordCount(0);
    setReadingTimer(60);
    setIsReading(true);
    if (phase === "tinted") setOverlay(true);
  };

  const finishReading = () => {
    const elapsed = (60 - readingTimer) || 1;
    const wpm = Math.round((wordCount / elapsed) * 60);
    clearTimeout(timerRef.current);
    setIsReading(false);
    setOverlay(false);
    if (readingPhase === "baseline") { setBaselineWPM(wpm); setStep(5); }
    else                             { setTintedWPM(wpm);   setStep(8); }
  };

  // Symptom scoring
  const symptomScore = Object.values(symptoms).reduce((a,b) => a+b, 0);
  const maxScore     = SYMPTOMS.length * 4;
  const severity     = symptomScore / maxScore;

  const suggestedFamilies = () => {
    const cats = { visual:0, pain:0, light:0, pattern:0, function:0 };
    SYMPTOMS.forEach(s => { cats[s.category] += (symptoms[s.id] || 0); });
    const s = [];
    if (cats.light   > 4) s.push(1,2);
    if (cats.visual  > 6) s.push(4,5);
    if (cats.pain    > 4) s.push(0,8);
    if (cats.pattern > 4) s.push(7,0);
    if (cats.function> 6) s.push(3,4);
    return [...new Set(s)];
  };

  const improvement = tintedWPM && baselineWPM
    ? Math.round(((tintedWPM - baselineWPM) / baselineWPM) * 100)
    : 0;

  const resetAll = () => {
    setStep(0); setPatient({name:"",age:"",complaint:""});
    setSymptoms({}); setPatternSymptoms({}); setActiveGrating(null);
    setBaselineWPM(null); setTintedWPM(null);
    setSelectedFamily(null); setSelectedSat(2);
    setWordCount(0); setIsReading(false);
  };

  // ── Reading Test ──────────────────────────────────────────────────────────
  const ReadingTest = ({ phase }) => {
    const radius = 52;
    const circ   = 2 * Math.PI * radius;
    const dash   = ((60 - readingTimer) / 60) * circ;
    const tintBg = phase === "tinted" && currentColor
      ? hslToHex(currentColor.hue, currentColor.sat, 93)
      : "white";

    return (
      <div className="reading-test" style={{ backgroundColor: tintBg }}>
        {!isReading ? (
          <>
            <p style={{ fontSize:"0.88rem", color:"var(--text-muted)", marginBottom:"1rem" }}>
              {phase === "baseline"
                ? "Leitura SEM filtro — estabelece a linha de base"
                : "Leitura COM filtro — avalia a melhora"}
            </p>
            <div className="reading-words" style={{ opacity:0.25, filter:"blur(3px)", userSelect:"none" }}>
              {READING_WORDS.map((w,i) => <span key={i} className="reading-word">{w}</span>)}
            </div>
            <p style={{ fontSize:"0.88rem", color:"var(--text-muted)", margin:"0 0 1.5rem" }}>
              Peça ao paciente para ler em voz alta. Toque em <strong>Iniciar</strong> e registre cada palavra.
            </p>
            <button className="btn btn-primary" style={{ fontSize:"1rem", padding:"1rem 2rem" }}
              onClick={() => startReading(phase)}>
              ▶ Iniciar Leitura (60s)
            </button>
          </>
        ) : (
          <>
            <div className="timer-ring">
              <svg width="130" height="130" viewBox="0 0 130 130">
                <circle cx="65" cy="65" r={radius} fill="none" stroke="#e0e0e0" strokeWidth="9" />
                <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--accent)" strokeWidth="9"
                  strokeDasharray={circ} strokeDashoffset={circ - dash} strokeLinecap="round" />
              </svg>
              <div className="timer-text">{readingTimer}</div>
            </div>
            <div className="reading-words">
              {[...READING_WORDS,...READING_WORDS,...READING_WORDS].map((w,i) =>
                <span key={i} className="reading-word">{w}</span>)}
            </div>
            <p style={{ fontSize:"0.88rem", color:"var(--text-muted)", margin:"0.5rem 0 1rem" }}>
              Toque <strong style={{ color:"var(--success)" }}>+</strong> para cada palavra lida corretamente
            </p>
            <div className="counter-display">{wordCount}</div>
            <div className="counter-controls">
              <button className="count-btn"
                onClick={() => setWordCount(w => Math.max(0, w-1))}>−</button>
              <button className="count-btn-add"
                onClick={() => setWordCount(w => w+1)}>+</button>
              <button className="btn btn-danger" style={{ minHeight:52, padding:"0 1.25rem" }}
                onClick={finishReading}>Encerrar</button>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── Screens ───────────────────────────────────────────────────────────────
  const screens = {

    // 0 — INTRO
    0: (
      <div className="screen">
        <div className="intro-hero">
          <div className="intro-title">Protocolo Wilkins<br/><em>Precision Tinted Lenses</em></div>
          <p className="intro-sub">
            Avaliação clínica para prescrição de filtros cromáticos baseada no
            Intuitive Colorimeter System de Arnold Wilkins (MRC Cambridge).
          </p>
        </div>
        <div className="steps-list">
          {[
            ["Dados do Paciente",        "Identificação e queixa principal"],
            ["Questionário de Sintomas", "Quantificação — Wilkins Visual Sensitivity Scale"],
            ["Pattern Glare Test",       "Grades de listras em 3 frequências espaciais (Wilkins & Evans, 2001)"],
            ["Teste de Leitura Base",    "Velocidade sem filtro (palavras por minuto)"],
            ["Seleção de Família de Cor","Identificação do matiz cromático ideal"],
            ["Ajuste de Saturação",      "Calibração da intensidade do filtro"],
            ["Validação com Filtro",     "Confirmação por melhora objetiva na leitura"],
            ["Prescrição",               "Laudo com especificações para laboratório óptico"],
          ].map(([t,d],i) => (
            <div className="step-item" key={i}>
              <div className="step-num">{i+1}</div>
              <div className="step-content"><h4>{t}</h4><p>{d}</p></div>
            </div>
          ))}
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" style={{ fontSize:"1rem", padding:"1rem 2.5rem" }}
            onClick={() => setStep(1)}>
            Iniciar Avaliação →
          </button>
        </div>
      </div>
    ),

    // 1 — PATIENT
    1: (
      <div className="screen">
        <h2 className="screen-title">Dados do Paciente</h2>
        <p className="screen-subtitle">Identificação e queixa principal</p>
        <div className="card">
          <div className="input-group">
            <label className="input-label">Nome completo</label>
            <input className="input-field" placeholder="Nome do paciente"
              value={patient.name} onChange={e => setPatient(p => ({...p, name: e.target.value}))} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
            <div className="input-group">
              <label className="input-label">Idade</label>
              <input className="input-field" type="number" placeholder="Anos"
                value={patient.age} onChange={e => setPatient(p => ({...p, age: e.target.value}))} />
            </div>
            <div className="input-group">
              <label className="input-label">Data</label>
              <input className="input-field" type="date"
                defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          <div className="input-group" style={{ marginBottom:0 }}>
            <label className="input-label">Queixa principal / Histórico</label>
            <textarea className="input-field"
              placeholder="Cefaleia, dificuldades de leitura, fotofobia, diagnósticos anteriores..."
              value={patient.complaint}
              onChange={e => setPatient(p => ({...p, complaint: e.target.value}))} />
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => setStep(0)}>← Voltar</button>
          <button className="btn btn-primary"   onClick={() => setStep(2)} disabled={!patient.name}>Próximo →</button>
        </div>
      </div>
    ),

    // 2 — SYMPTOMS
    2: (
      <div className="screen">
        <h2 className="screen-title">Questionário de Sintomas</h2>
        <p className="screen-subtitle">Wilkins Visual Sensitivity Scale — frequência de cada sintoma</p>
        <div className="card">
          <div className="symptom-grid">
            {SYMPTOMS.map(s => (
              <div className="symptom-row" key={s.id}
                style={{ borderColor: (symptoms[s.id]||0) > 0 ? "var(--border)" : "transparent" }}>
                <span className="symptom-text">{s.text}</span>
                <div className="severity-btns">
                  {SEVERITY.map(sev => (
                    <button key={sev.value} className={`sev-btn ${(symptoms[s.id]??0)===sev.value?"active":""}`}
                      onClick={() => setSymptoms(p => ({...p,[s.id]:sev.value}))}
                      title={sev.label}>
                      {sev.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="score-bar-wrap">
            <div className="score-label">
              <span>Pontuação total</span>
              <strong>{symptomScore} / {maxScore}</strong>
            </div>
            <div className="score-bar">
              <div className="score-fill" style={{
                width: `${severity*100}%`,
                background: severity < 0.3 ? "#27ae60" : severity < 0.6 ? "#f39c12" : "#c0392b"
              }} />
            </div>
            <p style={{ marginTop:"0.5rem", fontSize:"0.82rem", color:"var(--text-muted)" }}>
              {severity < 0.2
                ? "Sintomas leves — filtro pode não ser necessário"
                : severity < 0.5
                  ? "Sintomas moderados — triagem indicada"
                  : "Sintomas severos — alta probabilidade de benefício com filtro"}
            </p>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => setStep(1)}>← Voltar</button>
          <button className="btn btn-primary"   onClick={() => setStep(3)}>Próximo →</button>
        </div>
      </div>
    ),

    // 3 — PATTERN GLARE TEST
    3: (
      <div className="screen">
        <h2 className="screen-title">Pattern Glare Test</h2>
        <p className="screen-subtitle">Sensibilidade cortical a padrões listrados — Wilkins & Evans, 2001</p>
        <div className="card" style={{ marginBottom:"1.25rem" }}>
          <div className="card-title">Instruções</div>
          <p style={{ fontSize:"0.88rem", lineHeight:1.7, color:"var(--text-muted)" }}>
            Apresente cada grade por <strong>10 segundos</strong> a <strong>40 cm</strong>, em
            iluminação uniforme. O paciente olha fixamente para o centro e relata qualquer sensação anormal.
            Registre os sintomas para cada frequência separadamente.
          </p>
        </div>

        {/* Grating Selector */}
        <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
          {GRATINGS.map(g => (
            <button key={g.id}
              className={`btn ${activeGrating===g.id ? "btn-primary" : "btn-secondary"}`}
              style={{ flex:1, minWidth:"150px", flexDirection:"column", gap:"0.15rem", padding:"0.85rem" }}
              onClick={() => setActiveGrating(g.id)}>
              <span style={{ fontWeight:700 }}>{g.label}</span>
              <span style={{ fontSize:"0.75rem", opacity:0.72, fontWeight:400 }}>{g.cycles}</span>
            </button>
          ))}
        </div>

        {/* Grating Display */}
        {activeGrating && (() => {
          const g = GRATINGS.find(x => x.id===activeGrating);
          return (
            <div style={{ marginBottom:"1.5rem" }}>
              <div style={{
                width:"100%", height:"clamp(200px, 40vw, 340px)", height:"300px",
                borderRadius:"14px", overflow:"hidden",
                border:"2px solid var(--border)", position:"relative",
              }}>
                <div style={{
                  position:"absolute", inset:0,
                  backgroundImage:`repeating-linear-gradient(0deg,
                    #000 0px, #000 ${g.stripeWidth/2}px,
                    #fff ${g.stripeWidth/2}px, #fff ${g.stripeWidth}px)`,
                }} />
                <div style={{
                  position:"absolute", bottom:"1rem", left:"50%", transform:"translateX(-50%)",
                  background:"rgba(0,0,0,0.65)", color:"white",
                  padding:"0.3rem 1rem", borderRadius:"99px",
                  fontSize:"0.78rem", letterSpacing:"0.05em", whiteSpace:"nowrap",
                }}>
                  {g.label} · {g.cycles}
                </div>
              </div>
              <p style={{ fontSize:"0.8rem", color:"var(--text-muted)", marginTop:"0.5rem", textAlign:"center" }}>
                {g.description}
              </p>
            </div>
          );
        })()}

        {/* Symptom Checklist */}
        {activeGrating && (
          <div className="card">
            <div className="card-title">
              Sintomas relatados — {GRATINGS.find(g => g.id===activeGrating)?.label}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem" }}>
              {PATTERN_SYMPTOMS.map(s => {
                const key     = `${activeGrating}_${s.id}`;
                const checked = !!patternSymptoms[key];
                return (
                  <label key={key} style={{
                    display:"flex", alignItems:"center", gap:"1rem",
                    padding:"0.85rem 1rem", minHeight:52,
                    background: checked ? "#f0f5fb" : "var(--paper)",
                    border:`1.5px solid ${checked ? "var(--accent)" : "var(--border)"}`,
                    borderRadius:"10px", cursor:"pointer", fontSize:"0.9rem",
                    transition:"all 0.15s",
                  }}>
                    <input type="checkbox" checked={checked}
                      onChange={e => setPatternSymptoms(p => ({...p,[key]:e.target.checked}))}
                      style={{ width:22, height:22, accentColor:"var(--accent)", flexShrink:0 }} />
                    {s.text}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {Object.values(patternSymptoms).some(Boolean) && (
          <div className="card" style={{ background:"#fdf8ee", border:"1px solid #e8d5a0" }}>
            <div className="card-title" style={{ color:"#7a6020" }}>Resumo Pattern Glare</div>
            {GRATINGS.map(g => {
              const count = PATTERN_SYMPTOMS.filter(s => patternSymptoms[`${g.id}_${s.id}`]).length;
              const pct   = Math.round((count / PATTERN_SYMPTOMS.length) * 100);
              return (
                <div key={g.id} style={{ marginBottom:"0.85rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.85rem", marginBottom:"0.3rem" }}>
                    <span style={{ fontWeight:500 }}>{g.label}</span>
                    <span style={{ fontWeight:700, color: count>=3 ? "var(--danger)" : count>=1 ? "#c47a00" : "var(--success)" }}>
                      {count} sintoma{count!==1?"s":""}{count>=3?" — alto":count>=1?" — moderado":" — normal"}
                    </span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{
                      width:`${pct}%`,
                      background: count>=3 ? "var(--danger)" : count>=1 ? "#f39c12" : "var(--success)"
                    }} />
                  </div>
                </div>
              );
            })}
            <p style={{ marginTop:"0.75rem", fontSize:"0.82rem", color:"#7a6020" }}>
              {(() => {
                const mid = PATTERN_SYMPTOMS.filter(s => patternSymptoms[`mid_${s.id}`]).length;
                const low = PATTERN_SYMPTOMS.filter(s => patternSymptoms[`low_${s.id}`]).length;
                if (mid >= 3)           return "⚠ Padrão Pattern Glare positivo — forte indicação para filtro cromático";
                if (mid >= 1 && mid>low)return "△ Sensibilidade aumentada à frequência média — triagem indicada";
                return "✓ Sem padrão significativo de sensibilidade visual";
              })()}
            </p>
          </div>
        )}

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => setStep(2)}>← Voltar</button>
          <button className="btn btn-primary"   onClick={() => setStep(4)}>Próximo: Leitura Base →</button>
        </div>
      </div>
    ),

    // 4 — BASELINE READING
    4: (
      <div className="screen">
        <h2 className="screen-title">Teste de Leitura Base</h2>
        <p className="screen-subtitle">Wilkins Rate of Reading Test — sem filtro, linha de base</p>
        <ReadingTest phase="baseline" />
        {baselineWPM && (
          <div className="card" style={{ marginTop:"1.25rem", textAlign:"center" }}>
            <p style={{ fontSize:"0.82rem", color:"var(--text-muted)", marginBottom:"0.4rem" }}>Resultado base</p>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"2.8rem", color:"var(--accent)" }}>
              {baselineWPM} <span style={{ fontSize:"1rem" }}>pal/min</span>
            </div>
          </div>
        )}
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => setStep(3)}>← Voltar</button>
          {baselineWPM && <button className="btn btn-primary" onClick={() => setStep(5)}>Próximo →</button>}
        </div>
      </div>
    ),

    // 5 — COLOR FAMILY
    5: (
      <div className="screen">
        <h2 className="screen-title">Família de Cor</h2>
        <p className="screen-subtitle">Matizes do Intuitive Colorimeter — selecione o mais indicado</p>
        {suggestedFamilies().length > 0 && (
          <div className="suggested-note">
            ★ <strong>Sugeridas pelos sintomas:</strong>{" "}
            {suggestedFamilies().map(i => COLOR_FAMILIES[i].name).join(", ")}.{" "}
            Priorize-as, mas avalie a preferência do paciente.
          </div>
        )}
        <div className="color-grid">
          {COLOR_FAMILIES.map((fam, i) => {
            const sw = hslToHex(fam.hue, 70, 68);
            return (
              <div key={i}
                className={`color-card ${selectedFamily===i?"selected":""} ${suggestedFamilies().includes(i)?"suggested":""}`}
                onClick={() => setSelectedFamily(i)}>
                <div className="color-swatch" style={{ backgroundColor:sw }} />
                <div className="color-info">
                  <div className="color-name">{fam.name}</div>
                  <div className="color-desc">{fam.description}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => setStep(4)}>← Voltar</button>
          <button className="btn btn-primary"   onClick={() => setStep(6)} disabled={selectedFamily===null}>Próximo →</button>
        </div>
      </div>
    ),

    // 6 — SATURATION
    6: (
      <div className="screen">
        <h2 className="screen-title">Intensidade do Filtro</h2>
        <p className="screen-subtitle">Ajuste a saturação conforme a sensibilidade do paciente</p>
        <div className="sat-layout">
          <div className="sat-grid">
            {SATURATION_LEVELS.map((sat, i) => {
              const hex = selectedFamily!==null ? hslToHex(COLOR_FAMILIES[selectedFamily].hue, sat.value, 72) : "#ccc";
              return (
                <div key={i} className={`sat-option ${selectedSat===i?"selected":""}`}
                  onClick={() => setSelectedSat(i)}>
                  <div className="sat-swatch" style={{ backgroundColor:hex }} />
                  <div>
                    <div className="sat-label">{sat.label}</div>
                    <div className="sat-desc">{sat.desc} · {sat.value}%</div>
                  </div>
                  {selectedSat===i && (
                    <span style={{ marginLeft:"auto", color:"var(--accent)", fontWeight:700, fontSize:"1.2rem" }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
          <div>
            <p className="live-preview-label">Preview</p>
            <div className="live-preview-box" style={{
              backgroundColor: selectedFamily!==null
                ? hslToHex(COLOR_FAMILIES[selectedFamily].hue, SATURATION_LEVELS[selectedSat].value, 86)
                : "#f0f0f0"
            }}>
              <p style={{ fontSize:"0.9rem", lineHeight:1.8, textAlign:"center", color:"#333" }}>
                Uma vez por semana<br/>eu leio um livro<br/>durante o café<br/>da manhã. As palavras<br/>fluem com tranquilidade.
              </p>
            </div>
            <p style={{ marginTop:"0.6rem", fontSize:"0.75rem", color:"var(--text-muted)", textAlign:"center" }}>
              {selectedFamily!==null && COLOR_FAMILIES[selectedFamily].name}<br/>
              Saturação {SATURATION_LEVELS[selectedSat].value}%
            </p>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => setStep(5)}>← Voltar</button>
          <button className="btn btn-primary"   onClick={() => setStep(7)}>Aplicar e Validar →</button>
        </div>
      </div>
    ),

    // 7 — VALIDATION
    7: (
      <div className="screen">
        <h2 className="screen-title">Validação com Filtro</h2>
        <p className="screen-subtitle">Repita o teste de leitura COM o filtro aplicado</p>
        {currentColor && (
          <div className="preview-panel">
            <div className="preview-header">
              <span>Filtro: {COLOR_FAMILIES[selectedFamily].name} · {SATURATION_LEVELS[selectedSat].value}% saturação</span>
              <div style={{
                width:22, height:22, borderRadius:6,
                backgroundColor: hslToHex(currentColor.hue, currentColor.sat, 65),
                border:"1px solid rgba(255,255,255,0.2)"
              }} />
            </div>
            <div className="preview-text"
              style={{ backgroundColor: hslToHex(currentColor.hue, currentColor.sat, 93) }}>
              <p>O paciente lerá com a simulação do filtro. Peça para relatar se houve redução de desconforto,
                maior estabilidade das letras ou melhora de clareza.</p>
            </div>
          </div>
        )}
        <ReadingTest phase="tinted" />
        {overlay && currentColor && (
          <div style={{
            position:"fixed", inset:0, pointerEvents:"none", zIndex:50,
            backgroundColor: hslToHex(currentColor.hue, currentColor.sat, 80),
            opacity:0.4, mixBlendMode:"multiply"
          }} />
        )}
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => setStep(6)}>← Ajustar Filtro</button>
          {tintedWPM && <button className="btn btn-primary" onClick={() => setStep(8)}>Ver Resultado →</button>}
        </div>
      </div>
    ),

    // 8 — RESULT / PRESCRIPTION
    8: (() => {
      const pc = currentColor
        ? { hex: hslToHex(currentColor.hue, currentColor.sat, 60), hue: currentColor.hue, sat: currentColor.sat }
        : null;
      const heroBg  = pc ? hslToHex(pc.hue, pc.sat, 72) : "#eee";
      const heroFg  = pc ? getContrastColor(heroBg) : "#000";
      const midCnt  = PATTERN_SYMPTOMS.filter(s => patternSymptoms[`mid_${s.id}`]).length;

      return (
        <div className="screen">
          <h2 className="screen-title">Prescrição de Filtro</h2>
          <p className="screen-subtitle">Resultado do Protocolo Wilkins — {new Date().toLocaleDateString("pt-BR")}</p>

          {pc && (
            <div className="result-hero" style={{ backgroundColor:heroBg }}>
              <div style={{ color:heroFg }}>
                <p className="result-label">Cor Prescrita</p>
                <div className="result-metric">{COLOR_FAMILIES[selectedFamily].name}</div>
                <p style={{ fontSize:"0.9rem", opacity:0.8, marginTop:"0.5rem" }}>
                  Matiz {pc.hue}° · Saturação {pc.sat}% · Luminosidade 60%
                </p>
                <p style={{ marginTop:"0.6rem", fontSize:"0.82rem", opacity:0.65, fontFamily:"monospace" }}>
                  HEX: {pc.hex.toUpperCase()}
                </p>
              </div>
            </div>
          )}

          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-val">{baselineWPM||"—"}</div>
              <div className="metric-lbl">Pal/min sem filtro</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color:"var(--success)" }}>{tintedWPM||"—"}</div>
              <div className="metric-lbl">Pal/min com filtro</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: improvement>=0?"var(--success)":"var(--danger)" }}>
                {improvement>=0?"+":""}{improvement}%
              </div>
              <div className="metric-lbl">Melhora objetiva</div>
            </div>
          </div>

          <div style={{ marginBottom:"1.25rem" }}>
            {improvement >= 15
              ? <span className="tag tag-green">✓ Melhora significativa — prescrição indicada</span>
              : improvement >= 5
                ? <span className="tag tag-gold">△ Melhora marginal — reconsiderar saturação ou cor</span>
                : <span className="tag tag-red">✗ Sem melhora objetiva — revisar seleção de filtro</span>}
          </div>

          <div className="prescription-box">
            <div className="rx-header">Receituário — Protocolo Wilkins · CROO 1726 · Olhar Clínica da Visão</div>
            {[
              ["Paciente",               patient.name || "—"],
              ["Idade",                  `${patient.age||"—"} anos`],
              ["Data",                   new Date().toLocaleDateString("pt-BR")],
              ["Família de Cor",         selectedFamily!==null ? COLOR_FAMILIES[selectedFamily].name : "—"],
              ["Matiz",                  pc ? `${pc.hue}°` : "—"],
              ["Saturação",              pc ? `${pc.sat}%` : "—"],
              ["Código HEX (referência)",pc ? pc.hex.toUpperCase() : "—"],
              ["Pontuação de sintomas",  `${symptomScore} / ${maxScore}`],
              ["Pattern Glare (freq. média)", `${midCnt} sintoma${midCnt!==1?"s":""} / ${PATTERN_SYMPTOMS.length}`],
              ["Melhora na leitura",     `+${improvement}% (${baselineWPM||"—"} → ${tintedWPM||"—"} pal/min)`],
              ["Tipo de lente",          `Tinted Precision Lens — ${SATURATION_LEVELS[selectedSat].label}`],
            ].map(([label,value],i,arr) => (
              <div className="rx-line" key={label}
                style={i===arr.length-1 ? {borderBottom:"none"} : {}}>
                <span className="rx-label">{label}</span>
                <span className="rx-value" style={label.includes("HEX") ? {fontFamily:"monospace",fontSize:"0.95rem"} : {}}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">Orientações ao paciente</div>
            <p style={{ fontSize:"0.9rem", lineHeight:1.75, color:"var(--text-muted)" }}>
              Usar as lentes regularmente nas atividades de leitura e uso de telas. A tonalidade pode necessitar
              de ajuste em 3–6 meses conforme adaptação cortical. Reavaliar se houver mudança da queixa principal
              ou retorno dos sintomas. Comunicar ao laboratório o código HEX e saturação exatos para coloração precisa.
            </p>
          </div>

          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep(7)}>← Rever validação</button>
            <button className="btn btn-gold"      onClick={() => window.print()}>🖨 Imprimir</button>
            <button className="btn btn-secondary" onClick={resetAll}>Nova Avaliação</button>
          </div>
        </div>
      );
    })(),
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div>
            <h1>Wilkins Protocol</h1>
            <span>Precision Tinted Lenses · Olhar Clínica da Visão</span>
          </div>
        </div>
        <div className="header-step">
          {step+1}/{STEPS.length}<br/>
          <span style={{ opacity:0.6 }}>{STEPS[step]}</span>
        </div>
      </header>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width:`${(step/(STEPS.length-1))*100}%` }} />
      </div>
      <main className="main">
        {screens[step]}
      </main>
    </div>
  );
}
