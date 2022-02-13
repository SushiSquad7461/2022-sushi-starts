import createArrivalBot from "./arrivebot.js";
import Attendees from "./attendees.js";
import createLeaveBot from "./leavebot.js";
import { getAttendees } from "./notion.js";

let curr_attendees = new Attendees();
createArrivalBot(curr_attendees);
createLeaveBot(curr_attendees);