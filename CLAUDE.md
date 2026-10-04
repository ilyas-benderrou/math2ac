# Math 2AC — Jeu d'évaluation (brief pour Claude Code)

## Objectif
Un jeu pour évaluer la compréhension des élèves de **2ème année collège (Maroc)** en mathématiques.
Il suit le cahier de l'élève : 3 domaines, chacun en 3 parcours, et des compétences notées
🟢 acquis / 🟡 en cours / 🔴 à revoir, avec un tampon **VISA** quand le parcours est validé.
Le but reste l'**évaluation**, pas l'exploration : le monde sert à motiver, pas à ralentir.

## 1. Format
- Jeu pour **PC**, format **16:9 plein écran**. Résolutions cibles : **1920×1080** et **1366×768** (PC d'école).
  Tester les deux en headless (voir « Tests »).
- Bouton plein écran (Fullscreen API). Textes et formules **grands, lisibles au projecteur**.
- Raccourcis clavier : **A/B/C** ou **1/2/3** pour répondre, **Entrée** pour continuer.
- Le téléphone n'est plus la priorité.
- Doit rester **fluide sur un PC d'école modeste**.
- Aucune connexion internet nécessaire après le build (tout est local : polices, assets, KaTeX).

## 2. Monde ouvert
- **Phaser 3** pour le monde 2D. **React** reste pour l'interface par-dessus (questions, résultats, passeport).
- Garder la logique existante : progression, évaluation, VISA, passeport, Nour, sons, confettis (voir « Architecture »).
- L'élève **choisit un personnage** et se déplace (flèches/WASD ou clic). Caméra qui suit le personnage.
- **3 îles reliées par un bateau** :
  1. Fractions (or `#D18A1E`)
  2. Nombres positifs et négatifs (orange `#DD6430`)
  3. Algèbre (framboise `#AE4068`)
- **Monde vivant** : eau animée, nuages, oiseaux, arbres qui bougent.
- **Chaque parcours = un lieu sur l'île** (porte, temple, tour). En s'approchant, **Nour** apparaît et propose
  de commencer ; les questions s'affichent **en panneau par-dessus le monde**, sans quitter le monde.
- **VISA obtenu** = le lieu s'illumine et un **pont ou chemin s'ouvre** vers le lieu suivant.
  Le parcours suivant n'est jouable qu'avec le VISA du précédent.
- **Question boss** = rencontre avec un **gardien** à la fin du parcours.
- Déplacements courts et **voyage rapide** vers les lieux débloqués.
- Graphismes : assets gratuits **CC0 de Kenney.nl**, listés dans `CREDITS.md` (nom du pack, lien, licence).

### Nour, le tuteur (hibou)
- Animé : cligne des yeux, saute de joie, se gratte la tête quand c'est faux, danse pour les séries et le VISA.
- Parle en **darija** (écriture arabe, RTL). Phrases variées : « باز عليك! », « برافو عليك! », « تبارك الله عليك! »,
  « واعر! كمل هكا »… Utilise le prénom de l'élève de temps en temps.
- Bonne réponse : animation + son + confettis. Série de 3/5/8 bonnes réponses : célébration spéciale.
- Mauvaise réponse : explication de l'erreur + indice + 2e essai. Au 2e échec : correction affichée.
- Animations rapides (< 400 ms) ; respecter `prefers-reduced-motion`. Bouton muet.

## 3. Contenu des questions (le plus important)
- Questions dans `src/data/<domaine>-p<parcours>.json` (`frac`, `rel`, `alg`), séparées du code.
  Un nouveau fichier est chargé automatiquement par `src/data/index.ts`.
- Format d'une question :
  ```json
  { "comp": 1, "q": "Calcule : $\\frac{1}{2}+\\frac{1}{3}$",
    "options": [
      { "t": "$\\frac{5}{6}$", "ok": true },
      { "t": "$\\frac{2}{5}$", "why": "explication de l'erreur en darija" },
      { "t": "$\\frac{2}{6}$", "why": "..." } ],
    "hint": "indice en darija", "exp": "correction en LaTeX", "fig": null, "boss": false }
  ```
  `comp` commence à 1. `fig` : `null`, `{ "type": "numberLine", ... }` ou `{ "type": "graph", ... }`.
- **Toujours 3 choix**, une seule bonne réponse.
- Chaque mauvais choix = une **erreur fréquente réelle**, avec son explication (`why`) ; l'indice (`hint`) en darija.
- **Questions courtes et claires** : surtout du calcul direct. Pour « Modéliser » : **une seule phrase courte**, pas de longue histoire.
- Énoncés en **français** comme le cahier ; tuteur en **darija** (écriture arabe).
- Compétences par parcours : photos des pages **5, 26 et 41** du cahier dans `/docs`.
- **Une question boss par parcours** (`"boss": true`) : un peu plus difficile, placée à la fin, bonus d'étoile.
- Une question ne doit pas dépendre d'une autre (l'ordre est mélangé dans chaque compétence).
- Vérifier chaque réponse mathématiquement avant de l'ajouter.
- **`npm run check`** (lancé aussi par `npm run build`) doit signaler :
  - structure invalide (3 choix, une seule bonne réponse, `why`/`hint`/`exp` présents, compétence valide) ;
  - LaTeX invalide ;
  - doublons ;
  - **à ajouter** : recalcul de chaque question de calcul → bonne réponse fausse, ou mauvais choix qui serait juste.

## 4. Évaluation
- 1 point au 1er essai, 0,5 au 2e, 0 sinon.
- Par compétence : ≥ 75 % 🟢, ≥ 50 % 🟡, sinon 🔴.
- **VISA** : score ≥ 75 % et aucune compétence 🔴.
- Étoiles : ≥ 90 % → 3, ≥ 70 % → 2, ≥ 40 % → 1 ; +1 (max 3) si la question boss est réussie au 1er essai.
- Écran de résultats = grille du cahier (compétences × 3 visages) + pages du cahier à réviser.
- Enregistrer chaque réponse : élève, domaine, parcours, compétence, question, choix, essai, temps.
- Bouton « Exporter mes résultats » en **CSV** (pour analyse par le professeur) + tableau de bord professeur.
- Sauvegarde locale (`localStorage`, clé `math2ac:v1`).

## Architecture actuelle (à réutiliser)
- Vite + React + TypeScript ; KaTeX (`src/lib/math.tsx`, composant `<Tex>` pour le texte avec `$...$`) ;
  Motion (`motion/react`) ; canvas-confetti ; sons Web Audio (`src/lib/sound.ts`) ;
  police Baloo Bhaijaan 2 installée localement (`@fontsource`).
- `src/lib/evaluation.ts` : score, niveaux, VISA, étoiles, bonus boss.
- `src/lib/progress.ts` : état de chaque parcours (`locked` / `soon` / `open` / `done` / `visa`), déblocage, prochaine étape.
- `src/lib/storage.ts` : sauvegarde (meilleur score, étoiles, date du VISA, déblocages déjà montrés).
- `src/game/` : monde Phaser — `WorldScene` (île, eau, nuages, oiseaux, héros, caméra, lieux), `islands.ts` (plan des îles et
  bâtiments en tuiles Kenney), `textures.ts` (textures dessinées par le code), `bridge.ts` (événements Phaser ↔ React :
  `near`, `interact`, `ready` / `progress`, `pause`), `GameCanvas.tsx`, `config.ts` (personnages, zoom).
- `src/components/` : `Stage` (scène UI 1920 × 1080 mise à l'échelle), `Hud`, `PlacePrompt` (Nour près d'un lieu), `Owl`,
  `Tutor`, `Stamp`, `Face`, `Figure`, `HeroSprite`.
- `src/screens/` (panneaux par-dessus le monde) : `HeroSelect`, `Quiz`, `Results`, `Passport`. CSS de l'interface PC : `src/world.css`.

## Tests
- Le panneau navigateur intégré ne dessine pas toujours (`requestAnimationFrame` à l'arrêt) : pour les tests de bout en bout
  et les captures, utiliser **Chrome headless via `playwright-core`** (`C:/Program Files/Google/Chrome/Application/chrome.exe`),
  installé hors du projet (dossier scratchpad), en 1920×1080 et 1366×768.
- Tester aussi avec `reducedMotion: 'reduce'`.
- Vérifier qu'il n'y a aucune erreur dans la console.

## 5. Ordre de travail (s'arrêter à chaque point de contrôle)
1. **Prototype avec UNE île (Fractions)** : personnage, déplacement, caméra, un lieu qui lance Fractions P1 existant.
   → Montrer des captures en 1920×1080 et **attendre la validation**.
2. **Les 2 autres îles**, le bateau, les ponts qui s'ouvrent, le voyage rapide.
   → Captures + **attendre la validation**.
3. **Fractions P2** : écrire d'abord 4 questions exemples (une par compétence) + 1 question boss, lancer `npm run check`,
   et les montrer. → **Attendre la validation** avant d'écrire le reste.
4. **Le reste des parcours 2 et 3**, domaine par domaine, en montrant chaque fichier JSON avant de passer au suivant.
5. **Enregistrement de chaque réponse** (élève, domaine, parcours, compétence, question, choix, essai, temps),
   export CSV, tableau de bord du professeur.

Après chaque étape : **commit Git**, `npm run dev` sans erreur, et un **résumé simple** de ce qui marche et de ce qui reste.

## Historique
- Étape 1 du nouveau plan : prototype Phaser avec l'île des Fractions (héros, déplacement, caméra, lieux P1/P2/P3, quiz en panneau).
- Étapes 1 à 3 de l'ancien plan faites (commit `4b55312`) : jeu React, contenu des parcours 1 en JSON,
  carte d'aventure en 2D (HTML/SVG), passeport avec tampons, Nour animé, séries, support des questions boss.
