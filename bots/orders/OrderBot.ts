import { config } from "../../Environment.js";
import { BaseSushiBot, BaseSushiBotOptions } from "../BaseSushiBot.js";

import { APIEmbedField, Collection, EmbedBuilder, Guild, GuildMember, TextChannel, userMention } from "discord.js";
import { orderFormProps } from "../../utils/NotionDatabaseConstants.js";

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
        let propertyValue;
        
        switch (data[propertyName]["type"]) {
            case 'rich_text':
                propertyValue = this.getTextPropertyValue(data, propertyName);
                break;
            case 'number':
                propertyValue = data[propertyName]["number"]?.toString() ?? null;
                break;
            case 'url':
                propertyValue = data[propertyName]["url"] ?? null;
                break;
            case 'people':
                propertyValue = data[propertyName]["people"][0]?.name ?? null;
                break;
            default:
                propertyValue = null;
                break;
        }

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
            (await this.getMembers()).find(x => x.user.username == userTag) :
            null;
        const userId = guildMember?.id;

        const orderProperties = orderInfo["properties"];
        const orderName = "ORDER-" + orderProperties[orderFormProps.id]["unique_id"]["number"];
        const orderDescription = orderProperties[orderFormProps.description]["title"][0]["plain_text"] ?? "(not found)";
        const orderRequestorRaw = orderProperties[orderFormProps.submitter]["people"][0]["name"] ?? "(not found)";
        const status = orderProperties[orderFormProps.status]["status"]["name"];
        const orderPageUrl = orderInfo["url"];

        if (!orderName || !orderDescription || !status) {
            console.warn(`OrderBot: Order name or status were null.`);
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(orderName)
            .setURL(orderPageUrl)
            .setDescription(orderDescription)
            .addFields(
                { name: "Requester", value: (userId ? userMention(userId) : userTag) ?? orderRequestorRaw },
                { name: "Order status", value: status },
            );

        embed.addFields(
            [orderFormProps.productName, orderFormProps.quantity, orderFormProps.trackingLink, orderFormProps.approver, orderFormProps.approverNote]
                .map(prop => this.getPropertyEmbed(orderProperties, prop))
                .filter(field => field != null) as APIEmbedField[]);

        this.channel.send({
            content: `${userId ? (userMention(userId) + " ") : ""}${orderName} was updated.`,
            embeds: [embed],
        });
    }
}