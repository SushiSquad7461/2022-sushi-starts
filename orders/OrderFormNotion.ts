import { TitlePropertyValue } from "@notionhq/client/build/src/api-types";
import { NotionClient } from "NotionClient.js";
import { config } from "../Environment.js";
import { OrderBot } from "./OrderBot";

export default class OrderForm {
    private bot: OrderBot;
    private idTimesMap: Record<string, number>;
    private initialSyncPromise: Promise<void>;
    private notion: NotionClient;

    constructor(orderBot: OrderBot, notionClient: NotionClient) {
        this.bot = orderBot;
        this.idTimesMap = {};
        this.notion = notionClient;

        this.initialSyncPromise = this.syncOrderForm(true);
        this.syncPeriodic();
    }

    private async syncPeriodic(): Promise<void> {
        await this.initialSyncPromise;

        const startTime = new Date().getTime();
        await this.syncOrderForm(false);
        const endTime = new Date().getTime();

        const elapsed = endTime - startTime;

        setTimeout(this.syncPeriodic.bind(this), config.notion.orderFormPollInterval - elapsed);
    }

    private async syncOrderForm(isFirstSync: boolean) {
        try {
            const orders = await this.notion.queryDatabase({
                database_id: config.notion.orderFormDatabaseId,
            });

            for (let i of orders.results) {
                const pageLastEditedTime = new Date(i.last_edited_time).getTime();

                // Send a Discord message only after the first sync,
                // and only if there is a new order form entry or an order form entry has changed.
                if (!isFirstSync && (!this.idTimesMap[i.id] || pageLastEditedTime != this.idTimesMap[i.id])) {
                    const nameProperty = i.properties.Name as TitlePropertyValue | undefined;
                    const nameFromNotion = nameProperty?.title[0]?.plain_text;
                    const nameFromRoster = nameFromNotion ? (await this.notion.getRosterEntryFromName(nameFromNotion)).discordTag : null;

                    if (!nameFromNotion || !nameFromRoster) {
                        console.warn(`Order form checker: Could not get the name of an order form entry. ID: ${i.id}`);
                    } else {
                        this.bot.updateUsers(nameFromRoster, i.properties);
                    }
                }

                this.idTimesMap[i.id] = pageLastEditedTime;
            }
        } catch (e) {
            console.warn(`Order form checker: An error occurred when checking for order form updates.`, e);
        }
    }
}
