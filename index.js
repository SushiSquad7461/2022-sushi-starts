"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const arrivebot_1 = __importDefault(require("./arrivebot"));
const attendees_1 = __importDefault(require("./attendees"));
const leavebot_1 = __importDefault(require("./leavebot"));
let curr_attendees = new attendees_1.default();
(0, arrivebot_1.default)(curr_attendees);
(0, leavebot_1.default)(curr_attendees);
//# sourceMappingURL=index.js.map