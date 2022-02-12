import { Client } from "@notionhq/client"
import "dotenv/config";
const notion = new Client({ auth: process.env.NOTION_KEY })

const ATTENDENCEID = process.env.NOTION_DATABASE_ID
const ROSTERID = process.env.ROSTER_ID

const DATE = new Date(Date.now())

const date = (DATE.getMonth()+1)+'/'+DATE.getDate()+'/'+22;

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
    //console.log(response);
    pageId = response.results[0].id;
  }
  catch(error) {
    console.error(error.body)
  }  
  const userinfo = await notion.pages.retrieve({page_id: pageId});
  //console.log(userinfo);
  return userinfo.properties["Notion User"]["people"][0];
}

export default async function markPresent(tag) {
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
    pageId = currPage.results[0].id;
    let people = currPage.results[0].properties.Attendees.people;
    people.push(user);
    console.log(people);

    const response = await notion.pages.update({
      page_id: pageId,
      properties: {
        'Attendees': {
          people: people,
        },
      },
    });
  
  }
  catch(error) {
    console.error(error.body)
  }

}