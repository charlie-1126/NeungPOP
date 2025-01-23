const Database = require('better-sqlite3'); // better-sqlite3 모듈 불러오기

// SQLite 데이터베이스 연결
const db = new Database('./class_score.db', { verbose: console.log }); // verbose는 SQL 쿼리를 로그로 출력하게 설정

// 테이블 생성
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class TEXT NOT NULL UNIQUE,
      attacked INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0
    )
  `).run();

  console.log('data 테이블이 준비되었습니다.');

  // 초기 데이터를 삽입
  const classes = [
    '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
    '2-1', '2-2', '2-3', '2-4', '2-5', '2-6',
    '3-1', '3-2', '3-3', '3-4', '3-5', '3-6'
  ];

  const insertStmt = db.prepare('INSERT OR IGNORE INTO data (class) VALUES (?)');

  // 여러 클래스를 삽입
  classes.forEach((className) => {
    insertStmt.run(className);
  });

  console.log('초기 데이터 삽입 완료.');
} catch (err) {
  console.error('데이터베이스 작업 중 오류 발생:', err.message);
}

// db 객체를 외부에서 사용할 수 있도록 내보냄
module.exports = db;