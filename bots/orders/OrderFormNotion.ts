import { NotionClient } from "clients/NotionClient.js";
import { config } from "../../Environment.js";
import { OrderBot } from "./OrderBot.js";
import { isFullUser, isFullPage } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints.js";
import { orderFormProps } from "../../utils/NotionDatabaseConstants.js";

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
                if (!("last_edited_time" in i) || !isFullPage(i)) {
                    console.warn(`Order form checker: Received a partial response from Notion, skipping.`);
                    continue;
                }

                const pageLastEditedTime = new Date(i.last_edited_time).getTime();
                // Send a Discord message only after the first sync,
                // and only if there is a new order form entry or an order form entry has changed.
                if (!isFirstSync && (!this.idTimesMap[i.id] || pageLastEditedTime != this.idTimesMap[i.id])) {
                                    // given the required title, product name, and subtotal are not filled out, skip until next sync
                    if (!this.isCompletedSushiOrder(i)) {
                        console.warn(`Order form checker: Received a partially filled out page ${i.id}, skipping until required title, product name, and subtotal are filled out`);
                        continue;
                    }

                    const submitter = i.properties[orderFormProps.submitter];
                    if (submitter != null && submitter?.type != "people") {
                        console.warn(`Order form checker: Submitter not "people" type`);
                        continue;
                    }

                    try {
                        const submitterFirst = submitter?.people.at(0);
                        if (submitterFirst != null &&  isFullUser(submitterFirst) && submitterFirst.name != null) {
                            const rosterEntry = await this.notion.getRosterEntryFromName(submitterFirst.name);
                            this.bot.updateUsers(rosterEntry?.discordTag ?? null, i);
                        } else {
                            throw new Error("Submitter object malformed")
                        }
                    } catch (error) {
                        console.warn(`Order form checker: Could not get the name for an order.`, error);
                        this.bot.updateUsers(null, i);
                    }
                }

                this.idTimesMap[i.id] = pageLastEditedTime;
            }
        } catch (e) {
            console.warn(`Order form checker: An error occurred when checking for order form updates.`, e);
        }
    }

    private isCompletedSushiOrder(orderObject: PageObjectResponse): boolean {
        const orderProperties = orderObject.properties;

        const titleProperty = orderProperties[orderFormProps.description];
        const title = titleProperty?.type === 'title' ? titleProperty.title?.at(0)?.plain_text : null;

        const subtotalProperty = orderProperties[orderFormProps.subtotal];
        const subtotal =  subtotalProperty?.type === 'number' ? subtotalProperty.number : null;

        return title !== null && title !== orderFormProps.defaultDescription && subtotal !== null;
    }
}
