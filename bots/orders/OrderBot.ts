import { config } from "../../Environment.js";
import { BaseSushiBot, BaseSushiBotOptions } from "../BaseSushiBot.js";

import { APIEmbedField, Collection, EmbedBuilder, Guild, GuildMember, TextChannel, userMention } from "discord.js";
import { RequisitionObject } from "../../models/RequisitionObject.js";

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

    private getPropertyEmbed(data: RequisitionObject, prop: keyof RequisitionObject): APIEmbedField | null {
        let propertyValue; 
        switch (prop) {
            case "submitter":
            case "approver":
                propertyValue = data[prop]?.name ?? null;
                break;
            case "quantity":
            case "subtotal":
                propertyValue = data[prop].toString();
                break;
            default:
                propertyValue = data[prop];
                break;
        }

        if (!propertyValue) return null;

        let propName = prop.replace(/([A-Z])/g, ' $1');
        propName = propName.charAt(0).toUpperCase() + propName.slice(1);
        
        return {
            name: propName,
            value: propertyValue,
            inline: true,
        }
    }

    public async updateUsers(userTag: string | null, orderInfo: RequisitionObject, orderPageUrl: string): Promise<void> {
        await this.waitForLogin();

        const guildMemberId = userTag != null ?
            (await this.getMembers()).find(x => x.user.username == userTag)?.id :
            null;
        const orderName = "ORDER-" + orderInfo.orderId;
        const orderDescription = orderInfo.description;
        const requesterName = orderInfo.submitter.name?.toString() ?? "(not found)";
        const orderRequester = (guildMemberId ? userMention(guildMemberId) : userTag) ?? requesterName;
        const orderStatus = orderInfo.status.toLowerCase();

        const embed =  new EmbedBuilder()
            .setTitle(orderName)
            .setURL(orderPageUrl)
            .setDescription(orderDescription)
            .addFields(
                { name: "Requester", value: orderRequester},
                { name: "Order status", value: orderStatus },
            );

        const remainingFields: Array<keyof RequisitionObject> = ["productName", "quantity", "approver", "approverNote", "trackingLink"];

        embed.addFields(
            remainingFields.map(prop => this.getPropertyEmbed(orderInfo, prop)).filter(field => field != null) as APIEmbedField[]
        );

        this.channel.send({
            content: `${guildMemberId ? (userMention(guildMemberId) + " ") : ""}${orderName} was updated.`,
            embeds: [embed],
        });
    }
}