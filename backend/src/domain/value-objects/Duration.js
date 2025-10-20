/**
 * Value Object: Duration
 *
 * Representa duração em segundos com validação e formatação
 */

class Duration {
  constructor(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      throw new Error('Duração deve ser um número');
    }
    if (seconds < 0) {
      throw new Error('Duração não pode ser negativa');
    }

    this._seconds = Math.round(seconds);
    Object.freeze(this);
  }

  get seconds() {
    return this._seconds;
  }

  get minutes() {
    return Math.floor(this._seconds / 60);
  }

  get hours() {
    return Math.floor(this._seconds / 3600);
  }

  add(other) {
    if (!(other instanceof Duration)) {
      throw new Error('Pode adicionar apenas Duration com Duration');
    }
    return new Duration(this._seconds + other._seconds);
  }

  subtract(other) {
    if (!(other instanceof Duration)) {
      throw new Error('Pode subtrair apenas Duration de Duration');
    }
    return new Duration(this._seconds - other._seconds);
  }

  isGreaterThan(other) {
    if (!(other instanceof Duration)) {
      throw new Error('Pode comparar apenas Duration com Duration');
    }
    return this._seconds > other._seconds;
  }

  equals(other) {
    if (!(other instanceof Duration)) {
      return false;
    }
    return this._seconds === other._seconds;
  }

  format() {
    const hours = Math.floor(this._seconds / 3600);
    const minutes = Math.floor((this._seconds % 3600) / 60);
    const seconds = this._seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  toString() {
    return this.format();
  }

  toJSON() {
    return this._seconds;
  }

  static fromMinutes(minutes) {
    return new Duration(minutes * 60);
  }

  static fromHours(hours) {
    return new Duration(hours * 3600);
  }

  static zero() {
    return new Duration(0);
  }
}

module.exports = Duration;
