"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs_1 = require("@sentry/utils/fs");
var path_1 = require("@sentry/utils/path");
var string_1 = require("@sentry/utils/string");
var lru_map_1 = require("lru_map");
var stacktrace = require("stack-trace");
// tslint:disable-next-line:no-unsafe-any
var DEFAULT_LINES_OF_CONTEXT = 7;
var FILE_CONTENT_CACHE = new lru_map_1.LRUMap(100);
/**
 * Resets the file cache. Exists for testing purposes.
 */
function resetFileContentCache() {
    FILE_CONTENT_CACHE.clear();
}
exports.resetFileContentCache = resetFileContentCache;
/** JSDoc */
function getFunction(frame) {
    try {
        return frame.getFunctionName() || frame.getTypeName() + "." + (frame.getMethodName() || '<anonymous>');
    }
    catch (e) {
        // This seems to happen sometimes when using 'use strict',
        // stemming from `getTypeName`.
        // [TypeError: Cannot read property 'constructor' of undefined]
        return '<anonymous>';
    }
}
var mainModule = ((require.main && require.main.filename && path_1.dirname(require.main.filename)) ||
    global.process.cwd()) + "/";
/** JSDoc */
function getModule(filename, base) {
    if (!base) {
        base = mainModule; // tslint:disable-line:no-parameter-reassignment
    }
    // It's specifically a module
    var file = path_1.basename(filename, '.js');
    filename = path_1.dirname(filename); // tslint:disable-line:no-parameter-reassignment
    var n = filename.lastIndexOf('/node_modules/');
    if (n > -1) {
        // /node_modules/ is 14 chars
        return filename.substr(n + 14).replace(/\//g, '.') + ":" + file;
    }
    // Let's see if it's a part of the main module
    // To be a part of main module, it has to share the same base
    n = (filename + "/").lastIndexOf(base, 0);
    if (n === 0) {
        var moduleName = filename.substr(base.length).replace(/\//g, '.');
        if (moduleName) {
            moduleName += ':';
        }
        moduleName += file;
        return moduleName;
    }
    return file;
}
/**
 * This function reads file contents and caches them in a global LRU cache.
 * Returns a Promise filepath => content array for all files that we were able to read.
 *
 * @param filenames Array of filepaths to read content from.
 */
function readSourceFiles(filenames) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var sourceFiles, i, filename, cache, content, _1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // we're relying on filenames being de-duped already
                    if (filenames.length === 0) {
                        return [2 /*return*/, {}];
                    }
                    sourceFiles = {};
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < filenames.length)) return [3 /*break*/, 7];
                    filename = filenames[i];
                    cache = FILE_CONTENT_CACHE.get(filename);
                    // We have a cache hit
                    if (cache !== undefined) {
                        // If it's not null (which means we found a file and have a content)
                        // we set the content and return it later.
                        if (cache !== null) {
                            sourceFiles[filename] = cache;
                        }
                        // In any case we want to skip here then since we have a content already or we couldn't
                        // read the file and don't want to try again.
                        return [3 /*break*/, 6];
                    }
                    content = null;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fs_1.readFileAsync(filename)];
                case 3:
                    content = _a.sent();
                    sourceFiles[filename] = content;
                    return [3 /*break*/, 5];
                case 4:
                    _1 = _a.sent();
                    return [3 /*break*/, 5];
                case 5:
                    // We always want to set the cache, even to null which means there was an error reading the file.
                    // We do not want to try to read the file again.
                    FILE_CONTENT_CACHE.set(filename, content);
                    _a.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/, sourceFiles];
            }
        });
    });
}
/** JSDoc */
function extractStackFromError(error) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var stack;
        return tslib_1.__generator(this, function (_a) {
            stack = stacktrace.parse(error);
            if (!stack) {
                return [2 /*return*/, []];
            }
            return [2 /*return*/, stack];
        });
    });
}
exports.extractStackFromError = extractStackFromError;
/** JSDoc */
function parseStack(stack, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var filesToRead, linesOfContext, frames, _2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filesToRead = [];
                    linesOfContext = options && options.frameContextLines !== undefined ? options.frameContextLines : DEFAULT_LINES_OF_CONTEXT;
                    frames = stack.map(function (frame) {
                        var parsedFrame = {
                            colno: frame.getColumnNumber(),
                            filename: frame.getFileName() || '',
                            function: getFunction(frame),
                            lineno: frame.getLineNumber(),
                        };
                        var isInternal = frame.isNative() ||
                            (parsedFrame.filename &&
                                !parsedFrame.filename.startsWith('/') &&
                                !parsedFrame.filename.startsWith('.') &&
                                parsedFrame.filename.indexOf(':\\') !== 1);
                        // in_app is all that's not an internal Node function or a module within node_modules
                        // note that isNative appears to return true even for node core libraries
                        // see https://github.com/getsentry/raven-node/issues/176
                        parsedFrame.in_app =
                            !isInternal && parsedFrame.filename !== undefined && !parsedFrame.filename.includes('node_modules/');
                        // Extract a module name based on the filename
                        if (parsedFrame.filename) {
                            parsedFrame.module = getModule(parsedFrame.filename);
                            if (!isInternal && linesOfContext > 0) {
                                filesToRead.push(parsedFrame.filename);
                            }
                        }
                        return parsedFrame;
                    });
                    // We do an early return if we do not want to fetch context liens
                    if (linesOfContext <= 0) {
                        return [2 /*return*/, frames];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, addPrePostContext(filesToRead, frames, linesOfContext)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    _2 = _a.sent();
                    // This happens in electron for example where we are not able to read files from asar.
                    // So it's fine, we recover be just returning all frames without pre/post context.
                    return [2 /*return*/, frames];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.parseStack = parseStack;
/**
 * This function tries to read the source files + adding pre and post context (source code)
 * to a frame.
 * @param filesToRead string[] of filepaths
 * @param frames StackFrame[] containg all frames
 */
function addPrePostContext(filesToRead, frames, linesOfContext) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var sourceFiles;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readSourceFiles(filesToRead)];
                case 1:
                    sourceFiles = _a.sent();
                    return [2 /*return*/, frames.map(function (frame) {
                            if (frame.filename && sourceFiles[frame.filename]) {
                                try {
                                    var lines = sourceFiles[frame.filename].split('\n');
                                    frame.pre_context = lines
                                        .slice(Math.max(0, (frame.lineno || 0) - (linesOfContext + 1)), (frame.lineno || 0) - 1)
                                        .map(function (line) { return string_1.snipLine(line, 0); });
                                    frame.context_line = string_1.snipLine(lines[(frame.lineno || 0) - 1], frame.colno || 0);
                                    frame.post_context = lines
                                        .slice(frame.lineno || 0, (frame.lineno || 0) + linesOfContext)
                                        .map(function (line) { return string_1.snipLine(line, 0); });
                                }
                                catch (e) {
                                    // anomaly, being defensive in case
                                    // unlikely to ever happen in practice but can definitely happen in theory
                                }
                            }
                            return frame;
                        })];
            }
        });
    });
}
/** JSDoc */
function getExceptionFromError(error, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var name, stack, frames;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = error.name || error.constructor.name;
                    return [4 /*yield*/, extractStackFromError(error)];
                case 1:
                    stack = _a.sent();
                    return [4 /*yield*/, parseStack(stack, options)];
                case 2:
                    frames = _a.sent();
                    return [2 /*return*/, {
                            stacktrace: {
                                frames: prepareFramesForEvent(frames),
                            },
                            type: name,
                            value: error.message,
                        }];
            }
        });
    });
}
exports.getExceptionFromError = getExceptionFromError;
/** JSDoc */
function parseError(error, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var name, exception;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = error.name || error.constructor.name;
                    return [4 /*yield*/, getExceptionFromError(error, options)];
                case 1:
                    exception = _a.sent();
                    return [2 /*return*/, {
                            exception: {
                                values: [exception],
                            },
                            message: name + ": " + (error.message || '<no message>'),
                        }];
            }
        });
    });
}
exports.parseError = parseError;
/** JSDoc */
function prepareFramesForEvent(stack) {
    if (!stack || !stack.length) {
        return [];
    }
    var localStack = stack;
    var firstFrameFunction = localStack[0].function || '';
    if (firstFrameFunction.includes('captureMessage') || firstFrameFunction.includes('captureException')) {
        localStack = localStack.slice(1);
    }
    // The frame where the crash happened, should be the last entry in the array
    return localStack.reverse();
}
exports.prepareFramesForEvent = prepareFramesForEvent;
//# sourceMappingURL=parsers.js.map