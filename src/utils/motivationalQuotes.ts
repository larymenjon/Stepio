import { getDailyQuotes } from "@/i18n";
import type { AppLanguage } from "@/i18n";

export function getRandomQuote(language: AppLanguage): string {
  const quotes = getDailyQuotes(language);
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

export function getDailyQuote(language: AppLanguage): string {
  const quotes = getDailyQuotes(language);
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % quotes.length;
  return quotes[index];
}