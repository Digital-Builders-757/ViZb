import forge from "node-forge"

export type AppleSignerMaterial = {
  wwdrPem: string
  signerCertPem: string
  signerKeyPem: string
  /** Passkit expects this field; use empty string when the key PEM is unencrypted. */
  signerKeyPassphrase: string
}

/**
 * Extract signer certificate + private key PEM from an Apple Pass Type ID .p12.
 */
export function p12ToSignerCertificates(p12Der: Buffer, passphrase: string): {
  signerCertPem: string
  signerKeyPem: string
} {
  const p12Asn1 = forge.asn1.fromDer(p12Der.toString("binary"))
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, passphrase)

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  const certBag = certBags[forge.pki.oids.certBag]
  const certificate = certBag?.[0]?.cert
  if (!certificate) {
    throw new Error("No certificate found in Apple Wallet PKCS#12")
  }

  const keyBags1 = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  let privateKey = keyBags1[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key

  if (!privateKey) {
    const keyBags2 = p12.getBags({ bagType: forge.pki.oids.keyBag })
    privateKey = keyBags2[forge.pki.oids.keyBag]?.[0]?.key
  }

  if (!privateKey) {
    throw new Error("No private key found in Apple Wallet PKCS#12")
  }

  return {
    signerCertPem: forge.pki.certificateToPem(certificate),
    signerKeyPem: forge.pki.privateKeyToPem(privateKey as forge.pki.PrivateKey),
  }
}

export function decodeBase64ToUtf8(b64: string): string {
  return Buffer.from(b64.trim(), "base64").toString("utf8")
}

export function decodeBase64ToBuffer(b64: string): Buffer {
  return Buffer.from(b64.trim(), "base64")
}
