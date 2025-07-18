const log = [];
let uuid = null;

export async function fetchUUID() {
    const res = await fetch("start_game", {method: "get"});
    if (!res.ok) {
        throw new Error("Error starting game");
    }
    const json = await res.json();
    uuid = json.uuid;
    console.log(uuid);
}

export function newLogEntry(selected, value, deltaTime) {
    log.push([selected, value, deltaTime]);
}

export function getLog() {
    return log;
}