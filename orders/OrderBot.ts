import { config } from "../Environment.js";
import { BaseSushiBot, BaseSushiBotOptions } from "../BaseSushiBot.js";

import { APIEmbedField, Collection, EmbedBuilder, Guild, GuildMember, TextChannel, userMention } from "discord.js";

export class OrderBot extends BaseSushiBot {
    private members: Collection<string, GuildMember>;
    private membersFetchTime: number;

    constructor(options: BaseSushiBotOptions) {
        super(options);
    }

    private get guild(): Guild {
        const guild = this.client.guilds.cache.get(config.discord.guildId);

        if (!guild) throw new Error(`Could not fetch guild ${config.discord.guildId}`);

        return guild;
    }

    private get channel(): TextChannel {
        const channel = this.client.channels.cache.get(config.discord.orderChannelId);

        if (!channel) throw new Error(`Could not fetch channel ${config.discord.orderChannelId}`);

        return channel as TextChannel;
    }

    async getMembers() {
        const currentTime = new Date().getTime();
        if (!this.members || !this.membersFetchTime || currentTime - this.membersFetchTime > 60000) {
            this.members = await this.guild.members.fetch();
            this.membersFetchTime = currentTime;
        }

        return this.members;
    }

    private getTextPropertyValue(data: any, propertyName: string): string | null {
        return data[propertyName]["rich_text"][0]?.text?.content ?? null;
    }

    private getPropertyEmbed(data: any, propertyName: string): APIEmbedField | null {
        const propertyValue = this.getTextPropertyValue(data, propertyName);

        if (!propertyValue) return null;

        return {
            name: propertyName,
            value: propertyValue,
            inline: true,
        };
    }

    public async updateUsers(userTag: string | null, orderInfo: any): Promise<void> {
        await this.waitForLogin();

        const guildMember = userTag != null ?
            (await this.getMembers()).find(x => x.user.username + "#" + x.user.discriminator == userTag) :
            null;

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
                .filter(field => field != null) as APIEmbedField[]);

        this.channel.send({
            content: `${userId ? (userMention(userId) + " ") : ""}Order "${orderName}" was updated.`,
            embeds: [embed],
        });
    }
}