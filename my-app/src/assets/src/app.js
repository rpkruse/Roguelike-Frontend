"use strict";

window.debug = false;
window.gameDebug = false;

/* Classes and Libraries */
const Game = require('./game');
const EntityManager = require('./entity_manager');
const EntitySpawner = require('./entity_spawner');
const Tilemap = require('./tilemap');
const tileset = require('../tilemaps/tiledef.json');
const Player = require('./player');
const Pathfinder = require('./pathfinder');
const CombatController = require("./combat_controller");
const Vector = require('./vector');
const Click = require('./click');
const Stairs = require('./stairs');
const ProgressManager = require('./progress_manager');
const GUI = require('./gui');
const Terminal = require('./terminal');
const SFX = require("./sfx");
const Enemy = require("./enemy");
const HttpClient = require("./HttpClient");

/* Global variables */
window.client = new HttpClient();
// Terminal MUST be defined first so that anyone can add commands at any point
window.terminal = new Terminal();
window.terminal.log("Welcome to Roguelike");
window.terminal.log("Good luck!");
window.terminal.addCommand("debug", "Toggle debug",
    function (args) {
        if (args.length == 1) window.terminal.log("You do not have permission to use this command", window.colors.invalid);
        else if (args[1] != 4747) window.terminal.log("Nice try, but that's incorrect", window.colors.invalid);
        else {
            window.gameDebug = !window.gameDebug;
            window.terminal.log(`Debug mode set to ${window.gameDebug}`, window.colors.cmdResponse);
            player.debugModeChanged();
        }
    });


var canvas = document.getElementById('screen');
var scale = canvas.width / 1788;
var game = new Game(canvas, update, render);
window.sfx = new SFX();
window.entityManager = new EntityManager();
var fadeAnimationProgress = new ProgressManager(0, function () { });
var isFadeOut = true;
var screenSize = { width: 1056, height: 1056 };
var stairs;

window.combatController = new CombatController();

var gui = new GUI(screenSize);

var pathfinder = new Pathfinder();
window.pathfinder = pathfinder;

var input = {
    up: false,
    down: false,
    left: false,
    right: false
}

var turnTimer = 0;
var defaultTurnDelay = 400;     //Default turn between turns
var turnDelay = defaultTurnDelay; //current time between turns
var autoTurn = false;           //If true, reduces time between turns and turns happen automatically
var resetTimer = true;          //Take turn immediately on movement key press if true

var player = new Player({ x: 0, y: 0 });

window.player = player;
player.shouldProcessTurn = false;

// Event Listeners
function onMouseMove(event) {
    gui.onmousemove(event, scale);
}

function onMouseDown(event) {
    // Init the level when class is chosen
    if (player.shouldProcessTurn) player.playAttack({ x: event.offsetX, y: event.offsetY }, scale);
    if (gui.state == "start" || gui.state == "choose class") {
        window.sfx.play("click");
        gui.onmousedown(event);
        if (gui.chosenClass != "") {
            window.sfx.play("click");
            createNewCharacter(gui.chosenClass);
        }
    }
}

function onKeyDown(event) {
    if (window.terminal.onkeydown(event)) return;
    switch (event.key) {
        case "ArrowUp":
        case "w":
            event.preventDefault();
            input.up = true;
            if (resetTimer) {
                turnTimer = turnDelay;
                resetTimer = false;
            }
            player.changeDirection("up");
            break;
        case "ArrowDown":
        case "s":
            event.preventDefault();
            input.down = true;
            if (resetTimer) {
                turnTimer = turnDelay;
                resetTimer = false;
            }
            player.changeDirection("down");
            break;
        case "ArrowLeft":
        case "a":
            event.preventDefault();
            input.left = true;
            if (resetTimer) {
                turnTimer = turnDelay;
                resetTimer = false;
            }
            player.changeDirection("left");
            break;
        case "ArrowRight":
        case "d":
            event.preventDefault();
            input.right = true;
            if (resetTimer) {
                turnTimer = turnDelay;
                resetTimer = false;
            }
            player.changeDirection("right");
            break;
        case "v":
            event.preventDefault();
            window.sfx.toggleVolume();
            break;
        case "Escape":
            event.preventDefault();
            if (gui.state == "controls" || gui.state == "credits" || gui.state == "choose class") {
                gui.state = "start";
            }
    }
}

function onKeyUp(event) {
    switch (event.key) {
        case "ArrowUp":
        case "w":
            input.up = false;
            break;
        case "ArrowDown":
        case "s":
            input.down = false;
            break;
        case "ArrowLeft":
        case "a":
            input.left = false;
            break;
        case "ArrowRight":
        case "d":
            input.right = false;
            break;
        case "Shift":
            turnDelay = defaultTurnDelay;
            autoTurn = false;
            break;
    }
    if (!(input.left || input.right || input.up || input.down)) resetTimer = true;
}

function canvasOnClick(event) {
    var node = {
        x: parseInt(event.offsetX / (96 * scale)),
        y: parseInt(event.offsetY / (96 * scale))
    }

    var clickedWorldPos = window.tilemap.toWorldCoords(node);
    window.entityManager.addEntity(new Click(clickedWorldPos, player, function (enemy) {
        var distance = Vector.distance(player.position, enemy.position);
        if (distance.x <= player.combat.weapon.range && distance.y <= player.combat.weapon.range) {
            if (player.combat.weapon.attackType != "Melee" && player.combat.weapon.name != "Magic Missile") {
                var path = pathfinder.findPath(player.position, enemy.position);
                if (Vector.magnitude(distance) * 2 >= path.length) {
                    combatController.handleAttack(player.combat, enemy.combat);
                }
            } else {
                combatController.handleAttack(player.combat, enemy.combat);
            }
            processTurn();
        }
    }));
}

function canvasOnContextMenu(event) {
    event.preventDefault();
}

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
canvas.addEventListener('click', canvasOnClick);
canvas.addEventListener('contextmenu', canvasOnContextMenu);

/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function (timestamp) {
    game.loop(timestamp);
    window.requestAnimationFrame(masterLoop);
}

/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {

    if (player.shouldEndGame) {
        player.shouldEndGame = false;
        gui.state = "start";
        gui.chosenClass = "";
    }

    gui.update(elapsedTime);
    if (input.left || input.right || input.up || input.down || autoTurn) {
        turnTimer += elapsedTime;
        if (turnTimer >= turnDelay) {
            turnTimer = 0;
            processTurn();
        }
    }
    window.entityManager.update(elapsedTime);
    fadeAnimationProgress.progress(elapsedTime);
    window.terminal.update(elapsedTime);
    if (window.gameDebug) {
        window.terminal.addCommand("door", "Get the coordinates of the exit door",
            function () {
                window.terminal.log(`The coordinates of the exit door are x: ${stairs.position.x} y: ${stairs.position.y}`, window.colors.cmdResponse);
            });
        window.terminal.addCommand("spawn", "Spawns a given entity", function (args) { EntitySpawner.spawnCommand(args); });
        window.terminal.addCommand("level", "Sets the level to the given integer",
            function (args) {
                if (args.length != 2) {
                    window.terminal.log("Syntax: level <integer>", window.colors.invalid);
                }
                else {
                    if (args[1] != parseInt(args[1]) || args[1] < 1) {
                        window.terminal.log("Invalid level number", window.colors.invalid);
                        return;
                    }
                    window.player.position = { x: stairs.position.x, y: stairs.position.y };
                    window.terminal.log(`Setting level to ${args[1]}`, window.colors.cmdResponse);
                    window.player.level = parseInt(args[1]) - 1;
                }
            });
    }
    else {
        window.terminal.removeCommand("door");
        window.terminal.removeCommand("spawn");
        window.terminal.removeCommand("level");
    }
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */

function render(elapsedTime, ctx) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(scale, scale);


    window.tilemap.render(ctx);
    entityManager.render(elapsedTime, ctx);

    ctx.save();
    ctx.globalAlpha = (isFadeOut) ? fadeAnimationProgress.percent : 1 - fadeAnimationProgress.percent;
    ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
    ctx.restore();

    ctx.fillRect(1060, 0, 732, 1116);

    ctx.fillStyle = "white";
    ctx.fillRect(1057, 0, 2, 1116);
    window.terminal.render(elapsedTime, ctx);

    gui.render(elapsedTime, ctx);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
  * @function processTurn
  * Proccesses one turn, updating the states of all entities.
  */
function processTurn() {
    window.entityManager.processTurn(input);
}

function nextLevel(fadeOut) {
    if (player.level > 0)
        player.score += (player.score * .1) + (Math.floor(player.level / 5 + 1) * 10);
    player.level++;

    player.checkPoint();

    client.createLevel(player.level, "seed", function (level) {
        client.updateCharacterHistory(player.db.characterHistoryID,
            { score: Math.round(player.score), level_id: level.id }, function () { });
    });

    var isBossLevel = (player.level % 10 == 0);
    var init = function () {
        // clear terminal
        window.terminal.clear();
        var msg = `---===| LEVEL ${player.level} |===---`;
        var padSpace = Math.floor((80 - msg.length) / 2);
        window.terminal.log(Array(padSpace).join(' ') + msg);

        if (isBossLevel) {
            window.terminal.log("You sense an erie presence...");
            window.terminal.log("The demon dragon appears to consume your soul");
        }

        if (player.level == 1) window.terminal.instructions();

        // reset entities
        window.entityManager.reset();

        (isBossLevel) ? bossLevel() : standardLevel();
        //standardLevel();

        unfadeFromBlack();

    };

    (fadeOut) ? fadeToBlack(init) : init()
}

function bossLevel() {
    window.tilemap = new Tilemap(screenSize, 11, 11, tileset, true, {
        onload: function () { }
    });
    window.tilemap.generateMap();

    //move player to valid location
    player.position = { x: 5, y: 6 };

    // allow player to move
    player.shouldProcessTurn = true;

    // add player
    window.entityManager.addEntity(player);
    player.combat.health += window.combatController.healthPotion(player.level);

    //place new entities
    EntitySpawner.spawn(player, tilemap, 15, combatController.getPercentArray(true));

    var dragon = new Enemy({ x: 2, y: 1 }, "Fucking Dragon", player, function () {
        stairs = new Stairs({ x: 5, y: 2 }, function () { nextLevel(true) });
        window.entityManager.addEntity(stairs);
    });
    dragon.size = { width: 96, height: 96 };
    entityManager.addEntity(dragon);
}

function standardLevel() {
    if (window.tilemap.isBoss) {
        window.tilemap = new Tilemap(screenSize, 65, 65, tileset, false, {
            onload: function () { }
        });
    }

    var regen = false;

    do {
        //reset the regen flag
        regen = false;

        //gen new map
        window.tilemap.changeTileset();
        window.tilemap.generateMap();

        //move player to valid location
        var pos = window.tilemap.findOpenSpace();
        player.position = { x: pos.x, y: pos.y };
        window.tilemap.moveTo({ x: pos.x - 5, y: pos.y - 5 });

        // allow player to move
        player.shouldProcessTurn = true;

        // Find stairs location that is at least 8 away.
        var pos;
        var dist;
        var iterations = 0;
        do {
            pos = window.tilemap.findOpenSpace();
            dist = pathfinder.findPath(player.position, pos).length
            iterations++;
            if (iterations > 20) {
                regen = true;
                break;
            }
        } while (dist == 0 && dist < 8);

    } while (regen);

    // add player
    window.entityManager.addEntity(player);
    player.combat.health += window.combatController.healthPotion(player.level);

    // add stairs
    stairs = new Stairs(pos, function () { nextLevel(true) });
    window.entityManager.addEntity(stairs);
    //place new entities
    EntitySpawner.spawn(player, 30, combatController.getPercentArray(false));
}

function fadeToBlack(completion) {
    isFadeOut = true;
    fadeAnimationProgress = new ProgressManager(1000, completion);
    fadeAnimationProgress.isActive = true;
}

function unfadeFromBlack() {
    isFadeOut = false;
    fadeAnimationProgress = new ProgressManager(1000, function () { });
    fadeAnimationProgress.isActive = true;
}

function startFirstLevel() {
    gui.state = "playing";
    player.shouldProcessTurn = true;
    nextLevel(false);
}

function createNewCharacter(className) {
    // Post everything to server
    player.changeClass(className);

    var name = JSON.parse(sessionStorage.getItem("newCharacter"));
    sessionStorage.removeItem("newCharacter"); // Clear so that only loaded once 
    if (!name) {
        name = "Tim";
    }

    var health = player.combat.health;
    var attackBonus = player.combat.attackBonus;
    var damageBonus = player.combat.damageBonus;
    var defenseBonus = player.combat.defenseBonus;
    var weaponID = player.combat.weapon.data.id;
    var armorID = player.combat.armor.data.id;
    var classID = data.classes.find(function (x) { return x.name == className }).id;

    client.createLevel(0, "seed", function (level) {
        client.createCharacter(name, health, attackBonus, damageBonus,
            defenseBonus, weaponID, armorID, classID, function (character) {
                client.createCharacterHistory(character.id, player.score, level.id, function (history) {
                    player.db = {};
                    player.db.characterHistoryID = history.id;
                    player.db.characterID = character.id;
                    startFirstLevel();
                });
            });
    });
}

function loadFromSave(characterHistory) {
    var className = characterHistory.character.class.name;

    player.changeClass(className);
    player.loadCharacter(characterHistory);
    startFirstLevel();
}

function loadTilemap() {
    window.tilemap = new Tilemap(screenSize, 65, 65, tileset, false, {
        onload: function () {

            var characterHistory = JSON.parse(sessionStorage.getItem("character_history"));
            sessionStorage.removeItem("character_history"); // Clear so that only loaded once 
            if (characterHistory !== null) {
                loadFromSave(characterHistory);
            }

            masterLoop(performance.now());
        }
    });
}

function loadGameData() {
    var barrier = {
        count: 0,
        start: function () { this.count++; },
        stop: function () {
            this.count--;
            if (this.count == 0) this.complete();
        },
        complete: function () { loadTilemap(); }
    }

    window.data = {};

    barrier.start();
    client.listPowerups(function (powerups) {
        window.data.powerups = powerups;
        barrier.stop();
    });

    barrier.start();
    client.listArmors(function (armors) {
        window.data.armors = armors;
        barrier.stop();
    });

    barrier.start();
    client.listClasses(function (classes) {
        window.data.classes = classes;
        barrier.stop();
    });

    barrier.start();
    client.listWeapons(function (weapons) {
        window.data.weapons = weapons;
        barrier.stop();
    });
}

window.gameCleanup = function () {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('click', canvasOnClick);
    canvas.removeEventListener('contextmenu', canvasOnContextMenu);

    sfx.stop();
}

loadGameData();