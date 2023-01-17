import { config } from "./dist/Environment.js";
import createArrivalBot from "./attendance/arrivebot.js";
import Attendees from "./attendance/attendees.js";
import createLeaveBot from "./attendance/leavebot.js";
import { OrderBot } from "./dist/orders/OrderBot.js";
import OrderForm from "./dist/orders/OrderFormNotion.js";

if (!config.tokens.arriveBotToken || !config.tokens.leaveBotToken || !config.tokens.orderBotToken) {
    console.error("The ARRIVE_CLIENT_TOKEN, LEAVE_CLIENT_TOKEN, and ORDER_CLIENT_TOKEN environment variables are required.");
    process.exit(1);
}

const attendees = new Attendees();
createArrivalBot(config.tokens.arriveBotToken, attendees);
createLeaveBot(config.tokens.leaveBotToken, attendees);

const orderBot = new OrderBot({ token: config.tokens.orderBotToken, name: "OrderBot" });
new OrderForm(orderBot);