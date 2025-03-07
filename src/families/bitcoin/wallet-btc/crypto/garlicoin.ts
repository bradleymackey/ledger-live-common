import * as bjs from "bitcoinjs-lib";
import * as bip32 from "bip32";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { toOutputScript } from "bitcoinjs-lib/src/address";
import { bech32 } from "bech32";
import { DerivationModes } from "../types";
import { ICrypto } from "./types";
import Base from "./base";

// Todo copy paste from bitcoin.ts. we can merge them later
class Garlicoin extends Base implements ICrypto {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  network: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    this.network.dustThreshold = 10000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }

  getLegacyAddress(xpub: string, account: number, index: number): string {
    const { address } = bjs.payments.p2pkh({
      pubkey: bip32.fromBase58(xpub, this.network).derive(account).derive(index)
        .publicKey,
      network: this.network,
    });
    return String(address);
  }

  getSegWitAddress(xpub: string, account: number, index: number): string {
    const { address } = bjs.payments.p2sh({
      redeem: bjs.payments.p2wpkh({
        pubkey: bip32
          .fromBase58(xpub, this.network)
          .derive(account)
          .derive(index).publicKey,
        network: this.network,
      }),
    });
    return String(address);
  }

  getNativeSegWitAddress(xpub: string, account: number, index: number): string {
    const { address } = bjs.payments.p2wpkh({
      pubkey: bip32.fromBase58(xpub, this.network).derive(account).derive(index)
        .publicKey,
      network: this.network,
    });

    return String(address);
  }

  getAddress(
    derivationMode: DerivationModes,
    xpub: string,
    account: number,
    index: number
  ): string {
    switch (derivationMode) {
      case DerivationModes.LEGACY:
        return this.getLegacyAddress(xpub, account, index);
      case DerivationModes.SEGWIT:
        return this.getSegWitAddress(xpub, account, index);
      case DerivationModes.NATIVE_SEGWIT:
        return this.getNativeSegWitAddress(xpub, account, index);
      default:
        throw new Error("Should not be reachable");
    }
  }

  // infer address type from its syntax
  getDerivationMode(address: string) {
    if (address.match("^(grlc).*")) {
      return DerivationModes.NATIVE_SEGWIT;
    }
    if (address.match("^(M).*")) {
      return DerivationModes.SEGWIT;
    }
    if (address.match("^(G).*")) {
      return DerivationModes.LEGACY;
    }
    throw new Error(
      "INVALID ADDRESS: ".concat(address).concat(" is not a valid address")
    );
  }

  toOutputScript(address: string) {
    return toOutputScript(address, this.network);
  }

  // eslint-disable-next-line class-methods-use-this
  validateAddress(address: string): boolean {
    // bech32 address
    if (address.substring(0, 4) === "grlc") {
      if (bech32.decodeUnsafe(address)) {
        return true;
      }
    }
    // bs58 address
    return super.validateAddress(address);
  }
}

export default Garlicoin;
