
// require dependencies
const config    = require('config');
const Daemon    = require('daemon');
const schedule  = require('node-schedule');
const formatter = require('currency-formatter');

// require helpers
const orderHelper   = helper('order');
const discordHelper = helper('discord');

// rquire models
const Payment = model('payment');

/**
 * build example dameon class
 */
class DiscordSaleDaemon extends Daemon {
  /**
   * construct rentlar daemon class
   */
  constructor() {
    // run super eden
    super();

    // bind methods
    this.build = this.build.bind(this);
    this.sendOrder = this.sendOrder.bind(this);
    this.sendStats = this.sendStats.bind(this);

    // run build method
    this.building = this.build();
  }

  /**
   * builds rentlar slack daemon
   */
  async build() {
    // build sale daemon
    this.eden.post('order.complete', this.sendOrder);

    // build sale daemon
    this.eden.on('subscription.started', subscription => this.sendSubscription(subscription, 'Started', 2664261));
    this.eden.on('subscription.cancelled', subscription => this.sendSubscription(subscription, 'Cancelled', 14431557));
    this.eden.on('subscription.requested', subscription => this.sendSubscription(subscription, 'Cancel Requested', 16761095));

    // check thread
    if (['back', 'stats'].includes(this.eden.cluster) && parseInt(this.eden.id) === 0) {
      // send stats
      schedule.scheduleJob({
        hour   : 9,
        minute : 0,
      }, this.sendStats);
    }
  }

  /**
   * sends order
   *
   * @param  {Order}  order
   *
   * @return {Promise}
   */
  async sendOrder(order) {
    // return no token
    if (!config.get('discord.bot.client')) return;

    // try/catch
    try {
      // get models
      const user      = await order.get('user');
      const invoice   = await order.get('invoice');
      const payment   = await Payment.where('invoice.id', invoice.get('_id').toString()).findOne();
      const affiliate = await order.get('affiliate');

      // set initial fields
      const fields = [{
        name  : 'Name',
        value : user ? `[${user.name() || user.get('username') || user.get('email')}](https://${config.get('domain')}/admin/user/${user.get('_id').toString()}/update)` : order.get('address.name'),
      }];

      // check affiliate
      if (affiliate) {
        // set user
        let aff = await affiliate.get('user');
        aff = Array.isArray(aff) ? aff[0] : aff;

        // push affilate
        if (aff) {
          // push to fields
          fields.push({
            name  : 'Affiliate',
            value : `[${aff.name() || aff.get('username') || aff.get('email')}](https://${config.get('domain')}/admin/user/${aff.get('_id').toString()}/update)`,
          });
        }
      }

      // push more fields
      fields.push(...([{
        name  : 'Amount',
        value : `${formatter.format((invoice.get('total') || 0), {
          code : invoice.get('currency') || config.get('shop.currency') || 'USD',
        })} ${order.get('currency') || config.get('shop.currency') || 'USD'}`,
      }, {
        name  : 'Method',
        value : payment ? payment.get('method.type') : 'N/A',
      }, {
        name  : 'Discount',
        value : `${formatter.format((invoice.get('discount') || 0), {
          code : invoice.get('currency') || config.get('shop.currency') || 'USD',
        })} ${order.get('currency') || config.get('shop.currency') || 'USD'}`,
      }]));

      // push line items
      fields.push({
        name  : 'Items',
        value : (await Promise.all((await orderHelper.lines(order)).map(async (line) => {
          // return value
          return `$${line.price.toFixed(2)} ${invoice.get('currency')} • ${line.qty.toLocaleString()} X [${line.title}](https://${config.get('domain')}/admin/shop/product/${line.product}/update) (${line.sku})`;
        }))).join('\n\n'),
        inline : true,
      });

      // set data
      const data = {
        embed : {
          fields,
          url       : `https://${config.get('domain')}/admin/shop/order/${order.get('_id').toString()}/update`,
          color     : 2664261,
          title     : 'Order Completed',
          timestamp : new Date(),
        },
      };

      // hook
      await this.eden.hook('sales.discord', data, order);

      // send to channel
      discordHelper.channel(config.get('discord.sales.channel'), 'Order Completed', data);
    } catch (e) {
      // log error
      console.log(e);
    }
  }

  /**
   * sends subscription
   *
   * @param  {Subscription}  subscription
   * @param  {String}        type
   * @param  {String}        color
   *
   * @return {Promise}
   */
  async sendSubscription(subscription, type, color) {
    // return no token
    if (!config.get('discord.bot.client') || !subscription) return;

    // try/catch
    try {
      // get models
      const user    = await subscription.get('user');
      const order   = await subscription.get('order');
      const payment = await subscription.get('payment');
      const product = await subscription.get('product');
      const invoice = await order.get('invoice');

      // set initial fields
      const fields = [{
        name  : 'Name',
        value : user ? `[${user.name() || user.get('username') || user.get('email')}](https://${config.get('domain')}/admin/user/${user.get('_id').toString()}/update)` : 'N/A',
      }, {
        name  : 'Product',
        value : product ? `[${Object.values(product.get('title'))[0]}](https://${config.get('domain')}/admin/shop/product/${product.get('_id').toString()}/update)` : 'N/A',
      }, {
        name  : 'Method',
        value : payment ? payment.get('method.type') : 'N/A',
      }, {
        name  : 'State',
        value : subscription.get('state'),
      }, {
        name  : 'Price',
        value : subscription.get('price') ? `${formatter.format(subscription.get('price'), {
          code : invoice.get('currency') || config.get('shop.currency') || 'USD',
        })} ${order.get('currency') || config.get('shop.currency') || 'USD'}` : 'N/A',
      }, {
        name   : 'Started',
        value  : (subscription.get('started_at') || subscription.get('created_at')).toLocaleString(),
        inline : true,
      }, {
        name   : 'Due',
        value  : subscription.get('due').toLocaleString(),
        inline : true,
      }];

      // set data
      const data = {
        embed : {
          color,
          fields,
          url       : `https://${config.get('domain')}/admin/shop/subscription/${subscription.get('_id').toString()}/update`,
          title     : `Subscription ${type}`,
          timestamp : new Date(),
        },
      };

      // hook
      await this.eden.hook('sales.discord.subscription', data, subscription);

      // send to channel
      discordHelper.channel(config.get('discord.subscription.channel') || config.get('discord.sales.channel'), `Subscription ${type}`, data);
    } catch (e) {
      // log error
      console.log(e);
    }
  }

  /**
   * sends subscription
   *
   * @param  {Subscription}  subscription
   * @param  {String}        type
   * @param  {String}        color
   *
   * @return {Promise}
   */
  async sendStats() {
    // return no token
    if (!config.get('discord.bot.client')) return;

    // create stats object
    const stats = {};

    // await hook
    await this.eden.hook('shop.stats.send', stats);

    // loop stats
    for (const stat in stats) {
      // set fields
      const fields = [];

      // loop keys in count
      for (const key in stats[stat].count) { // eslint-disable-guard-for-in
        // set value
        const count = stats[stat].count[key];
        const money = (stats[stat].money || {})[key];

        // create field
        fields.push({
          name  : `${key}`,
          value : `${stats[stat].count[key].toLocaleString()}${money ? ` ${formatter.format(money, {
            code : config.get('shop.currency') || 'USD',
          })}` : ''}`,
          inline : true,
        });
      }

      // set data
      const data = {
        embed : {
          fields,
          color     : 2664261,
          title     : stats[stat].title,
          timestamp : new Date(),
        },
      };

      // send to channel
      await discordHelper.channel(config.get('discord.stats.channel') || config.get('discord.sales.channel'), '', data);
    }
  }
}

/**
 * export slack daemon class
 *
 * @type {DiscordSaleDaemon}
 */
module.exports = DiscordSaleDaemon;
