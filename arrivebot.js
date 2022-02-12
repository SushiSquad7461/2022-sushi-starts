import 'dotenv/config';
import { Client, Intents } from 'discord.js';

let client;

export default function createArrivalBot() {
    client = new Client({ 
        intents: [
            Intents.FLAGS.GUILDS, 
            Intents.FLAGS.GUILD_MESSAGES,
        ] 
    });
    
    client.on('ready', () => {
          console.log(`Logged in as ${client.user.tag}!`);
    });
    
    client.on('interactionCreate', async interaction => {
        try {
            console.log(interaction);
            console.log("ur mom");
            console.log("Hello: " + interaction.member);
        } catch(e) {
            console.log(e);
        }
        if (!interaction.isCommand()) return;

        if (interaction.commandName === 'ping') {
            await interaction.reply('Pong!');
        }
    });

    client.on('messageCreate', (message) => {
        if (message.mentions.has(client.user)) {
            console.log("User is arriving");
            console.log(message.author.username + ":" + message.author.discriminator);
            message.reply("Welcome " + message.author.username);
            // console.log(client.users.find(u => {console.log(u.username)}));
            // message.reply(`<@${client.users.cache.find(u => u.username === "holeintheozone:6110").id}>`);
        }
    });

    client.login(process.env.ARRIVE_CLIENT_TOKEN);
}