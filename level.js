/**
 * Parsing d'un niveau au format Sokoban `.xsb` (texte brut) vers l'objet
 * consommé par game.init :
 *   { nbRow, nbCol, data: [[car, ...], ...] }
 *
 * Portage côté client de l'ancien niveau.php : aucune dépendance serveur, ce qui
 * rend le jeu 100 % statique (compatible GitHub Pages, ouvert via un serveur web).
 *
 * Seuls les caractères Sokoban valides sont conservés ; les retours chariot et
 * tout caractère étranger sont ignorés, à l'identique de l'ancien filtrage PHP.
 */

"use strict";

var CARACTERES_VALIDES = {
    " ": true,      // sol libre
    "#": true,      // mur
    "$": true,      // caisse
    ".": true,      // destination
    "*": true,      // caisse sur destination
    "@": true,      // joueur
    "+": true       // joueur sur destination
};

function parseLevel(text)
{
    var lignes = String(text).split(/\r\n|\r|\n/);

    // Un éventuel saut de ligne final ne doit pas créer une rangée vide en trop
    // (comportement de fgets dans l'ancien niveau.php).
    if (lignes.length > 0 && lignes[lignes.length - 1] === "")
    {
        lignes.pop();
    }

    var result = { nbRow: 0, nbCol: 0, data: [] };

    for (var i = 0; i < lignes.length; i++)
    {
        var ligne = lignes[i];
        var cases = [];

        for (var j = 0; j < ligne.length; j++)
        {
            var car = ligne.charAt(j);

            if (CARACTERES_VALIDES[car])
            {
                cases.push(car);
            }
        }

        result.nbRow++;
        result.nbCol = Math.max(result.nbCol, cases.length);
        result.data.push(cases);
    }

    return result;
}

// Inerte dans le navigateur (parseLevel reste global), exposé pour les tests node.
if (typeof module !== "undefined" && module.exports)
{
    module.exports = parseLevel;
}
