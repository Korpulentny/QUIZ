import {NextFunction, Request, Response} from 'express';
import * as sqlite3 from 'sqlite3';
import {dbAllWrapper, dbGetWrapper, dbRunWrapper, openDatabaseWrapper} from "./utils/dbWrapper";
import {addUser, getUser} from "./utils/userUtils";
import {BAD_REQUEST, MOVED_PERMANENTLY} from 'http-status-codes';
import {MemoryStore} from 'express-session';
import {promisify} from "util";
import csurf = require ('csurf');
import express = require('express');
import cookieParser = require('cookie-parser');
import session = require('express-session');
import createError = require('http-errors');
import cors = require('cors');

const connectSqlite3 = require('connect-sqlite3')

sqlite3.verbose();
const app: express.Application = express();
const csrfProtection = csurf({cookie: true});
const sessionStore: MemoryStore = new MemoryStore();

const logoutUser = (req: Request, res: Response, next: NextFunction) => {
  sessionStore.all((err: any, sessions: any) => {
    const toDelete = Object.entries(sessions)
    .filter(([k, v]: [any, any]) => v.login === req.session.login)
    .map(([k, v]) => (promisify(sessionStore.destroy.bind(sessionStore))(k)));
    (Promise.all(toDelete)).then(() => {
      return res.redirect(MOVED_PERMANENTLY, '/login');
    }).catch(() => {
      return next(createError(400));
    });
  })
}

interface User {
  login: string;
  hashed_password: string;
}

async function dbStart() {
  const db: sqlite3.Database = await openDatabaseWrapper("database.db");
}

const redirectLogin = (req, res, next) => {
  if (!req.session!.login) {
    return res.redirect('/login');
  } else {
    next();
  }
};

const redirectHome = (req, res, next) => {
  if (req.session!.login) {
    return res.redirect('/');
  } else {
    next();
  }
};

function extractTimeStats(allEntriesForGivenQuiz: any) {
  let timeScores = allEntriesForGivenQuiz.map((entry: any) => {
    return JSON.parse(entry.content)
  }).map((answers: any) => {
    return answers.map((answer) => {
      return answer[2];
    })
  });
  timeScores = Object.keys(timeScores[0]).map((c) => {
    return timeScores.map(function (r) {
      return r[c];
    });
  }).map((answerStat: [any]) => {
    return answerStat.reduce((sum: number, b: number) => sum + b / (answerStat.length * 1000), 0)
  });
  return timeScores;
}

dbStart().then(() => {

  // view engine setup
  app.use(express.json());

  app.set('view engine', 'pug');
  // app.set('views', path.join(__dirname, 'views'));
  app.use('/public', express.static(__dirname + '/public/'));
  // app.use(logger('dev'));
  app.use(cors());
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.db = new sqlite3.Database('database.db')
    next();
  });
  app.use(express.urlencoded({extended: true}));
  app.use(cookieParser('PozdrawiamSerdecznie7132'));

  app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'PozdrawiamSerdecznie7132',
    cookie: {sameSite: 'strict'},
    store: sessionStore
  }));


//
  app.get('/login', csrfProtection, redirectHome, (req: Request, res: Response, next: NextFunction) => {
    res.render('login', {
      title: "login",
      csrfToken: req.csrfToken()
    })
  });

  app.get('/change', csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
    if (req.session!.login) {
      res.render('change', {
        title: "change",
        login: req.session!.login,
        csrfToken: req.csrfToken()
      });
    } else {
      return res.redirect(MOVED_PERMANENTLY, 'login');
    }
  });

  app.get('/', csrfProtection, redirectLogin, (req: Request, res: Response) => {
    return res.redirect(MOVED_PERMANENTLY, '/quiz')
  });

  app.post('/change', csrfProtection, redirectLogin, async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.new_password && req.body.new_password.length > 0 && req.body.new_password === req.body.repeat_new_password) {
      await addUser(res.locals.db, req.session!.login, req.body.new_password);
      logoutUser(req, res, next);
    } else {
      res.redirect(MOVED_PERMANENTLY, '/change');
    }
  });

  app.post('/logout', csrfProtection, redirectLogin, async (req: Request, res: Response, next: NextFunction) => {
    req.session.destroy(() => {
      return res.redirect(MOVED_PERMANENTLY, '/login');
    })
  });

  app.get('/quiz', csrfProtection, redirectLogin, async (req: Request, res: Response) => {
    let quizesWithScores: any = await dbAllWrapper(res.locals.db, 'SELECT quizzes.id, quizzes.name  FROM quizzes LEFT JOIN scores ON quizzes.id = scores.quizId WHERE scores.usr_login = ?', [req.session!.login]);
    let allQuizzes: any = await dbAllWrapper(res.locals.db, 'SELECT quizzes.id, quizzes.name  FROM quizzes;', []);
    let quizesWithoutScores: any = allQuizzes.filter((x: any) => {
      return quizesWithScores.map(a => {
        return a.id
      }).indexOf(x.id) == -1
    });
    res.render('quiz', {
      title: "quiz",
      solvedQuizlist: quizesWithScores || [],
      availableQuizlist: quizesWithoutScores || [],
      csrfToken: req.csrfToken()
    })
  });

  app.get('/questions', csrfProtection, redirectLogin, async (req: Request, res: Response) => {
    let quizId: string = req.query.available_dropdown;
    let result: any = await dbGetWrapper(res.locals.db, 'SELECT * FROM quizzes WHERE id=?', [quizId]);
    let userScore: any = await dbGetWrapper(res.locals.db, 'SELECT * FROM scores WHERE quizId=? AND usr_login = ?;', [quizId, req.session!.login]);
    if (userScore) {
      return res.redirect(BAD_REQUEST, '/');
    }
    if (result) {
      if (!req.session!.quizStartTimestamps[quizId]) {
        req.session!.quizStartTimestamps[quizId] = Date.now();
      }
      res.render('questions', {
        title: "questions",
        myQuestions: result.content,
        csrfToken: req.csrfToken()
      })
    } else {
      res.redirect('/');
    }

  });
  app.get('/quizError', csrfProtection, redirectLogin, (req: Request, res: Response) => {
    res.render('Error',{
      title: "Error",
      csrfToken: req.csrfToken()
    })
  });

  app.get('/stats/', csrfProtection, redirectLogin, async (req: Request, res: Response) => {


    let quizId: string = req.query.solved_dropdown;
    let quiz: any = await dbGetWrapper(res.locals.db, 'SELECT * FROM quizzes WHERE id=?', [quizId]);
    let result: any = await dbGetWrapper(res.locals.db, 'SELECT * FROM scores WHERE quizId=? AND usr_login = ?;', [quizId, req.session!.login]);
    if (!result) {
      return res.redirect(BAD_REQUEST, '/');
    }
    let allEntriesForGivenQuiz: any = await dbAllWrapper(res.locals.db, 'SELECT * FROM scores where quizId=?;', [quizId]);
    let top5: any = allEntriesForGivenQuiz.map((a: any) => {
      return {login: a.usr_login, result: a.result}
    }).sort((a, b) => {
      return b.result - a.result;
    }).slice(0, 5);
    let timeScores = extractTimeStats(allEntriesForGivenQuiz);
    let resultArray = JSON.parse(result.content)
    .map((record: any, index: number) => {
      record.push(timeScores[index]);
      return record;
    })
    if (result) {
      res.render('stats', {
        title: "stats",
        questionScores: resultArray,
        topResults: top5,
        questionsNumber: resultArray.length,
        csrfToken: req.csrfToken()
      })
    } else {
      res.redirect('/');
    }
  });

  app.post('/save/:quizId', csrfProtection, redirectLogin, async function (req: Request, res: Response, next: NextFunction) {
    let timeElapsed = Date.now() - req.session!.quizStartTimestamps[req.params.quizId];
    let quizEntry: any = await dbGetWrapper(res.locals.db, 'SELECT * FROM quizzes WHERE id=?', [req.params.quizId]);
    let quiz: any = JSON.parse(quizEntry.content);
    let questions = Object.values(quiz.questions);
    let score: number = 0;
    let result = req.body.answers.map((answer: any, index: number) => {
      score += answer[0] === questions[index][1] ? 1 : 0;
      return [answer[0], answer[0] === questions[index][1] ? 'OK' : 'WA', answer[1] * timeElapsed, questions[index][1]];
    });
    score /= questions.length;
    let resultString = JSON.stringify(result);

    let userScore: any = await dbGetWrapper(res.locals.db, 'SELECT * FROM scores WHERE quizId=? AND usr_login = ?;', [req.params.quizId, req.session!.login]);
    console.log(userScore);
    if (userScore) {
      console.log("niedodaje");
      res.redirect('/quizError');
    } else {
      console.log("dodaje");
      await dbRunWrapper(res.locals.db, 'INSERT INTO scores (usr_login, result, content, quizId) VALUES (?, ?,?,?);', [req.session!.login, score, resultString, req.params.quizId]);
      res.redirect("/");
    }
  });


//
  app.post('/login', csrfProtection, redirectHome, async function (req: Request, res: Response, next: NextFunction) {
    let login = req.body.login;
    let password = req.body.password;
    if (!login || !password) {
      return res.redirect(MOVED_PERMANENTLY, 'login');
    }
    let user: User = await getUser(res.locals.db, req.body.login, req.body.password);
    if (user) {
      req.session!.login = user.login;
      req.session!.quizStartTimestamps = new Map<string, string>();
      return res.redirect(MOVED_PERMANENTLY, 'quiz');
    }
    return res.redirect(MOVED_PERMANENTLY, 'login');
  });


//
// // catch 404 and forward to error handler
  app.use(function (req: Request, res: Response, next: NextFunction) {
    next(createError(404));
  });
//
// error handler
// error handler
  app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
    // set loccals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

});


module.exports = app;
