/**
 * Comic value object and data fetching utilities
 * Centralizes validation, creation, navigation, serialization, and loading logic.
 */

import {
  formatDate,
  isValidComicDate,
  isValidComicDateRange,
  getFirstComicDate,
  getLastComicDate
} from './dateUtils.js';
import { imageUrlDatabase } from './imageUrlDatabase.js';
import { transcriptDatabase } from './transcriptDatabase.js';

// Constants
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static';

// ===== COMIC CLASS =====

export class Comic {
  #transcriptPromise = null;

  constructor({ date, formattedDate, url, transcript }) {
    this.date = date;
    this.formattedDate = formattedDate ?? formatDate(date);
    this.url = url ?? Comic.#resolveImageUrl(this.year, this.date);
    this.transcript = transcript ?? Comic.#resolveTranscript(this.date);
  }

  get year() {
    return this.date.split('-')[0];
  }

  // ===== NAVIGATION =====

  getPrevious() {
    const previousDate = Comic.#shiftDateWithinRange(this.date, -1);
    return previousDate ? Comic.fromDate(previousDate) : null;
  }

  getNext() {
    const nextDate = Comic.#shiftDateWithinRange(this.date, 1);
    return nextDate ? Comic.fromDate(nextDate) : null;
  }

  // ===== TRANSCRIPT LOADING =====

  async loadTranscript() {
    if (this.transcript) return this.transcript;
    if (this.#transcriptPromise) return this.#transcriptPromise;

    this.#transcriptPromise = this.#fetchTranscript();
    this.transcript = await this.#transcriptPromise;
    this.#transcriptPromise = null;
    return this.transcript;
  }

  async #fetchTranscript() {
    const dbTranscript = transcriptDatabase.getTranscript(this.date);
    if (dbTranscript) return dbTranscript;

    try {
      const cdnUrl = `${CDN_BASE}/dilbert-transcripts/${this.year}/${this.date}.json`;
      const localUrl = `/dilbert-transcripts/${this.year}/${this.date}.json`;

      let response;
      try {
        response = await fetch(cdnUrl);
        if (!response.ok) throw new Error('CDN fetch failed');
      } catch {
        response = await fetch(localUrl);
        if (!response.ok) throw new Error('Local fetch failed');
      }

      return await response.json();
    } catch (error) {
      console.warn(`Failed to fetch transcript for ${this.date}:`, error);
      return null;
    }
  }

  // ===== STATIC FACTORY METHODS =====

  static isValid(date) {
    if (!date || typeof date !== 'string') return false;
    return isValidComicDate(date) && isValidComicDateRange(date);
  }

  static fromDate(date) {
    if (!Comic.isValid(date)) return null;
    return new Comic({ date });
  }

  static fromSerialized(value) {
    if (!value) return null;
    if (value instanceof Comic) return value;
    if (!Comic.isValid(value.date)) return null;

    return new Comic({
      date: value.date,
      formattedDate: value.formattedDate,
      url: value.url,
      transcript: value.transcript
    });
  }

  static random() {
    const firstDate = getFirstComicDate();
    const lastDate = getLastComicDate();
    if (!firstDate || !lastDate) return null;

    const firstTimestamp = new Date(firstDate).getTime();
    const lastTimestamp = new Date(lastDate).getTime();
    const randomTimestamp = firstTimestamp + Math.random() * (lastTimestamp - firstTimestamp);
    const randomDate = new Date(randomTimestamp).toISOString().split('T')[0];

    return Comic.fromDate(randomDate);
  }

  // ===== SERIALIZATION =====

  toJSON() {
    return {
      date: this.date,
      formattedDate: this.formattedDate,
      url: this.url,
      transcript: this.transcript
    };
  }

  // ===== PRIVATE HELPERS =====

  static #shiftDateWithinRange(date, delta) {
    const firstDate = getFirstComicDate();
    const lastDate = getLastComicDate();
    if (!firstDate || !lastDate) return null;

    const current = new Date(date);
    if (Number.isNaN(current.getTime())) return null;

    current.setDate(current.getDate() + delta);
    const shifted = current.toISOString().split('T')[0];

    if (shifted < firstDate || shifted > lastDate) return null;
    return shifted;
  }

  static #resolveImageUrl(year, date) {
    const urlData = imageUrlDatabase.getImageUrl(date);
    if (urlData?.imageUrl) return urlData.imageUrl;

    return `${CDN_BASE}/dilbert-comics/${year}/${date}.gif`;
  }

  static #resolveTranscript(date) {
    return transcriptDatabase.getTranscript(date);
  }
}

// ===== COMIC RETRIEVAL FUNCTIONS =====

export async function getComicByDate(date) {
  const comic = Comic.fromDate(date);
  if (!comic) {
    console.warn('getComicByDate: Invalid or unavailable date:', date);
    return null;
  }
  return comic;
}

export async function getPreviousComic(currentDate) {
  try {
    const comic = Comic.fromDate(currentDate);
    if (!comic) return null;
    return comic.getPrevious();
  } catch (error) {
    console.error('Error getting previous comic:', error);
    return null;
  }
}

export async function getNextComic(currentDate) {
  try {
    const comic = Comic.fromDate(currentDate);
    if (!comic) return null;
    return comic.getNext();
  } catch (error) {
    console.error('Error getting next comic:', error);
    return null;
  }
}

// ===== HIGH-LEVEL LOADERS =====

export async function loadComicBrowser(date) {
  try {
    const comic = Comic.fromDate(date);
    if (!comic) throw new Error('Comic not found');

    const previousComic = comic.getPrevious();
    const nextComic = comic.getNext();

    return {
      success: true,
      comic,
      previousComic,
      nextComic
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function loadRandomComic() {
  try {
    const comic = Comic.random();
    if (!comic) throw new Error('No comics available');

    const previousComic = comic.getPrevious();
    const nextComic = comic.getNext();

    return {
      success: true,
      comic,
      previousComic,
      nextComic
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function loadFirstComic() {
  try {
    const firstDate = getFirstComicDate();
    if (!firstDate) throw new Error('First comic date not available');

    const comic = Comic.fromDate(firstDate);
    if (!comic) throw new Error('First comic not found');

    const previousComic = comic.getPrevious();
    const nextComic = comic.getNext();

    return {
      success: true,
      comic,
      previousComic,
      nextComic
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function loadLastComic() {
  try {
    const lastDate = getLastComicDate();
    if (!lastDate) throw new Error('Last comic date not available');

    const comic = Comic.fromDate(lastDate);
    if (!comic) throw new Error('Last comic not found');

    const previousComic = comic.getPrevious();
    const nextComic = comic.getNext();

    return {
      success: true,
      comic,
      previousComic,
      nextComic
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
