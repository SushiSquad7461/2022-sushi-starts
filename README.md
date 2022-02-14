# Sushi-Starts
Sushi Squad discord bot for attendance 

This repo has code for two discord bot, doorman, and leaving.

Doorman:

The doorman bot has two uses. The first is to count you as present to the metting by adding you to the Enginnering Notebook page for the current metting, 
and adding you to the attendace log in sheet. The second one is to notify all current attendees of a metting that somebody is at the door. Both uses are activated
by typing in @doorman, their is no special option for not pinging evrybody at the meeting as it is assumed that when a user enters GIX they will need somebody to open
the door.

Leaving:

The leaving bot has only on purpose, to log your exit from GIX.


Attendce Logs are stored in notion in the Attendce page.

The list of people currently at the metting, which is used by the bot to ping people for door access, is stored in memory, as
such if the bot crashes all of the people currently at the metting that have logged in with the doorman bot will not
be pinged when somebody is at the door.
