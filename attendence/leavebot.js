import { Client, Intents } from 'discord.js';
import { logPing } from "./notion.js";

export default function createLeaveBot(token, attendees) {
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
        if (message.mentions.has(client.user)) {
            const user = `${message.author.username}#${message.author.discriminator}`;

            console.log(`User leaving: ${user}`);

            message.reply(`Goodbye, \`${message.author.username}\`.`);

            await logPing(true, user);

            if (attendees.findAttendee(message.author.id)) {
                attendees.removeAttendee(user, message.author.id);
            }
        }
    });

    client.login(token);

    return client;
}