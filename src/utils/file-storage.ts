import { promises as fs } from "fs";
import path from "path";

const dataDirectory = path.resolve(process.cwd(), "data");
const usersFilePath = path.resolve(dataDirectory, "users.json");

export async function ensureUsersFile(): Promise<void> {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(usersFilePath);
  } catch {
    await fs.writeFile(usersFilePath, "[]", "utf-8");
  }
}

export async function readJsonFile<T>(fallbackValue: T): Promise<T> {
  await ensureUsersFile();

  try {
    const fileContent = await fs.readFile(usersFilePath, "utf-8");
    return JSON.parse(fileContent) as T;
  } catch {
    return fallbackValue;
  }
}

export async function writeJsonFile<T>(data: T): Promise<void> {
  await ensureUsersFile();
  await fs.writeFile(usersFilePath, JSON.stringify(data, null, 2), "utf-8");
}
