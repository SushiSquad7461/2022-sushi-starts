import "dotenv/config";
import createArrivalBot from "./attendance/arrivebot.js";
import Attendees from "./attendance/attendees.js";
import createLeaveBot from "./attendance/leavebot.js";
import { createOrderBot } from "./orders/orderbot.js";
import OrderForm from "./orders/orderformnotion.js";

const arrivalToken = process.env.ARRIVE_CLIENT_TOKEN;
const leaveToken = process.env.LEAVE_CLIENT_TOKEN;

if (!arrivalToken || !leaveToken) {
    console.error("The ARRIVE_CLIENT_TOKEN and LEAVE_CLIENT_TOKEN environment variables are required.");
    process.exit(1);
}

const attendees = new Attendees();
createArrivalBot(arrivalToken, attendees);
createLeaveBot(leaveToken, attendees);

new OrderForm();
createOrderBot();