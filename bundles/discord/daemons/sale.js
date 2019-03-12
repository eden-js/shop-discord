
// require dependencies
const config = require('config');
const Daemon = require('daemon');

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

    // run build method
    this.building = this.build();
  }

  /**
   * builds rentlar slack daemon
   */
  async build() {
    // build sale daemon
    this.eden.post('order.complete', this.sendOrder);
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
      const user    = await order.get('user');
      const invoice = await order.get('invoice');
      const payment = await Payment.where('invoice.id', invoice.get('_id').toString()).findOne();

      // set initial fields
      const fields = [{
        name  : 'Name',
        value : user ? `[${user.name() || user.get('username') || user.get('email')}](https://${config.get('domain')}/admin/user/${user.get('_id').toString()}/update)` : config.get('address.name'),
      }, {
        name  : 'Amount',
        value : `$${invoice.get('total').toFixed(2)} ${config.get('shop.currency') || 'USD'}`,
      }, {
        name  : 'Method',
        value : payment ? payment.get('method.type') : 'N/A',
      }, {
        name  : 'Discount',
        value : `$${(invoice.get('discount') || 0).toFixed(2)} ${config.get('shop.currency') || 'USD'}`,
      }];

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
}

/**
 * export slack daemon class
 *
 * @type {DiscordSaleDaemon}
 */
module.exports = DiscordSaleDaemon;
