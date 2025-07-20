# Gmail App Password Setup for Nodemailer

Using an App Password is a simpler way to send emails from your Gmail account, but it requires you to enable 2-Step Verification.

## 1. Enable 2-Step Verification

- First, you must enable 2-Step Verification for your Google Account.
- Go to your [Google Account security settings](https://myaccount.google.com/security).
- Click on "2-Step Verification" and follow the on-screen steps to enable it. You will need your phone for this. This step must be completed before you can create an App Password.

## 2. Generate an App Password

- After 2-Step Verification is enabled, go to the [App Passwords page](https://myaccount.google.com/apppasswords). This is a separate page from the 2-Step verification setup.
- You may be asked to sign in again.
- On the App Passwords page, click "Select app" and choose "Other (Custom name)".
- Give it a name you'll remember, like "Student Hub Mailer", and click "Generate".
- You will see a 16-digit password. **Copy this password immediately.** This is the only time you will see it.

## 3. Add Credentials to Your Environment Variables

Add the following to your `.env.local` file. Use the App Password you just generated, not your regular Gmail password.

```
# Your Gmail address
GMAIL_USER=your_gmail_address@gmail.com

# The 16-digit App Password you generated
GMAIL_APP_PASSWORD=your_16_digit_app_password
```

Replace `your_gmail_address@gmail.com` and `your_16_digit_app_password` with your actual credentials.
