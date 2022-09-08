import 'dotenv/config';
import { Client, Intents } from 'discord.js';
import { markPresent, getAttendees, logPing} from "./notion.js";
let client;
let guild;

export default function createArrivalBot(curAttendees) {
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
        if (message.mentions.has(client.user) && message.author !== client.user && message.author.username === "KTOmega") {
            const user = `${message.author.username}#${message.author.discriminator}`;
            const date = new Date(message.createdTimestamp);

            let ping = curAttendees.attendees_id.map(id => `<@${id}>`).join(" ");

            console.log(`User arriving: ${user}`);
            await markPresent(message.author.username + "#" + message.author.discriminator, date);

            if (ping === "") {
                ping = `Welcome, \`${message.author.username}\`. There is no one here yet.`;
            } else {
                const messageContentWithoutPing = message.content.replace(`<@${client.user.id}>`, "").trim();

                // keep message content first so people see that first on their phone notifications
                ping = `${messageContentWithoutPing} ${ping}`;
            }

            if (message.content.includes("door") || message.content.includes("inner")) {
                message.reply(ping);
            } else {
                message.reply(`Welcome, \`${message.author.username}\`. If you need to be let in, please specify which door you're at.`);
            }

            if (!curAttendees.findAttendee(message.author.id)) {
                await logPing(false, user);
                curAttendees.addAttendee(user, message.author.id);
            }
        }
    });

    client.login(process.env.ARRIVE_CLIENT_TOKEN);
}