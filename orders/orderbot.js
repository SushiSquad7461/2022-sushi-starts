import { config } from "../dist/Environment.js";
import { BaseSushiBot } from "../dist/BaseSushiBot.js";

import { EmbedBuilder, userMention } from "discord.js";

export class OrderBot extends BaseSushiBot {
    constructor(options) {
        super(options);
    }

    get guild() {
        return this.client.guilds.cache.get(config.discord.guildId);
    }

    get channel() {
        return this.client.channels.cache.get(config.discord.orderChannelId);
    }

    async getMembers() {
        const currentTime = new Date().getTime();
        if (!this.members || !this.membersFetchTime || currentTime - this.membersFetchTime > 60000) {
            this.members = await this.guild.members.fetch();
            this.membersFetchTime = currentTime;
        }

        return this.members;
    }

    getTextPropertyValue(data, propertyName) {
        return data[propertyName]["rich_text"][0]?.text?.content ?? null;
    }

    getPropertyEmbed(data, propertyName) {
        const propertyValue = this.getTextPropertyValue(data, propertyName);

        if (!propertyValue) return null;

        return {
            name: propertyName,
            value: propertyValue,
            inline: true,
        };
    }

    async updateUsers(userTag, orderInfo) {
        await this.waitForLogin();

        const guildMember = (await this.getMembers()).find(x => x.user.username + "#" + x.user.discriminator == userTag);
        const userId = guildMember?.id;

        const orderRequestorRaw = orderInfo.Name.title[0]?.text?.content ?? "(not found)";
        const orderName = this.getTextPropertyValue(orderInfo, "Product Name");
        const orderDescription = this.getTextPropertyValue(orderInfo, "Description");

        const status = orderInfo["Tracking #"]?.status?.name;

        if (!orderName || !status) {
            console.warn(`OrderBot: Order name or status were null.`);
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(orderName)
            .setDescription(orderDescription)
            .addFields(
                { name: "Requester", value: (userId ? userMention(userId) : userTag) ?? orderRequestorRaw },
                { name: "Order status", value: status },
            );

        embed.addFields(
            ["Approver's note", "Order Tracking Link"]
                .map(prop => this.getPropertyEmbed(orderInfo, prop))
                .filter(field => field != null));

        this.channel.send({
            content: `${userId ? (userMention(userId) + " ") : ""}Order "${orderName}" was updated.`,
            embeds: [embed],
        });
    }
}