const u = new (require('./utilities.js'))();
const crypto = require('crypto').webcrypto;
const pemJwk = require('pem-jwk');
const asn1 = require('asn1.js');
const Buffer = require('buffer').Buffer;
const jwt = require("jsonwebtoken");

class Discreet {
	constructor(){
		this.crypto = crypto;
		this.pemJwk = pemJwk;
		this.asn1 = asn1;
		this.Buffer = Buffer;
		this.jwt = jwt;
	}
	// generateSecretKey
	// generateRandomPin
	// isSPKIFormat
	// PEMtoBuffer
	// base64ToArrayBuffer
	// arrayBufferToBase64
	// arrayBufferToPem
	// encrypt
	// decrypt
	// deriveKey
	generateSecretKey() {
		let secretKey;
		if (typeof crypto.getRandomValues !== "undefined") {
			// Web Crypto API (client-side)
			secretKey = new Uint8Array(32);
			crypto.getRandomValues(secretKey);
		} else if (typeof crypto.randomBytes !== "undefined") {
			// Node.js (server-side)
			secretKey = crypto.randomBytes(32);
		} else {
			throw new Error("No suitable random generator found.");
		}
		return Array.from(secretKey)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}
	generateRandomPin() {
		const min = 1000;
		const max = 9999;
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	isSPKIFormat(publicKey) {
		try {
			const keyBuffer = this.PEMtoBuffer(publicKey);
			const algorithmOid = new Uint8Array([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01]);
			const spkiHeader = new Uint8Array([0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00]);
			const keyHeader = new Uint8Array(keyBuffer.slice(0, 26));
			if (keyHeader.length !== spkiHeader.length) {
				return false;
			}
			for (let i = 0; i < spkiHeader.length; i++) {
				if (keyHeader[i] !== spkiHeader[i] && keyHeader[i] !== algorithmOid[i]) {
					return false;
				}
			}
			return true;
		} catch (error) {
			console.error(error);
			return false;
		}
	}
	PEMtoBuffer(pem) {
		if (!pem) {
			return null;
		}
		const base64 = pem
			.replace(/-----BEGIN PUBLIC KEY-----/, '')
			.replace(/-----END PUBLIC KEY-----/, '')
			.replace(/\s+/g, '');
		return this.base64ToArrayBuffer(base64);
	}
	base64ToArrayBuffer(base64) {
		try {
			const buffer = Buffer.from(base64, 'base64');
			const bytes = new Uint8Array(buffer);
			return bytes.buffer;
		} catch (error) {
			console.error(error);
			return null;
		}
	}
	async arrayBufferToBase64(buffer) {
		return new Promise((resolve, reject) => {
			const base64data = Buffer.from(buffer).toString('base64');
			if (base64data) {
				resolve(base64data);
			} else {
				reject(new Error('Error converting array buffer to base64'));
			}
		});
	}
	arrayBufferToPem(key) {
		const exported = String.fromCharCode.apply(null, new Uint8Array(key));
		const base64 = btoa(exported);
		const pem = base64.match(/.{0,64}/g).join('\n');
		return `-----BEGIN PUBLIC KEY-----\n${pem}\n-----END PUBLIC KEY-----`;
	}
	async encrypt(data, key) {
		const encoder = new TextEncoder();
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const encodedData = encoder.encode(JSON.stringify(data));
		const encryptedData = await crypto.subtle.encrypt({
				name: "AES-GCM",
				iv: iv,
			},
			key,
			encodedData
		);
		const encryptedBytes = new Uint8Array(encryptedData);
		const encryptedHex = Array.from(encryptedBytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		const ivHex = Array.from(iv)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		return ivHex + ":" + encryptedHex;
	}
	async decrypt(encryptedData, key) {
		if (!encryptedData) {
			console.error("Encrypted data is undefined, cannot decrypt.");
			return null;
		}
		try {
			const [ivHex, encryptedHex] = encryptedData.split(":");

			const iv = new Uint8Array(
				ivHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
			);
			const encryptedText = new Uint8Array(
				encryptedHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
			);

			const decryptedContent = await crypto.subtle.decrypt({
					name: "AES-GCM",
					iv: iv,
				},
				key,
				encryptedText.buffer
			);

			const decryptedData = JSON.parse(new TextDecoder().decode(decryptedContent));
			return decryptedData;
		} catch (error) {
			console.error("Decryption error:", error);
			return null;
		}
	}
	async deriveKey(sharedSecret) {
		const encoder = new TextEncoder();
		const sharedSecretBuffer = encoder.encode(sharedSecret);
		const derivedKeyBuffer = await crypto.subtle.digest('SHA-256', sharedSecretBuffer);
		return derivedKeyBuffer;
	}
}

module.exports = Discreet;
