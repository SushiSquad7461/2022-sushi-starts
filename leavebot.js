import 'dotenv/config'
import { Client, Intents } from 'discord.js';

export default function createLeaveBot() {
    const client = new Client({ 
        intents: [
            Intents.FLAGS.GUILDS, 
            Intents.FLAGS.GUILD_MESSAGES,
        ] 
    });
    
    client.on('ready', () => {
          console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on('messageCreate', (message) => {
        if (message.mentions.has(client.user)) {
            console.log("User is leaving");
            console.log(message.author.username + ":" + message.author.discriminator);
            message.reply("Goodbye " + message.author.username);
        }
    });

    client.login(process.env.LEAVE_CLIENT_TOKEN);
}