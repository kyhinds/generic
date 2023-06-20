const fs = require("fs");
const path = require("path");
const consoleLogPath = "console_logs";

class Utilities {
    static instance;

    constructor() {
        if (!Utilities.instance) {
            this.fs = fs;
            this.path = path;
            this.consoleLogPath = consoleLogPath; // Make it a class property
            this.currentOutputFileName = this.generateOutputFileName();
            this.initializeConsoleLog();
            Utilities.instance = this;
        }
        return Utilities.instance;
    }
    // sanitizeAndCheckDangerousInput
    // sanitizeInput
    // deserializeInput
    // hasDangerousCharacters
    // calculateDifference
    // calculatePercentageDifference
    // last
    // compareObjects
    // deepCopy
    // createRecursiveCallbacks
    // updateCallbackInput
    // executeCallbacks
    // replacer
    // cl
    clone(obj) { // alert(obj);
        return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
    }
    initializeConsoleLog() {
        if (!this.fs.existsSync(consoleLogPath)) {
            this.fs.mkdirSync(consoleLogPath);
        }
    }
    replacer() {
        const seen = new Set();
        return (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular]';
                }
                seen.add(value);
            }
            return value;
        };
    }
    cl(message) {
        // Get the caller's file and line number
        const stackTrace = new Error().stack.split('\n');
        const callerInfo = stackTrace[2].trim(); // The second line in the stack trace is the caller's info
        // Log the message to the console
        console.log(message);
        //console.log(callerInfo);
        // Convert the object to a string
        const messageString = message;
        //typeof message === 'object' ? JSON.stringify(message, this.replacer(), 2) : message;

        // Write the message to the output file in the console_outputs subdirectory
        this.fs.appendFile(this.path.join(this.consoleLogPath, this.currentOutputFileName),
         messageString + "\n" + callerInfo + "\n" + "\n" + "\n", (err) => {
            if (err) {
                console.error("Error writing to output file:", err);
            }
        });
    }
    generateOutputFileName() {
        const date = new Date();
        const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
        const timeString = `${date.getHours().toString().padStart(2, "0")}-${date.getMinutes().toString().padStart(2, "0")}-${date.getSeconds().toString().padStart(2, "0")}`;
        return `output-${dateString}-${timeString}.js`;
    }
    sanitizeAndCheckDangerousInput(msg) {
        const sanitizedObj = this.sanitizeInput(msg);
        if (this.hasDangerousCharacters(sanitizedObj) || this.hasDangerousCharacters(msg)) {
            sanitizedObj.finalWords = "DIRTY INPUT";
            completeRequest(sanitizedObj);
            return;
        }
    }
    sanitizeInput(obj) {
        const newObj = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                newObj[key] = obj[key].replace(/</g, '&lt;').replace(/>/g, '&gt;');
            } else if (typeof obj[key] === 'object') {
                newObj[key] = this.sanitizeInput(obj[key]);
            } else {
                newObj[key] = obj[key];
            }
        }
        return newObj;
    }
    deserializeInput(obj) {
        const newObj = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                newObj[key] = obj[key].replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            } else if (typeof obj[key] === 'object') {
                newObj[key] = this.deserializeInput(obj[key]);
            } else {
                newObj[key] = obj[key];
            }
        }
        return newObj;
    }
    hasDangerousCharacters(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                if (obj[key].includes('<') || obj[key].includes('>')) {
                    return true;
                }
            } else if (typeof obj[key] === 'object') {
                if (this.hasDangerousCharacters(obj[key])) {
                    return true;
                }
            }
        }
        return false;
    }
    calculateDifference(received, expected) {
        return Math.abs(received - expected);
    }
    calculatePercentageDifference(received, expected) {
        const diff = Math.abs(received - expected);
        const percentageDiff = (diff / expected) * 100;
        return percentageDiff;
    }
    last(arr) {
        if (Array.isArray(arr) && arr.length > 0) {
            return arr[arr.length - 1];
        }
        return null;
    }
    compareObjects(obj1, obj2) {
        if (obj1 === undefined || obj2 === undefined) {
            return false;
        }
        if (obj1 === null || obj2 === null) {
            return obj1 === obj2;
        }
        return obj1.toString() === obj2.toString();
    }
    deepCopy(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const newObj = Array.isArray(obj) ? [] : {};

        for (const key in obj) {
            newObj[key] = this.deepCopy(obj[key]);
        }

        return newObj;
    }
    createRecursiveCallbacks(functions) {
        if (functions.length === 0) {
            return null;
        }
        const currentFunc = functions[0];
        const remainingFuncs = functions.slice(1);
        const nestedCallback = this.createRecursiveCallbacks(remainingFuncs);

        return {
            func: currentFunc.func,
            input: {
                ...currentFunc.input,
                callback: nestedCallback, // Directly set the nested callback here
            },
        };
    }
    getCallbackAtIndex(callbackChain, index, currentIndex = 0) {
        if (!callbackChain) return null;
        if (currentIndex === index) return callbackChain;
        return this.getCallbackAtIndex(callbackChain.input.callback, index, currentIndex + 1);
    }
    updateCallbackInput(callbackChain, index, newInputs, currentIndex = 0) {
        if (!callbackChain) return null;

        if (currentIndex === index) {
            return {
                func: callbackChain.func,
                input: {
                    ...callbackChain.input,
                    ...newInputs,
                    callback: callbackChain.input.callback, // Carry over the rest of the chain
                },
            };
        }

        return {
            func: callbackChain.func,
            input: {
                ...callbackChain.input,
                callback: this.updateCallbackInput(callbackChain.input.callback, index, newInputs, currentIndex + 1),
            },
        };
    }

    // updateCallbackInput(callbackChain, index, newInputs) {
    //     let currentCallback = callbackChain;
    //     let currentIndex = 0;
    //     while (currentCallback) {
    //         if (currentIndex === index) {
    //             currentCallback.input = {
    //                 ...currentCallback.input,
    //                 ...newInputs,
    //             };
    //             break;
    //         }
    //         currentCallback = currentCallback.callback;
    //         currentIndex++;
    //     }
    // }
    async executeCallbacks(msg, data, continueStack) {
        this.cl("EXECUTE CALLBACKS");
        this.cl(msg.callback)
        this.cl(data)
        //this.cl("JOINS AND DATA");
        //this.cl(data)
        //this.cl(msg.callback)
        continueStack = (continueStack && msg.callback && msg.callback !== null) ? true : false;
        this.cl("CONTINUE STACK?: "+ continueStack);
        if (!msg.callback) {
            return;
        }
        //this.cl(msg);
        const callback = msg.callback;
        let newMessage = {
            ...msg
        };
        // Merge properties from the data object
        if (typeof data === "object" && data !== null) {
            newMessage = {
                ...newMessage,
                ...data
            };
        } else {
            newMessage.data = data;
        }
        if (!continueStack) {
            newMessage.callback = null; // Remove the remaining nested callbacks
        } else {
            newMessage.callback = msg.callback.input.callback; // Set the next callback in the chain
        }
        callback.input = {
            ...callback.input,
            ...newMessage
        };
        //this.cl("NEW MESSAGE JOINS AND DATA");
        //this.cl(callback.input);
        await callback.func(callback.input);
    }
}

module.exports = Utilities;
