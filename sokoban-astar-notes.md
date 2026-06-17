# Notes — refonte A* du Sokoban

Mémo pour reprendre le travail une fois le dépôt git créé et les bons fichiers rapatriés.

## Contexte

Jeu de Sokoban en JS (jQuery), rendu via le DOM (`<div id="cell-x-y">`).
Clic sur une case → `soko.astar(x, y)` calcule un chemin → `soko.anim()` déplace le joueur.
Le code original mélange logique de jeu, A* et manipulation DOM dans un seul gros fichier (template PHP côté serveur).

## Problèmes repérés dans l'A* original

1. **Comparaison de coût incorrecte (justesse)** — la version originale comparait le
   coût du voisin existant à `u.cout` (coût du parent) au lieu du coût candidat
   `u.cout + 1`. Et elle ne retirait/mettait jamais à jour l'ancien nœud → doublons
   dans l'open list, chemins potentiellement sous-optimaux.
   → Règle correcte : ouvrir un voisin seulement si `tentative = g + 1` est
   **strictement meilleur** que le `g` déjà connu.

2. **Heuristique euclidienne** (`sqrt(dx² + dy²)`) — admissible mais sous-estime trop
   sur une grille 4 directions → A* explore trop de nœuds.
   → Remplacée par **Manhattan** (`|dx| + |dy|`), exacte ici. Au passage, `Math.abs`
   sous un carré était inutile.

3. **Tout l'A* lit le DOM dans la boucle chaude** — `getCell` fait `$("#cell-x-y")`,
   `getVoisins`/`canGo` font des `.hasClass(...)` et `.attr("data-x")` (strings) à
   chaque voisin de chaque nœud. Coûteux + coercions de type dispersées (`Number`, `==`).
   → Découpler : grille en mémoire (tableau 2D mur/caisse) construite dans `init`,
   le DOM ne sert plus qu'à l'affichage.

4. **Structures de données** — `SortedList.insert` en O(n) (tri à bulles adjacent),
   `searchXY` en scan linéaire O(n).
   → Remplacées par un **min-heap binaire** (open list, O(log n)) et une **Map
   `"x,y" -> g`** pour les coûts connus (O(1)).

5. **Détails** — `List.prototype.size` défini deux fois ; pas de gestion de la case
   hors grille (`getCell` renvoie un objet jQuery vide, jamais testé) ;
   `SortedList.insert` continuait de boucler après avoir placé l'élément (pas de `break`).

## Ce qui a déjà été fait

- `astar.js` : module A* autonome, **découplé du DOM**, avec toutes les corrections
  ci-dessus. Signature :

  ```js
  astar(start, goal, isWalkable) -> string[]   // ["haut"|"bas"|"gauche"|"droite", ...]
  ```

  `isWalkable(x, y)` est le seul pont avec le modèle de jeu (renvoie false pour mur,
  caisse, ou hors grille). Export CommonJS, inerte dans le navigateur.

## Branchement prévu dans `Soko`

Version rapide (réutilise le DOM existant) :

```js
Soko.prototype.astar = function(x, y) {
    var that = this;
    return astar(
        { x: this.joueur.x, y: this.joueur.y },
        { x: x, y: y },
        function(cx, cy) {
            var cell = that.getCell(cx, cy);
            return cell.length > 0 && that.canGo(cell); // length > 0 = test hors-grille
        }
    );
};
```

## À faire une fois le dépôt prêt

- [ ] Rapatrier le fichier source original (template PHP/JS) dans le dépôt.
- [ ] Décider : version « rapide » (DOM via `isWalkable`) ou refonte avec grille en
      mémoire dans `init`. **Recommandé : grille en mémoire** si on veut aller plus loin.
- [ ] Intégrer `astar.js` et remplacer l'ancien A* + `List`/`SortedList`/`Noeud`.
- [ ] (Optionnel) `package.json` + test rapide (`node:test`) pour valider l'A*
      sur quelques cartes : chemin trouvé, chemin optimal, cas sans solution.
- [ ] Séparer proprement logique de jeu / rendu / pathfinding (le tout est dans un
      seul gros bloc aujourd'hui).
