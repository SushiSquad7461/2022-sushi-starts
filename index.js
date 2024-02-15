import { config } from "./dist/Environment.js";
import createArrivalBot from "./bots/attendance/arrivebot.js";
import Attendees from "./bots/attendance/attendees.js";
import createLeaveBot from "./bots/attendance/leavebot.js";
import { OrderBot } from "./dist/bots/orders/OrderBot.js";
import OrderForm from "./dist/bots/orders/OrderFormNotion.js";
import { NotionClient } from "./dist/clients/NotionClient.js";

if (!config.tokens.arriveBotToken || !config.tokens.leaveBotToken || !config.tokens.orderBotToken) {
    console.error("The ARRIVE_CLIENT_TOKEN, LEAVE_CLIENT_TOKEN, and ORDER_CLIENT_TOKEN environment variables are required.");
    process.exit(1);
}

const notion = new NotionClient({
    auth: config.tokens.notionClientKey,
});

const attendees = new Attendees();
createArrivalBot(config.tokens.arriveBotToken, notion, attendees);
createLeaveBot(config.tokens.leaveBotToken, notion, attendees);

const orderBot = new OrderBot({ token: config.tokens.orderBotToken, name: "OrderBot" });
new OrderForm(orderBot, notion);