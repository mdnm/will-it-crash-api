export default class CheckGuessServiceBody {
    public id: string;
    public guess: 'yes' | 'no';
    public btcPrice: number;
    public lastGuessTimestamp: number;

    constructor({ id, guess, btcPrice, lastGuessTimestamp }: CheckGuessServiceBody) {
        this.id = id;
        this.guess = guess;
        this.btcPrice = btcPrice;
        this.lastGuessTimestamp = lastGuessTimestamp;
    }

    isValid() {
        const isGuessValid = this.guess === 'yes' || this.guess === 'no';

        return (
            typeof this.id === 'string' &&
            isGuessValid &&
            typeof this.btcPrice === 'number' &&
            typeof this.lastGuessTimestamp === 'number'
        );
    }
}
