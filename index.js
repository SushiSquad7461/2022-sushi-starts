import createArrivalBot from "./attendence/arrivebot.js";
import Attendees from "./attendence/attendees.js";
import createLeaveBot from "./attendence/leavebot.js";
import { createOrderBot } from "./orders/orderbot.js";
import OrderForm from "./orders/orderformnotion.js";

let curr_attendees = new Attendees();
createArrivalBot(curr_attendees);
createLeaveBot(curr_attendees);

new OrderForm();
createOrderBot();
