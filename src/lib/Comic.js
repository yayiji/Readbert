/**
 * Canonical Comic value object
 * Centralizes validation, creation, navigation, and serialization logic.
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

export class Comic {
  #transcriptPromise = null;

  constructor({ date, formattedDate, url, transcript }) {
    this.date = date;
    this.formattedDate = formattedDate ?? formatDate(date);
    this.url = url ?? Comic.#resolveImageUrl(this.year, this.date);
    this.transcript = transcript ?? Comic.#resolveTranscript(this.date);
  }

  // Convenience getter for the four-digit year extracted from the date string.
  get year() {
    return this.date.split('-')[0];
  }

  // Load transcript with fallback to individual file
  async loadTranscript() {
    // Return cached if already loaded
    if (this.transcript) {
      return this.transcript;
    }

    // Return in-flight promise if already loading
    if (this.#transcriptPromise) {
      return this.#transcriptPromise;
    }

    // Start loading
    this.#transcriptPromise = this.#fetchTranscript();
    this.transcript = await this.#transcriptPromise;
    this.#transcriptPromise = null;
    return this.transcript;
  }

  async #fetchTranscript() {
    // Try database first
    const dbTranscript = transcriptDatabase.getTranscript(this.date);
    if (dbTranscript) {
      return dbTranscript;
    }

    // Fallback: fetch individual file
    try {
      const cdnUrl = `https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static/dilbert-transcripts/${this.year}/${this.date}.json`;
      const localUrl = `/dilbert-transcripts/${this.year}/${this.date}.json`;

      // Try CDN first
      let response;
      try {
        response = await fetch(cdnUrl);
        if (!response.ok) throw new Error('CDN fetch failed');
      } catch {
        // Fallback to local
        response = await fetch(localUrl);
        if (!response.ok) throw new Error('Local fetch failed');
      }

      return await response.json();
    } catch (error) {
      console.warn(`Failed to fetch transcript for ${this.date}:`, error);
      return null;
    }
  }

  // Validate if a date string can represent a comic in our collection.
  static isValid(date) {
    if (!date || typeof date !== 'string') {
      return false;
    }
    return isValidComicDate(date) && isValidComicDateRange(date);
  }

  // Create a Comic instance from a YYYY-MM-DD string.
  static fromDate(date) {
    if (!Comic.isValid(date)) {
      return null;
    }
    return new Comic({ date });
  }

  // Rehydrate a Comic instance from a serialized/plain object.
  static fromSerialized(value) {
    if (!value) return null;
    if (value instanceof Comic) return value;
    if (!Comic.isValid(value.date)) {
      return null;
    }

    return new Comic({
      date: value.date,
      formattedDate: value.formattedDate,
      url: value.url,
      transcript: value.transcript
    });
  }

  // Return the previous comic if it exists.
  getPrevious() {
    const previousDate = Comic.#shiftDateWithinRange(this.date, -1);
    return previousDate ? Comic.fromDate(previousDate) : null;
  }

  // Return the next comic if it exists.
  getNext() {
    const nextDate = Comic.#shiftDateWithinRange(this.date, 1);
    return nextDate ? Comic.fromDate(nextDate) : null;
  }

  // Pick a random comic within the known date range.
  static random() {
    const firstDate = getFirstComicDate();
    const lastDate = getLastComicDate();

    if (!firstDate || !lastDate) {
      return null;
    }

    const firstTimestamp = new Date(firstDate).getTime();
    const lastTimestamp = new Date(lastDate).getTime();
    const randomTimestamp = firstTimestamp + Math.random() * (lastTimestamp - firstTimestamp);
    const randomDate = new Date(randomTimestamp).toISOString().split('T')[0];

    return Comic.fromDate(randomDate);
  }

  // Provide a stable JSON representation for storage.
  toJSON() {
    return {
      date: this.date,
      formattedDate: this.formattedDate,
      url: this.url,
      transcript: this.transcript
    };
  }


  // Shift a date by delta days while respecting global boundaries.
  static #shiftDateWithinRange(date, delta) {
    const firstDate = getFirstComicDate();
    const lastDate = getLastComicDate();

    if (!firstDate || !lastDate) {
      return null;
    }

    const current = new Date(date);
    if (Number.isNaN(current.getTime())) {
      return null;
    }

    current.setDate(current.getDate() + delta);
    const shifted = current.toISOString().split('T')[0];

    if (shifted < firstDate || shifted > lastDate) {
      return null;
    }

    return shifted;
  }

  static #resolveImageUrl(year, date) {
    const urlData = imageUrlDatabase.getImageUrl(date);
    if (urlData?.imageUrl) {
      return urlData.imageUrl;
    }

    const cdnUrl = `https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static/dilbert-comics/${year}/${date}.gif`;
    const localUrl = `/dilbert-comics/${year}/${date}.gif`;

    return cdnUrl;
  }

  static #resolveTranscript(date) {
    // Try to get from database (returns null if not loaded)
    return transcriptDatabase.getTranscript(date);
  }
}
