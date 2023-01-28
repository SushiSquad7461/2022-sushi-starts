import "dotenv/config";
import configFromJson from "./config.json" assert { type: "json" };

export const config = {
    discord: {
        ...configFromJson.discord,
        loggerWebhookUrl: process.env.LOGGER_WEBHOOK_URL,
    },
    notion: {
        ...configFromJson.notion,
        orderFormPollInterval: 15000,
    },
    tokens: {
        arriveBotToken: process.env.ARRIVE_CLIENT_TOKEN,
        leaveBotToken: process.env.LEAVE_CLIENT_TOKEN,
        notionClientKey: process.env.NOTION_KEY,
        orderBotToken: process.env.ORDER_CLIENT_TOKEN,
    },
};