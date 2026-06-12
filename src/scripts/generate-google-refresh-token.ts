import { google } from "googleapis";
import * as readline from "readline";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

console.log("Authorize this app by visiting this URL:");
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
rl.question("\nPaste the authorization code here: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log("\nRefresh Token:");
    console.log(tokens.refresh_token);

    console.log("\nAccess Token:");
    console.log(tokens.access_token);
  } catch (err) {
    console.error(err);
  } finally {
    rl.close();
  }
});
