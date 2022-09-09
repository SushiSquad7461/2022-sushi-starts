import createArrivalBot from "./arrivebot";
import Attendees from "./attendees";
import createLeaveBot from "./leavebot";
import { getAttendees } from "./notion";

let curr_attendees = new Attendees();
createArrivalBot(curr_attendees);
createLeaveBot(curr_attendees);