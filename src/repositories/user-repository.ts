import { User } from "../models/user";
import { readJsonFile, writeJsonFile } from "../utils/file-storage";

export async function findUsers(): Promise<User[]> {
  return readJsonFile<User[]>([]);
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await findUsers();
  return users.find((user) => user.email === email.toLowerCase());
}

export async function createUser(user: User): Promise<User> {
  const users = await findUsers();
  users.push(user);
  await writeJsonFile(users);
  return user;
}
