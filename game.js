/**
 * Modèle de jeu Sokoban — état et règles purs, SANS aucune dépendance au DOM.
 *
 * Source de vérité : grille en mémoire (Sets "x,y"). Le rendu et le pathfinding
 * sont assurés ailleurs (render.js, astar.js) ; ils consomment cet état.
 *
 * Les opérations renvoient un « diff » décrivant ce qui a bougé, que le rendu
 * applique sans connaître les règles :
 *   { joueur: { from, to, dir }, caisse?: { from, to }, won }
 */

"use strict";

var DELTAS = {
    haut: { dx: 0, dy: -1 },
    bas: { dx: 0, dy: 1 },
    gauche: { dx: -1, dy: 0 },
    droite: { dx: 1, dy: 0 }
};

var INVERSE = {
    haut: "bas",
    bas: "haut",
    gauche: "droite",
    droite: "gauche"
};

function key(x, y)
{
    return x + "," + y;
}

function Game()
{
    this.murs = new Set();
    this.caisses = new Set();
    this.destinations = new Set();
    this.cells = new Set();          // toutes les cases présentes (in-game)
    this.joueur = { x: 0, y: 0 };
    this.nbCol = 0;
    this.nbRow = 0;
    this.nbMove = 0;
    this.nbPush = 0;
    this.backup = [];
}

/**
 * Construit l'état depuis l'objet `data` de niveau.php :
 *   { nbRow, nbCol, data: [[car, ...], ...] }
 * Les lignes courtes (car undefined) sont simplement ignorées (hors-jeu).
 */
Game.prototype.init = function (data)
{
    this.murs = new Set();
    this.caisses = new Set();
    this.destinations = new Set();
    this.cells = new Set();
    this.nbCol = data.nbCol;
    this.nbRow = data.nbRow;
    this.nbMove = 0;
    this.nbPush = 0;
    this.backup = [];

    for (var y = 0; y < data.nbRow; y++)
    {
        var ligne = data.data[y] || [];

        for (var x = 0; x < ligne.length; x++)
        {
            var car = ligne[x];

            if (car === undefined)
            {
                continue;
            }

            var k = key(x, y);
            this.cells.add(k);

            switch (car)
            {
                case "#":
                    this.murs.add(k);
                    break;
                case "$":
                    this.caisses.add(k);
                    break;
                case ".":
                    this.destinations.add(k);
                    break;
                case "*":
                    this.caisses.add(k);
                    this.destinations.add(k);
                    break;
                case "@":
                    this.joueur = { x: x, y: y };
                    break;
                case "+":
                    this.joueur = { x: x, y: y };
                    this.destinations.add(k);
                    break;
                default:
                    break;          // ' ' : sol libre
            }
        }
    }
};

/** Case franchissable : présente dans la grille, ni mur, ni caisse. Pont avec l'A*. */
Game.prototype.isWalkable = function (x, y)
{
    var k = key(x, y);

    return this.cells.has(k) && !this.murs.has(k) && !this.caisses.has(k);
};

/**
 * Tente un déplacement dans une direction ("haut"|"bas"|"gauche"|"droite").
 * Pousse une caisse si elle est devant et que la case au-delà est libre.
 * Renvoie le diff appliqué, ou null si le mouvement est impossible.
 */
Game.prototype.tryMove = function (dir)
{
    var d = DELTAS[dir];

    if (!d)
    {
        return null;
    }

    var from = { x: this.joueur.x, y: this.joueur.y };
    var to = { x: from.x + d.dx, y: from.y + d.dy };
    var toKey = key(to.x, to.y);

    var diff = null;

    if (this.caisses.has(toKey))
    {
        // Une caisse est devant : poussable seulement si la case au-delà est libre.
        var au_dela = { x: to.x + d.dx, y: to.y + d.dy };

        if (!this.isWalkable(au_dela.x, au_dela.y))
        {
            return null;
        }

        this.caisses.delete(toKey);
        this.caisses.add(key(au_dela.x, au_dela.y));
        this.nbPush++;

        diff = { caisse: { from: { x: to.x, y: to.y }, to: au_dela } };

        this.backup.push({
            type: "push",
            joueurFrom: from,
            caisseFrom: { x: to.x, y: to.y },
            caisseTo: au_dela
        });
    }
    else
    {
        if (!this.isWalkable(to.x, to.y))
        {
            return null;
        }

        diff = {};

        this.backup.push({ type: "move", joueurFrom: from });
    }

    this.joueur = to;
    this.nbMove++;

    diff.joueur = { from: from, to: to, dir: dir };
    diff.won = this.isWon();

    return diff;
};

/**
 * Annule la dernière opération. Renvoie le diff inverse à appliquer au rendu,
 * ou null si rien à annuler.
 */
Game.prototype.undo = function (dir)
{
    var op = this.backup.pop();

    if (!op)
    {
        return null;
    }

    var courant = { x: this.joueur.x, y: this.joueur.y };

    this.joueur = { x: op.joueurFrom.x, y: op.joueurFrom.y };
    this.nbMove--;

    var diff = { joueur: { from: courant, to: this.joueur, dir: null }, won: false };

    if (op.type === "push")
    {
        this.caisses.delete(key(op.caisseTo.x, op.caisseTo.y));
        this.caisses.add(key(op.caisseFrom.x, op.caisseFrom.y));
        this.nbPush--;

        diff.caisse = { from: op.caisseTo, to: op.caisseFrom };
    }

    return diff;
};

/** Toutes les caisses sont sur une destination. */
Game.prototype.isWon = function ()
{
    for (var k of this.caisses)
    {
        if (!this.destinations.has(k))
        {
            return false;
        }
    }

    return this.caisses.size > 0;
};

Game.INVERSE = INVERSE;

// Inerte dans le navigateur, exposé pour les tests node.
if (typeof module !== "undefined" && module.exports)
{
    module.exports = Game;
}
