import DiscordJS, { Intents } from 'discord.js'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()
interface CoinInfo {
    id: string;
    symbol: string;
    name: string;
  }

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
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