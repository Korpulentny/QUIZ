import * as sqlite3 from 'sqlite3'
import {addUser} from "./utils/userUtils";
import {dbRunWrapper, openDatabaseWrapper} from "./utils/dbWrapper";
// let db = new sqlite3.Database('database.db');

const myQuestions1: string = `{
    "intro": "Welcome to algoquiz",
    "id": 1,
    "name": "Algoquiz1",
    "questions":{
        "0": ["8+4", "12", 4],
        "1": ["1-(-12:6)", "3", 10],
        "2": ["6:2", "3", 10],
        "3": ["10*20", "200", 10]
    },
    "size": "4"
}`;

const myQuestions2: string = `{
    "intro": "Welcome to algoquiz2",
    "id": 2,
    "name": "Algoquiz2",
    "questions":{
        "0": ["8+4", "12", 4],
        "1": ["1-(-12:6)", "3", 10],
        "2": ["6:2", "3", 10],
        "3": ["10*20", "200", 10]
    },
    "size": "4"
}`;

//to jest lsoowy json, nie do konca tak bedzie wygladal JSON z odpowiedziami
const answers: string = `{
    "result": 12,
    "time": 12,
    "answers":{
        "0": ["8+4", "12", 4],
        "1": ["1-(-12:6)", "3", 10],
        "2": ["6:2", "3", 10],
        "3": ["10*20", "200", 10]
    },
    "size": "4"
}`;

async function dbInit() {
  const db: sqlite3.Database = await openDatabaseWrapper("database.db");

  await dbRunWrapper(db, "DROP TABLE IF EXISTS users;", []);
  await dbRunWrapper(db, "DROP TABLE IF EXISTS quizzes;", []);
  await dbRunWrapper(db, "DROP TABLE IF EXISTS scores;", []);

  await dbRunWrapper(db, "CREATE TABLE IF NOT EXISTS users (login VARCHAR PRIMARY KEY, password VARCHAR);", []);
  await addUser(db, "user1", "user1");
  await addUser(db, "user2", "user2");

  await dbRunWrapper(db, "CREATE TABLE IF NOT EXISTS quizzes (id INTEGER PRIMARY KEY, name TEXT, content TEXT);", []);
  await dbRunWrapper(db, 'INSERT INTO quizzes VALUES (1, ?, ?)', ['Algoquiz1', myQuestions1]);
  await dbRunWrapper(db, 'INSERT INTO quizzes VALUES (2, ?, ?)', ['Algoquiz2', myQuestions2]);

  await dbRunWrapper(db, "CREATE TABLE IF NOT EXISTS scores (usr_login VARCHAR REFERENCES users(login), quizId INTEGER REFERENCES quizzes(id), result FLOAT, content TEXT);", []);
}

dbInit();
