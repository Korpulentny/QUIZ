import bcrypt = require( "bcrypt");
import * as sqlite from "sqlite3";
import {dbGetWrapper, dbRunWrapper} from "./dbWrapper"


export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function addUser(db: sqlite.Database, login: string, password: string): Promise<any> {
  return dbRunWrapper(db,
      "INSERT OR REPLACE INTO users (login, password) VALUES (?, ?);",
      [login, await hashPassword(password)]);
}

export function getUser(db: sqlite.Database, login: string, password: string): Promise<any> {
  return dbGetWrapper(db, "SELECT * FROM users WHERE login = ?;", [login])
  .then(async (row: any) => {
    if (row) {
      if (await bcrypt.compare(password, row.password)) {
        return row;
      } else {
        return null;
      }
    }
    return null;
  });
}
