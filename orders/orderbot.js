import 'dotenv/config';
import { Client, Intents } from 'discord.js';

let client;

export default function createOrderBot() {
    client = new Client({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES
        ]
    });

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on('messageCreate', async (message) => {
        if (message.mentions.has(client.user) && message.author !== client.user) {
         message.reply(`Welcome dez nutz, \`${message.author.username}\`.`);
        }
    });

    client.login(process.env.ORDER_CLIENT_TOKEN);
}