import { formatDate, isValidComicDate, isValidComicDateRange, getFirstComicDate, getLastComicDate } from './dateUtils.js';
import { transcriptIndex } from './transcriptIndex.js';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static';

export class Comic {
  #transcriptPromise = null;

  constructor({ date, formattedDate, url, transcript }) {
    this.date = date;
    this.formattedDate = formattedDate ?? formatDate(date);
    this.url = url ?? `${CDN_BASE}/dilbert-comics/${this.year}/${this.date}.gif`;
    this.transcript = transcript ?? transcriptIndex.getTranscript(this.date);
  }

  get year() {
    return this.date.split('-')[0];
  }

  getPrevious() {
    const previousDate = Comic.#shiftDateWithinRange(this.date, -1);
    return previousDate ? Comic.fromDate(previousDate) : null;
  }

  getNext() {
    const nextDate = Comic.#shiftDateWithinRange(this.date, 1);
    return nextDate ? Comic.fromDate(nextDate) : null;
  }

  async loadTranscript() {
    if (this.transcript) return this.transcript;
    if (this.#transcriptPromise) return this.#transcriptPromise;

    this.#transcriptPromise = this.#fetchTranscript();
    this.transcript = await this.#transcriptPromise;
    this.#transcriptPromise = null;
    return this.transcript;
  }

  async #fetchTranscript() {
    const dbTranscript = transcriptIndex.getTranscript(this.date);
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

  static isValid(date) {
    return Boolean(date && typeof date === 'string' && isValidComicDate(date) && isValidComicDateRange(date));
  }

  static fromDate(date) {
    return Comic.isValid(date) ? new Comic({ date }) : null;
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

  static async load(date) {
    return Comic.#loaded(Comic.fromDate(date), 'Comic not found');
  }

  static async loadRandom() {
    return Comic.#loaded(Comic.random(), 'No comics available');
  }

  static async loadFirst() {
    const firstDate = getFirstComicDate();
    if (!firstDate) return { success: false, error: 'First comic date not available' };
    return Comic.#loaded(Comic.fromDate(firstDate), 'First comic not found');
  }

  static async loadLast() {
    const lastDate = getLastComicDate();
    if (!lastDate) return { success: false, error: 'Last comic date not available' };
    return Comic.#loaded(Comic.fromDate(lastDate), 'Last comic not found');
  }

  toJSON() {
    return {
      date: this.date,
      formattedDate: this.formattedDate,
      url: this.url,
      transcript: this.transcript
    };
  }

  static #loaded(comic, missingMessage) {
    try {
      if (!comic) throw new Error(missingMessage);
      return {
        success: true,
        comic,
        previousComic: comic.getPrevious(),
        nextComic: comic.getNext()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

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
}
