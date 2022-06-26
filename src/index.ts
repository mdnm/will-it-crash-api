import { CheckGuessService } from './check-guess-service/CheckGuessService';
import BitcoinPriceHistoryRepository from './repositories/BitcoinPriceHistoryRepository';

const bitcoinPriceTableName = process.env.BTCPRICES_TABLE_NAME;
if (!bitcoinPriceTableName) {
    throw new Error('BTCPRICES_TABLE_NAME env variable was not set');
}

const bitcoinPriceHistoryRepository = new BitcoinPriceHistoryRepository(bitcoinPriceTableName);
const checkGuessService = new CheckGuessService(bitcoinPriceHistoryRepository);

export const checkGuessServiceHandler = checkGuessService.execute.bind(checkGuessService);
