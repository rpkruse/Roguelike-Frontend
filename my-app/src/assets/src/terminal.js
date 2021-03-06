"use strict";

window.colors = {
    cmd: "Yellow",
    cmdResponse: "LawnGreen",
    invalid: "Red",
    combat: "Orchid",
    pickup: "SkyBlue",
    chat: "Pink"
}

const MAX_MSG_COUNT = 62;
const MAX_MSG_LENGTH = 64;

module.exports = exports = Terminal;

function Terminal() {
    this.delta = 0;
    this.messages = [];
    this.chat = [];
    this.startPos = { x: 1063, y: 1095 };
    this.active = false;
    this.input = "";
    this.commands = {};

    this.addCommand("help", "Print out all available commands", this.helpCommand.bind(this), false);
    this.addCommand("message", "Send a message to another user", this.sendMessage.bind(this), true);
    this.addCommand("m", "Send a message to another user", this.sendMessage.bind(this), true);
    this.addCommand("reply", "Reply to the last user that messaged you", this.reply.bind(this), true);
    this.addCommand("r", "Reply to the last user that messaged you", this.reply.bind(this), true);
    this.addCommand("clear", "Clear the terminal", this.clear.bind(this));
	  this.addCommand("instructions", "Displays the instruction to play the game", this.instructions.bind(this));
}

Terminal.prototype.log = function (message, color) {
    if (typeof color == 'undefined') color = 'white';
    splitMessage(message, this.messages, color);
    if (this.messages.length > MAX_MSG_COUNT) {
        this.messages.pop();
    }
    if (window.debug) console.log(message);
}

Terminal.prototype.clear = function () {
    this.messages = [];
}

Terminal.prototype.sendMessage = function(args) {
    var self = this;
    if(!(args.length > 2)) this.log("Syntax: message|m <username> <message>", window.colors.invalid)
    else {
        var recipient = args[1]
        args = args.slice(2)
        var message = args.join(' ')
        client.sendMessage(message, recipient, (json) => {
            if(json != null) {
                self.log(`You: ${json.content}`, window.colors.chat)
            } else {
                self.log('You are not friends with that user', window.colors.invalid)
            }
        })
    }
}

Terminal.prototype.reply = function(args) {
    var self = this;
    if(args.length == 1) this.log("Syntax: reply|r <message>", window.colors.invalid)
    else {
        if(this.chat.length == 0) this.log(`You have no messages to reply to`, window.colors.invalid)
        else {
            var recipient = this.chat[this.chat.length - 1].display_name
            args.shift()
            var message = args.join(' ')
            client.sendMessage(message, recipient, (json) => {
                if(json != null) {
                    self.log(`You: ${json.content}`, window.colors.chat)
                } else {
                    self.log(`You are not friends with that user`, window.colors.invalid)
                }
            })
        }
    }
}

Terminal.prototype.update = function (time) {
    this.delta += time;
    if(this.delta > 1000) {
        this.delta = 0;
        client.updateMessages((json) => {
            if(json != null) {
                json.forEach((message) => {
                    if(!(message in this.chat)) {
                        this.chat.push(message)
                        this.log(`${message.display_name}: ${message.content}`, window.colors.chat)
                    }
                })
            }
        })
    }
}

Terminal.prototype.instructions = function () {
	this.log("Use WASD or the Arrow Keys to move your player");
	this.log("Click on an enemy to attack them");
	this.log("For the most part, you cannot attack through walls");
	this.log("Attack range is based on class. Knight is 1, Archer is 4 and Mage is anything you can see");
	this.log("To advance to the next level, find the door");
	this.log("Health is displayed in the bottom left corner, followed by your armor level and name, then your weapon level, name, and properties");
	this.log("To toggle the volume, you can hit v on the keyboard");
	this.log("To activate the terminal, type /");
	this.log("For further information about the terminal, type help");
	this.log("A command will appear in this color", window.colors.cmd);
	this.log("A response to a command will appear in this color", window.colors.cmdResponse);
	this.log("Invalid command input will appear in this color", window.colors.invalid);
	this.log("Combat information will appear in this color", window.colors.combat);
	this.log("Any loot you pick up will appear in this color", window.colors.pickup);
  this.log("Any chat messages will appear in this color", window.colors.chat);
}

Terminal.prototype.render = function (elapsedTime, ctx) {
    ctx.font = "15px Courier New";
    var self = this;
    this.messages.forEach(function (message, i) {
        ctx.fillStyle = message.color;
        ctx.fillText(message.text, self.startPos.x, self.startPos.y - 18 * i);
    });

    ctx.fillStyle = "white";
    ctx.fillText(">", 1063, 1111);

    if (this.active) {
        ctx.fillStyle = "white";
        ctx.fillText(this.input, 1078, 1111)
    } else {
        ctx.fillStyle = "#d3d3d3";
        ctx.fillText("Press / to type", 1078, 1111);
    }
}

Terminal.prototype.onkeydown = function (event) {
    switch (event.key) {
        case "/":
            event.preventDefault();
            this.active = true;
            break;
        case "Enter":
            event.preventDefault();
            if (!this.active) return;
            this.processInput();
            this.input = "";
            this.active = false;
            break;
        case "Backspace":
            event.preventDefault();
            this.input = this.input.substr(0, this.input.length - 1);
            break;
        case "Escape":
            event.preventDefault();
            this.input = "";
            this.active = false;
        case " ":
            event.preventDefault();
        default:
            if (event.key.length > 1) return;
            if (this.active && this.input.length < MAX_MSG_LENGTH) this.input = this.input.concat(event.key)
    }

    return this.active;
}

// Callback should accept a string and return true if it handles the Command
// else it should return false
Terminal.prototype.addCommand = function (command, description, callback, hideConfirm) {
    this.commands[command] = { command: command, description: description, callback: callback, hideConfirm: hideConfirm };
}

Terminal.prototype.removeCommand = function (command) {
    if (command in this.commands) {
        delete this.commands[command];
    }
}

Terminal.prototype.helpCommand = function () {
    var self = this;
    Object.keys(self.commands).forEach(function (command) {
        var c = self.commands[command];
        self.log(c.command + " " + c.description, window.colors.cmdResponse);
    });
}

Terminal.prototype.processInput = function () {
    var args = this.input.split(' ');
    if (!this.commands[args[0]].hideConfirm) this.log(args[0], window.colors.cmd);

    if (args[0] in this.commands) {
        this.commands[args[0]].callback(args);
        return;
    }

    this.log("Command not found", window.colors.invalid);
}

function splitMessage(message, messages, color) {
    if (message.length < MAX_MSG_LENGTH) {
        messages.unshift({ text: message, color: color });
    }
    else {
        var index = MAX_MSG_LENGTH;
        for (var i = 0; i < MAX_MSG_LENGTH; i++) {
            if (message.charAt(i) == ' ') index = i + 1;
        }
        messages.unshift({ text: message.slice(0, index), color: color });
        splitMessage(message.slice(index, message.length), messages, color);
    }
}
