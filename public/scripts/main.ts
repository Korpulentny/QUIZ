let quizView = document.getElementById("quiz-view") as HTMLParagraphElement;
// let resultsView = document.getElementById("results-view") as HTMLParagraphElement;
// let resultsTableContainer = document.getElementById("results-table") as HTMLTableElement;
let submitButton = document.getElementById("submit") as HTMLButtonElement;
let previousButton = document.getElementById("previous") as HTMLButtonElement;
let nextButton = document.getElementById("next") as HTMLButtonElement;
// let saveRawButton = document.getElementById("save-raw") as HTMLButtonElement;
let saveScoresButton = document.getElementById("save-scores") as HTMLButtonElement;
let introElement = document.getElementById("introduction") as HTMLParagraphElement;
let questionElement = document.getElementById("question") as HTMLParagraphElement;
let answerElement = document.getElementById("answer") as HTMLInputElement;
let resultNumberElement = document.getElementById("result-number") as HTMLParagraphElement;
let resultTimeElement = document.getElementById("result-time") as HTMLParagraphElement;
let timerElement = document.getElementById("timer") as HTMLParagraphElement;
let penaltyElement = document.getElementById("question-penalty") as HTMLParagraphElement;

interface quiz {
  name: string;
  intro: string;
  id: string;
  questions: Map<String, (String | number)[]>;
  size: number;
  answers: Map<String, String[]>;
  result: string;
  time: number;
}


// let myQuestions: string = `{
//     "intro": "Welcome to algoquiz",
//     "questions":{
//         "0": ["8+4", "12", 4],
//         "1": ["1-(-12:6)", "3", 10],
//         "2": ["6:2", "3", 10],
//         "3": ["10*20", "200", 10]
//     },
//     "size": "4"
// }`;

let script: HTMLScriptElement = document.scripts[0];
let myQuestions: string = script.getAttribute("data-content");
let token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

let currentQuiz: quiz = JSON.parse(myQuestions);
let currentQuestion = 0;
let answersGiven = 0;
let timeElapsed: number = 0
introElement.innerHTML = currentQuiz.intro;
let answers: string[] = [];
let timers: number[] = [];
let questionTimer: number = 0;

(function () {

  function fillArray(arr: Array<any>, val: any, size: number) {
    for (let i = 0; i < size; i++) {
      arr.push(val);
    }
  }

  function disableOrEnablePrev() {
    if (currentQuestion == 0) {
      previousButton.setAttribute("disabled", "true")
      previousButton.style.color = "grey";
    } else {
      previousButton.removeAttribute("disabled");
      previousButton.style.color = "#fff";
    }
  }

  function disableOrEnableNext() {
    if (currentQuestion == currentQuiz.size - 1) {
      nextButton.setAttribute("disabled", "true")
      nextButton.style.color = "grey";
    } else {
      nextButton.removeAttribute("disabled");
      nextButton.style.color = "#fff";
    }
  }

  function disableOrEnableSubmit() {
    if (answersGiven != currentQuiz.size) {
      submitButton.setAttribute("disabled", "true")
      submitButton.style.color = "grey";
    } else {
      submitButton.removeAttribute("disabled");
      submitButton.style.color = "#fff";
    }
  }

  function disableOrEnableButtons() {
    disableOrEnablePrev();
    disableOrEnableNext();
    disableOrEnableSubmit(


    );
  }

  function showQuestion(n: number) {
    updateQuestionTimers();
    currentQuestion = n;
    penaltyElement.innerHTML = "Penalty: " + currentQuiz.questions[currentQuestion][2] + "<br>";
    questionElement.innerHTML = currentQuiz.questions[currentQuestion][0];
    answerElement.placeholder = "";
    answerElement.value = answers[currentQuestion];
    answerElement.style.visibility = "visible";
    disableOrEnableButtons();
  }

  function addAnswer() {
    if (answers[currentQuestion] == "" && answerElement.value != "") {
      answersGiven++;
    }
    if (answers[currentQuestion] != "" && answerElement.value == "") {
      answersGiven--;
    }
    answers[currentQuestion] = answerElement.value;
    disableOrEnableButtons();
  }

  function showNextQuestion() {
    showQuestion(currentQuestion + 1);
  }

  function showPreviousQuestion() {
    showQuestion(currentQuestion - 1);
  }

  function updateQuestionTimers() {
    let currentTime = timeElapsed - questionTimer;
    timers[currentQuestion] += currentTime;
    questionTimer = timeElapsed;
  }

  function saveToLocalStorage(str: string) {
    let randomNumber: number = -1;
    do {
      randomNumber = Math.floor(Math.random() * 10000000) + 1;
    } while (localStorage.getItem(randomNumber.toString()) != null)
    localStorage.setItem(("QUIZ" + randomNumber.toString()), str);
  }

  function saveWithScores() {
    let timeSum = 0;
    Object.values(currentQuiz.answers).forEach((answer) => {
      timeSum += answer[1]
    });
    Object.values(currentQuiz.answers).forEach((answer) => {
      answer[1] /= timeSum;
    });
    let resultJSON = JSON.stringify({answers: Object.values(currentQuiz.answers)});
    postQuizResults(currentQuiz.id, resultJSON, token).then(() => {
      window.location.replace("quiz");
    });
  }

  function postQuizResults(quizId: string, quizResults: string, csrfToken: string): Promise<any> {
    return fetch(`http://localhost:3000/save/${quizId}`, {
      credentials: 'same-origin',
      method: 'POST',
      body: quizResults,
      headers: {
        'CSRF-Token': csrfToken,
        "Content-Type": "application/json"// <-- is the csrf token as a header
      }
    });
    // .then(response => if);
  }

  function updateTime() {
    timeElapsed++;
    timerElement.innerHTML = "Timer: " + (parseFloat((timeElapsed / 10).toString()).toFixed(1)).toString() + "<br>";
  }

  function showResults() {
    updateQuestionTimers();
    clearInterval(timerId);
    let correctAnswers: number = 0;
    currentQuiz.time = timeElapsed;
    for (let i = 0; i < answers.length; i++) {
      currentQuiz.answers.set(i.toString(), []);
      currentQuiz.answers[i.toString()] = new Array<String>(2);
      currentQuiz.answers[i.toString()][0] = answers[i];
      currentQuiz.answers[i.toString()][1] = timers[i];
      // let newRow = resultsTableContainer.insertRow();
      // let currCell = newRow.insertCell(0);
      // currCell.innerHTML = i.toString();
      // currCell = newRow.insertCell(1);
      if (answers[i] == currentQuiz.questions[i.toString()][1]) {
        correctAnswers++;
        // currCell.innerHTML = "OK";
        // currCell.style.color = "green";
        currentQuiz.answers[i].push("OK")
      } else {
        currentQuiz.answers[i][1] += currentQuiz.questions[i.toString()][2];
        currentQuiz.time += currentQuiz.questions[i.toString()][2];
        // currCell.innerHTML = "WA";
        // currCell.style.color = "red";
        currentQuiz.answers[i.toString()].push("WA")
      }
      // currCell = newRow.insertCell(2);
      // currCell.innerHTML = currentQuiz.answers[i.toString()][1];

    }
    currentQuiz.result = correctAnswers.toString() + "/" + currentQuiz.size.toString();
    // resultNumberElement.innerHTML = "Result: " + currentQuiz.result + "<br>"
    // resultTimeElement.innerHTML = "Time: " + currentQuiz.time + "<br>"
    // quizView.style.display = "none";
    // resultsView.style.visibility = "visible";
    saveWithScores();
  }

  // resultsView.style.visibility = "hidden";
  fillArray(answers, "", currentQuiz.size);
  fillArray(timers, 0, currentQuiz.size);
  currentQuiz.answers = new Map<String, String[]>();
  showQuestion(0);
  let timerId = setInterval(updateTime, 100);

  answerElement.addEventListener("input", addAnswer);
  submitButton.addEventListener("click", showResults);
  previousButton.addEventListener("click", showPreviousQuestion);
  nextButton.addEventListener("click", showNextQuestion);
  saveScoresButton.addEventListener("click", saveWithScores);
})();


