const log = [];

export function newLogEntry(selected, value, deltaTime) {
    log.push([selected, value, deltaTime]);
}

export function getLog() {
    return log;
}