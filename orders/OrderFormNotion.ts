import { Client } from "@notionhq/client"
import { RichTextPropertyValue, TitlePropertyValue } from "@notionhq/client/build/src/api-types";
import { config } from "../Environment.js";
import { OrderBot } from "./OrderBot";

export default class OrderForm {
    private bot: OrderBot;
    private idTimesMap: Record<string, number>;
    private initialSyncPromise: Promise<void>;
    private notion: Client;

    constructor(orderBot: OrderBot) {
        this.bot = orderBot;
        this.idTimesMap = {};
        this.notion = new Client({ auth: config.tokens.notionClientKey });

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
            const orders = await this.notion.databases.query({
                database_id: config.notion.orderFormDatabaseId,
            });

            for (let i of orders.results) {
                const pageLastEditedTime = new Date(i.last_edited_time).getTime();

                // Send a Discord message only after the first sync,
                // and only if there is a new order form entry or an order form entry has changed.
                if (!isFirstSync && (!this.idTimesMap[i.id] || pageLastEditedTime != this.idTimesMap[i.id])) {
                    const nameProperty = i.properties.Name as TitlePropertyValue | undefined;
                    const nameFromNotion = nameProperty?.title[0]?.plain_text;

                    if (!nameFromNotion) {
                        console.warn(`Order form checker: Could not get the name of an order form entry. ID: ${i.id}`);
                    } else {
                        const name = await this.getDiscordTagBasedOnName(nameFromNotion);
                        this.bot.updateUsers(name, i.properties);
                    }
                }

                this.idTimesMap[i.id] = pageLastEditedTime;
            }
        } catch (e) {
            console.warn(`Order form checker: An error occurred when checking for order form updates.`, e);
        }
    }

    private async getDiscordTagBasedOnName(name: string) {
        try {
            const response = await this.notion.databases.query({
                database_id: config.notion.rosterDatabaseId,
                filter: {
                    "property": 'Name',
                    "text": {
                        "contains": name,
                    }
                },
            });

            if (response.results.length === 0) {
                console.warn(`Order form checker: Could not find a roster entry for name "${name}".`);
                return null;
            }

            const userRosterPageId = response.results[0]?.id;
        
            if (userRosterPageId != null) {
                const userRosterEntry = await this.notion.pages.retrieve({ page_id: userRosterPageId });
                const userDiscordTag = userRosterEntry.properties["Discord Tag"] as RichTextPropertyValue | undefined;
                return userDiscordTag?.rich_text[0]?.plain_text ?? null;
            }
        } catch (e) {
            console.warn(`Order form checker: Caught an error trying to find Discord tag for name "${name}".`, e);
        }

        return null;
    }
}
