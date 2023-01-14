import 'dotenv/config';
import { Client, Intents } from 'discord.js';

let client;
const ORDER_CHANNEL_ID = process.env.ORDER_CHANNEL_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

export function createOrderBot() {
    client = new Client({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MEMBERS,
        ]
    });

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.login(process.env.ORDER_CLIENT_TOKEN);
}

export async function updateUsers(userTag, orderInfo) {
    let userId = "";

    (await client.guilds.cache.get(GUILD_ID).members.fetch())
        .forEach(
            x => {
                if(x.user.username + "#" + x.user.discriminator == userTag) {
                    userId = x.id;
                }
            }
    );

    const orderName = orderInfo["Product Name"]["rich_text"][0]?.text?.content;
    const status = orderInfo["Tracking #"]?.status?.name;
    const message = `Your Order of \`${orderName}\` has been updated, the new status is \`${status}\``;

    if (!orderName || !status) {
        console.warn(`OrderBot: Order name or status were null.`);
        return;
    }

    client.channels.cache.get(ORDER_CHANNEL_ID).send(`<@${userId}> ${message}`);
}