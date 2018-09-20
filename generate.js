const bitcoin = require('bitcoinjs-lib');
const utils = require('./utils');

const network = 'testnet';

(function main() {
  const bitcoinNetwork = bitcoin.networks[network];
  const contract = utils.createP2SHAddress('hi there!', bitcoinNetwork);

  console.log(contract);

})()
