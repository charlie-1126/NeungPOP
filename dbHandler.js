const sqlite3 = require('sqlite3').verbose();

// SQLite 데이터베이스 연결
const db = new sqlite3.Database('./class_score.db', (err) => {
    if (err) {
        console.error('데이터베이스 연결 오류:', err.message);
    }
});

// 데이터베이스에서 데이터를 조회하는 함수
function fetchData() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM data', [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            //가공
            const formattedData = {};
            rows.forEach((row) => {
                formattedData[row.class] = {
                    attacked: row.attacked,
                    score: row.score,
                };
            });
            resolve(formattedData);
        });
    });
}

async function DataUpdate(clientData){
    for (const className in clientData) {
        const { attacked, defensed } = clientData[className];
        
        // 데이터베이스에서 해당 class의 현재 상태를 가져옴
        db.get('SELECT attacked, score FROM data WHERE class = ?', [className], (err, row) => {
            if (err) {
                console.error('데이터 조회 오류:', err.message);
                return;
            }

            if (row) {
                let { attacked: currentAttacked, score: currentScore } = row;

                // score 증감
                currentScore += defensed;
                let temp = currentScore;
                currentScore -= attacked
                // attacked 증가
                if (currentScore >= 0) {
                    currentAttacked += attacked;
                }
                else{
                    currentAttacked += temp;
                    currentScore = 0;
                }

                // 데이터베이스에 업데이트된 값 저장
                db.run('UPDATE data SET attacked = ?, score = ? WHERE class = ?', [currentAttacked, currentScore, className], (err) => {
                    if (err) {
                        console.error('데이터 업데이트 오류:', err.message);
                    }
                });
            }
        });
    }
}

module.exports = { fetchData, DataUpdate };