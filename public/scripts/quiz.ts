let scoresTableContainer = document.getElementById("scores-table") as HTMLTableElement;

interface quiz {
  intro: string;
  questions: Map<String, (String | number)[]>;
  size: number;
  answers: Map<String, String[]>;
  result: string;
  time: number;
}


function readFromLocalStorage() {
  for (let i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i);
    if (key != null) {
      let value = localStorage.getItem(key);
      if ((value != null) && (key.startsWith("QUIZ"))) {
        let score: quiz = JSON.parse(value);
        let newRow = scoresTableContainer.insertRow();
        let currCell = newRow.insertCell(0);
        currCell.innerHTML = score.result;
        currCell = newRow.insertCell(1);
        currCell.innerHTML = (score.time).toString();
      }
    }
  }
}

readFromLocalStorage();
