import { config } from "../Environment.js";
import { Client, Intents } from 'discord.js';

let client;

export function createOrderBot(token) {
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

    client.login(token);
}

export async function updateUsers(userTag, orderInfo) {
    let userId = "";

    (await client.guilds.cache.get(config.discord.guildId).members.fetch())
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

    client.channels.cache.get(config.discord.orderChannelId).send(`<@${userId}> ${message}`);
}