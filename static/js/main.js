import { delay, typewriter, highlightOption, numberToColoredSpan } from "./modules/effects.js";
import { startGame, postRoundData, fetchRoundData, readRoundData } from "./modules/rounds.js";

const header = document.getElementById("header");
const headerInfo = document.getElementById("header-info");
const balance = document.getElementById("balance");
const mainText = document.getElementById("main-text");
const coins = document.getElementById("coins");
const confirmButton = document.getElementById("confirm");
const footer = document.getElementById("footer");

const pickTimerDuration = 30;
const playerFirst = Math.random() > 0.5;

let score = 0;
let round = 0;

header.style.visibility = "hidden";
footer.style.visibility = "hidden";
coins.style.display = "none";

confirmButton.addEventListener("click", async function() {
    confirmButton.style.display = "none";
    
    await startGame();

    await typewriter(mainText, "Looking for partner");
    let ellipses = 0;
    const ellipsesInterval = setInterval(() => {
        mainText.textContent = "Looking for partner"+".".repeat(ellipses+1);
        ellipses = (ellipses + 1) % 3;
    }, 400);

    await delay(5000 + Math.random() * 8000);
    clearInterval(ellipsesInterval);

    typewriter(mainText, "Partner found.");
    await delay(3000);

    typewriter(mainText, "Welcome to Coin Game!");
    await delay(4000);

    typewriter(mainText, "You and your partner have a shared balance.");
    await delay(5000);

    typewriter(mainText, "You will take turns selecting a coin, and its value will be added to your balance.");
    await delay(6000);

    typewriter(mainText, "Either player may also pass their turn to their partner.");
    await delay(5000);

    typewriter(mainText, "Good luck!");
    await delay(4000);

    balance.innerHTML = "Balance: "+numberToColoredSpan(0);
    header.style.visibility = "visible";
    footer.style.visibility = "visible";
    confirmButton.textContent = "Let my partner choose!";
    newRound();
}, {once: true});

async function adjustScore(messageStart, delta, messageEnd) {
    score += delta;
    
    await typewriter(mainText, messageStart+numberToColoredSpan(delta)+messageEnd);
    typewriter(balance, "Balance: "+numberToColoredSpan(delta));
}

function enablePlayerPick() {
    let elementsWithListeners = [];
    let onPick = null;

    const playerPickPromise = new Promise ((resolve, reject) => {
        onPick = (event) => {
            const closestCoin = event.target.closest("#blue-coin") || event.target.closest("#yellow-coin") || event.target.closest("#green-coin");

            if (closestCoin) {
                resolve(closestCoin.id);
            } else if (event.target.id == "confirm") {
                resolve("pass");
            } else {
                reject();
            }

            clearEventListeners();
        }

        for (const child of coins.children) {
            child.addEventListener("click", onPick);
            elementsWithListeners.push(child);
        }
        confirmButton.addEventListener("click", onPick);
        elementsWithListeners.push(confirmButton);
    })

    const clearEventListeners = () => {
        for (const element of elementsWithListeners) {
            element.removeEventListener("click", onPick);
        }
    }

    playerPickPromise.stop = clearEventListeners;

    return playerPickPromise;
}

function startFooterTimer(messageStart, duration, messageEnd) {
    footer.textContent = messageStart+duration.toString()+messageEnd;

    let footerInterval = null;
    const footerTimerPromise = new Promise(resolve => {
        footerInterval = setInterval(() => {
            duration--;

            if (duration >= 0) {
                footer.textContent = messageStart+duration.toString()+messageEnd;
            } else {
                clearInterval(footerInterval);
                footer.textContent = "";
                resolve("footerTimer");
            }
        }, 1000);
    });

    footerTimerPromise.stop = () => {
        clearInterval(footerInterval);
        footer.textContent = "";
    }

    return footerTimerPromise;
}

async function partnerPick(passed) {
    coins.style.display = "none";
    confirmButton.style.display = "none";

    if (passed) {
        typewriter(mainText, "You passed your turn to your partner. They're making a selection.");
        confirmButton.classList.add("transparent");
    } else {
        typewriter(mainText, "It's your partner's turn. They're making a selection.");
    }

    const footerTimerPromise = startFooterTimer("Your partner has ", pickTimerDuration, " seconds remaining.");

    await delay(Math.random()*5000 + 3000);

    if (round == 1) {
        await delay(2000);
    }

    let winner = null;
    if (!passed && parseInt(readRoundData("p2surrendered"))) {
        winner = "pass";
        typewriter(mainText, "Your partner passed their turn to you!");
    } else {
        winner = "coin";
        typewriter(mainText, "Your partner selected a coin...");
    }
    footerTimerPromise.stop();
    await delay(3000);

    let points = null;
    if (winner != "pass") {
        if (passed) {
            points = readRoundData("p1surrendered");
        } else {
            points = readRoundData("p2move");
        }
        points = parseInt(points);

        adjustScore("...the coin was worth ", points, " points"+(points>0 ? "!" : "."));
        await delay(5000);
    } else {
        points = await playerPick(true);
    }

    return points;
}

async function playerPick(passed) {
    highlightOption(null);

    const startTime = new Date;

    if (passed) {
        typewriter(mainText, "Your partner passed you their turn! Please make a selection.");
        confirmButton.classList.add("disabled");
        confirmButton.classList.add("transparent");
    } else {
        typewriter(mainText, "It's your turn. Please make a selection.");
        confirmButton.classList.remove("disabled");
        confirmButton.classList.remove("transparent");
    }
    coins.classList.remove("disabled");
    coins.classList.remove("transparent");
    coins.style.display = "flex";
    confirmButton.style.display = "block";
    
    const footerTimerPromise = startFooterTimer("You have ", pickTimerDuration, " seconds remaining.");
    const playerPickPromise = enablePlayerPick();

    let raceWinner = null;
    let timerExpired = false;
    const race = Promise.race([footerTimerPromise, playerPickPromise]).then(async (value) => {
        coins.classList.add("disabled");
        confirmButton.classList.add("disabled");

        if (value == "footerTimer") {
            playerPickPromise.stop();
            timerExpired = true;
        } else {
            footerTimerPromise.stop();
            raceWinner = value;
        }
    })

    await race;
    const endTime = new Date;

    if (timerExpired) {
        if (passed) {
            const coinColor = ["blue", "yellow", "green"].at(Math.floor(Math.random()*3));
            raceWinner = coinColor+"-coin";
            typewriter(mainText, "You did not make a selection in time, so you selected the "+coinColor+" coin at random.");
        } else {
            raceWinner = "timeout";
            typewriter(mainText, "You did not make a selection in time, so your turn has been passed to your partner.");
        }
        await delay(2000);
    } else if (raceWinner == "pass") {
        typewriter(mainText, "You passed your turn to your partner.");
    } else {
        typewriter(mainText, "You selected the "+raceWinner.slice(0, -5)+" coin...");
    }
    highlightOption(raceWinner=="timeout"?"pass":raceWinner);
    await delay(3000);

    let points = null;
    if (raceWinner != "pass" && raceWinner != "timeout") {
        if (passed) {
            points = readRoundData("p2move");
        } else {
            points = readRoundData("p1move");
        }
        points = parseInt(points);

        adjustScore("...the "+raceWinner.slice(0, -5)+" coin was worth ", points, " points"+(points>0 ? "!" : "."));
        await delay(5000);
    } else {
        points = await partnerPick(true);
    }

    if (!passed) {
        postRoundData(raceWinner, points, (endTime.getTime()-startTime.getTime())/1000);
    }

    return points;
}

async function newRound() {
    round++;
    typewriter(headerInfo, "Round "+round.toString()+"/"+readRoundData("roundsQuantity").toString());

    await fetchRoundData();

    if (playerFirst) {
        await playerPick(false);
        await partnerPick(false);
    } else {
        await partnerPick(false);
        await playerPick(false);
    }

    if (round < readRoundData("roundsQuantity")) {
        newRound();
    } else {
        header.style.visibility = "hidden";
        footer.style.visibility = "hidden";
        coins.style.display = "none";
        confirmButton.style.display = "none";

        await typewriter(mainText, "The game has ended...");
        await delay(3000);
        await typewriter(mainText, "Thank you for playing! Your final score was "+numberToColoredSpan(score)+".");
    }
}