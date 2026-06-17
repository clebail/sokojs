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

    function gagner()
    {
        canPlay = false;

        setTimeout(function ()
        {
            alert("Niveau réussi bravo !");

            $.ajax({
                url: "score.php",
                type: "POST",
                data: { niveau: game.niveau, nbMove: game.nbMove, nbPush: game.nbPush },
                success: function (data)
                {
                    $(".highscore tbody").html(data);
                },
                beforeSend: function ()
                {
                    $("#loading").show();
                },
                complete: function ()
                {
                    $("#loading").hide();
                }
            });
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

    function loadNiveau(niveau)
    {
        $.ajax({
            url: "niveau.php",
            type: "POST",
            data: { niveau: niveau },
            dataType: "JSON",
            success: function (data)
            {
                game.init(data);
                game.niveau = niveau;
                renderer.renderLevel(game);
                renderer.setCounters(0, 0);
                $(".highscore tbody").html(data["scores"]);
                canPlay = true;
            },
            beforeSend: function ()
            {
                $("#loading").show();
            },
            complete: function ()
            {
                $("#loading").hide();
            }
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
