interface GuessConstructorParams {
    playerId: string;
    guesses: boolean[];
}

export default class Guess {
    public playerId: string;
    public guesses: boolean[];

    constructor({ playerId, guesses }: GuessConstructorParams) {
        this.playerId = playerId;
        this.guesses = guesses;
    }
}
