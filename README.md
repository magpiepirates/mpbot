# mpbot - The heart of Magpie Steward Bot
Hello pirates! We decided to share our efforts with the community, making our code available to everyone!
This is not our main repository, but we will update this with every new update, removing tokens and credentials form it, because we're not dumb... (i swear it was a mistake... .gitignore didn't work for some reason)

If you wish to contribute or suggest a change/other stuff (idk, whatever), contact @DDC or @AnalogWeapon in the Discord's server!

And if you, for some unknown reason, stumble upon this, and you're interested in music production, DIY, and much more (because i can't think of something else), join our Discord Server: https://discord.gg/AqyhYdd

## Running the code
This bot is written in JavaScript, and you'll need NodeJs and NPM installed.
After cloning this repository to your local machine, run:
```bash
npm install
```
Since we use MongoDB to store some variables, collab data and so on, you'll need a MongoDB instance running somewhere to use some features.
The `modules/drive.js` file is a wrapper for the Google Drive API, specifically made for our use cases, so you'll also need to setup a google service account to use with it.

In order to auth and use MongoDB, Google Drive and the bot itself, you'll need to create a `creds` folder, to store your MongoDB credentials, Google Service Account credentials and Bot tokens.

... I still need to figure out a bunch of things to write here... it took 5 months to figure out what we wrote in the code lol...
