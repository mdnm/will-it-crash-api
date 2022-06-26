export default class CheckGuessServiceBody {
    public playerId: string;
    public guess: 'yes' | 'no';
    public btcPrice: number;
    public lastGuessTimestamp: number;

    constructor({ playerId, guess, btcPrice, lastGuessTimestamp }: CheckGuessServiceBody) {
        this.playerId = playerId;
        this.guess = guess;
        this.btcPrice = btcPrice;
        this.lastGuessTimestamp = lastGuessTimestamp;
    }

    isValid() {
        const isGuessValid = this.guess === 'yes' || this.guess === 'no';

        return (
            typeof this.playerId === 'string' &&
            isGuessValid &&
            typeof this.btcPrice === 'number' &&
            typeof this.lastGuessTimestamp === 'number'
        );
    }
}
