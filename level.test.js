"use strict";

const test = require("node:test");
const assert = require("node:assert");
const parseLevel = require("./level");

test("niveau simple : dimensions et contenu", () =>
{
    const data = parseLevel("#@$.#");

    assert.strictEqual(data.nbRow, 1);
    assert.strictEqual(data.nbCol, 5);
    assert.deepStrictEqual(data.data, [["#", "@", "$", ".", "#"]]);
});

test("plusieurs lignes : nbCol = ligne la plus large", () =>
{
    const data = parseLevel("###\n#@ #\n###");

    assert.strictEqual(data.nbRow, 3);
    assert.strictEqual(data.nbCol, 4);
});

test("saut de ligne final : pas de rangée vide en trop", () =>
{
    const data = parseLevel("###\n#@#\n###\n");

    assert.strictEqual(data.nbRow, 3);
});

test("fins de ligne Windows (CRLF) supportées", () =>
{
    const data = parseLevel("###\r\n#@#\r\n###");

    assert.strictEqual(data.nbRow, 3);
    assert.strictEqual(data.nbCol, 3);
    // Aucun \r ne doit subsister dans les cases.
    assert.deepStrictEqual(data.data[0], ["#", "#", "#"]);
});

test("caractères étrangers ignorés", () =>
{
    const data = parseLevel("#@xyz#");

    assert.deepStrictEqual(data.data, [["#", "@", "#"]]);
});

test("tous les caractères Sokoban valides conservés", () =>
{
    const data = parseLevel(" #$.*@+");

    assert.deepStrictEqual(data.data, [[" ", "#", "$", ".", "*", "@", "+"]]);
});
