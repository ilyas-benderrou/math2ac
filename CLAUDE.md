# Math 2AC — Jeu d'évaluation (brief pour Claude Code)

## Objectif
Un jeu web pour évaluer la compréhension des élèves de **2ème année collège (Maroc)** en mathématiques.
Il suit le cahier de l'élève : 3 domaines, chacun en 3 parcours, et des compétences notées
🟢 acquis / 🟡 en cours / 🔴 à revoir, avec un tampon **VISA** quand le parcours est validé.

Point de départ : `math2ac-demo.html` (démo fonctionnelle : tuteur, QCM, correction, grille de résultats).
Reprendre sa logique et son contenu, mais en faire un vrai projet structuré, plus créatif et plus animé.

## Stack
- Vite + React + TypeScript
- KaTeX pour toutes les formules (`$...$` dans le contenu)
- Framer Motion pour les animations, canvas-confetti pour les célébrations
- Sons courts (Web Audio ou Howler), avec bouton muet
- Sauvegarde locale (localStorage) ; aucune connexion internet nécessaire après le build
- Doit marcher sur PC (Windows) et sur téléphone (responsive)

## Contenu (le plus important)
- Questions dans `src/data/<domaine>-p<parcours>.json`, séparées du code.
- Format d'une question :
  ```json
  { "comp": 1, "q": "Calcule : $\\frac{1}{2}+\\frac{1}{3}$",
    "options": [
      { "t": "$\\frac{5}{6}$", "ok": true },
      { "t": "$\\frac{2}{5}$", "why": "explication de l'erreur en darija" },
      { "t": "$\\frac{2}{6}$", "why": "..." } ],
    "hint": "indice en darija", "exp": "correction en LaTeX", "fig": null }
  ```
- **Toujours 3 choix**, une seule bonne réponse.
- **Questions courtes et claires** : surtout du calcul direct. Peu de problèmes à énoncé.
  Pour les compétences « Modéliser », une seule phrase courte, pas de longue histoire.
- Chaque mauvais choix correspond à une **erreur fréquente réelle** et a son explication.
- Énoncés en français (comme le cahier), tuteur en darija (écriture arabe, RTL).
- Compétences par parcours : voir les pages 5, 26 et 41 du cahier (photos dans `/docs` si présentes).
- Vérifier chaque réponse mathématiquement avant de l'ajouter.

## Domaines
1. Fractions (couleur or)
2. Nombres positifs et négatifs (couleur orange)
3. Algèbre (couleur framboise)

## Expérience de jeu
- **Carte d'aventure** : chaque domaine est une île/région, chaque parcours une étape du chemin.
  Le parcours suivant se débloque quand le précédent a le VISA.
- **Passeport** : l'élève a un passeport où s'impriment les tampons VISA obtenus (animation de tampon).
- **Tuteur « Nour » (hibou)** : animé (cligne des yeux, saute de joie, se gratte la tête quand c'est faux).
  Phrases variées : « باز عليك! », « برافو عليك! », « تبارك الله عليك! », « واعر! كمل هكا »…
  Utilise le prénom de l'élève de temps en temps.
- Bonne réponse : animation + son + confettis. Série de 3/5/8 bonnes réponses : célébration spéciale.
- Mauvaise réponse : explication de l'erreur + indice + 2e essai. Au 2e échec : correction affichée.
- **Question boss** à la fin de chaque parcours (un peu plus difficile, bonus d'étoiles).
- Barre de progression, étoiles (0 à 3), meilleure série.
- Animations rapides (< 400 ms) pour ne pas ralentir ; respecter `prefers-reduced-motion`.

## Évaluation
- 1 point au 1er essai, 0,5 au 2e, 0 sinon.
- Par compétence : ≥ 75 % 🟢, ≥ 50 % 🟡, sinon 🔴.
- VISA : score ≥ 75 % et aucune compétence 🔴.
- Écran de résultats = grille du cahier (compétences × 3 visages) + pages du cahier à réviser.
- Enregistrer chaque réponse : élève, domaine, parcours, compétence, question, choix, essai, temps.
- Bouton « Exporter mes résultats » en CSV (pour analyse par le professeur).

## Design
- Thème clair et propre, beaucoup d'air, gros boutons faciles à toucher.
- Police : Baloo Bhaijaan 2 (arabe + latin), installée localement.
- Les formules doivent être grandes et bien lisibles.

## Étapes de travail
1. Mettre en place le projet et reprendre la démo telle quelle (même contenu, même logique).
2. Mettre le contenu dans les fichiers JSON.
3. Ajouter la carte d'aventure, le passeport et les animations du tuteur.
4. Écrire les questions des parcours 2 et 3 (montrer quelques questions à valider avant de tout écrire).
5. Export CSV et tableau de bord professeur (plus tard).

Après chaque étape : lancer `npm run dev`, vérifier qu'il n'y a pas d'erreur, et expliquer simplement ce qui a changé.
