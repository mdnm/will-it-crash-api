interface BitcoinPriceDataConstructorParams {
    price: number;
    timestamp: number;
}

export default class BitcoinPriceData {
    public price: number;
    public timestamp: number;

    constructor({ price, timestamp }: BitcoinPriceDataConstructorParams) {
        this.price = price;
        this.timestamp = timestamp;
    }
}
