/**
 * Simulated Live Stream Chat & Viewer Interaction Engine
 * Generates realistic viewer comments and triggers real in-game buffs!
 */

class ChatSimulator {
  constructor(onCommand, onMessage) {
    this.onCommand = onCommand || (() => {});
    this.onMessage = onMessage || (() => {});
    this.isRunning = false;
    this.chatInterval = null;

    this.userNames = [
      'NeonRider', 'PixelKing', 'FlagMaster99', 'SambaBoy', 'GamerGirl_x',
      'DragonSlayer', 'SpeedyGonzales', 'AstroViper', 'TokyoDrift', 'EagleEye',
      'MapleLeaf', 'CurryPower', 'BaguetteWarrior', 'VikingNord', 'TangoMaster',
      'KiwiChamp', 'AlpineFox', 'DesertHawk', 'SaharaGhost', 'StreamSniper'
    ];

    this.templates = [
      { text: "GO {country}! {flag}{flag}{flag}", type: 'cheer' },
      { text: "!boost {country}", type: 'cmd' },
      { text: "{country} is dominating right now!! 🔥🔥", type: 'cheer' },
      { text: "TEAM {country} VOTE VOTE {flag}", type: 'cheer' },
      { text: "!speed {country}", type: 'cmd' },
      { text: "No way {country} survives this! 😱", type: 'cheer' },
      { text: "!shield {country}", type: 'cmd' },
      { text: "ALL MY POINTS ON {country} 💰👑", type: 'cheer' }
    ];
  }

  start() {
    this.isRunning = true;
    this.scheduleNextMessage();
  }

  stop() {
    this.isRunning = false;
    if (this.chatInterval) clearTimeout(this.chatInterval);
  }

  scheduleNextMessage() {
    if (!this.isRunning) return;

    // Fast active chat pacing (every 400ms to 1200ms)
    const delay = 400 + Math.random() * 800;
    this.chatInterval = setTimeout(() => {
      this.generateMessage();
      this.scheduleNextMessage();
    }, delay);
  }

  generateMessage() {
    const user = this.userNames[Math.floor(Math.random() * this.userNames.length)];
    const country = window.FlagManager.getRandomCountry();
    const template = this.templates[Math.floor(Math.random() * this.templates.length)];

    let text = template.text
      .replace(/{country}/g, country.name.toUpperCase())
      .replace(/{flag}/g, '🏳️');

    const msgObj = {
      id: Date.now() + Math.random(),
      user: user,
      text: text,
      country: country,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    this.onMessage(msgObj);

    // If it's a command or cheer, trigger in-game boost
    if (template.type === 'cmd' || Math.random() < 0.35) {
      this.onCommand({
        countryCode: country.code,
        countryName: country.name,
        type: text.includes('shield') ? 'shield' : (text.includes('giant') ? 'giant' : 'speed')
      });
    }
  }

  sendCustomMessage(user, text) {
    const msgObj = {
      id: Date.now(),
      user: user || 'Streamer',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    this.onMessage(msgObj);

    // Parse commands like !boost usa or !shield br
    const clean = text.trim().toLowerCase();
    const parts = clean.split(' ');
    let cmdType = 'speed';
    let targetName = clean;

    if (parts[0].startsWith('!')) {
      const c = parts[0].substring(1);
      if (['shield', 'giant', 'speed', 'boost'].includes(c)) {
        cmdType = c === 'boost' ? 'speed' : c;
        targetName = parts.slice(1).join(' ');
      }
    }

    const country = window.FlagManager.getCountryByNameOrAlias(targetName);
    if (country) {
      this.onCommand({
        countryCode: country.code,
        countryName: country.name,
        type: cmdType
      });
    }
  }
}

window.ChatSimulator = ChatSimulator;
