const schedule = require('node-schedule');
const dayjs = require('dayjs');
const fs = require('fs');
const path = require('path');
const { resetDB } = require('./dbHandler');
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.tz.setDefault('Asia/Seoul');

function getServerTimeCron(kst) {
    const serverTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const servertime = kst.tz(serverTimeZone);
    return servertime.toDate();
}

async function setSchedule(kst) {
    const dataFilePath = path.join(__dirname, "../data/resetTime.json");
    
    let data = {};
    const fileContent = fs.readFileSync(dataFilePath, "utf-8");
    if (fileContent.trim()) {
        data = JSON.parse(fileContent);
    }

    if (data.job) {
        data.job.cancel();
    }

    data.job = schedule.scheduleJob(getServerTimeCron(kst), () => {
        resetDB();
        delete data.job;
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    });

    const dataToSave = { ...data };
    delete dataToSave.job;
    fs.writeFileSync(dataFilePath, JSON.stringify(dataToSave, null, 2));
}

module.exports = { setSchedule };