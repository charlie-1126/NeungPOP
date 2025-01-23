const WebSocket = require('ws');
const { fetchData, DataUpdate } = require('./dbHandler');

module.exports = function (server) {
    const wss = new WebSocket.Server({ server }); // Express 서버와 웹소켓 서버 연결

    //클라이언트와 웹소켓 연결완료
    wss.on('connection', async (ws) => {
        console.log('A client connected');

        try {
            const initialData = await fetchData(); // 데이터베이스에서 데이터 가져오기
            ws.send(JSON.stringify(initialData)); // 클라이언트로 데이터 전송
        } catch (error) {
            console.error('데이터 전송 오류:', error.message);
        }
        
        //클라이언트로부터 메세지를 받았을때
        ws.on('message', async (message) => {
            const decodedMessage = message.toString();  // Buffer를 문자열로 변환

            try {
                const clientData = JSON.parse(decodedMessage); // JSON 데이터 파싱
                await DataUpdate(clientData); // 데이터 처리
    
                const dataToSend = await fetchData(); // 데이터베이스에서 데이터 가져오기
                ws.send(JSON.stringify(dataToSend)); // 클라이언트로 데이터 전송
            } catch (error) {
                console.error('데이터 처리 오류:', error.message);
            }
        });

        ws.on('close', () => {
            console.log('A client disconnected');
        });
    });
};