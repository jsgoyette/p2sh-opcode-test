const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto')
const secp256k1 = require('secp256k1')
const wif = require('wif');
const bip38 = require('bip38');
const Address = require('btc-address');
const binConv = require('binstring');

module.exports = {
  addressToHash160,
  hash160ToAddress,
  hexStrip0x,

  generatePrivateKey,
  getECPair,

  createP2SHAddress,
  createTransaction,
};

function addressToHash160(address, addressType, network) {
  const addr = new Address(address, addressType, network);
  return binConv(addr.hash, {in : 'bytes', out: 'hex'});
}

function hash160ToAddress(hash160, addressType, network) {
  const addr = binConv(hexStrip0x(hash160), {in : 'hex', out: 'bytes'});
  const address = new Address(addr, addressType, network);
  return address.toString();
}

function hexStrip0x(hex) {
  if (hex.indexOf('0x') === 0) {
    return hex.slice(2);
  }

  return hex;
}

function generatePrivateKey() {
  let randomBuf;

  do {
    randomBuf = crypto.randomBytes(32);
  } while (!secp256k1.privateKeyVerify(randomBuf));

  return randomBuf.toString('hex');
}

function getECPair(passwd, encryptedKey, version, bitcoinNetwork) {
  const { privateKey, compressed } = bip38.decrypt(encryptedKey, passwd);
  const privateKeyWif = wif.encode(version, privateKey, compressed);
  return bitcoin.ECPair.fromWIF(privateKeyWif, bitcoinNetwork);
};

function createP2SHAddress(x, bitcoinNetwork) {
  const hash = bitcoin.crypto.sha256(Buffer.from(x));

  const redeemScript = bitcoin.script.compile([

    bitcoin.opcodes.OP_SHA256,
    hash,
    bitcoin.opcodes.OP_EQUALVERIFY,
    bitcoin.opcodes.OP_1,

    // bitcoin.opcodes.OP_IF,
    // bitcoin.opcodes.OP_SHA256,
    // Buffer.from(hashx, 'hex'),
    // bitcoin.opcodes.OP_EQUALVERIFY,
    // bitcoin.opcodes.OP_DUP,
    // bitcoin.opcodes.OP_HASH160,
    // Buffer.from(hexStrip0x(destHash160Addr), 'hex'),

    // bitcoin.opcodes.OP_ELSE,
    // bitcoin.script.number.encode(redeemLockTimeStamp),
    // bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
    // bitcoin.opcodes.OP_DROP,
    // bitcoin.opcodes.OP_DUP,
    // bitcoin.opcodes.OP_HASH160,
    // Buffer.from(hexStrip0x(revokerHash160Addr), 'hex'),
    // bitcoin.opcodes.OP_ENDIF,

    // // Complete the signature check.
    // bitcoin.opcodes.OP_EQUALVERIFY,
    // bitcoin.opcodes.OP_CHECKSIG
  ]);

  const addressPay = bitcoin.payments.p2sh({
    redeem: {
      output: redeemScript,
      network: bitcoinNetwork,
    },
    network: bitcoinNetwork,
  });

  const address = addressPay.address;

  return {
    hash: hash.toString('hex'),
    p2sh: address,
    redeemScript: redeemScript,
  };
}

function createTransaction(contract, txid, vout, receiverAddr, amount, x, bitcoinNetwork) {
  const txb = new bitcoin.TransactionBuilder(bitcoinNetwork);
  const { SIGHASH_ALL } = bitcoin.Transaction;

  txb.setVersion(2);
  txb.addInput(txid, vout, 0);
  txb.addOutput(receiverAddr, amount);

  const tx = txb.buildIncomplete();
  const sigHash = tx.hashForSignature(0, contract.redeemScript, SIGHASH_ALL);

  const redeemScriptSig = bitcoin.payments.p2sh({
    redeem: {
      input: bitcoin.script.compile([
        Buffer.from(x),
      ]),
      output: contract.redeemScript
    }
  }).input;

  tx.setInputScript(0, redeemScriptSig);

  return tx.toHex();
}
