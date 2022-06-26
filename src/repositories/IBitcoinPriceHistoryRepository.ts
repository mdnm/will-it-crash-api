import BitcoinPriceData from '../models/BitcoinPriceData';

export default interface IBitcoinPriceHistoryRepository {
    getPastPriceTimestampPair(bitcoinPriceData: BitcoinPriceData): Promise<BitcoinPriceData | null>;
    getCurrentPriceTimestampPair(): Promise<BitcoinPriceData>;
    createPriceTimestampPair(bitcoinPriceData: BitcoinPriceData): Promise<void>;
}
