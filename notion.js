import { Client } from "@notionhq/client"
import "dotenv/config";
const notion = new Client({ auth: process.env.NOTION_KEY })

const ATTENDENCEID = process.env.NOTION_DATABASE_ID
const ROSTERID = process.env.ROSTER_ID
const DATE = new Date(Date.now())
const date = (DATE.getMonth()+1)+'/'+DATE.getDate()+'/'+22;
const day = DATE.getDay();
const time = DATE.getHours();

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
    })
    pageId = response.results[0].id;
  }
  catch(error) {
    console.error(error.body)
  }  
  const userinfo = await notion.pages.retrieve({page_id: pageId});
  return userinfo.properties["Notion User"]["people"][0];
}

export async function markPresent(tag) {
  const user = await getUser(tag);
  let pageId;
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
    if(((day>0 && day<6)&&(time<16)) || (day===6 && time<11))
    {
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
      pageId = currPage.results[0].id;
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
    console.error(error.body)
  }

}

export async function getAttendees() {
    console.log("IN")
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
        const userinfo = await notion.pages.retrieve({page_id: person.results[0].id});
        discord_tags.push(userinfo.properties["Discord Tag"].rich_text[0].plain_text);
    }

    return discord_tags;
  }
  catch(error) {
    console.error(error);
  }
}