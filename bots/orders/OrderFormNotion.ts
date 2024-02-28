import { NotionClient } from "clients/NotionClient.js";
import { config } from "../../Environment.js";
import { OrderBot } from "./OrderBot.js";
import { isFullPage } from "@notionhq/client";
import { toRequisitionObject } from "../../models/RequisitionObject.js";
import { IncompleteRequisitionObjectError } from "../../models/errors/RequisitionObjectErrors.js";
import { OrderStatus } from "../../models/OrderStatus.js";
import { isRequisitionObjectPageResponse } from "../../models/RequisitionObjectPageResponse.js";

export default class OrderForm {
    private bot: OrderBot;
    private idTimesMap: Record<string, number>;
    private idStatusMap: Record<string, OrderStatus>;
    private initialSyncPromise: Promise<void>;
    private notion: NotionClient;

    constructor(orderBot: OrderBot, notionClient: NotionClient) {
        this.bot = orderBot;
        this.idTimesMap = {};
        this.idStatusMap = {};
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
                if (!isFullPage(i) || !isRequisitionObjectPageResponse(i)) {
                    console.warn(`Order form checker: Received a partial response from Notion, skipping.`);
                    continue;
                }
                
                const pageLastEditedTime = new Date(i.last_edited_time).getTime();
                const orderStatus = i.properties["Status"].status?.name as OrderStatus;

                if (isFirstSync) {
                    this.syncLocalCache(i, pageLastEditedTime, orderStatus);
                    continue; 
                }

                if (this.requiresSyncing(i.id, pageLastEditedTime, orderStatus)) {
                    let reqObj;
                    try {
                        reqObj = toRequisitionObject(i);
                    } catch (error) {
                        if (error instanceof TypeError) {
                            console.warn(`Skipping order form entry ${i.id}: Not a valid RequisitionObject candidate.`, error);
                        } else if (error instanceof IncompleteRequisitionObjectError) {
                            console.warn(`Skipping order form entry ${i.id}: Order missing required fields; will be reprocessed once filled out.`, error);
                        }
                        this.syncLocalCache(i, pageLastEditedTime, orderStatus);
                        continue;
                    }

                    // Send a Discord message only after the first sync, if the order form has not been synced yet, or has been updated since the last check          
                    try {
                        if (reqObj.submitter.name === null) {
                            throw new Error("Submitter name is null");
                        }
                        const rosterEntry = await this.notion.getRosterEntryFromName(reqObj.submitter.name);
                        this.bot.updateUsers(rosterEntry?.discordTag ?? null, reqObj, i.url);

                    } catch (error) {
                        console.warn(`Order form checker: Could not get the name for an order. Updating users without tagging.`, error);
                        this.bot.updateUsers(null, reqObj, i.url);
                    }
                }
                // Update local cache with last update and status states
                this.syncLocalCache(i, pageLastEditedTime, orderStatus);
            }
        } catch (e) {
            console.warn(`Order form checker: An error occurred when checking for order form updates.`, e);
        }
    }

    private requiresSyncing(id:string, lastEditTime: number, status: OrderStatus): boolean {
        // If order has in status NEW, it has not been submitted yet, so we skip syncing
        if (status == OrderStatus.NEW) {
            console.log(`Order ${id} is NEW and has not been submitted yet, skipping.`);
            return false; 
        }
        
        // If the order has not been synced yet, or the status has been updated since the last check, we need to sync it
        return !this.idTimesMap[id] || !this.idStatusMap[id] || (lastEditTime != this.idTimesMap[id] && status != this.idStatusMap[id]);
    }
    
    private syncLocalCache(i: any, pageLastEditedTime: number, orderStatus: OrderStatus) {
        this.idTimesMap[i.id] = pageLastEditedTime;
        this.idStatusMap[i.id] = orderStatus;
    }
}
