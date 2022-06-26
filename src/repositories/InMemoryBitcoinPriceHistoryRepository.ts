import BitcoinPriceData from '../models/BitcoinPriceData';
import IBitcoinPriceHistoryRepository from './IBitcoinPriceHistoryRepository';

export default class InMemoryBitcoinPriceHistoryRepository implements IBitcoinPriceHistoryRepository {
    private bitcoinPrices: BitcoinPriceData[];
    private alwaysCrashPrices: boolean;

    constructor(alwaysCrashPrices?: boolean) {
        this.bitcoinPrices = [];
        this.alwaysCrashPrices = alwaysCrashPrices || true;
    }

    setAlwaysCrashPrices(value: boolean) {
        this.alwaysCrashPrices = value;
    }

    async getPastPriceTimestampPair({ price, timestamp }: BitcoinPriceData) {
        const bitcoinPriceData = this.bitcoinPrices.find(
            (bitcoinPrice) => bitcoinPrice.price === price && bitcoinPrice.timestamp === timestamp,
        );

        return bitcoinPriceData || null;
    }

    async getCurrentPriceTimestampPair() {
        const lastPriceData = this.bitcoinPrices[this.bitcoinPrices.length - 1];
        const newPrice = this.alwaysCrashPrices ? lastPriceData.price - 1 : lastPriceData.price + 1;

        return new BitcoinPriceData({
            price: newPrice,
            timestamp: Date.now(),
        });
    }

    async createPriceTimestampPair({ price, timestamp }: BitcoinPriceData): Promise<void> {
        this.bitcoinPrices.push({ price, timestamp });
    }
}
