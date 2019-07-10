/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict


// require dependencies
const config  = require('config');
const Daemon  = require('daemon');
const Discord = require('discord.js');

/**
 * build example dameon class
 *
 * @cluster discord
 * @cluster back
 */
class DiscordDaemon extends Daemon {
  /**
   * construct rentlar daemon class
   */
  constructor() {
    // run super eden
    super();

    // bind methods
    this.build = this.build.bind(this);

    // bind private methods
    this.postUser = this.postUser.bind(this);
    this.postCreate = this.postCreate.bind(this);
    this.postChannel = this.postChannel.bind(this);

    // run build method
    this.build();
  }

  /**
   * builds rentlar slack daemon
   */
  async build() {
    // return no token
    if (!config.get('discord.bot.client')) return;

    // load bot
    this.__bot = new Discord.Client();

    // logging
    this.logging = new Promise((resolve) => {
      // resolve ready
      this.__bot.on('ready', resolve);
    });

    // login with secret
    this.__bot.login(config.get('discord.bot.secret'));

    // bind eden listeners
    this.eden.endpoint('discord.user', this.postUser, true);
    this.eden.endpoint('discord.post', this.postCreate, true);
    this.eden.endpoint('discord.channel', this.postChannel, true);

    // await logging
    await this.logging;

    console.log(this.__bot);

    // get guild
    this.guild = this.__bot.guilds.find((g) => {
      // get sales guild
      return g.name === config.get('discord.sales.guild');
    });

    console.log(this.guild);
  }

  /**
   * post message to id
   *
   * @param {Array|null} data
   *
   * @private
   */
  async postCreate(data) {
    // await logging
    await this.logging;

    // apply to method
    return this.__bot.postMessage(...data);
  }

  /**
   * posts message to user
   *
   * @param {Array|null} data
   *
   * @private
   */
  async postUser(data) {
    // await logging
    await this.logging;

    // apply to method
    return this.__bot.postMessageToUser(...data);
  }

  /**
   * posts message to channel
   *
   * @param {Array|null} data
   *
   * @private
   */
  async postChannel(channel, ...data) {
    // await logging
    await this.logging;

    console.log(this.guild);

    // get channel
    channel = this.guild.channels.find((c) => {
      // find sales channel
      return c.name === channel;
    });

    // return send data
    await channel.send(...data);

    // return true
    return true;
  }
}

/**
 * export slack daemon class
 *
 * @type {DiscordDaemon}
 */
module.exports = DiscordDaemon;
