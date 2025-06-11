"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.postResults = postResults;
const gha = __importStar(require("@actions/core"));
const utils_1 = require("./utils");
const resultTypes = [
    "passed",
    "skipped",
    "xfailed",
    "failed",
    "xpassed",
    "error",
];
const resultTypesWithEmoji = (0, utils_1.zip)([...resultTypes], ["green", "yellow", "yellow", "red", "red", "red"].map((color) => `:${color}_circle:`));
async function postResults(results, inputs) {
    // Create a temporary structure that matches the old format
    const oldFormatResults = {
        total_time: results.total_time,
        total_tests: results.total_tests,
        passed: results.tests.filter(t => t.type === "passed"),
        failed: results.tests.filter(t => t.type === "failed"),
        skipped: results.tests.filter(t => t.type === "skipped"),
        xfailed: results.tests.filter(t => t.type === "xfailed"),
        xpassed: results.tests.filter(t => t.type === "xpassed"),
        error: results.tests.filter(t => t.type === "error"),
    };
    addResults(oldFormatResults, inputs.title, inputs.summary, inputs.displayOptions);
    await gha.summary.write();
}
function addResults(results, title, summary, displayOptions) {
    if (title) {
        gha.summary.addHeading(title);
    }
    if (summary) {
        addSummary(results);
    }
    for (const resultType of getResultTypesFromDisplayOptions(displayOptions || "")) {
        const results_for_type = results[resultType];
        if (!results_for_type.length) {
            continue;
        }
        gha.summary.addHeading(resultType, 2);
        for (const result of results_for_type) {
            if (result.msg) {
                addDetailsWithCodeBlock(gha.summary, result.id, result.msg);
            }
            else {
                gha.summary.addRaw(`\n:heavy_check_mark: ${result.id}`, true);
            }
        }
    }
}
function addSummary(results) {
    gha.summary.addRaw(`Ran ${results.total_tests} tests in ${(0, utils_1.prettyDuration)(results.total_time)}`, true);
    const rows = [["Result", "Amount"]];
    for (const [resultType, emoji] of resultTypesWithEmoji) {
        const abs_amount = results[resultType].length;
        const rel_amount = abs_amount / results.total_tests;
        rows.push([
            `${emoji} ${resultType}`,
            `${abs_amount} (${(rel_amount * 100).toFixed(1)}%)`,
        ]);
    }
    gha.summary.addTable(rows);
}
function getResultTypesFromDisplayOptions(displayOptions) {
    // 'N' resets the list of chars passed to the '-r' option of pytest. Thus, we only
    // care about anything after the last occurrence
    const displayChars = displayOptions.split("N").pop() || "";
    console.log(displayChars);
    if (displayChars.toLowerCase().includes("a")) {
        return [...resultTypes];
    }
    const displayTypes = new Set();
    for (const [displayChar, displayType] of [
        ["f", "failed"],
        ["E", "error"],
        ["s", "skipped"],
        ["x", "xfailed"],
        ["X", "xpassed"],
        ["p", "passed"],
        ["P", "passed"],
    ]) {
        if (displayOptions.includes(displayChar)) {
            displayTypes.add(displayType);
        }
    }
    return [...displayTypes];
}
function addDetailsWithCodeBlock(summary, label, code) {
    summary.addDetails(label, "\n\n" + code);
}
