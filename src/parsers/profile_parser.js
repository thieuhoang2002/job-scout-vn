const fs = require('fs');
const ReaWebExtractor = require('./rea_web_extractor');

/**
 * Universal Profile Parser
 * Supports:
 * - Online Portfolio URL (via REA Web Extractor)
 * - Local CV File (.md, .txt)
 * - Local Profile JSON (.json)
 */
class ProfileParser {
  constructor() {
    this.webExtractor = new ReaWebExtractor();
  }

  async parse(input) {
    if (!input) {
      throw new Error('Vui lòng cung cấp link Portfolio (URL) hoặc đường dẫn file CV.');
    }

    // 1. Case: URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return await this.webExtractor.extractFromUrl(input);
    }

    // 2. Case: Local file
    if (!fs.existsSync(input)) {
      throw new Error(`Không tìm thấy file tại đường dẫn: ${input}`);
    }

    const content = fs.readFileSync(input, 'utf8');

    // Case 2a: JSON Profile
    if (input.endsWith('.json')) {
      try {
        return JSON.parse(content);
      } catch (e) {
        throw new Error(`File JSON không hợp lệ: ${e.message}`);
      }
    }

    // Case 2b: Markdown / Text CV
    return this.parseTextCv(content);
  }

  parseTextCv(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let name = 'Ứng viên CNTT';
    let headline = 'Software Engineer';
    let experienceYears = 1.0;

    // Detect Name (often line 1 or header # Name)
    for (const line of lines.slice(0, 5)) {
      if (line.startsWith('# ')) {
        name = line.replace('# ', '').trim();
        break;
      } else if (!line.startsWith('-') && !line.startsWith('*') && line.length < 40) {
        name = line;
        break;
      }
    }

    // Detect Experience years
    const expMatch = text.match(/(\d+[\.,]?\d*)\s*(?:năm|years?)\s*(?:kinh nghiệm|exp)/i);
    if (expMatch) {
      experienceYears = parseFloat(expMatch[1].replace(',', '.'));
    }

    // Detect Tech Skills using REA regex bank
    const detectedTechs = this.webExtractor.detectKnownTechs(text);

    return {
      name,
      headline,
      summary: lines.slice(0, 10).join(' '),
      skills: detectedTechs.map(t => t.name),
      skill_details: detectedTechs,
      experience_years: experienceYears,
      featured_projects: []
    };
  }
}

module.exports = ProfileParser;
