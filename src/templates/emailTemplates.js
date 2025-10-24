export const emailTemplates = {
  verification: ({ name, link }) => `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <h2 style="color: #333;">Verify Your Email</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for registering! Please click the button below to verify your email address:</p>
      <a href="${link}" 
         style="
           display: inline-block;
           padding: 10px 20px;
           margin: 20px 0;
           background-color: #007BFF;
           color: #fff;
           text-decoration: none;
           border-radius: 5px;
         ">
        Verify Email
      </a>
      <p>If the button doesn’t work, copy and paste the following link in your browser:</p>
      <p style="word-break: break-all;"><a href="${link}">${link}</a></p>
      <p style="color: #888; font-size: 12px;">This link will expire in 10 minutes.</p>
    </div>
  `,

  welcome: ({ name }) => `
    <div style="font-family: Arial, sans-serif; text-align: center;">
      <h2>Welcome to Our App!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining us. We hope you enjoy our services.</p>
    </div>
  `,

  resetPassword: ({ name, link }) => `
    <div style="font-family: Arial, sans-serif; text-align: center;">
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>Click the link below to reset your password:</p>
      <a href="${link}">${link}</a>
      <p>This link will expire in 10 minutes.</p>

    </div>
  `,
};

