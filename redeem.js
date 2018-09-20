///// USER ENTERED INFO ///////////

// Transactions info from Loki crossTransDb
const x = 'hi there!'; // HashX

// Address where to send the funds
const userBtcAddr = '2MsTBS8XSmXWZXAqotN3MYeCsgdhpa4XBJZ';

// From UTXO where funds are now
const txid = '2625d8ebd0fbfb87ef07ae15917b9cfcac816d05d92d4cd53d7267b41d1a4723';
const vout = 0;
const amount = 500000;

const minerFee = 1000;
const network = 'testnet';


//////////////////////////////////

const bitcoin = require('bitcoinjs-lib');
const utils = require('./utils');

(function main() {
  const bitcoinNetwork = bitcoin.networks[network];
  const version = network == 'testnet' ? 239 : 128;

  const contract = utils.createP2SHAddress(x, bitcoinNetwork);

  // console.log(contract);

  // const ecPair = utils.getECPair(password, encryptedBtcKey, version, bitcoinNetwork);
  const txHex = utils.createTransaction(contract, txid, vout, userBtcAddr, amount-minerFee, x, bitcoinNetwork);

  console.log(txHex);
})()
