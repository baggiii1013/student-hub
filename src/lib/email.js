import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendStudentUpdateEmail(student, action) {
  if (!student.email) {
    return;
  }

  const subject = action === 'created' 
    ? 'Welcome to the Student Hub!' 
    : 'Your Student Hub Profile has been Updated';

  const htmlBody = `
    <h1>Hello ${student.name},</h1>
    <p>This is a notification from the Parul University Student Hub.</p>
    <p>Your student profile has been successfully <strong>${action}</strong>.</p>
    <p>Here are some of your details:</p>
    <ul>
      <li><strong>Name:</strong> ${student.name}</li>
      <li><strong>UG Number:</strong> ${student.ugNumber}</li>
      <li><strong>Branch:</strong> ${student.branch || 'Not specified'}</li>
    </ul>
    <p>You can view your full profile by logging into the <a href="${process.env.NEXTAUTH_URL}">Student Hub</a>.</p>
    <p>If you have any questions, please contact the administration.</p>
    <br>
    <p>Best regards,</p>
    <p><strong>Parul University Student Hub Team</strong></p>
  `;

  const mailOptions = {
    from: `"Parul University Student Hub" <${process.env.GMAIL_USER}>`,
    to: student.email,
    subject: subject,
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    // console.error(`Failed to send email to ${student.email}:`, error);
    // We don't want to block the main process if email fails, so we just log the error.
  }
}
