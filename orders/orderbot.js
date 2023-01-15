import { config } from "../dist/Environment.js";
import { BaseSushiBot } from "../dist/BaseSushiBot.js";

export class OrderBot extends BaseSushiBot {
    constructor(options) {
        super(options);
    }

    async updateUsers(userTag, orderInfo) {
        await this.waitForLogin();

        let userId = "";

        (await this.client.guilds.cache.get(config.discord.guildId).members.fetch())
            .forEach(
                x => {
                    if (x.user.username + "#" + x.user.discriminator == userTag) {
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

        this.client.channels.cache.get(config.discord.orderChannelId).send(`<@${userId}> ${message}`);
    }
}