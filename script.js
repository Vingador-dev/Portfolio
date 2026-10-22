const racine = document.documentElement;
const modules = [...document.querySelectorAll(".module")];

function lireStockage(cle) {
  try { return localStorage.getItem(cle); } catch (e) { return null; }
}

function ecrireStockage(cle, valeur) {
  try { localStorage.setItem(cle, valeur); } catch (e) {}
}

const boutonTheme = document.getElementById("theme");

function appliquerTheme(theme) {
  racine.dataset.theme = theme;
  boutonTheme.textContent = theme === "dark" ? "Mode clair" : "Mode sombre";
}

appliquerTheme(lireStockage("theme") || "dark");

boutonTheme.addEventListener("click", () => {
  const theme = racine.dataset.theme === "dark" ? "light" : "dark";
  appliquerTheme(theme);
  ecrireStockage("theme", theme);
});

const toast = document.getElementById("toast");
let minuteur;

function montrer(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(minuteur);
  minuteur = setTimeout(() => toast.classList.remove("visible"), 2200);
}

const boutonCopier = document.getElementById("copier");
const mail = boutonCopier.dataset.mail;

async function copierMail() {
  try {
    await navigator.clipboard.writeText(mail);
    montrer("Adresse copiée : " + mail);
    return true;
  } catch (e) {
    montrer(mail);
    return false;
  }
}

boutonCopier.addEventListener("click", copierMail);

const debut = new Date(2027, 1, 22);
const jours = Math.ceil((debut - new Date()) / 86400000);
const compte = document.getElementById("compte");
if (jours > 1) compte.textContent = "dans " + jours + " jours";
else if (jours === 1) compte.textContent = "demain";
else compte.textContent = "dès maintenant";

const boutonTout = document.getElementById("tout");

function majBoutonTout() {
  boutonTout.textContent = modules.every(m => m.open) ? "Tout fermer" : "Tout ouvrir";
}

boutonTout.addEventListener("click", () => {
  const ouvrir = !modules.every(m => m.open);
  modules.forEach(m => { m.open = ouvrir; });
  majBoutonTout();
});

modules.forEach(m => m.addEventListener("toggle", majBoutonTout));

function ouvrirModule(id) {
  const m = document.getElementById(id);
  m.open = true;
  m.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

const projets = [...document.querySelectorAll(".projet")];
const filtres = [...document.querySelectorAll(".filtre")];
const nbProjets = document.getElementById("nb-projets");
const vide = document.getElementById("vide");

function filtrer(filtre) {
  let visibles = 0;
  projets.forEach(p => {
    const ok = filtre === "tout" || p.dataset.tags.split(" ").includes(filtre);
    p.hidden = !ok;
    if (ok) visibles++;
  });
  filtres.forEach(b => {
    const actif = b.dataset.filtre === filtre;
    b.classList.toggle("actif", actif);
    b.setAttribute("aria-pressed", actif);
  });
  nbProjets.textContent = visibles;
  vide.hidden = visibles > 0;
  return visibles;
}

filtres.forEach(b => b.addEventListener("click", () => filtrer(b.dataset.filtre)));

const sortie = document.getElementById("sortie");
const champ = document.getElementById("commande");

function ecrire(texte, classe) {
  const p = document.createElement("p");
  p.textContent = texte;
  if (classe) p.className = classe;
  sortie.appendChild(p);
  sortie.scrollTop = sortie.scrollHeight;
}

const commandes = {
  aide() {
    ecrire("parcours      ouvre ma formation et mes expériences");
    ecrire("projets       ouvre mes projets");
    ecrire("projets stm32 filtre les projets (arduino, esp32, stm32, raspberry, moteurs, pcb, vision)");
    ecrire("competences   ouvre mes compétences");
    ecrire("hobbys        ouvre mes hobbys");
    ecrire("contact       copie mon adresse mail");
    ecrire("dispo         affiche mes dates de stage");
    ecrire("theme         change le thème");
    ecrire("clear         efface le terminal");
  },
  parcours() { ouvrirModule("parcours"); ecrire("Section Parcours ouverte.", "ok"); },
  projets(arg) {
    ouvrirModule("projets");
    if (!arg) { filtrer("tout"); ecrire("Section Projets ouverte.", "ok"); return; }
    if (!filtres.some(b => b.dataset.filtre === arg)) { ecrire("Filtre inconnu : " + arg + ". Tapez aide pour la liste."); return; }
    ecrire(filtrer(arg) + " projet(s) avec " + arg + ".", "ok");
  },
  competences() { ouvrirModule("competences"); ecrire("Section Compétences ouverte.", "ok"); },
  hobbys() { ouvrirModule("hobbys"); ecrire("Section Hobbys ouverte.", "ok"); },
  async contact() {
    const ok = await copierMail();
    ecrire(ok ? "Adresse copiée : " + mail : "Mon adresse : " + mail, "ok");
  },
  dispo() { ecrire("Stage de fin d'études de 6 mois, à temps plein, à partir du 22 février 2027. " + compte.textContent.replace(/^./, c => c.toUpperCase()) + ".", "ok"); },
  theme() { boutonTheme.click(); ecrire("Thème changé.", "ok"); },
  clear() { sortie.innerHTML = ""; }
};

const alias = { help: "aide", compétences: "competences", hobbies: "hobbys", mail: "contact", cls: "clear" };

document.getElementById("term").addEventListener("submit", e => {
  e.preventDefault();
  const brut = champ.value.trim();
  champ.value = "";
  if (!brut) return;
  ecrire("$ " + brut, "cmd");
  const [mot, arg] = brut.toLowerCase().split(/\s+/);
  const nom = alias[mot] || mot;
  if (commandes[nom]) commandes[nom](arg);
  else ecrire("Commande inconnue : " + mot + ". Tapez aide.");
});

document.addEventListener("keydown", e => {
  if (e.key === "/" && document.activeElement !== champ) {
    e.preventDefault();
    champ.focus();
  }
});

const canvas = document.getElementById("scope");
const ctx = canvas.getContext("2d");
const mesure = document.getElementById("mesure");
const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
let largeur, hauteur, ratio;
let frequence = 2, amplitude = 0.22, cibleF = 2, cibleA = 0.22, phase = 0;

function taille() {
  ratio = window.devicePixelRatio || 1;
  largeur = canvas.clientWidth;
  hauteur = canvas.clientHeight;
  canvas.width = largeur * ratio;
  canvas.height = hauteur * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function couleur(nom) {
  return getComputedStyle(racine).getPropertyValue(nom).trim();
}

function dessiner() {
  ctx.clearRect(0, 0, largeur, hauteur);
  const pas = 48;
  ctx.strokeStyle = couleur("--grille");
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= largeur; x += pas) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, hauteur); }
  for (let y = 0; y <= hauteur; y += pas) { ctx.moveTo(0, y + 0.5); ctx.lineTo(largeur, y + 0.5); }
  ctx.stroke();

  const milieu = hauteur * 0.62;
  const a = hauteur * amplitude;
  const trace = couleur("--trace");
  ctx.strokeStyle = trace;
  ctx.shadowColor = trace;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  for (let x = 0; x <= largeur; x += 2) {
    const t = (x / largeur) * frequence * Math.PI * 2 + phase;
    const y = milieu - a * (Math.sin(t) + 0.25 * Math.sin(3 * t) + 0.1 * Math.sin(5 * t));
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = couleur("--led");
  ctx.shadowColor = couleur("--led");
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x <= largeur; x += 2) {
    const t = (x / largeur) * frequence * 2 * Math.PI * 2 + phase * 1.5;
    const y = milieu + hauteur * 0.2 - (Math.sin(t) > 0 ? 1 : -1) * a * 0.25;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function boucle() {
  frequence += (cibleF - frequence) * 0.08;
  amplitude += (cibleA - amplitude) * 0.08;
  phase -= 0.035;
  dessiner();
  requestAnimationFrame(boucle);
}

document.querySelector(".hero").addEventListener("pointermove", e => {
  const r = canvas.getBoundingClientRect();
  cibleF = 1 + ((e.clientX - r.left) / r.width) * 7;
  cibleA = 0.08 + (1 - (e.clientY - r.top) / r.height) * 0.25;
  mesure.textContent = "CH1  f = " + (cibleF * 0.5).toFixed(2) + " kHz   amplitude = " + (cibleA * 20).toFixed(1) + " V";
});

taille();
window.addEventListener("resize", () => { taille(); if (calme) dessiner(); });

if (calme) dessiner();
else requestAnimationFrame(boucle);

new MutationObserver(() => { if (calme) dessiner(); }).observe(racine, { attributes: true, attributeFilter: ["data-theme"] });
