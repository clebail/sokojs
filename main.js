/**
 * Bootstrap / contrôleur du Sokoban : relie le modèle (game.js), le rendu
 * (render.js) et le pathfinding (astar.js), et gère les entrées utilisateur.
 *
 * Aucune règle de jeu ici : tout passe par game.tryMove / game.undo.
 */

"use strict";

(function ()
{
    var TOUCHES = {
        37: "gauche",
        38: "haut",
        39: "droite",
        40: "bas"
    };

    var canPlay = false;
    var game = new Game();
    var renderer = null;

    function isWalkable(x, y)
    {
        return game.isWalkable(x, y);
    }

    function appliquer(diff)
    {
        if (!diff)
        {
            return;
        }

        renderer.applyDiff(diff);
        renderer.setCounters(game.nbMove, game.nbPush);

        if (diff.won)
        {
            gagner();
        }
    }

    // Meilleur score personnel par niveau, conservé dans le navigateur
    // (localStorage) — remplace l'ancien classement servi par score.php.
    function bestKey(niveau)
    {
        return "sokoban.best." + niveau;
    }

    function getBest(niveau)
    {
        try
        {
            var raw = window.localStorage.getItem(bestKey(niveau));

            return raw ? JSON.parse(raw) : null;
        }
        catch (e)
        {
            return null;
        }
    }

    // Critère Sokoban : d'abord le moins de poussées, puis le moins de mouvements.
    function saveBest(niveau, nbMove, nbPush)
    {
        var best = getBest(niveau);
        var meilleur = !best
            || nbPush < best.nbPush
            || (nbPush === best.nbPush && nbMove < best.nbMove);

        if (meilleur)
        {
            best = { nbMove: nbMove, nbPush: nbPush };

            try
            {
                window.localStorage.setItem(bestKey(niveau), JSON.stringify(best));
            }
            catch (e)
            {
                // localStorage indisponible (mode privé strict) : on ignore.
            }
        }

        return best;
    }

    function gagner()
    {
        canPlay = false;

        var best = saveBest(game.niveau, game.nbMove, game.nbPush);

        setTimeout(function ()
        {
            alert("Niveau réussi, bravo !\n\n"
                + "Vos coups : " + game.nbPush + " poussées, " + game.nbMove + " mouvements.\n"
                + "Meilleur score : " + best.nbPush + " poussées, " + best.nbMove + " mouvements.");
        }, 500);
    }

    // Rejoue un chemin A* pas à pas (déplacements simples uniquement).
    function anim(step, chemin)
    {
        if (step >= chemin.length)
        {
            return;
        }

        appliquer(game.tryMove(chemin[step]));

        setTimeout(function ()
        {
            anim(step + 1, chemin);
        }, 100);
    }

    // Nom du fichier niveau, numéro sur 4 chiffres : 1 -> "level0001.xsb".
    function levelFile(niveau)
    {
        return "level" + String(niveau).padStart(4, "0") + ".xsb";
    }

    // Charge un niveau .xsb directement (statique, sans back-end) et le parse
    // côté client via parseLevel (level.js).
    function loadNiveau(niveau)
    {
        canPlay = false;
        $("#loading").show();

        fetch(levelFile(niveau))
            .then(function (reponse)
            {
                if (!reponse.ok)
                {
                    throw new Error("Niveau introuvable : " + niveau);
                }

                return reponse.text();
            })
            .then(function (texte)
            {
                game.init(parseLevel(texte));
                game.niveau = niveau;
                renderer.renderLevel(game);
                renderer.setCounters(0, 0);
                canPlay = true;
            })
            .catch(function (erreur)
            {
                console.error(erreur);
            })
            .then(function ()
            {
                $("#loading").hide();
            });
    }

    $(document).ready(function ()
    {
        renderer = new Renderer($(".soko"));
        loadNiveau(1);

        $("#selectNiveau").change(function ()
        {
            loadNiveau($(this).val());
            $(this).blur();
        });

        $(".game-select .reload a").click(function (e)
        {
            e.preventDefault();
            loadNiveau(game.niveau);
            $("#selectNiveau").blur();
        });

        $(".game-select .undo a").click(function (e)
        {
            e.preventDefault();
            appliquer(game.undo());
        });

        $(document).keydown(function (event)
        {
            var dir = TOUCHES[event.which];

            if (canPlay && dir)
            {
                event.preventDefault();
                appliquer(game.tryMove(dir));
            }
        });

        $(".soko").mousedown(function (e)
        {
            if (!canPlay)
            {
                return;
            }

            var offset = $(this).offset();
            var x = Math.floor((e.pageX - offset.left) / 32);
            var y = Math.floor((e.pageY - offset.top) / 32);

            anim(0, astar(game.joueur, { x: x, y: y }, isWalkable));
        });
    });
}());
