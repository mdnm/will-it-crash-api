interface GuessConstructorParams {
    playerId: string;
    guessedCorrectly: boolean;
}

export default class Guess {
    public playerId: string;
    public guessedCorrectly: boolean;

    constructor({ playerId, guessedCorrectly }: GuessConstructorParams) {
        this.playerId = playerId;
        this.guessedCorrectly = guessedCorrectly;
    }
}
