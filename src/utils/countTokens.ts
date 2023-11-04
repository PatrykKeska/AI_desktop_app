import { encode, isWithinTokenLimit } from "gpt-tokenizer";

export const countTokens = (chat: string, tokenLimit: number) => {
	const tokens = encode(JSON.stringify(chat));
	console.log("tokens", tokens);
	const withinTokenLimit = isWithinTokenLimit(JSON.stringify(chat), tokenLimit);
	console.log("withinTokenLimit", withinTokenLimit);
};
