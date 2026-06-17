"use strict";

const test = require("node:test");
const assert = require("node:assert");
const astar = require("./astar");

// Construit un isWalkable depuis une carte ASCII.
//   '#' = mur, ' ' = libre. Tout caractère hors grille -> non walkable.
function depuisCarte(lignes)
{
    const grille = lignes.map((l) => l.split(""));

    return function (x, y)
    {
        if (y < 0 || y >= grille.length)
        {
            return false;
        }

        if (x < 0 || x >= grille[y].length)
        {
            return false;
        }

        return grille[y][x] !== "#";
    };
}

// Rejoue un chemin et renvoie la position finale.
function rejouer(start, chemin)
{
    const pos = { x: start.x, y: start.y };
    const delta = {
        haut: { dx: 0, dy: -1 },
        bas: { dx: 0, dy: 1 },
        gauche: { dx: -1, dy: 0 },
        droite: { dx: 1, dy: 0 }
    };

    for (const pas of chemin)
    {
        pos.x += delta[pas].dx;
        pos.y += delta[pas].dy;
    }

    return pos;
}

test("ligne droite : chemin optimal", () =>
{
    const walk = depuisCarte([
        "#####",
        "#   #",
        "#####"
    ]);
    const chemin = astar({ x: 1, y: 1 }, { x: 3, y: 1 }, walk);

    assert.deepStrictEqual(chemin, ["droite", "droite"]);
});

test("contournement d'un mur : longueur optimale", () =>
{
    const walk = depuisCarte([
        "#####",
        "#   #",
        "### #",
        "#   #",
        "#####"
    ]);
    const start = { x: 1, y: 1 };
    const goal = { x: 1, y: 3 };
    const chemin = astar(start, goal, walk);

    // Le mur en (1,2) et (2,2) bloque la descente directe : il faut
    // contourner par la colonne x=3 -> 6 pas (Manhattan direct = 2).
    assert.strictEqual(chemin.length, 6);
    assert.deepStrictEqual(rejouer(start, chemin), goal);
});

test("le chemin est effectivement marchable", () =>
{
    const lignes = [
        "########",
        "#      #",
        "# #### #",
        "# #  # #",
        "# #  # #",
        "#      #",
        "########"
    ];
    const walk = depuisCarte(lignes);
    const start = { x: 1, y: 1 };
    const goal = { x: 3, y: 3 };
    const chemin = astar(start, goal, walk);

    let pos = { x: start.x, y: start.y };
    const delta = {
        haut: { dx: 0, dy: -1 },
        bas: { dx: 0, dy: 1 },
        gauche: { dx: -1, dy: 0 },
        droite: { dx: 1, dy: 0 }
    };

    for (const pas of chemin)
    {
        pos.x += delta[pas].dx;
        pos.y += delta[pas].dy;
        assert.ok(walk(pos.x, pos.y), `case non marchable traversée en (${pos.x},${pos.y})`);
    }

    assert.deepStrictEqual(pos, goal);
});

test("aucune solution : but enfermé", () =>
{
    const walk = depuisCarte([
        "#####",
        "#  ##",
        "## ##",
        "#####"
    ]);
    // (1,1) ne peut pas atteindre une case murée.
    const chemin = astar({ x: 1, y: 1 }, { x: 3, y: 1 }, walk);

    assert.deepStrictEqual(chemin, []);
});

test("start == goal : chemin vide", () =>
{
    const walk = depuisCarte([
        "###",
        "# #",
        "###"
    ]);
    const chemin = astar({ x: 1, y: 1 }, { x: 1, y: 1 }, walk);

    assert.deepStrictEqual(chemin, []);
});

test("but hors grille : chemin vide", () =>
{
    const walk = depuisCarte([
        "###",
        "# #",
        "###"
    ]);
    const chemin = astar({ x: 1, y: 1 }, { x: 99, y: 99 }, walk);

    assert.deepStrictEqual(chemin, []);
});
