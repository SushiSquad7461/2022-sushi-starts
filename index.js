import { config } from "./dist/Environment.js";
import createArrivalBot from "./attendance/arrivebot.js";
import Attendees from "./attendance/attendees.js";
import createLeaveBot from "./attendance/leavebot.js";
import { OrderBot } from "./dist/orders/OrderBot.js";
import OrderForm from "./dist/orders/OrderFormNotion.js";
import { DiscordErrorLogger } from "./dist/DiscordErrorLogger.js";

if (!config.tokens.arriveBotToken || !config.tokens.leaveBotToken || !config.tokens.orderBotToken || !config.discord.loggerWebhookUrl) {
    console.error("Missing environment variables.");
    process.exit(1);
}

const logger = new DiscordErrorLogger(config.discord.loggerWebhookUrl);

// const attendees = new Attendees();
// createArrivalBot(config.tokens.arriveBotToken, attendees);
// createLeaveBot(config.tokens.leaveBotToken, attendees);

const orderBot = new OrderBot({
    token: config.tokens.orderBotToken,
    name: "OrderBot",
    logger,
});

const orderFormChecker = new OrderForm(orderBot, logger);