import { Client } from "@notionhq/client"
import "dotenv/config";
import { updateUsers } from "./orderbot.js";

const ORDERFORMID = process.env.ORDER_FORM_DATABASE_ID;
const ROSTERID = process.env.ROSTER_ID;
const NOTION = new Client({ auth: process.env.NOTION_KEY });

export default class OrderForm {
    constructor() {
        this.idTimesMap = {};
        setInterval(() => this.checkForOrderFormUpdate(this), 3000);
        this.initTimes();
    }

    async initTimes() {
        const orders = await NOTION.databases.query({
            database_id: ORDERFORMID,
        }); 
        this.setTimes(orders); 
    }

    async setTimes(orders) {
        for (let i of orders.results) {
            this.idTimesMap[i.id] = i.last_edited_time;
        }
    }

    async checkForOrderFormUpdate() {
        try {
            const orders = await NOTION.databases.query({
                database_id: ORDERFORMID,
            });

            for (let i of orders.results) {
                if (this.idTimesMap[i.id] == undefined || new Date(i.last_edited_time).getTime() != new Date(this.idTimesMap[i.id]).getTime()) {
                    let name = await this.getDiscordTagBasedOnName(i.properties.Name.title[0].text.content);
                    updateUsers(name, i.properties);
                }
            }

            this.setTimes(orders);
        } catch (e) {
            console.warn(`An error occurred when checking for order form updates.`, e);
        }
    }

    async getDiscordTagBasedOnName(name) {
        let pageId;
        try {
            const response = await NOTION.databases.query({
              database_id: ROSTERID,
              filter: {
                    "property": 'Name',
                    "text": {
                      "contains": name,
                    }
                  },
            });
            pageId = response.results[0].id;
        } catch(error) {
            console.error(error.body);
        } 
        
        if (pageId != null) {
            const userinfo = await NOTION.pages.retrieve({page_id: pageId});
            return userinfo.properties["Discord Tag"].rich_text[0].text.content;
        } else {
            return null;
        }
    }
}
