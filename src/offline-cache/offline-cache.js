/**
 * Created by dcotton on 09/02/2017.
 */
window.offlineIndexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

var db = null;
var storekey = "state";

var offline = {
    restore: function(callback) {
        if (db) {
            var transaction = db.transaction('offline-cache');
            var objectStore = transaction.objectStore('offline-cache');
            var request = objectStore.get(storekey);
            request.onerror = function(event) {
                console.log('ClaimantDB: error reading from database, ' + request.error.name);
                callback(null);
            };
            request.onsuccess = function(event) {
                if (!request.result) {
                    console.log('ClaimantDB: no saved ' + storekey);
                    callback(null);
                }
                else {
                    console.log("ClaimantDB: restoring state");
                    callback(request.result);
                }
            };
        }
        else if (!window.offlineIndexedDB) {
            console.log('ClaimantDB: browser does not support indexedDB');
        }
        else {
            var request = window.offlineIndexedDB.open('claimant-dashboard-offline');
            request.onerror = function (event) {
                console.log('ClaimantDB: error opening database, ' + request.error.name);
            };
            request.onupgradeneeded = function (event) {
                console.log("ClaimantDB: creating obj store");
                event.target.result.createObjectStore('offline-cache');
            };
            request.onsuccess = function (event) {
                db = event.target.result;
                var transaction = db.transaction('offline-cache');
                var objectStore = transaction.objectStore('offline-cache');
                var request = objectStore.get(storekey);
                request.onerror = function(event) {
                    console.log('ClaimantDB: error reading from database, ' + request.error.name);
                    callback(null);
                };
                request.onsuccess = function(event) {
                    if (!request.result) {
                        console.log('ClaimantDB: no saved ' + storekey);
                    }
                    else {
                        //REDUX ME
                        console.log("ClaimantDB: restoring state");
                        callback(request.result);
                    }
                };

            };
        }
        return null;
    },
    saveState: function (state) {
        if (!db) {
            console.log("ClaimantDB: DB hasn't opened yet, we'll just ignore this for now.");
            return;
        }
        var transaction = db.transaction('offline-cache', 'readwrite');
        var objectStore = transaction.objectStore('offline-cache');
        var request = objectStore.put(state, storekey);
        request.onerror = function(event) {
            console.log('ClaimantDB: error writing to database, ' + request.error.name);
        };
        request.onsuccess = function(event) {
            console.log("ClaimantDB: Successful DB write");
        };
    }
};