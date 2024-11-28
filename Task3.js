const crypto = require("crypto");
const readline = require("readline-sync");

class DiceParser {
    static parseDice(args) {
        if (args.length < 3) {
            throw new Error(
                "Error: At least 3 dice configurations are required. Example usage:\nnode game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3"
            );
        }
        return args.map(arg => {
            const dice = arg.split(",").map(value => {
                if (!/^\d+$/.test(value)) {
                    throw new Error(
                        `Error: Dice configuration must only contain integers. Invalid input: ${arg}`
                    );
                }
                return Number(value);
            });
            if (dice.length !== 6) {
                throw new Error(
                    `Error: Each dice must have exactly 6 integers. Invalid input: ${arg}`
                );
            }
            return dice;
        });
    }
}


class FairRandomGenerator {
    static generateRandom(range) {
        const key = crypto.randomBytes(32).toString("hex");
        const randomValue = crypto.randomInt(0, range);
        const hmac = crypto
            .createHmac("sha3-256", key)
            .update(randomValue.toString())
            .digest("hex");
        return { key, randomValue, hmac };
    }
}

class ProbabilityCalculator {
    static calculateProbabilities(dice) {
        const probabilities = Array.from({ length: dice.length }, () =>
            Array(dice.length).fill(0)
        );

        for (let i = 0; i < dice.length; i++) {
            for (let j = 0; j < dice.length; j++) {
                if (i === j) continue;

                let wins = 0;
                let total = dice[i].length * dice[j].length;

                for (let rollA of dice[i]) {
                    for (let rollB of dice[j]) {
                        if (rollA > rollB) {
                            wins++;
                        }
                    }
                }

                probabilities[i][j] = wins / total;
            }
        }

        return probabilities;
    }
}


class TableGenerator {
    static generateTable(dice, probabilities) {
        console.log("\nDice Probabilities (Row vs Column):");
        console.log("   " + dice.map((_, i) => `D${i}`).join("    "));
        probabilities.forEach((row, i) => {
            console.log(
                `D${i} ` +
                    row
                        .map(p => (p === 0 ? "-" : `${(p * 100).toFixed(1)}%`))
                        .join("  ")
            );
        });
        console.log(""); 
    }
}


class Player {
    constructor(name) {
        this.name = name;
    }

    chooseDice(dice, usedDice) {
        console.log(`${this.name}, choose a dice:`);
        dice.forEach((die, index) => {
            if (!usedDice.includes(index)) {
                console.log(`${index}: ${die.join(",")}`);
            }
        });
        while (true) {
            const choice = readline.question("Your selection (or ? for help, X to exit): ");
            if (choice.toUpperCase() === "X") process.exit();
            if (choice === "?") {
                console.log("Enter a number to choose a dice, or X to exit.");
                continue;
            }
            const numChoice = parseInt(choice);
            if (!isNaN(numChoice) && !usedDice.includes(numChoice) && dice[numChoice]) {
                console.log(`You chose the dice: [${dice[numChoice].join(",")}]`);
                return numChoice;
            }
            console.log("Invalid choice. Try again.");
        }
    }

    throwDice(die) {
        const { randomValue, hmac, key } = FairRandomGenerator.generateRandom(die.length);
        console.log(`I selected a random value (HMAC=${hmac}).`);
        while (true) {
            const choice = readline.question("Add your number modulo dice length (or ? for help, X to exit): ");
            if (choice.toUpperCase() === "X") process.exit();
            if (choice === "?") {
                console.log("Enter a number between 0 and dice length - 1, or X to exit.");
                continue;
            }
            const numChoice = parseInt(choice);
            if (!isNaN(numChoice) && numChoice >= 0 && numChoice < die.length) {
                const result = (randomValue + numChoice) % die.length;
                console.log(
                    `My number: ${randomValue} (KEY=${key}). Result: ${randomValue} + ${numChoice} = ${result} (mod ${die.length}).`
                );
                return die[result];
            }
            console.log("Invalid choice. Try again.");
        }
    }
}

class GameEngine {
    constructor(dice) {
        this.dice = dice;
        this.usedDice = [];
        this.user = new Player("User");
        this.computer = new Player("Computer");
    }

    determineFirstMove() {
        const { randomValue, hmac, key } = FairRandomGenerator.generateRandom(2);
        console.log(`Let's determine who makes the first move.\nHMAC=${hmac}`);
        while (true) {
            const choice = readline.question("Your selection (0 or 1, ? for help, X to exit): ");
            if (choice.toUpperCase() === "X") process.exit();
            if (choice === "?") {
                console.log("Enter 0 or 1 to guess, or X to exit.");
                continue;
            }
            const numChoice = parseInt(choice);
            if (!isNaN(numChoice) && (numChoice === 0 || numChoice === 1)) {
                console.log(`My selection: ${randomValue} (KEY=${key}).`);
                if (numChoice === randomValue) {
                    console.log("You guessed correctly! You make the first move.");
                    return true;
                }
                console.log("I make the first move.");
                return false;
            }
            console.log("Invalid choice. Try again.");
        }
    }

    playGame() {
        const probabilities = ProbabilityCalculator.calculateProbabilities(this.dice);
        TableGenerator.generateTable(this.dice, probabilities);

        const userFirst = this.determineFirstMove();
        let userDie, computerDie;

        if (userFirst) {
            userDie = this.user.chooseDice(this.dice, this.usedDice);
            this.usedDice.push(userDie);
            computerDie = this.chooseComputerDice();
        } else {
            computerDie = this.chooseComputerDice();
            this.usedDice.push(computerDie);
            userDie = this.user.chooseDice(this.dice, this.usedDice);
        }

        const computerThrow = this.computer.throwDice(this.dice[computerDie]);
        const userThrow = this.user.throwDice(this.dice[userDie]);

        console.log(`Computer throw: ${computerThrow}`);
        console.log(`User throw: ${userThrow}`);
        if (userThrow > computerThrow) {
            console.log("You win!");
        } else if (userThrow < computerThrow) {
            console.log("Computer wins!");
        } else {
            console.log("It's a tie!");
        }
    }

    chooseComputerDice() {
        const choices = this.dice.map((_, index) => index).filter(
            index => !this.usedDice.includes(index)
        );
        const choice = choices[Math.floor(Math.random() * choices.length)];
        console.log(`Computer chooses the dice: [${this.dice[choice].join(",")}]`);
        return choice;
    }
}

try {
    const args = process.argv.slice(2);
    const dice = DiceParser.parseDice(args);

    console.log("Welcome to the Dice Game!");
    const engine = new GameEngine(dice);
    engine.playGame();
} catch (error) {
    console.error(error.message);
}
