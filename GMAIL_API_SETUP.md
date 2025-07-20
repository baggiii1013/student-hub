# Google OAuth2 Setup for Nodemailer

Follow these steps to get the required credentials for sending emails with Nodemailer and Gmail's API.

## 1. Create a Google Cloud Project

- Go to the [Google Cloud Console](https://console.cloud.google.com/).
- Create a new project or select an existing one.

## 2. Enable the Gmail API

- In your project, go to the "APIs & Services" > "Library" page.
- Search for "Gmail API" and enable it.

## 3. Create OAuth 2.0 Credentials

- Go to "APIs & Services" > "Credentials".
- Click "Create Credentials" and select "OAuth client ID".
- If prompted, configure the consent screen. For "User Type", select "External" and create the app. You don't need to submit it for verification for this use case.
- **Add Test Users**: While the app is in "Testing" mode, you must add allowed email addresses.
    - Go to "APIs & Services" > "OAuth consent screen".
    - Under "Test users", click "+ Add Users".
    - Enter the Google email address you intend to send emails from (e.g., `your_gmail_address@gmail.com`).
    - Click "Save".
- For the "Application type", select "Web application".
- Under "Authorized redirect URIs", add `https://developers.google.com/oauthplayground`.
- Click "Create". You will get a "Client ID" and "Client Secret".

## 4. Get a Refresh Token

- Go to the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
- In the top right corner, click the gear icon and check "Use your own OAuth credentials".
- Enter the "Client ID" and "Client Secret" you just created.
- In the "Select & authorize APIs" step, enter `https://mail.google.com/` in the input field and click "Authorize APIs".
- You will be prompted to sign in with your Google account. Choose the account you want to send emails from.
- Click "Exchange authorization code for tokens".
- You will get a "Refresh token".

## 5. Add Credentials to Your Environment Variables

Add the following to your `.env.local` file:

```
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_USER=your_gmail_address
```

Replace `your_client_id`, `your_client_secret`, `your_refresh_token`, and `your_gmail_address` with the values you obtained.
