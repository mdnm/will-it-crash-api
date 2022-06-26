import { CheckGuessService } from './check-guess-service/CheckGuessService';
import BitcoinPriceHistoryRepository from './repositories/BitcoinPriceHistoryRepository';

const bitcoinPriceHistoryRepository = new BitcoinPriceHistoryRepository('btcPrices');
const checkGuessService = new CheckGuessService(bitcoinPriceHistoryRepository);

export const checkGuessServiceHandler = checkGuessService.execute.bind(checkGuessService);
