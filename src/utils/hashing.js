import { createHmac } from 'crypto';
import { hash, compare } from 'bcryptjs';


// hash for passwoard:
export const hashPassword = async (password) => {
  return hash(password, 12)
}

export const comparePassword = async (enteredPassword, hashedPassword) => {
  return compare(enteredPassword, hashedPassword)
}


// hmax for simple hash:
export const hmacHash = (value) => {
	return createHmac('sha256', process.env.HMAC_VERIFICATION_CODE_SECRET).update(value).digest('hex');
};
