/**
 * Rendu DOM du Sokoban (jQuery). Ne connaît AUCUNE règle de jeu : il dessine
 * l'état fourni par game.js et applique les diffs qu'il reçoit.
 *
 * Les classes statiques (mur, destination) sont posées une fois par
 * renderLevel ; seules joueur / caisse / gauche / droite bougent ensuite.
 */

"use strict";

function Renderer(container)
{
    this.container = container;
}

Renderer.prototype.getCell = function (x, y)
{
    return this.container.find("#cell-" + x + "-" + y);
};

/** Reconstruit toute la grille depuis l'état du Game. */
Renderer.prototype.renderLevel = function (game)
{
    var body = "";

    for (var y = 0; y < game.nbRow; y++)
    {
        body += "<div class='row'>";

        for (var x = 0; x < game.nbCol; x++)
        {
            var k = x + "," + y;
            var classes = ["cell"];

            if (game.murs.has(k))
            {
                classes.push("mur");
            }

            if (game.destinations.has(k))
            {
                classes.push("destination");
            }

            if (game.caisses.has(k))
            {
                classes.push("caisse");
            }

            if (game.joueur.x === x && game.joueur.y === y)
            {
                classes.push("joueur");
            }

            body += "<div id='cell-" + x + "-" + y + "' class='" + classes.join(" ")
                + "' data-x='" + x + "' data-y='" + y + "'></div>";
        }

        body += "</div>";
    }

    this.container.html(body);
};

/** Applique un diff { joueur:{from,to}, caisse?:{from,to} } au DOM. */
Renderer.prototype.applyDiff = function (diff)
{
    if (diff.caisse)
    {
        this.getCell(diff.caisse.from.x, diff.caisse.from.y).removeClass("caisse");
        this.getCell(diff.caisse.to.x, diff.caisse.to.y).addClass("caisse");
    }

    if (diff.joueur)
    {
        var from = diff.joueur.from;
        var to = diff.joueur.to;

        this.getCell(from.x, from.y).removeClass("joueur gauche droite");

        // Orientation déduite du déplacement horizontal (neutre en vertical).
        var orientation = "";

        if (to.x < from.x)
        {
            orientation = "gauche";
        }
        else if (to.x > from.x)
        {
            orientation = "droite";
        }

        this.getCell(to.x, to.y).addClass("joueur " + orientation);
    }
};

Renderer.prototype.setCounters = function (nbMove, nbPush)
{
    this.container.closest(".game-sokoban").find(".nbMove").html(nbMove);
    this.container.closest(".game-sokoban").find(".nbPush").html(nbPush);
};

// Inerte hors navigateur ; exposé pour cohérence (non testé en node).
if (typeof module !== "undefined" && module.exports)
{
    module.exports = Renderer;
}
