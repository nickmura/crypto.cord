import DiscordJS, { Channel, Intents, Message, TextChannel } from 'discord.js'
import dotenv from 'dotenv'
import axios from 'axios'
import WebSocket from 'ws'
import { DataTypes } from 'sequelize';
import moment from 'moment'


const importDynamic = new Function('modulePath', 'return import(modulePath)');
const fetch = async (...args:any[]) => {
  const module = await importDynamic('node-fetch');
  return module.default(...args);

};

// websocket BTC-USDT (for now)
const ws = new WebSocket("wss://stream.binance.com/ws/btcusdt@bookTicker");

// sequelize (sqlite) configuration
const { Sequelize, Op } = require('@sequelize/core');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'db/history.sqlite'
  });


  // Testing connection (sequelize (sqlite) configuration)
(async () => {
    try {
      await sequelize.authenticate();
        console.log("Successfully established connection to the database.")
    } catch (error) {
        console.log("Unable to connect to the database:", error)
    }
})();



const priceHistory = sequelize.define('priceHistory', {
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.NUMBER,
        allowNull: true
    },
    date: {
        type: DataTypes.DATE,
        allowNull: true
    }}, {
    timestamps: false

})




// Throttle function

function throttle(func:Function, ms:number) {
    let isThrottled = false;
      type ISavedArgs = any[] | null;
      let savedArgs: ISavedArgs;
      let savedThis:any;
  
    function wrapper(this: any,...args:any[]) {
      if (isThrottled) {
        // (2)
        savedArgs = [...args];
        savedThis = this;
        return;
      }
      isThrottled = true;
  
      func.apply(this, arguments); // (1)
  
      setTimeout(function () {
        isThrottled = false; // (3)
        if (savedArgs) {
          wrapper.apply(savedThis, savedArgs);
          savedArgs = savedThis = null;
        }
      }, ms);
    }
  
    return wrapper;
  }

// btc-usdt interval

// db query




let oldValue = 0;
let objCurrent = 0;
let counter = 0;
let throttleInterval =


throttle(async (event: WebSocket.MessageEvent)=>{
  const obj = JSON.parse(event.data.toString()); 
  console.log(obj.b); counter += 5;
  if(counter >= 3600) {
      oldValue = obj.b
      counter = 0;
  }
  sequelize.sync().then(() => {
      priceHistory.create({ currency: "BTC/USDT", price: obj.b, date: moment() }).then(() => {
      }).catch((error:any) => {console.log(error)}).finally(() =>{console.log() })
  })

const lastPrice = await priceHistory.findAll({
        attributes: [
        Sequelize.fn('max', Sequelize.col('date')),
          'id',
          'price',
          'date'

        ],
    })


//price from one hour
const priceFromOneHour = await priceHistory.findAll({
      attributes: [
      Sequelize.fn('max', Sequelize.col('date')),
        'id',
        'price',
        'date'
      ],
      where: {
        date: {
          [Op.lt]: moment.utc(lastPrice.date).subtract(1, 'hours')
        }
      }
  })


comparingPricesHour(lastPrice, priceFromOneHour)




// if (priceFromOneHour[0].dataValues.price < Math.round((5/100) * last_date[0].dataValues.price)) {}

console.log("Price query added.")
console.log(lastPrice[0].dataValues.price, priceFromOneHour[0].dataValues.price, priceFromOneHour[0].dataValues.date)
} , 180000)


async function comparingPricesHour(lastPrice:any, priceFromOneHour:any) {

  await lastPrice
  await priceFromOneHour
  if (priceFromOneHour[0].dataValues.price > lastPrice[0].dataValues.price) {
    let x = 100 - (lastPrice[0].dataValues.price / priceFromOneHour[0].dataValues.price) * 100 
    if (x > 0.01) {
    const successful = await ( client.channels.cache.get('953701378751070323') as TextChannel ).send(`BTC / USD is ${lastPrice[0].dataValues.price}, which is down ${x.toFixed(1)} in the last hour.`)
    }
    const successful = await ( client.channels.cache.get('953701378751070323') as TextChannel ).send(`BTC / USD is ${lastPrice[0].dataValues.price}, which is down ${x.toFixed(1)} in the last hour.`)
  }
  

  
}







ws.onmessage = (event: WebSocket.MessageEvent) => {
throttleInterval(event)
}


dotenv.config()
interface CoinInfo {
    id: string;
    symbol: string;
    name: string;
  }

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,

    ]
})


let VALID_CURRENCIES: Array<CoinInfo>
fetch("https://api.coingecko.com/api/v3/coins/list").then(response => response.json()).then(data => VALID_CURRENCIES = <Array<CoinInfo>>data)




// decimal finder
function getDisplayValue(input:number) {
    return input.toFixed(Math.max(3,Math.abs(Math.log10(input)-4)))
  }


client.on('messageCreate', async (message) => {
    if (message.author.bot === true) return;
    if(message.content.startsWith('price')) {
    const sentCurrencyCode = message.content.split(" ")[1];

    const selectedCurrencyCode = VALID_CURRENCIES.find(
        (item) => item.symbol === sentCurrencyCode
      );

    if(selectedCurrencyCode) {
         
        const results = await Promise.all([
            axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${selectedCurrencyCode.id}&vs_currencies=usd`),
            axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd`)
        ])
        const marketPrice = results[0].data[selectedCurrencyCode.id].usd / results[1].data.tether.usd;

        message.reply({
            content: `1 ${selectedCurrencyCode.symbol.toUpperCase()} - ${getDisplayValue(marketPrice)} USD`,
        })
        // call the api
 
    } else {
        message.reply({
            content: `Please enter a valid symbol / currency.`,
        })
        // throw an error message
    }
    }
})





client.login(process.env.TOKEN)
client.on('ready', () => {
    return console.log('ready')
})