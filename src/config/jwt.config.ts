import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  accessTokenExpirationTime:
    process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME || '1d',
  refreshTokenExpirationTime:
    process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME || '7d',
}));
