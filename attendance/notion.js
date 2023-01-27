import { Client } from "@notionhq/client"
import { config } from "../dist/Environment.js";

const notion = new Client({ auth: config.tokens.notionClientKey });

async function getUser(tag) {
  let pageId;
  try {
    const response = await notion.databases.query({
      database_id: config.notion.rosterDatabaseId,
      filter: {
            "property": 'Discord Tag',
            "text": {
              "contains": tag,
            }
          },
    })
    pageId = response.results[0].id;
  }
  catch(error) {
    console.error(error.body)
  } 
  
  if (pageId != null) {
    const userinfo = await notion.pages.retrieve({page_id: pageId});
    return userinfo.properties["Notion User"]["people"][0];
  } else {
    return null;
  }
}

async function getCurrPage(date) {
  try {
    const currPage = await notion.databases.query({
      database_id: config.notion.engineeringNotebookDatabaseId,
      filter: {
        "property": 'Name',
        "text": {
          "contains": date,
        }
      }
    });
    return currPage;
  }
  catch(error) {
      return error.body;
  }
}

async function createPage(date) {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: config.notion.engineeringNotebookDatabaseId,
      },
      icon: {
        type: 'emoji', emoji: '📝'
      },
      properties: {
        Name: {
          title: [
            {
              type: 'text',
              text: { content: date, link: null },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
              },
              plain_text: date,
              href: null
            }
          ]
        }
      }
    })
  }
  catch(error) {
    console.log(error.body);
  }
}

export async function markPresent(tag, DATE) {
  const date = (DATE.getMonth()+1)+'/'+DATE.getDate();
  const day = DATE.getDay();
  const time = DATE.getHours();

  console.log("Time: ", date, day, time);

  const user = await getUser(tag);
  let currPage = await getCurrPage(date);

  if (user == null) {
    console.log("THIS USER IS NOT IN ROSTER COULD NOT MARK AS ATTENDED");
    return;
  }

  if( currPage.results.length === 0) {
    await createPage(date);
    currPage = await getCurrPage(date);
  }

  //console.log(currPage);
  let pageId = currPage.results[0].id;
  try {

    console.log(time);

    if( ( (day > 0 && day < 6) && (time < 16) ) || (day === 6 && time < 11)) {
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
    else
    {
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
  catch(error) {
    console.log(error.body);
  }
}

export async function getAttendees() {
  try {
    const currPage = await notion.databases.query({
      database_id: config.notion.engineeringNotebookDatabaseId,
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
            database_id: config.notion.rosterDatabaseId,
            filter: {
                "property": 'Notion User',
                "people": {
                  "contains": i.id,
                }
            }
        });
        const userinfo = await notion.pages.retrieve({page_id: person.results[0].id});
        discord_tags.push(userinfo.properties["Discord Tag"].rich_text[0].plain_text);
    }

    return discord_tags;
  }
  catch(error) {
    console.error(error);
  }
}

export async function logPing(leaving, tag) {
  const user = await getUser(tag);

  if (user == null) {
    console.log("user is not in team roster");
    return;
  }
  
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: config.notion.attendanceLogDatabaseId,
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
    })
  } catch(error) {
    console.log(error.body);
  }
}