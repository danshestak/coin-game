let uuid = null;
const csrfToken = document.querySelector('meta[name="csrf-token"]').content; 

export async function fetchUUID() {
    const res = await fetch("start_game", {method: "GET"});
    if (!res.ok) {
        throw new Error("Error starting game");
    }
    const json = await res.json();
    uuid = json.uuid;
    console.log(uuid);
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