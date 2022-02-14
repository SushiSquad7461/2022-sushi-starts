export default class Attendees {
    constructor() {
        this.attendees_names = [];
        this.attendees_id = [];
    }
    addAttendee(name, id) {
        this.attendees_names.push(name);
        this.attendees_id.push(id);
    }
    removeAttendee(name, id) {
        this.attendees_names = this.attendees_names.filter(value => value === name);
        this.attendees_id = this.attendees_names.filter(value => value === id);
    }
    findAttendee(id) {
        for (let i of this.attendees_id) {
            if (i === id) { return true; }
        }
        return false;
    }
    get getAttendeeIds() {
        return this.attendees_id;
    }
}
