const Database = require('better-sqlite3'); // better-sqlite3 모듈 불러오기

// SQLite 데이터베이스 연결
const db = new Database('./data/db.db');

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

function isValidData(clientData) {
    for (const className in clientData) {
      const { attacked, defensed } = clientData[className];

      if (typeof attacked !== 'number' || typeof defensed !== 'number') {
        console.error(`잘못된 데이터 형식: ${className}의 attacked 또는 defensed 값이 숫자가 아닙니다.`);
        return false;
      }
    }
    return true;
}

// 데이터 업데이트 함수
function updateData(clientData) {
  try {
    //유효성 검사
    if (!isValidData(clientData)) {
        throw new Error('잘못된 데이터 형식');
    }

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

module.exports = { fetchData, updateData };