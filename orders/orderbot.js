import 'dotenv/config';
import { Client, Intents } from 'discord.js';

let client;
const ORDER_CHANNEL_ID = process.env.ORDER_CHANNEL_ID;

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

    client.on('messageCreate', async (message) => {
        if (message.mentions.has(client.user) && message.author !== client.user) {
         message.reply(`Welcome dez nutz, \`${message.author.username}\`.`);
        }
    });

    client.login(process.env.ORDER_CLIENT_TOKEN);
}

export async function updateUsers(userTag, orderInfo) {
    let userId = "";
    (await client.guilds.cache.get("584610536671543309").members.fetch()).forEach(x => {
        if(x.user.username + "#" + x.user.discriminator == userTag) {
            userId = x.id;
        }
    }
    );

    console.log(orderInfo);

    const orderName = orderInfo["Product Name"]["rich_text"][0].text.content;
    const status = orderInfo["Tracking #"].status.name;

    let message = `Your Order of \`${orderName}\` has been updated, the new status is \`${status}\``;

    client.channels.cache.get(ORDER_CHANNEL_ID).send(`<@${userId}> ${message}`);
}