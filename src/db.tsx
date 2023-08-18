import Dexie, { Table } from 'dexie';
import sjcl from 'sjcl';

export type MarkPoint = {
	x: number;
	y: number;
	style: string;
};

export type MarkCollection = {
	[key: string]: MarkPoint;
};

export type Entry = {
	id?: number;
	isDraft?: number; //boolean
	date: string;
	weight?: number;
	height?: number;
	notes?: string;
	imageBlob?: UInt8Array;
	imageHash?: string; 
	imageNaturalWidth?: number;
	imageNaturalHeight?: number;
	thumbImageBlob?: UInt8Array;
	alignedImageBlob?: UInt8Array;
	marks?: MarkCollection;
	includedInExport: number; //boolean
};

export type Setting = {
	key?: string;
	value: any;
	visible?: boolean;
};
export class TypedDexie extends Dexie {
	entries!: Table<Entry>;
	settings!: Table<Setting>;

	constructor() {
		super('db');
		/*
 		this.version(39).stores({
			entries: '++id, draft, date, weight, notes, marks',
			settings: 'key, value'
		});
		*/
		this.version(40).stores({
			entries: '++id, isDraft, date, weight, notes, marks',
			settings: 'key, value'
		}).upgrade( txn => {
			return txn.table('entries').toCollection().modify( entry => {
				entry.isDraft = entry.draft ? 1 : 0;
			});
		});
		this.version(41).stores({
			entries: '++id, isDraft, date, weight, notes, marks, includedInExport',
			settings: 'key, value'
		}).upgrade( txn => {
			return txn.table('entries').toCollection().modify( entry => {
				entry.includedInExport = entry.includeInExport ? 1 : 0;
			});
		});
		this.version(42).stores({
			entries: '++id, isDraft, date, weight, notes, marks, includedInExport',
			settings: 'key, value'
		}).upgrade( txn => {
			return txn.table('entries').toCollection().modify( entry => {
				delete entry.draft;
				delete entry.includeInExport;
			});
		});
		this.version(82).stores({
			entries: '++id, isDraft, date, weight, notes, marks, includedInExport, imageHash',
			settings: 'key, value'
		}).upgrade( txn => {
			const textDecoder = new TextDecoder();
			return txn.table('entries').toCollection().modify( entry => { 
				//console.log('updating hash blob');
				if(entry.imageBlob && entry.imageBlob.buffer && entry.imageBlob.buffer.byteLength) {
					const myBitArray = sjcl.hash.sha256.hash(textDecoder.decode(entry.imageBlob.buffer));
					const sha256Hash = sjcl.codec.hex.fromBits(myBitArray)
					const curHash = sha256Hash;	
					console.log(`curHash=${curHash}`);
					entry.imageHash = curHash;	
				}
			});
		});
	}
}

export const db = new TypedDexie();

//basic examples of handling version change and when db reopens
/*
db.on("versionchange", function(event) {
  if (confirm ("Another page tries to upgrade the database to version " +
                event.newVersion + ". Accept?")) {
    // Refresh current webapp so that it starts working with newer DB schema.
    window.location.reload();
  } else {
    // Will let user finish its work in this window and
    // block the other window from upgrading.
    return false;
  }
});
*/

/*
db.on("ready", function () {
    // Will trigger each time db is successfully opened.
    console.warn('the DB is now open and ready');
}, true);
*/
