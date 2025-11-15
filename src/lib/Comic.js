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

export class Comic {
  constructor({ date, formattedDate, url }) {
    this.date = date;
    this.formattedDate = formattedDate ?? formatDate(date);
    this.url = url ?? Comic.#resolveImageUrl(this.year, date);
  }

  /**
   * Convenience getter for the four-digit year extracted from the date string.
   */
  get year() {
    return this.date.split('-')[0];
  }

  /**
   * Validate if a date string can represent a comic in our collection.
   */
  static isValid(date) {
    if (!date || typeof date !== 'string') {
      return false;
    }
    return isValidComicDate(date) && isValidComicDateRange(date);
  }

  /**
   * Create a Comic instance from a YYYY-MM-DD string.
   */
  static fromDate(date) {
    if (!Comic.isValid(date)) {
      return null;
    }
    return new Comic({ date });
  }

  /**
   * Rehydrate a Comic instance from a serialized/plain object.
   */
  static fromSerialized(value) {
    if (!value) return null;
    if (value instanceof Comic) return value;
    if (!Comic.isValid(value.date)) {
      return null;
    }

    return new Comic({
      date: value.date,
      formattedDate: value.formattedDate,
      url: value.url
    });
  }

  /**
   * Return the previous comic if it exists.
   */
  getPrevious() {
    const previousDate = Comic.#shiftDateWithinRange(this.date, -1);
    return previousDate ? Comic.fromDate(previousDate) : null;
  }

  /**
   * Return the next comic if it exists.
   */
  getNext() {
    const nextDate = Comic.#shiftDateWithinRange(this.date, 1);
    return nextDate ? Comic.fromDate(nextDate) : null;
  }

  /**
   * Pick a random comic within the known date range.
   */
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

  /**
   * Provide a stable JSON representation for storage.
   */
  toJSON() {
    return {
      date: this.date,
      formattedDate: this.formattedDate,
      url: this.url
    };
  }

  /**
   * Shift a date by delta days while respecting global boundaries.
   */
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

  /**
   * Determine the preferred comic image URL (IndexedDB index first, CDN fallback).
   */
  static #resolveImageUrl(year, date) {
    // const urlData = imageUrlDatabase.getImageUrl(date);
    // if (urlData?.imageUrl) {
    //   return urlData.imageUrl;
    // }

    const cdnUrl = `https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static/dilbert-comics/${year}/${date}.gif`;
    const localUrl = `/dilbert-comics/${year}/${date}.gif`;
    
    return cdnUrl;
  }
}
