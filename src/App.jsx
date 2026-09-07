import React, { useState, useEffect, useCallback, useMemo } from "react";

/* ---------------------------------------------------------
   Estúdio de Persona — criação de influenciadoras digitais IA
   Dossiê editorial: aparência, personalidade, moodboard e
   prompts prontos para Midjourney / SDXL / DALL·E / Leonardo.
--------------------------------------------------------- */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');`;

const INK = "#201C2C";
const MUTED = "#8A8398";
const BASE = "#F6F5F8";
const SURFACE = "#FFFFFF";
const LINE = "#E7E4ED";
const VIOLET = "#6E3AFF";
const CORAL = "#FF5B77";
const VIOLET_SOFT = "#EFE9FF";

const NICHOS = [
  "Moda", "Fitness", "Beleza", "Games", "Viagem",
  "Lifestyle", "Tecnologia", "Culinária", "Música", "Comédia",
];

const VIBE_TAGS = [
  { tag: "Streetwear", hex: "#2B2440" },
  { tag: "Luxo", hex: "#B08A3E" },
  { tag: "Minimalista", hex: "#C9C4D6" },
  { tag: "Boho", hex: "#A8724A" },
  { tag: "Cyberpunk", hex: "#00E5C7" },
  { tag: "Editorial", hex: "#20161E" },
  { tag: "Pastel", hex: "#F3C6D8" },
  { tag: "Dark academia", hex: "#4A3B2A" },
  { tag: "Futurista", hex: "#7A5CFF" },
  { tag: "Praiana", hex: "#4FB6C9" },
];

const PLATFORMS = ["Midjourney", "Stable Diffusion", "DALL·E", "Leonardo AI"];
const STORAGE_KEY = "estudio-influencer:personas";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function blankPersona() {
  return {
    id: uid(),
    name: "",
    niche: NICHOS[0],
    ageAppearance: "",
    skinTone: "",
    hair: "",
    eyes: "",
    bodyType: "",
    style: "",
    features: "",
    traits: "",
    tone: "",
    vibeTags: [],
    createdAt: Date.now(),
  };
}

function buildAnchor(p) {
  const parts = [
    p.ageAppearance && `mulher de ${p.ageAppearance}`,
    p.skinTone && `pele ${p.skinTone}`,
    p.hair && `cabelo ${p.hair}`,
    p.eyes && `olhos ${p.eyes}`,
    p.bodyType && `corpo ${p.bodyType}`,
  ].filter(Boolean);
  return parts.join(", ");
}

function buildPromptCore(p) {
  const anchor = buildAnchor(p);
  const style = p.style && `estilo: ${p.style}`;
  const features = p.features && `detalhes: ${p.features}`;
  return [anchor, style, features].filter(Boolean).join(". ");
}

function formatPrompt(platform, p) {
  const core = buildPromptCore(p);
  const vibe = p.vibeTags.join(", ");
  const base = core || "descreva a aparência da persona para gerar o prompt";

  switch (platform) {
    case "Midjourney":
      return `${base}${vibe ? `, ${vibe.toLowerCase()}` : ""}, sessão de fotos para rede social, iluminação editorial, foco nítido no rosto, textura de pele realista, fotografia ultra realista, 8k --ar 4:5 --style raw --v 6`;
    case "Stable Diffusion":
      return `POSITIVO: ${base}${vibe ? `, ${vibe.toLowerCase()}` : ""}, retrato fotorrealista, iluminação de estúdio suave, lente 85mm, alta definição, pele com textura natural\nNEGATIVO: deformado, membros extras, mãos malformadas, desfocado, baixa qualidade, marca d'água, texto, assimetria facial`;
    case "DALL·E":
      return `Uma fotografia realista de uma criadora de conteúdo digital: ${base}${vibe ? `, com estética ${vibe.toLowerCase()}` : ""}. Enquadramento de retrato, luz natural suave, expressão confiante e acessível, fundo desfocado, qualidade de sessão profissional.`;
    case "Leonardo AI":
      return `${base}${vibe ? `, ${vibe.toLowerCase()}` : ""}, retrato para influenciadora digital, preset PhotoReal, iluminação cinematográfica suave, alta fidelidade de pele, composição de retrato editorial`;
    default:
      return base;
  }
}

const CAPTION_TEMPLATES = {
  Moda: ["look de hoje inspirado em {vibe} — qual peça vocês salvariam?", "misturando {vibe} com o básico do guarda-roupa, o que acharam?", "provando que {vibe} cabe em qualquer estação do ano"],
  Fitness: ["treino de hoje focado em constância, não em perfeição", "um lembrete: descanso também é treino", "3 ajustes simples que mudaram minha rotina esse mês"],
  Beleza: ["rotina de hoje em 4 passos, simples assim", "testando essa tendência de {vibe} — vale o hype?", "produto que virou favorito da semana"],
  Games: ["clipe de hoje quase deu ruim, salvei no fim", "qual desses vocês também estão jogando essa semana?", "setup atualizado, o que acharam da mudança?"],
  Viagem: ["esse lugar não estava nos meus planos e virou favorito", "dica rápida pra quem for visitar essa cidade em breve", "3 coisas que eu faria diferente nessa viagem"],
  Lifestyle: ["um dia comum, registrado com carinho", "pequenos hábitos que mudaram minha rotina", "compartilhando o que tenho aprendido ultimamente"],
  Tecnologia: ["testei por uma semana, aqui vai o veredito", "ferramenta que mudou meu fluxo de trabalho", "vale a pena ou é só hype? deixo minha opinião"],
  Culinária: ["receita de hoje: simples, rápida e aprovada", "errei essa receita 3 vezes até acertar, valeu a pena", "ingrediente que eu recomendo ter sempre em casa"],
  Música: ["essa faixa está na repeat aqui essa semana", "bastidor rápido de como essa ideia começou", "qual dessas vocês recomendariam pra mim ouvir?"],
  Comédia: ["quando isso acontece com vocês também?", "reencenando uma situação real da minha semana", "esse foi só pra descontrair o dia de vocês"],
};

function captionsFor(p) {
  const tone = p.tone ? ` (tom: ${p.tone})` : "";
  const vibe = p.vibeTags[0] || p.style || "seu estilo";
  const list = CAPTION_TEMPLATES[p.niche] || CAPTION_TEMPLATES.Lifestyle;
  return list.map((t) => t.replace("{vibe}", vibe.toLowerCase()) + tone);
}

function useStorage() {
  const [personas, setPersonas] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setPersonas(raw ? JSON.parse(raw) : []);
    } catch {
      setPersonas([]);
    }
  }, []);

  const persist = useCallback((next) => {
    setPersonas(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      setError("Não consegui salvar agora. Tente novamente em instantes.");
    }
  }, []);

  return { personas, persist, error };
}

function Field({ label, value, onChange, placeholder, textarea }) {
  const commonStyle = {
    width: "100%",
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    color: INK,
    background: SURFACE,
    border: `1px solid ${LINE}`,
    borderRadius: "6px",
    padding: "9px 11px",
    outline: "none",
  };
  return (
    <label className="flex flex-col gap-1">
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: MUTED }}>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          style={{ ...commonStyle, resize: "vertical" }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={commonStyle}
        />
      )}
    </label>
  );
}

function Chip({ active, children, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "12px",
        padding: "6px 12px",
        borderRadius: "999px",
        border: `1px solid ${active ? color || VIOLET : LINE}`,
        background: active ? (color ? `${color}1A` : VIOLET_SOFT) : SURFACE,
        color: active ? INK : MUTED,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        transition: "border-color 120ms ease, background 120ms ease",
      }}
    >
      {color && (
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      )}
      {children}
    </button>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "19px", fontWeight: 500, color: INK, margin: 0 }}>
        {children}
      </h3>
      {sub && <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: MUTED, margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default function App() {
  const { personas, persist, error } = useStorage();
  const [activeId, setActiveId] = useState(null);
  const [platform, setPlatform] = useState("Midjourney");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (personas && personas.length && !activeId) setActiveId(personas[0].id);
  }, [personas, activeId]);

  const active = useMemo(
    () => (personas || []).find((p) => p.id === activeId) || null,
    [personas, activeId]
  );

  function createPersona() {
    const p = blankPersona();
    const next = [p, ...(personas || [])];
    persist(next);
    setActiveId(p.id);
  }

  function updateActive(field, value) {
    if (!active) return;
    const next = personas.map((p) => (p.id === active.id ? { ...p, [field]: value } : p));
    persist(next);
  }

  function toggleVibe(tag) {
    if (!active) return;
    const has = active.vibeTags.includes(tag);
    const nextTags = has ? active.vibeTags.filter((t) => t !== tag) : [...active.vibeTags, tag];
    updateActive("vibeTags", nextTags);
  }

  function deletePersona(id) {
    const next = personas.filter((p) => p.id !== id);
    persist(next);
    if (activeId === id) setActiveId(next[0]?.id || null);
  }

  function copy(text, label) {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  if (personas === null) {
    return (
      <div style={{ background: BASE, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONT_IMPORT}</style>
        <span style={{ fontFamily: "Inter, sans-serif", color: MUTED, fontSize: 14 }}>Carregando dossiês…</span>
      </div>
    );
  }

  return (
    <div style={{ background: BASE, minHeight: "100vh" }}>
      <style>{FONT_IMPORT}</style>

      <div className="flex flex-col lg:flex-row" style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* ROSTER */}
        <aside
          className="flex flex-col"
          style={{ width: "100%", maxWidth: 260, borderRight: `1px solid ${LINE}`, padding: "28px 20px", flexShrink: 0 }}
        >
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, color: INK, margin: 0 }}>
            Estúdio de Persona
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: MUTED, marginTop: 4, marginBottom: 22 }}>
            Dossiês de influenciadoras digitais criadas com IA
          </p>

          <button
            onClick={createPersona}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: VIOLET,
              border: "none",
              borderRadius: 6,
              padding: "10px 14px",
              cursor: "pointer",
              marginBottom: 18,
            }}
          >
            Nova persona
          </button>

          <div className="flex flex-col gap-1">
            {personas.length === 0 && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
                Nenhuma persona ainda. Crie a primeira e comece o dossiê.
              </p>
            )}
            {personas.map((p) => (
              <div
                key={p.id}
                onClick={() => setActiveId(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: p.id === activeId ? VIOLET_SOFT : "transparent",
                }}
              >
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: INK }}>
                  {p.name || "Sem nome"}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePersona(p.id); }}
                  title="Excluir"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: MUTED, background: "none", border: "none", cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* DOSSIER */}
        <main className="flex-1" style={{ padding: "28px 32px 60px" }}>
          {!active ? (
            <div style={{ paddingTop: 60, textAlign: "center" }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: MUTED }}>
                Selecione ou crie uma persona para abrir o dossiê.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Header */}
              <div>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: MUTED }}>Dossiê</span>
                <input
                  value={active.name}
                  onChange={(e) => updateActive("name", e.target.value)}
                  placeholder="Nome da influenciadora"
                  style={{
                    display: "block",
                    fontFamily: "Fraunces, serif",
                    fontSize: 30,
                    fontWeight: 500,
                    color: INK,
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    width: "100%",
                    padding: "2px 0 8px",
                  }}
                />
                <select
                  value={active.niche}
                  onChange={(e) => updateActive("niche", e.target.value)}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    color: INK,
                    background: SURFACE,
                    border: `1px solid ${LINE}`,
                    borderRadius: 6,
                    padding: "6px 10px",
                  }}
                >
                  {NICHOS.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>

              {/* Aparência */}
              <div>
                <SectionTitle sub="Esses campos formam o âncora de consistência usado em todos os prompts">
                  Aparência
                </SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Idade aparente" value={active.ageAppearance} onChange={(v) => updateActive("ageAppearance", v)} placeholder="ex: 24 anos" />
                  <Field label="Tom de pele" value={active.skinTone} onChange={(v) => updateActive("skinTone", v)} placeholder="ex: morena clara" />
                  <Field label="Cabelo" value={active.hair} onChange={(v) => updateActive("hair", v)} placeholder="ex: castanho ondulado, longo" />
                  <Field label="Olhos" value={active.eyes} onChange={(v) => updateActive("eyes", v)} placeholder="ex: castanho escuro" />
                  <Field label="Corpo" value={active.bodyType} onChange={(v) => updateActive("bodyType", v)} placeholder="ex: atlético esguio" />
                  <Field label="Estilo / figurino" value={active.style} onChange={(v) => updateActive("style", v)} placeholder="ex: streetwear com toques metálicos" />
                </div>
                <div className="mt-3">
                  <Field label="Traços marcantes (opcional)" value={active.features} onChange={(v) => updateActive("features", v)} placeholder="ex: tatuagem geométrica no antebraço, piercing no nariz" textarea />
                </div>
              </div>

              {/* Personalidade */}
              <div>
                <SectionTitle>Personalidade</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Traços de personalidade" value={active.traits} onChange={(v) => updateActive("traits", v)} placeholder="ex: divertida, direta, curiosa" />
                  <Field label="Tom de voz" value={active.tone} onChange={(v) => updateActive("tone", v)} placeholder="ex: descontraído, próximo, com humor seco" />
                </div>
              </div>

              {/* Moodboard */}
              <div>
                <SectionTitle sub="Escolha as referências estéticas — elas entram nos prompts e formam a paleta visual">
                  Moodboard
                </SectionTitle>
                <div className="flex flex-wrap gap-2 mb-4">
                  {VIBE_TAGS.map(({ tag, hex }) => (
                    <Chip key={tag} active={active.vibeTags.includes(tag)} onClick={() => toggleVibe(tag)} color={hex}>
                      {tag}
                    </Chip>
                  ))}
                </div>
                {active.vibeTags.length > 0 && (
                  <div className="flex gap-2" style={{ height: 40 }}>
                    {active.vibeTags.map((tag) => {
                      const hex = VIBE_TAGS.find((v) => v.tag === tag)?.hex;
                      return <div key={tag} style={{ flex: 1, background: hex, borderRadius: 4 }} title={tag} />;
                    })}
                  </div>
                )}
              </div>

              {/* Prompt */}
              <div>
                <SectionTitle sub="Copie e cole na ferramenta de geração de imagem escolhida — o texto muda de formato conforme a plataforma">
                  Prompt de geração
                </SectionTitle>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PLATFORMS.map((pl) => (
                    <Chip key={pl} active={platform === pl} onClick={() => setPlatform(pl)}>
                      {pl}
                    </Chip>
                  ))}
                </div>
                <div style={{ background: INK, borderRadius: 8, padding: "16px 18px" }}>
                  <pre
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "#F1EFF7",
                      whiteSpace: "pre-wrap",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {formatPrompt(platform, active)}
                  </pre>
                  <button
                    onClick={() => copy(formatPrompt(platform, active), "prompt")}
                    style={{
                      marginTop: 12,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: INK,
                      background: "#F1EFF7",
                      border: "none",
                      borderRadius: 5,
                      padding: "7px 12px",
                      cursor: "pointer",
                    }}
                  >
                    {copied === "prompt" ? "Copiado" : "Copiar prompt"}
                  </button>
                </div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: MUTED, marginTop: 8 }}>
                  Use sempre o mesmo âncora de aparência em novos prompts para manter a persona consistente entre imagens.
                </p>
              </div>

              {/* Legendas */}
              <div>
                <SectionTitle sub="Pontos de partida para posts — ajuste a linguagem antes de publicar">
                  Ideias de legenda
                </SectionTitle>
                <div className="flex flex-col gap-2">
                  {captionsFor(active).map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3"
                      style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 6, padding: "10px 12px" }}
                    >
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: INK }}>{c}</span>
                      <button
                        onClick={() => copy(c, `cap-${i}`)}
                        style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: VIOLET, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
                      >
                        {copied === `cap-${i}` ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: CORAL }}>{error}</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
