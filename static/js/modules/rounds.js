let uuid = null;
let roundsQuantity = null;
let cachedRoundData = null;
const csrfToken = document.querySelector('meta[name="csrf-token"]').content; 

export async function startGame() {
    const res = await fetch("start_game", {method: "GET"});
    if (!res.ok) {
        throw new Error("Error starting game");
    }
    const json = await res.json();
    uuid = json.uuid;
    roundsQuantity = json.rounds;
    console.log(json);
}

export async function postRoundData(selected, value, deltatime) {
    const formData = new FormData();
    formData.append("selected", selected);
    formData.append("value", value);
    formData.append("deltatime", Math.max(0, deltatime));

    const res = await fetch("round_data/"+uuid, {method: "POST", body: formData, headers: {'X-CSRFToken': csrfToken}});
    if (!res.ok) {
        throw new Error("Error sending round data");
    }
}

export async function fetchRoundData() {
    const res = await fetch("round_data/"+uuid, {method: "GET"});
    if (!res.ok) {
        throw new Error("Error getting round data");
    }
    cachedRoundData = await res.json();
}

export function readRoundData(data_name) {
    if (data_name == "roundsQuantity") {
        return roundsQuantity;
    } else {
        return cachedRoundData[data_name];
    }
}