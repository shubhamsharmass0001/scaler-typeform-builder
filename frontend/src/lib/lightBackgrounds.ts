export interface LightBackgroundPreset {
  id: string;
  name: string;
  desc: string;
  isSignature?: boolean;
  css: string;
  dataUrl: string | null;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  answerColor: string;
}

export const BUILTIN_LIGHT_BACKGROUNDS: LightBackgroundPreset[] = [
  {
    id: "sky-geometric-arches",
    name: "Sky Geometric Arches",
    desc: "Typeform signature light blue arches & lenses (Image 1)",
    isSignature: true,
    css: "linear-gradient(135deg, #8ec5fc 0%, #408cff 50%, #62a9fe 100%)",
    dataUrl: "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%201440%20900%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20preserveAspectRatio%3D%22xMidYMid%20slice%22%3E%0A%20%20%3Crect%20width%3D%221440%22%20height%3D%22900%22%20fill%3D%22%238ec5fc%22/%3E%0A%20%20%3Ccircle%20cx%3D%22-40%22%20cy%3D%220%22%20r%3D%22520%22%20fill%3D%22%23408cff%22/%3E%0A%20%20%3Ccircle%20cx%3D%221480%22%20cy%3D%220%22%20r%3D%22520%22%20fill%3D%22%23408cff%22/%3E%0A%20%20%3Ccircle%20cx%3D%22-40%22%20cy%3D%22900%22%20r%3D%22520%22%20fill%3D%22%23408cff%22/%3E%0A%20%20%3Ccircle%20cx%3D%221480%22%20cy%3D%22900%22%20r%3D%22520%22%20fill%3D%22%23408cff%22/%3E%0A%20%20%3Crect%20x%3D%220%22%20y%3D%22360%22%20width%3D%221440%22%20height%3D%22180%22%20fill%3D%22%2362a9fe%22/%3E%0A%20%20%3Cpath%20d%3D%22M%20620%2C0%20C%20680%2C120%20710%2C190%20720%2C220%20C%20730%2C190%20760%2C120%20820%2C0%20Z%22%20fill%3D%22%23408cff%22/%3E%0A%20%20%3Cpath%20d%3D%22M%20620%2C900%20C%20680%2C780%20710%2C710%20720%2C680%20C%20730%2C710%20760%2C780%20820%2C900%20Z%22%20fill%3D%22%23408cff%22/%3E%0A%20%20%3Cpath%20d%3D%22M%200%2C0%20C%20180%2C200%20240%2C320%20240%2C450%20C%20240%2C580%20180%2C700%200%2C900%20Z%22%20fill%3D%22%23549bf8%22%20opacity%3D%220.6%22/%3E%0A%20%20%3Cpath%20d%3D%22M%201440%2C0%20C%201260%2C200%201200%2C320%201200%2C450%20C%201200%2C580%201260%2C700%201440%2C900%20Z%22%20fill%3D%22%23549bf8%22%20opacity%3D%220.6%22/%3E%0A%3C/svg%3E",
    backgroundColor: "#8ec5fc",
    textColor: "#0c2b54",
    buttonColor: "#0c2b54",
    buttonTextColor: "#ffffff",
    answerColor: "#0c2b54",
  },
  {
    id: "pastel-lavender-curves",
    name: "Pastel Lavender Curves",
    desc: "Soft violet geometric arcs & calm ribbon",
    css: "linear-gradient(135deg, #ede9fe 0%, #c4b5fd 50%, #ddd6fe 100%)",
    dataUrl: "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%201440%20900%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20preserveAspectRatio%3D%22xMidYMid%20slice%22%3E%0A%20%20%3Crect%20width%3D%221440%22%20height%3D%22900%22%20fill%3D%22%23ede9fe%22/%3E%0A%20%20%3Ccircle%20cx%3D%22-40%22%20cy%3D%220%22%20r%3D%22520%22%20fill%3D%22%23a78bfa%22/%3E%0A%20%20%3Ccircle%20cx%3D%221480%22%20cy%3D%220%22%20r%3D%22520%22%20fill%3D%22%23a78bfa%22/%3E%0A%20%20%3Ccircle%20cx%3D%22-40%22%20cy%3D%22900%22%20r%3D%22520%22%20fill%3D%22%23a78bfa%22/%3E%0A%20%20%3Ccircle%20cx%3D%221480%22%20cy%3D%22900%22%20r%3D%22520%22%20fill%3D%22%23a78bfa%22/%3E%0A%20%20%3Crect%20x%3D%220%22%20y%3D%22360%22%20width%3D%221440%22%20height%3D%22180%22%20fill%3D%22%23ddd6fe%22/%3E%0A%20%20%3Cpath%20d%3D%22M%20620%2C0%20C%20680%2C120%20710%2C190%20720%2C220%20C%20730%2C190%20760%2C120%20820%2C0%20Z%22%20fill%3D%22%23a78bfa%22/%3E%0A%20%20%3Cpath%20d%3D%22M%20620%2C900%20C%20680%2C780%20710%2C710%20720%2C680%20C%20730%2C710%20760%2C780%20820%2C900%20Z%22%20fill%3D%22%23a78bfa%22/%3E%0A%20%20%3Cpath%20d%3D%22M%200%2C0%20C%20180%2C200%20240%2C320%20240%2C450%20C%20240%2C580%20180%2C700%200%2C900%20Z%22%20fill%3D%22%23c4b5fd%22%20opacity%3D%220.6%22/%3E%0A%20%20%3Cpath%20d%3D%22M%201440%2C0%20C%201260%2C200%201200%2C320%201200%2C450%20C%201200%2C580%201260%2C700%201440%2C900%20Z%22%20fill%3D%22%23c4b5fd%22%20opacity%3D%220.6%22/%3E%0A%3C/svg%3E",
    backgroundColor: "#ede9fe",
    textColor: "#2e1065",
    buttonColor: "#5b21b6",
    buttonTextColor: "#ffffff",
    answerColor: "#5b21b6",
  },
  {
    id: "mint-botanical-arches",
    name: "Mint Sage Arches",
    desc: "Fresh botanical sage & pistachio curves",
    css: "linear-gradient(135deg, #dcfce7 0%, #86efac 50%, #bbf7d0 100%)",
    dataUrl: "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%201440%20900%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20preserveAspectRatio%3D%22xMidYMid%20slice%22%3E%0A%20%20%3Crect%20width%3D%221440%22%20height%3D%22900%22%20fill%3D%22%23dcfce7%22/%3E%0A%20%20%3Ccircle%20cx%3D%22-40%22%20cy%3D%220%22%20r%3D%22520%22%20fill%3D%22%2334d399%22/%3E%0A%20%20%3Ccircle%20cx%3D%221480%22%20cy%3D%220%22%20r%3D%22520%22%20fill%3D%22%2334d399%22/%3E%0A%20%20%3Ccircle%20cx%3D%22-40%22%20cy%3D%22900%22%20r%3D%22520%22%20fill%3D%22%2334d399%22/%3E%0A%20%20%3Ccircle%20cx%3D%221480%22%20cy%3D%22900%22%20r%3D%22520%22%20fill%3D%22%2334d399%22/%3E%0A%20%20%3Crect%20x%3D%220%22%20y%3D%22360%22%20width%3D%221440%22%20height%3D%22180%22%20fill%3D%22%23bbf7d0%22/%3E%0A%20%20%3Cpath%20d%3D%22M%20620%2C0%20C%20680%2C120%20710%2C190%20720%2C220%20C%20730%2C190%20760%2C120%20820%2C0%20Z%22%20fill%3D%22%2334d399%22/%3E%0A%20%20%3Cpath%20d%3D%22M%20620%2C900%20C%20680%2C780%20710%2C710%20720%2C680%20C%20730%2C710%20760%2C780%20820%2C900%20Z%22%20fill%3D%22%2334d399%22/%3E%0A%20%20%3Cpath%20d%3D%22M%200%2C0%20C%20180%2C200%20240%2C320%20240%2C450%20C%20240%2C580%20180%2C700%200%2C900%20Z%22%20fill%3D%22%236ee7b7%22%20opacity%3D%220.6%22/%3E%0A%20%20%3Cpath%20d%3D%22M%201440%2C0%20C%201260%2C200%201200%2C320%201200%2C450%20C%201200%2C580%201260%2C700%201440%2C900%20Z%22%20fill%3D%22%236ee7b7%22%20opacity%3D%220.6%22/%3E%0A%3C/svg%3E",
    backgroundColor: "#dcfce7",
    textColor: "#064e3b",
    buttonColor: "#065f46",
    buttonTextColor: "#ffffff",
    answerColor: "#065f46",
  },
  {
    id: "warm-sunlight-arches",
    name: "Warm Sunlight Arches",
    desc: "Cozy warm cream, apricot & honey geometric arches",
    css: "linear-gradient(135deg, #ffedd5 0%, #fdba74 50%, #fed7aa 100%)",
    dataUrl: "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%201440%20900%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20preserveAspectRatio%3D%22xMidYMid%20slice%22%3E%0A%20%20%3Crect%20width%3D%221440%22%20height%3D%22900%22%20fill%3D%22%23ffedd5%22/%3E%0A%20%20%3Ccircle%20cx%3D%22-40%22%20cy%3D%220%22%20r%3D%22520%22%20fill%3D%22%23fb923c%22/%3E%0A%20%20%3Ccircle%20cx%3D%221480%22%20cy%3D%220%22%20r%3D%22520%22%20fill%3D%22%23fb923c%22/%3E%0A%20%20%3Ccircle%20cx%3D%22-40%22%20cy%3D%22900%22%20r%3D%22520%22%20fill%3D%22%23fb923c%22/%3E%0A%20%20%3Ccircle%20cx%3D%221480%22%20cy%3D%22900%22%20r%3D%22520%22%20fill%3D%22%23fb923c%22/%3E%0A%20%20%3Crect%20x%3D%220%22%20y%3D%22360%22%20width%3D%221440%22%20height%3D%22180%22%20fill%3D%22%23fed7aa%22/%3E%0A%20%20%3Cpath%20d%3D%22M%20620%2C0%20C%20680%2C120%20710%2C190%20720%2C220%20C%20730%2C190%20760%2C120%20820%2C0%20Z%22%20fill%3D%22%23fb923c%22/%3E%0A%20%20%3Cpath%20d%3D%22M%20620%2C900%20C%20680%2C780%20710%2C710%20720%2C680%20C%20730%2C710%20760%2C780%20820%2C900%20Z%22%20fill%3D%22%23fb923c%22/%3E%0A%20%20%3Cpath%20d%3D%22M%200%2C0%20C%20180%2C200%20240%2C320%20240%2C450%20C%20240%2C580%20180%2C700%200%2C900%20Z%22%20fill%3D%22%23fdba74%22%20opacity%3D%220.6%22/%3E%0A%20%20%3Cpath%20d%3D%22M%201440%2C0%20C%201260%2C200%201200%2C320%201200%2C450%20C%201200%2C580%201260%2C700%201440%2C900%20Z%22%20fill%3D%22%23fdba74%22%20opacity%3D%220.6%22/%3E%0A%3C/svg%3E",
    backgroundColor: "#ffedd5",
    textColor: "#7c2d12",
    buttonColor: "#9a3412",
    buttonTextColor: "#ffffff",
    answerColor: "#9a3412",
  },
  {
    id: "rose-blush-flow",
    name: "Blush Rose Flow",
    desc: "Gentle blush pink & pastel coral flowing waves",
    css: "linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 50%, #f472b6 100%)",
    dataUrl: "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%201440%20900%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20preserveAspectRatio%3D%22xMidYMid%20slice%22%3E%0A%20%20%3Crect%20width%3D%221440%22%20height%3D%22900%22%20fill%3D%22%23fdf2f8%22/%3E%0A%20%20%3Cpath%20d%3D%22M%200%2C0%20L%201440%2C0%20L%201440%2C300%20C%201140%2C420%20900%2C220%20600%2C340%20C%20300%2C460%20150%2C280%200%2C380%20Z%22%20fill%3D%22%23fbcfe8%22%20opacity%3D%220.55%22/%3E%0A%20%20%3Cpath%20d%3D%22M%200%2C900%20L%201440%2C900%20L%201440%2C620%20C%201200%2C500%20950%2C720%20680%2C580%20C%20420%2C440%20180%2C660%200%2C540%20Z%22%20fill%3D%22%23f472b6%22%20opacity%3D%220.6%22/%3E%0A%20%20%3Ccircle%20cx%3D%22720%22%20cy%3D%22450%22%20r%3D%22380%22%20fill%3D%22%23fdf4ff%22%20opacity%3D%220.35%22/%3E%0A%3C/svg%3E",
    backgroundColor: "#fdf2f8",
    textColor: "#500724",
    buttonColor: "#831843",
    buttonTextColor: "#ffffff",
    answerColor: "#831843",
  },
  {
    id: "minimal-dots-grid",
    name: "Architectural Dots Grid",
    desc: "Modern light geometric micro-grid",
    css: "radial-gradient(#94a3b8 1.5px, #f8fafc 1.5px)",
    dataUrl: "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2228%22%20height%3D%2228%22%20viewBox%3D%220%200%2028%2028%22%3E%0A%20%20%3Crect%20width%3D%2228%22%20height%3D%2228%22%20fill%3D%22%23f8fafc%22/%3E%0A%20%20%3Ccircle%20cx%3D%2214%22%20cy%3D%2214%22%20r%3D%222%22%20fill%3D%22%2394a3b8%22%20opacity%3D%220.6%22/%3E%0A%3C/svg%3E",
    backgroundColor: "#f8fafc",
    textColor: "#0f172a",
    buttonColor: "#1e293b",
    buttonTextColor: "#ffffff",
    answerColor: "#0284c7",
  },
  {
    id: "clean-plain",
    name: "Clean Canvas (Plain White)",
    desc: "Classic neutral white backdrop",
    css: "#ffffff",
    dataUrl: null,
    backgroundColor: "#ffffff",
    textColor: "#191919",
    buttonColor: "#0445af",
    buttonTextColor: "#ffffff",
    answerColor: "#0445af",
  },
];
