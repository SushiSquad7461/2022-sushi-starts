"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const notion_1 = require("./notion");
function createLeaveBot(curr_attendees) {
    const client = new discord_js_1.Client({
        intents: [
            discord_js_1.Intents.FLAGS.GUILDS,
            discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
        ]
    });
    client.on('ready', () => {
        console.log(`Logged in as ${client.user?.tag}!`);
    });
    client.on('messageCreate', async (message) => {
        if (client.user && message.mentions.has(client.user)) {
            console.log("User is leaving");
            console.log(message.author.username + ":" + message.author.discriminator);
            message.reply("Goodbye " + message.author.username);
            await (0, notion_1.logPing)(true, message.author.username + "#" + message.author.discriminator);
            if (curr_attendees.findAttendee(message.author.id)) {
                curr_attendees.removeAttendee(message.author.username + "#" + message.author.discriminator, message.author.id);
            }
        }
    });
    client.login(process.env.LEAVE_CLIENT_TOKEN);
}
exports.default = createLeaveBot;
//# sourceMappingURL=leavebot.js.map