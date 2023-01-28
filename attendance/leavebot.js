import { Client, GatewayIntentBits } from 'discord.js';

export default function createLeaveBot(token, notion, attendees) {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
        ],
    });
    
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on('messageCreate', async (message) => {
        if (message.mentions.has(client.user)) {
            const user = `${message.author.username}#${message.author.discriminator}`;

            message.reply(`Goodbye, <@${message.author.id}>.`);

            try {
                await notion.logPing(true, user);
            } catch (error) {
                console.error(`LeaveBot: Failed to log attendance for ${user}.`);
            }

            if (attendees.findAttendee(message.author.id)) {
                attendees.removeAttendee(user, message.author.id);
            }
        }
    });

    client.login(token);

    return client;
}