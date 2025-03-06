const WebSocket = require('ws');
const env = require('dotenv');
const { fetchData, updateData, resetDB } = require('./services/dbHandler');
const { setSchedule, getSchedule } = require('./services/scheduler');
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.tz.setDefault('Asia/Seoul');
env.config();

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
                if (clientData.type){
                    // db업데이트
                    if (clientData.type == "update"){
                        updateData(clientData.data); // 데이터 처리
    
                        const dataToSend = fetchData(); // 데이터베이스에서 데이터 가져오기
                        ws.send(JSON.stringify({type: "update", status: "success", data: dataToSend})); // 클라이언트로 데이터 전송
                    }
                    // db 초기화
                    else if (clientData.type == "reset"){
                        if (clientData.data.pw == process.env.PW){ // 비번
                            if (clientData.data.date == null){// 날짜 입력 x
                                resetDB();
                                ws.send(JSON.stringify({type: "message", status: "success", data: "초기화 완료"}));
                            }
                            else{
                                const date = clientData.data.date;
                                const now = dayjs().tz();
                                if (dayjs(date).isValid()){ // 날짜 검증
                                    if (dayjs(date).isAfter(now)){
                                        setSchedule(dayjs.tz(date));
                                        ws.send(JSON.stringify({type: "message", status: "success", data: `${dayjs.tz(date).format("YYYY/MM/DD HH:mm:ss")}에 초기화 등록됨`}));
                                    }
                                    else{
                                        ws.send(JSON.stringify({type: "message", status: "faild", data: "현재시간 이후의 시간만 입력해주세요."}));
                                    }
                                }
                                else{
                                    ws.send(JSON.stringify({type: "message", status: "faild", data: "알맞지 않은 날짜 형식"}));
                                }
                            }
                        }
                        else{
                            ws.send(JSON.stringify({type: "message", status: "faild", data: "올바르지 않은 비밀번호입니다."}));
                        }
                    }
                    else if(clientData.type == "getResetSchedule"){
                        ws.send(JSON.stringify({type: "message", status: "success", data: `${getSchedule()? `${getSchedule()}에 초기화 예정` : "초기화 예정 없음."}`}));
                    }
                    else{
                        ws.send(JSON.stringify({type: "message", status: "faild", data: "올바르지 않은 type값"}));
                    }
                }
                else{
                    ws.send(JSON.stringify({type: "message", status: "faild", data: "올바르지 않은 type값"}));
                }
            } catch (error) {
                console.error('데이터 처리 오류:', error.message);
            }
        });

        ws.on('close', () => {
            console.log('A client disconnected');
        });
    });
};