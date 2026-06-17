"use strict";

const test = require("node:test");
const assert = require("node:assert");
const Game = require("./game");

// Construit l'objet `data` (format niveau.php) depuis une carte ASCII.
// Reproduit volontairement le non-padding des lignes courtes.
function carte(lignes)
{
    return {
        nbRow: lignes.length,
        nbCol: Math.max(...lignes.map((l) => l.length)),
        data: lignes.map((l) => l.split(""))
    };
}

test("init : parse murs, caisses, destinations et joueur", () =>
{
    const g = new Game();
    g.init(carte([
        "#####",
        "#@$.#",
        "#####"
    ]));

    assert.deepStrictEqual(g.joueur, { x: 1, y: 1 });
    assert.ok(g.murs.has("0,0"));
    assert.ok(g.caisses.has("2,1"));
    assert.ok(g.destinations.has("3,1"));
    assert.strictEqual(g.nbMove, 0);
    assert.strictEqual(g.nbPush, 0);
});

test("init : '*' = caisse sur destination, '+' = joueur sur destination", () =>
{
    const g = new Game();
    g.init(carte([
        "#####",
        "#+*.#",
        "#####"
    ]));

    assert.deepStrictEqual(g.joueur, { x: 1, y: 1 });
    assert.ok(g.destinations.has("1,1"));     // sous le joueur
    assert.ok(g.caisses.has("2,1"));
    assert.ok(g.destinations.has("2,1"));     // caisse déjà placée
    assert.ok(g.destinations.has("3,1"));
});

test("init : lignes courtes (data[y][x] undefined) traitées hors-jeu", () =>
{
    const g = new Game();
    g.init({
        nbRow: 2,
        nbCol: 4,
        data: [
            ["#", "@"],          // ligne courte : x=2,3 absents
            ["#", "#", "#", "#"]
        ]
    });

    // (2,0) et (3,0) ne sont ni mur ni jouables.
    assert.ok(!g.murs.has("2,0"));
    assert.ok(!g.isWalkable(2, 0));   // hors longueur de ligne -> non marchable
});

test("isWalkable : grille, murs, caisses", () =>
{
    const g = new Game();
    g.init(carte([
        "#####",
        "#@$ #",
        "#####"
    ]));

    assert.ok(!g.isWalkable(0, 0));    // mur
    assert.ok(!g.isWalkable(2, 1));    // caisse
    assert.ok(g.isWalkable(3, 1));     // libre
    assert.ok(!g.isWalkable(-1, 1));   // hors grille
    assert.ok(!g.isWalkable(99, 1));   // hors grille
});

test("tryMove : déplacement libre incrémente nbMove et renvoie un diff", () =>
{
    const g = new Game();
    g.init(carte([
        "#####",
        "#@  #",
        "#####"
    ]));

    const diff = g.tryMove("droite");

    assert.deepStrictEqual(g.joueur, { x: 2, y: 1 });
    assert.strictEqual(g.nbMove, 1);
    assert.strictEqual(g.nbPush, 0);
    assert.deepStrictEqual(diff.joueur, { from: { x: 1, y: 1 }, to: { x: 2, y: 1 }, dir: "droite" });
    assert.strictEqual(diff.caisse, undefined);
    assert.strictEqual(diff.won, false);
});

test("tryMove : mur bloquant renvoie null, état inchangé", () =>
{
    const g = new Game();
    g.init(carte([
        "###",
        "#@#",
        "###"
    ]));

    assert.strictEqual(g.tryMove("droite"), null);
    assert.deepStrictEqual(g.joueur, { x: 1, y: 1 });
    assert.strictEqual(g.nbMove, 0);
});

test("tryMove : pousse une caisse, met à jour grille et compteurs", () =>
{
    const g = new Game();
    g.init(carte([
        "######",
        "#@$  #",
        "######"
    ]));

    const diff = g.tryMove("droite");

    assert.deepStrictEqual(g.joueur, { x: 2, y: 1 });
    assert.ok(g.caisses.has("3,1"));
    assert.ok(!g.caisses.has("2,1"));
    assert.strictEqual(g.nbMove, 1);
    assert.strictEqual(g.nbPush, 1);
    assert.deepStrictEqual(diff.caisse, { from: { x: 2, y: 1 }, to: { x: 3, y: 1 } });
});

test("tryMove : caisse bloquée par un mur derrière -> null", () =>
{
    const g = new Game();
    g.init(carte([
        "####",
        "#@$#",
        "####"
    ]));

    assert.strictEqual(g.tryMove("droite"), null);
    assert.ok(g.caisses.has("2,1"));
    assert.strictEqual(g.nbPush, 0);
});

test("tryMove : caisse bloquée par une autre caisse derrière -> null", () =>
{
    const g = new Game();
    g.init(carte([
        "######",
        "#@$$ #",
        "######"
    ]));

    assert.strictEqual(g.tryMove("droite"), null);
    assert.ok(g.caisses.has("2,1"));
    assert.ok(g.caisses.has("3,1"));
});

test("tryMove : pousser la dernière caisse sur destination -> won", () =>
{
    const g = new Game();
    g.init(carte([
        "#####",
        "#@$.#",
        "#####"
    ]));

    const diff = g.tryMove("droite");

    assert.ok(g.caisses.has("3,1"));
    assert.strictEqual(diff.won, true);
    assert.ok(g.isWon());
});

test("undo : annule un déplacement simple", () =>
{
    const g = new Game();
    g.init(carte([
        "#####",
        "#@  #",
        "#####"
    ]));

    g.tryMove("droite");
    const diff = g.undo();

    assert.deepStrictEqual(g.joueur, { x: 1, y: 1 });
    assert.strictEqual(g.nbMove, 0);
    assert.ok(diff);
});

test("undo : annule une poussée (joueur et caisse reviennent)", () =>
{
    const g = new Game();
    g.init(carte([
        "######",
        "#@$  #",
        "######"
    ]));

    g.tryMove("droite");
    g.undo();

    assert.deepStrictEqual(g.joueur, { x: 1, y: 1 });
    assert.ok(g.caisses.has("2,1"));
    assert.ok(!g.caisses.has("3,1"));
    assert.strictEqual(g.nbMove, 0);
    assert.strictEqual(g.nbPush, 0);
});

test("undo : pile vide renvoie null sans planter", () =>
{
    const g = new Game();
    g.init(carte([
        "###",
        "#@#",
        "###"
    ]));

    assert.strictEqual(g.undo(), null);
});

test("isWon : faux tant qu'une caisse n'est pas placée", () =>
{
    const g = new Game();
    g.init(carte([
        "######",
        "#@$ .#",
        "######"
    ]));

    assert.ok(!g.isWon());
});
