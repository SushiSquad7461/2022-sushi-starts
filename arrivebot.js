import 'dotenv/config';
import { Client, Intents } from 'discord.js';
import { markPresent, getAttendees, logPing} from "./notion.js";
let client;
let guild;

export default function createArrivalBot(curr_attendees) {
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
        if (message.mentions.has(client.user)) {
            console.log("User is arriving");
            console.log(message.author.username + "#" + message.author.discriminator);

            let DATE = new Date(message.createdTimestamp);

            message.reply("Welcome " + message.author.username);
            await markPresent(message.author.username + "#" + message.author.discriminator, DATE);

            let ping = "";
            for (let i of curr_attendees.attendees_id) {
                ping += `<@${i}> `
            }

            if (ping === "") {
                ping = "No current attendees";
            }

            message.reply(ping);

            if (!curr_attendees.findAttendee(message.author.id)) {
                await logPing(false, message.author.username + "#" + message.author.discriminator);
                curr_attendees.addAttendee(message.author.username + "#" + message.author.discriminator, message.author.id);
            }
        }
    });

    client.login(process.env.ARRIVE_CLIENT_TOKEN);
}