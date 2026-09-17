import { registerAs } from '@nestjs/config';

export default registerAs('salesforce', () => {
  const required = ['SF_CLIENT_ID', 'SF_CLIENT_SECRET'];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[SalesforceConfig] Missing required environment variables: ${missing.join(', ')}. ` +
        `Please check your .env file.`,
    );
  }

  return {
    loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
    clientId: process.env.SF_CLIENT_ID!,
    clientSecret: process.env.SF_CLIENT_SECRET!,
    redirectUri:
      process.env.SF_REDIRECT_URI || 'http://localhost:3000/oauth/callback',
    username: process.env.SF_USERNAME,
    password: process.env.SF_PASSWORD,
  };
});
