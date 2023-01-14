import { Client, Intents } from 'discord.js';
import { markPresent, logPing } from "./notion.js";

export default function createArrivalBot(token, attendees) {
    const client = new Client({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
        ],
    });

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on('messageCreate', async (message) => {
        if (message.mentions.has(client.user) && message.author !== client.user) {
            const user = `${message.author.username}#${message.author.discriminator}`;
            const date = new Date(message.createdTimestamp);

            let ping = attendees.attendees_id.map(id => `<@${id}>`).join(" ");

            console.log(`User arriving: ${user}`);
            await markPresent(message.author.username + "#" + message.author.discriminator, date);

            if (ping === "") {
                ping = `Welcome, <@${message.author.id}>. There is no one here yet.`;
            } else {
                const messageContentWithoutPing = message.content.replace(`<@${client.user.id}>`, "").trim();

                // keep message content first so people see that first on their phone notifications
                ping = `${messageContentWithoutPing} ${ping}`;
            }

            if (message.content.includes("door") || message.content.includes("inner")) {
                message.reply(ping);
            } else {
                message.reply(`Welcome, <@${message.author.id}>. If you need to be let in, please specify which door you're at.`);
            }

            if (!attendees.findAttendee(message.author.id)) {
                await logPing(false, user);
                attendees.addAttendee(user, message.author.id);
            }
        }
    });

    client.login(token);

    return client;
}