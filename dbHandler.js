const Database = require('better-sqlite3'); // better-sqlite3 모듈 불러오기

// SQLite 데이터베이스 연결
const db = new Database('./class_score.db', { verbose: console.log }); // verbose는 SQL 쿼리를 로그로 출력하게 설정

// 데이터베이스에서 데이터를 조회하는 함수
function fetchData() {
  try {
    const rows = db.prepare('SELECT * FROM data').all();

    // 가공
    const formattedData = {};
    rows.forEach((row) => {
      formattedData[row.class] = {
        attacked: row.attacked,
        score: row.score,
      };
    });

    return formattedData;
  } catch (err) {
    console.error('데이터 조회 오류:', err.message);
    throw err;
  }
}

// 데이터 업데이트 함수
function DataUpdate(clientData) {
  try {
    const updateStmt = db.prepare('UPDATE data SET attacked = ?, score = ? WHERE class = ?');

    for (const className in clientData) {
      const { attacked, defensed } = clientData[className];

      // 데이터베이스에서 해당 class의 현재 상태를 가져옴
      const row = db.prepare('SELECT attacked, score FROM data WHERE class = ?').get(className);

      if (row) {
        let { attacked: currentAttacked, score: currentScore } = row;

        // score 증감
        currentScore += defensed;
        let temp = currentScore;
        currentScore -= attacked;

        // attacked 증가
        if (currentScore >= 0) {
          currentAttacked += attacked;
        } else {
          currentAttacked += temp;
          currentScore = 0;
        }

        // 데이터베이스에 업데이트된 값 저장
        updateStmt.run(currentAttacked, currentScore, className);
      }
    }
  } catch (err) {
    console.error('데이터 업데이트 오류:', err.message);
    throw err;
  }
}

module.exports = { fetchData, DataUpdate };