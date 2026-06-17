/**
 * A* sur grille 4-directions, découplé de tout rendu (DOM).
 *
 * astar(start, goal, isWalkable) -> string[]
 *   start, goal : { x, y }
 *   isWalkable(x, y) -> bool   seul pont avec le modèle de jeu :
 *                              false pour un mur, une caisse ou une case hors grille.
 *
 * Retourne la liste des déplacements ["haut"|"bas"|"gauche"|"droite", ...]
 * menant de start à goal, ou [] si aucun chemin (ou si goal == start).
 *
 * - Heuristique de Manhattan (exacte sur grille 4 directions).
 * - Open list = min-heap binaire (O(log n) par opération).
 * - Coûts connus dans une Map "x,y" -> g (O(1)).
 */

"use strict";

function key(x, y)
{
    return x + "," + y;
}

// Min-heap binaire ordonné sur la clé `f`.
function MinHeap()
{
    this.items = [];
}

MinHeap.prototype.size = function ()
{
    return this.items.length;
};

MinHeap.prototype.push = function (node)
{
    var items = this.items;
    var i = items.length;

    items.push(node);

    while (i > 0)
    {
        var parent = (i - 1) >> 1;

        if (items[parent].f <= items[i].f)
        {
            break;
        }

        var tmp = items[parent];
        items[parent] = items[i];
        items[i] = tmp;
        i = parent;
    }
};

MinHeap.prototype.pop = function ()
{
    var items = this.items;
    var top = items[0];
    var last = items.pop();

    if (items.length > 0)
    {
        items[0] = last;

        var i = 0;
        var n = items.length;

        for (;;)
        {
            var left = 2 * i + 1;
            var right = 2 * i + 2;
            var smallest = i;

            if (left < n && items[left].f < items[smallest].f)
            {
                smallest = left;
            }

            if (right < n && items[right].f < items[smallest].f)
            {
                smallest = right;
            }

            if (smallest === i)
            {
                break;
            }

            var tmp = items[i];
            items[i] = items[smallest];
            items[smallest] = tmp;
            i = smallest;
        }
    }

    return top;
};

// y croît vers le bas (cohérent avec le rendu Sokoban).
var DIRECTIONS = [
    { dx: 0, dy: -1, nom: "haut" },
    { dx: 1, dy: 0, nom: "droite" },
    { dx: 0, dy: 1, nom: "bas" },
    { dx: -1, dy: 0, nom: "gauche" }
];

function heuristique(x, y, goal)
{
    return Math.abs(x - goal.x) + Math.abs(y - goal.y);
}

function astar(start, goal, isWalkable)
{
    if (start.x === goal.x && start.y === goal.y)
    {
        return [];
    }

    if (!isWalkable(goal.x, goal.y))
    {
        return [];
    }

    var open = new MinHeap();
    var gScore = new Map();         // "x,y" -> meilleur coût connu g
    var cameFrom = new Map();       // "x,y" -> { x, y, nom } : provenance + déplacement

    var startKey = key(start.x, start.y);

    gScore.set(startKey, 0);
    open.push({ x: start.x, y: start.y, g: 0, f: heuristique(start.x, start.y, goal) });

    while (open.size() > 0)
    {
        var u = open.pop();
        var uKey = key(u.x, u.y);

        // Entrée périmée : un meilleur g a déjà été traité pour cette case.
        if (u.g > gScore.get(uKey))
        {
            continue;
        }

        if (u.x === goal.x && u.y === goal.y)
        {
            return reconstruire(cameFrom, goal);
        }

        for (var i = 0; i < DIRECTIONS.length; i++)
        {
            var dir = DIRECTIONS[i];
            var nx = u.x + dir.dx;
            var ny = u.y + dir.dy;

            if (!isWalkable(nx, ny))
            {
                continue;
            }

            var tentative = u.g + 1;
            var vKey = key(nx, ny);
            var connu = gScore.get(vKey);

            if (connu === undefined || tentative < connu)
            {
                gScore.set(vKey, tentative);
                cameFrom.set(vKey, { x: u.x, y: u.y, nom: dir.nom });
                open.push({ x: nx, y: ny, g: tentative, f: tentative + heuristique(nx, ny, goal) });
            }
        }
    }

    return [];
}

function reconstruire(cameFrom, goal)
{
    var chemin = [];
    var courant = key(goal.x, goal.y);
    var prov = cameFrom.get(courant);

    while (prov)
    {
        chemin.unshift(prov.nom);
        courant = key(prov.x, prov.y);
        prov = cameFrom.get(courant);
    }

    return chemin;
}

// Inerte dans le navigateur, exposé pour les tests node.
if (typeof module !== "undefined" && module.exports)
{
    module.exports = astar;
}
