/**
 * Value Object: YouTubeId
 *
 * Representa um ID válido do YouTube com validação
 */

class YouTubeId {
  constructor(id) {
    if (typeof id !== 'string') {
      throw new Error('YouTubeId deve ser uma string');
    }

    // Validar formato do YouTube ID (11 caracteres alfanuméricos, _ ou -)
    const youtubeIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    if (!youtubeIdRegex.test(id)) {
      throw new Error(`YouTubeId inválido: ${id}. Deve ter 11 caracteres alfanuméricos, _ ou -`);
    }

    this._id = id;
    Object.freeze(this);
  }

  get value() {
    return this._id;
  }

  equals(other) {
    if (!(other instanceof YouTubeId)) {
      return false;
    }
    return this._id === other._id;
  }

  toString() {
    return this._id;
  }

  toJSON() {
    return this._id;
  }

  getUrl() {
    return `https://www.youtube.com/watch?v=${this._id}`;
  }

  getThumbnailUrl(quality = 'default') {
    // quality: default, mqdefault, hqdefault, sddefault, maxresdefault
    return `https://i.ytimg.com/vi/${this._id}/${quality}.jpg`;
  }

  getEmbedUrl() {
    return `https://www.youtube.com/embed/${this._id}`;
  }
}

module.exports = YouTubeId;
