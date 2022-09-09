import * as notion from "./notion";

(async () => {
    console.log(await notion.getAttendees());
    console.log(await notion.getUser("KTOmega#7816"));
})();