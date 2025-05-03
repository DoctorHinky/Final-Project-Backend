import * as argon from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return argon.hash(password, {
    type: argon.argon2id,
    memoryCost: 2 ** 16, // thats 64MB RAM
    timeCost: 3, // number of iterations
    parallelism: 1, // number of threads (only 1 cuz nodejs is single threaded)
  });
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon.verify(hash, password);
}
