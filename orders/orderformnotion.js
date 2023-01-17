import { Client } from "@notionhq/client"
import { config } from "../dist/Environment.js";

const NOTION = new Client({ auth: config.tokens.notionClientKey });

export default class OrderForm {
    constructor(orderBot) {
        this.bot = orderBot;
        this.idTimesMap = {}; // Record<string, number>

        this.initialSyncPromise = this.syncOrderForm(true);

        this.syncPeriodic();
    }

    async syncPeriodic() {
        await this.initialSyncPromise;

        const startTime = new Date().getTime();
        await this.syncOrderForm(false);
        const endTime = new Date().getTime();

        const elapsed = endTime - startTime;

        this.timeout = setTimeout(this.syncPeriodic.bind(this), config.notion.orderFormPollInterval - elapsed);
    }

    async syncOrderForm(isFirstSync) {
        try {
            const orders = await NOTION.databases.query({
                database_id: config.notion.orderFormDatabaseId,
            });

            for (let i of orders.results) {
                const pageLastEditedTime = new Date(i.last_edited_time).getTime();

                // Send a Discord message only after the first sync,
                // and only if there is a new order form entry or an order form entry has changed.
                if (!isFirstSync && (!this.idTimesMap[i.id] || pageLastEditedTime != this.idTimesMap[i.id])) {
                    const nameFromNotion = i.properties.Name.title[0]?.text?.content;

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

    async getDiscordTagBasedOnName(name) {
        try {
            const response = await NOTION.databases.query({
                database_id: config.notion.rosterDatabaseId,
                filter: {
                    "property": 'Name',
                    "text": {
                        "contains": name,
                    }
                },
            });

            if (!response.results?.length) {
                console.warn(`Order form checker: Could not find a roster entry for name "${name}".`);
                return null;
            }

            const userRosterPageId = response.results[0].id;
        
            if (userRosterPageId) {
                const userinfo = await NOTION.pages.retrieve({ page_id: userRosterPageId });
                return userinfo.properties["Discord Tag"].rich_text[0]?.text?.content ?? null;
            }
        } catch (e) {
            console.warn(`Order form checker: Caught an error trying to find Discord tag for name "${name}".`, e);
        }

        return null;
    }
}
