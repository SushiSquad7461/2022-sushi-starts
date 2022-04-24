import 'dotenv/config';
import { Client, Intents } from 'discord.js';
import {joinVoiceChannel, createAudioPlayer, createAudioResource, AudioResource} from "@discordjs/voice";
import {createReadStream} from 'fs';
import { markPresent, getAttendees, logPing} from "./notion.js";
const doors= {
    INVALID: 0,
    INNER: 1,
    DOOR4: 2,
    DOOR3: 3,
    }
let client;
let ready = true;
let voiceChannelID = 584610536671543320;

export default function createArrivalBot(curr_attendees) {
    client = new Client({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_VOICE_STATES,
        ]
    });

    client.on('ready', () => {
          console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on('messageCreate', async (message) => {
        if (message.mentions.has(client.user) && message.author !== client.user) {
            console.log("User is arriving");
            console.log(message.author.username + "#" + message.author.discriminator);

            const date = new Date(message.createdTimestamp);

            message.reply("Welcome " + message.author.username);
            await markPresent(message.author.username + "#" + message.author.discriminator, date);

            let ping = curr_attendees.attendees_id.map(id => `<@${id}>`).join(" ");

            if (ping === "") {
                ping = "No current attendees";
            } else {
                const messageContentWithoutPing = message.content.replace(`<@!${client.user.id}>`, "");

                // keep message content first so people see that first on their phone notifications
                ping = `${messageContentWithoutPing} ${ping}`;
            }

            if (message.content.includes("door")) {
                message.reply(ping);
                if(!voiceChannelID) {
                    message.reply('must set doorbell bot to a voice channel');
                    return
                } else {
                    if (!ready) {
                        message.reply('Doorbell is currently in use. Try again in a few seconds');
                        return
                    } else {
                        ready = false;
                        const enteredDoor = setDoor(message);
                        if (enteredDoor === doors.INVALID) {
                            message.reply('please try again and specify which door');
                            ready = true;
                            return;
                        }
                        channel = await client.channels.fetch(voiceChannelID);
                        const connection = joinVoiceChannel({
                            channelId: channel.id,
                            guildId: channel.guild.id,
                            adapterCreator: channel.guild.voiceAdapterCreator,
                        })
                        try {
                            const player = createAudioPlayer();
                            // An AudioPlayer will always emit an "error" event with a .resource property
                            player.on('error', error => {
                                console.error('Error:', error.message, 'with track', error.resource.metadata.title);
                            });

                            const resource = createAudioResource(createReadStream("doorbell.mp3"), {inlineVolume: true});
                            resource.volume.setVolume(1);

                            connection.subscribe(player);
                            player.play(resource);
                            setTimeout(() => {
                                try {
                                    let whichDoor = AudioResource;
                                    switch(enteredDoor) {
                                        case doors.INNER:
                                            whichDoor = createAudioResource(createReadStream("innerdoor.mp3"), {inlineVolume: true});
                                            break
                                        case doors.DOOR3:
                                            whichDoor = createAudioResource(createReadStream("door 3.mp3"), {inlineVolume: true});
                                            break
                                        case doors.DOOR4:
                                            whichDoor = createAudioResource(createReadStream("door 4.mp3"), {inlineVolume: true});
                                            break
                                    }
                                    whichDoor.volume.setVolume(1);
                                    player.play(whichDoor);

                                } catch(ex) {
                                    console.log(ex);
                                }

                            }, 3000);
                            setTimeout(() => {
                                try {
                                    connection.destroy();
                                } catch(ex) {
                                    console.log(ex);
                                }
                                ready = true;
                            }, 6000);
                        } catch(ex) {
                            console.log(ex);
                        }
                    }
                }
            }

            if (!curr_attendees.findAttendee(message.author.id)) {
                await logPing(false, message.author.username + "#" + message.author.discriminator);
                curr_attendees.addAttendee(message.author.username + "#" + message.author.discriminator, message.author.id);
            }
            if(message.content.includes("setvc")) {
                if(!message.member.voice.channelId) {
                    message.reply("you must be in a voice channel to set bot's voice channel");
                    return;
                }
                voiceChannelID = message.member.voice.channelId;
                message.reply("successfully joined voice channel " + message.member.voice.channel.name);
            }
        }
    });

    function setDoor(args) {
        if(args.content.includes('inner')) return doors.INNER;
        else if (args.content.includes('four') || args.content.includes('4')) return doors.DOOR4;
        else if (args.content.includes('three') || args.content.includes('3')) return doors.DOOR3;
        else {
            return doors.INVALID;
        }
    }

    client.login(process.env.ARRIVE_CLIENT_TOKEN);
}