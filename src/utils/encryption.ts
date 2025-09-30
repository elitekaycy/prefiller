export class EncryptionUtil {
  private static readonly SALT = 'prefiller-salt-2024';

  static encode(text: string): string {
    try {
      return btoa(unescape(encodeURIComponent(text + this.SALT)));
    } catch (error) {
      console.error('Encoding failed:', error);
      return text;
    }
  }

  static decode(encodedText: string): string {
    try {
      const decoded = decodeURIComponent(escape(atob(encodedText)));
      return decoded.replace(this.SALT, '');
    } catch (error) {
      console.error('Decoding failed:', error);
      return encodedText;
    }
  }

  static isValidApiKey(apiKey: string): boolean {
    return apiKey.length > 10 && apiKey.startsWith('AIzaSy');
  }
}