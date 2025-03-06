const schedule = require('node-schedule');
const dayjs = require('dayjs');
const fs = require('fs');
const path = require('path');
const { resetDB } = require('./dbHandler');
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.tz.setDefault('Asia/Seoul');

let currentJob = null;

function setSchedule(kst) {
    const dataFilePath = path.join(__dirname, "../data/resetTime.json");
    
    if (currentJob) {
        currentJob.cancel();
        currentJob = null;
    }
    
    const scheduledTime = kst.toDate();
    
    // 스케줄 등록
    currentJob = schedule.scheduleJob(scheduledTime, () => {
        resetDB();
        fs.writeFileSync(dataFilePath, JSON.stringify({}, null, 2));
        currentJob = null;
    });
    
    const dataToSave = {
        time: scheduledTime
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(dataToSave, null, 2));
}

function initSchedule() {
    const dataFilePath = path.join(__dirname, "../data/resetTime.json");
    let data = {};
    try {
        const fileContent = fs.readFileSync(dataFilePath, "utf-8");
        if (fileContent.trim()) {
            data = JSON.parse(fileContent);
        }
    } catch (error) {
        console.error(error);
        return;
    }
    
    if (!data.time) return;
    
    const scheduledTime = dayjs(data.time);
    const now = dayjs().tz();
    
    if (scheduledTime.isAfter(now)) {
        currentJob = schedule.scheduleJob(scheduledTime.toDate(), () => {
            resetDB();
            fs.writeFileSync(dataFilePath, JSON.stringify({}, null, 2));
            currentJob = null;
        });
    } else {
        fs.writeFileSync(dataFilePath, JSON.stringify({}, null, 2));
        console.log("만료된 스케줄 삭제");
    }
}

module.exports = { setSchedule, initSchedule };