"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPing = exports.getAttendees = exports.markPresent = exports.getUser = void 0;
const client_1 = require("@notionhq/client");
require("dotenv/config");
const notion = new client_1.Client({ auth: process.env.NOTION_KEY });
const ATTENDENCEID = process.env.NOTION_DATABASE_ID ?? "";
const ROSTERID = process.env.ROSTER_ID ?? "";
const LOGID = process.env.LOG_ID ?? "";
async function getUser(tag) {
    let pageId;
    try {
        const response = await notion.databases.query({
            database_id: ROSTERID,
            filter: {
                "property": 'Discord Tag',
                "text": {
                    "contains": tag,
                }
            },
        });
        pageId = response.results[0]?.id;
    }
    catch (error) {
        console.error(error.body);
    }
    if (pageId != null) {
        const userinfo = await notion.pages.retrieve({ page_id: pageId });
        return userinfo.properties["Notion User"]["people"][0];
    }
    else {
        return null;
    }
}
exports.getUser = getUser;
async function getCurrPage(date) {
    try {
        const currPage = await notion.databases.query({
            database_id: ATTENDENCEID,
            filter: {
                "property": 'Name',
                "text": {
                    "contains": date,
                }
            }
        });
        return currPage;
    }
    catch (error) {
        return error.body;
    }
}
async function createPage(date) {
    try {
        const response = await notion.pages.create({
            parent: {
                database_id: ATTENDENCEID,
            },
            icon: {
                type: 'emoji', emoji: '📝'
            },
            properties: {
                Name: {
                    title: [
                        {
                            type: 'text',
                            text: { content: date },
                            annotations: {
                                bold: false,
                                italic: false,
                                strikethrough: false,
                                underline: false,
                                code: false,
                                color: 'default'
                            },
                            plain_text: date,
                        }
                    ]
                }
            }
        });
    }
    catch (error) {
        console.log(error.body);
    }
}
async function markPresent(tag, DATE) {
    const date = (DATE.getMonth() + 1) + '/' + DATE.getDate() + '/' + 22;
    const day = DATE.getDay();
    const time = DATE.getHours();
    console.log("Time: ");
    console.log(date);
    console.log(day);
    console.log(time);
    const user = await getUser(tag);
    let currPage = await getCurrPage(date);
    if (user == null) {
        console.log("THIS USER IS NOT IN ROSTER COULD NOT MARK AS ATTENDED");
        return;
    }
    if (currPage.results.length === 0) {
        await createPage(date);
        currPage = await getCurrPage(date);
    }
    let pageId = currPage.results[0].id;
    try {
        console.log(time);
        if (((day > 0 && day < 6) && (time < 16)) || (day === 6 && time < 11)) {
            pageId = currPage.results[0].id;
            let people = currPage.results[0].properties.Attendees.people;
            people.push(user);
            const response = await notion.pages.update({
                page_id: pageId,
                properties: {
                    'Attendees': {
                        people: people,
                    },
                },
            });
        }
        else {
            let people = currPage.results[0].properties["Late Attendees"].people;
            people.push(user);
            const response = await notion.pages.update({
                page_id: pageId,
                properties: {
                    'Late Attendees': {
                        people: people,
                    },
                },
            });
        }
    }
    catch (error) {
        console.log(error.body);
    }
}
exports.markPresent = markPresent;
async function getAttendees() {
    console.log("IN");
    try {
        const currPage = await notion.databases.query({
            database_id: ATTENDENCEID,
            filter: {
                "property": 'Name',
                "text": {
                    "contains": date,
                }
            }
        });
        let late_people = currPage.results[0].properties["Late Attendees"].people;
        let people = currPage.results[0].properties.Attendees.people;
        people = people.concat(late_people);
        let discord_tags = [];
        for (let i of people) {
            const person = await notion.databases.query({
                database_id: ROSTERID,
                filter: {
                    "property": 'Notion User',
                    "people": {
                        "contains": i.id,
                    }
                }
            });
            const userinfo = await notion.pages.retrieve({ page_id: person.results[0].id });
            discord_tags.push(userinfo.properties["Discord Tag"].rich_text[0].plain_text);
        }
        return discord_tags;
    }
    catch (error) {
        console.error(error);
    }
}
exports.getAttendees = getAttendees;
async function logPing(leaving, tag) {
    const user = await getUser(tag);
    if (user == null) {
        console.log("user is not in team roster");
        return;
    }
    try {
        const response = await notion.pages.create({
            parent: {
                database_id: LOGID,
            },
            properties: {
                Leaving: {
                    checkbox: leaving
                },
                Person: {
                    people: [
                        user
                    ]
                }
            }
        });
    }
    catch (error) {
        console.log(error.body);
    }
}
exports.logPing = logPing;
//# sourceMappingURL=notion.js.map