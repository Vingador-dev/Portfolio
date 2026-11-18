const racine = document.documentElement;

function lireStockage(cle) {
  try { return localStorage.getItem(cle); } catch (e) { return null; }
}

function ecrireStockage(cle, valeur) {
  try { localStorage.setItem(cle, valeur); } catch (e) {}
}

const parametre = new URLSearchParams(location.search).get("lang");
let langue = traductions[parametre] ? parametre : lireStockage("langue");
if (!traductions[langue]) langue = "fr";

function t(cle) {
  return traductions[langue][cle];
}

const elements = [...document.querySelectorAll("[data-t]")];
elements.forEach(el => { traductions.fr[el.dataset.t] = el.innerHTML; });

const description = document.querySelector('meta[name="description"]');
traductions.fr.titre_page = document.title;
traductions.fr.description_page = description.content;

const boutonTheme = document.getElementById("theme");

function appliquerTheme(theme) {
  racine.dataset.theme = theme;
  const libelle = t(theme === "dark" ? "theme_clair" : "theme_sombre");
  boutonTheme.setAttribute("aria-label", libelle);
  boutonTheme.title = libelle;
}

boutonTheme.addEventListener("click", () => {
  const theme = racine.dataset.theme === "dark" ? "light" : "dark";
  appliquerTheme(theme);
  ecrireStockage("theme", theme);
});

const debut = new Date(2027, 1, 22);
const jours = Math.ceil((debut - new Date()) / 86400000);
const compte = document.getElementById("compte");

function texteCompte() {
  if (jours > 1) return t("jours")(jours);
  if (jours === 1) return t("demain");
  return t("maintenant");
}

const choixLangue = document.getElementById("langue");

function appliquerLangue(nouvelle) {
  langue = nouvelle;
  racine.lang = nouvelle;
  choixLangue.value = nouvelle;
  elements.forEach(el => { el.innerHTML = t(el.dataset.t); });
  compte.textContent = texteCompte();
  document.title = t("titre_page");
  description.content = t("description_page");
  appliquerTheme(racine.dataset.theme);
}

choixLangue.addEventListener("change", () => {
  appliquerLangue(choixLangue.value);
  ecrireStockage("langue", langue);
});

racine.dataset.theme = lireStockage("theme") || "dark";
appliquerLangue(langue);

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
    montrer(t("copie") + mail);
    return true;
  } catch (e) {
    montrer(mail);
    return false;
  }
}

boutonCopier.addEventListener("click", copierMail);

function allerA(id) {
  document.getElementById(id).scrollIntoView();
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

function ouvrir(id) {
  allerA(id);
  ecrire(t("section"), "ok");
}

const commandes = {
  aide() { t("aide").forEach(ligne => ecrire(ligne)); },
  parcours() { ouvrir("parcours"); },
  projets(arg) {
    if (!arg) { filtrer("tout"); ouvrir("projets"); return; }
    if (!filtres.some(b => b.dataset.filtre === arg)) { ecrire(t("filtre_inconnu")); return; }
    allerA("projets");
    ecrire(t("resultat")(filtrer(arg)), "ok");
  },
  competences() { ouvrir("competences"); },
  hobbys() { ouvrir("hobbys"); },
  async contact() {
    const ok = await copierMail();
    ecrire(t(ok ? "copie" : "adresse") + mail, "ok");
  },
  dispo() { ecrire(t("dispo") + compte.textContent + ".", "ok"); },
  theme() { boutonTheme.click(); ecrire(t("theme_change"), "ok"); },
  clear() { sortie.innerHTML = ""; }
};

const alias = {
  help: "aide", ajuda: "aide",
  background: "parcours", percurso: "parcours",
  projects: "projets", projetos: "projets",
  compétences: "competences", skills: "competences", competencias: "competences", competências: "competences",
  hobbies: "hobbys",
  mail: "contact", contacto: "contact",
  cls: "clear"
};

document.getElementById("term").addEventListener("submit", e => {
  e.preventDefault();
  const brut = champ.value.trim();
  champ.value = "";
  if (!brut) return;
  ecrire("$ " + brut, "cmd");
  const [mot, arg] = brut.toLowerCase().split(/\s+/);
  const nom = alias[mot] || mot;
  if (commandes[nom]) commandes[nom](arg);
  else ecrire(t("inconnue"));
});

document.addEventListener("keydown", e => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
    e.preventDefault();
    champ.focus();
  }
});

const zoom = document.getElementById("zoom");
const imageZoom = zoom.querySelector("img");

document.querySelectorAll(".photo img, .capture img").forEach(img => {
  img.addEventListener("click", () => {
    imageZoom.src = img.src;
    imageZoom.alt = img.alt;
    zoom.hidden = false;
  });
});

zoom.addEventListener("click", () => { zoom.hidden = true; });

document.addEventListener("keydown", e => {
  if (e.key === "Escape") zoom.hidden = true;
});

const liensNav = [...document.querySelectorAll(".nav-liens a")];

const suiviNav = new IntersectionObserver(entrees => {
  entrees.forEach(entree => {
    if (!entree.isIntersecting) return;
    liensNav.forEach(a => a.classList.toggle("actif", a.getAttribute("href") === "#" + entree.target.id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });

document.querySelectorAll(".module").forEach(section => suiviNav.observe(section));

const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!calme) {
  racine.classList.add("anime");
  const apparition = new IntersectionObserver(entrees => {
    entrees.forEach(entree => {
      if (!entree.isIntersecting) return;
      entree.target.classList.add("vu");
      apparition.unobserve(entree.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".module-tete, .ligne-temps li, .projet, .grille-comp > div, .terminal").forEach(el => {
    el.classList.add("apparait");
    apparition.observe(el);
  });
}

const canvas = document.getElementById("scope");
const ctx = canvas.getContext("2d");
const mesure = document.getElementById("mesure");
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
