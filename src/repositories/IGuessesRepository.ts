import Guess from '../models/Guess';

export interface CreateGuessParam {
    playerId: string;
    correctGuess: boolean;
}
export default interface IGuessesRepository {
    getPlayerGuesses(playerId: string): Promise<Guess | null>;
    createGuess(guessData: CreateGuessParam): Promise<void>;
}
