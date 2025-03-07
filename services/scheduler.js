const schedule = require('node-schedule');
const dayjs = require('dayjs');
const fs = require('fs');
const path = require('path');
const { resetDB } = require('./dbHandler');
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.tz.setDefault('Asia/Seoul');

const dataFilePath = path.join(__dirname, "../data/resetTime.json");

let jobs = {};

function saveSchedules() {
    const dataToSave = {};
    for (const id in jobs) {
        dataToSave[id] = jobs[id].time;
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(dataToSave, null, 2));
}

function checkTime(time){
    for (const otherId in jobs) {
        if (new Date(jobs[otherId].time).getTime()/1000 === time.unix()) {
            return false;
        }
    }
    return true;
}

/**
 * @param {string|number} [id]
 * @param {dayjs.Dayjs} kst
 */
function setSchedule(id, kst) {
    if (!id) {
        id = dayjs().unix().toString();
    } else {
        id = id.toString();
    }
    const scheduledTime = kst.toDate();

    if (jobs[id]) {
        jobs[id].job.cancel();
    }

    // 스케줄 등록
    const job = schedule.scheduleJob(scheduledTime, () => {
        resetDB();
        delete jobs[id];
        saveSchedules();
    });

    jobs[id] = { job, time: scheduledTime };

    saveSchedules();
    return id;
}

/**
 * @param {string|number} id
 */
function cancelSchedule(id) {
    id = id.toString();
    if (jobs[id]) {
        jobs[id].job.cancel();
        delete jobs[id];
        saveSchedules();
        return true;
    }
    return false;
}

function checkId(id){
    if (jobs[id]) return true;
    return false;
}

function initSchedule() {
    let data = {};
    try {
        const fileContent = fs.readFileSync(dataFilePath, "utf-8");
        if (fileContent.trim()) {
            data = JSON.parse(fileContent);
        }
    } catch (error) {
        console.error("스케줄 파일 읽기 에러:", error);
        return;
    }
    
    // 파일에 저장된 모든 예약에 대해 스케줄 재설정
    for (const id in data) {
        const scheduledTime = dayjs(data[id]);
        const now = dayjs().tz();
        if (scheduledTime.isAfter(now)) {
            const job = schedule.scheduleJob(scheduledTime.toDate(), () => {
                resetDB();
                delete jobs[id];
                saveSchedules();
            });
            jobs[id] = { job, time: scheduledTime.toDate() };
        } else {
            console.log(`만료된 스케줄(id: ${id}) 삭제`);
        }
    }
    saveSchedules();
}

/**
 * @returns {object}
 */
function getSchedule() {
    const schedules = [];
    for (const id in jobs) {
        schedules.push({time: new Date(jobs[id].time).getTime(), text: `${dayjs(jobs[id].time).format("YYYY/MM/DD HH:mm:ss")}: ${id}`});
    }
    schedules.sort((a,b)=> a.time - b.time);
    return schedules.map(i=>i.text);
}

module.exports = { setSchedule, initSchedule, getSchedule, cancelSchedule, checkTime ,checkId };