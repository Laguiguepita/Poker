# Poker Texas Hold'em - Mode Interactive

Ce projet est un jeu de Poker Texas Hold'em en mode console, écrit en **JavaScript** pour **Node.js**. Il permet de jouer contre des adversaires IA, avec une interface interactive dans le terminal.

---

## Fonctionnalités

- Joueur humain contre 1 à 8 IA
- Gestion complète des phases du poker (pré-flop, flop, turn, river, showdown)
- Système de blinds, mises, relances, tapis, etc.
- Affichage clair de l'état de la partie et des résultats
- IA simple pour les adversaires
- Interface utilisateur via le terminal (readline)

---

## Prérequis

- **Node.js** : version **18.x** ou supérieure  
  (Testé avec Node.js 18 et 20)
- **npm** : version **8.x** ou supérieure

---

## Installation

1. **Clone le dépôt :**
   ```bash
   git clone <url-du-repo>
   cd Poker
   ```

2. **(Optionnel) Installe les dépendances :**  
   Ce projet n'utilise que des modules natifs Node.js, donc aucune dépendance externe n'est requise.

---

## Lancement du jeu

Dans le dossier du projet, exécute :

```bash
node ./src/index.js
```

ou

```bash
npm install
npm start
```

---

## Structure du projet

```
Poker/
├── src/
│   ├── index.js               
│   ├── models/
│   │   ├── Players.js
│   │   ├── Decks.js
│   ├── services/
│   │   ├── GameService.js
│   │   ├── PlayerService.js
│   │   ├── DealService.js
│   │   ├── HandEvaluator.js
│   └── ...
├── README.md
```

---

## Technologies utilisées

- **Node.js** (>= 18.x)
- **JavaScript** (ES2022, modules natifs)
- **readline** (module natif Node.js pour l'interface console)

---

## Utilisation

- Lance le jeu, saisis ton nom et le nombre d'adversaires IA.
- Joue chaque main en suivant les instructions affichées dans le terminal.
- À la fin de chaque main, choisis si tu veux continuer ou quitter.

---

## Limitations & améliorations possibles

- L'IA est basique (pas de stratégie avancée).
- Pas de sauvegarde de partie.
- Pas de gestion multi-joueurs humains.
- Pas d'interface graphique.

---

## Auteur

- Guillaume Pelsser Banales
- Projet personnel pour l'apprentissage de Node.js et du poker

---

**Bon jeu !**