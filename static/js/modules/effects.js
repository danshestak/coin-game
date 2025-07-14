export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms, "delay"));
}

const typewriterDelayMap = new Map();
typewriterDelayMap.set(".", 150);
typewriterDelayMap.set("!", 150);
typewriterDelayMap.set(":", 150);
typewriterDelayMap.set(",", 75);

const typewriterMessageIdMap = new Map();
export function typewriter(element, message) {
    return new Promise(async resolve => {
        let cachedMessageId = typewriterMessageIdMap.get(element);
        if (cachedMessageId == undefined) {
            cachedMessageId = 0;
        } else {
            cachedMessageId++;
        }

        typewriterMessageIdMap.set(element, cachedMessageId);

        element.innerHTML = "";
        let index = 0;
        while (index <= message.length) {
            if (typewriterMessageIdMap.get(element) != cachedMessageId) {
                break;
            }

            const char = message[index]

            if (char == "<") {
                index = message.indexOf(">", index);
            }
            element.innerHTML = message.slice(0, index+1);

            const delayMapValue = typewriterDelayMap.get(char);
            if (delayMapValue) {
                await delay(delayMapValue);
            } else if (char != " " && char != "<") {
                await delay(25);
            }

            index++;
        }

        resolve();
    })
}

const coins = document.getElementById("coins");
const confirmButton = document.getElementById("confirm");
export function highlightOption(option) {
    if (option == null) {
        confirmButton.classList.remove("transparent");
        for (const child of coins.children) {
            child.classList.remove("transparent");
        }
    } else if (option == "pass") {
        confirmButton.classList.remove("transparent");
        for (const child of coins.children) {
            child.classList.add("transparent");
        }
    } else if (option.slice(-4) == "coin") {
        confirmButton.classList.add("transparent");
        for (const child of coins.children) {
            if (child.id == option) {
                child.classList.remove("transparent");
            } else {
                child.classList.add("transparent");
            }
        }
    }
}