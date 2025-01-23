const sqlite3 = require('sqlite3').verbose(); // sqlite3 모듈 불러오기

// SQLite 데이터베이스 연결
const db = new sqlite3.Database('./class_score.db', (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
  } else {
    console.log('SQLite 데이터베이스 연결 성공');
  }
});

// 테이블 생성
db.run(`
  CREATE TABLE IF NOT EXISTS data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class TEXT NOT NULL UNIQUE,
    attacked INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0
  )
`, (err) => {
  if (err) {
    console.error('테이블 생성 오류:', err.message);
  } else {
    console.log('data 테이블이 준비되었습니다.');

    // 초기 데이터를 삽입
    const classes = [
      '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
      '2-1', '2-2', '2-3', '2-4', '2-5', '2-6',
      '3-1', '3-2', '3-3', '3-4', '3-5', '3-6'
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO data (class) VALUES (?)');

    classes.forEach((className) => {
      stmt.run(className);
    });

    stmt.finalize();
  }
});

// db 객체를 외부에서 사용할 수 있도록 내보냄
module.exports = db;