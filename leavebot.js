import 'dotenv/config'
import { Client, Intents } from 'discord.js';
import { markPresent, getAttendees, logPing} from "./notion.js";

export default function createLeaveBot(curr_attendees) {
    const client = new Client({ 
        intents: [
            Intents.FLAGS.GUILDS, 
            Intents.FLAGS.GUILD_MESSAGES,
        ] 
    });
    
    client.on('ready', () => {
          console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on('messageCreate', async message => {
        if (message.mentions.has(client.user)) {
            console.log("User is leaving");
            console.log(message.author.username + ":" + message.author.discriminator);
            message.reply("Goodbye " + message.author.username);

            if (curr_attendees.findAttendee(message.author.id)) {
                await logPing(true, message.author.username + "#" + message.author.discriminator);
                curr_attendees.removeAttendee(message.author.username + "#" + message.author.discriminator, message.author.id);
            }
        }
    });

    client.login(process.env.LEAVE_CLIENT_TOKEN);
}