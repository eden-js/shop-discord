
// Require dependencies
const Helper = require('helper');

/**
 * Build discord helper class
 */
class DiscordHelper extends Helper {
  /**
   * Construct discord helper
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.user = this.user.bind(this);
    this.post = this.post.bind(this);
    this.channel = this.channel.bind(this);
  }

  /**
   * post message to anywhere
   */
  post(...args) {
    // emit to eden
    return this.eden.call('discord.post', ...args, true);
  }

  /**
   * post message to user
   */
  user(...args) {
    // emit to eden
    return this.eden.call('discord.user', ...args, true);
  }

  /**
   * post message to user
   */
  channel(...args) {
    // emit to eden
    return this.eden.call('discord.channel', ...args, true);
  }
}

/**
 * export discord class
 *
 * @type {discord}
 */
module.exports = new DiscordHelper();
