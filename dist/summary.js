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
const parse_1 = require("./parse");
const resultTypes = [
    parse_1.TestType.Passed,
    parse_1.TestType.Skipped,
    parse_1.TestType.XFailed,
    parse_1.TestType.Failed,
    parse_1.TestType.XPassed,
    parse_1.TestType.Error,
];
const resultTypesWithEmoji = (0, utils_1.zip)([...resultTypes], ["green", "yellow", "yellow", "red", "red", "red"].map((color) => `:${color}_circle:`));
async function postResults(results, inputs) {
    // Create a temporary structure that matches the old format
    const oldFormatResults = {
        total_time: results.total_time,
        total_tests: results.total_tests,
        passed: results.tests.filter((t) => t.type === parse_1.TestType.Passed),
        failed: results.tests.filter((t) => t.type === parse_1.TestType.Failed),
        skipped: results.tests.filter((t) => t.type === parse_1.TestType.Skipped),
        xfailed: results.tests.filter((t) => t.type === parse_1.TestType.XFailed),
        xpassed: results.tests.filter((t) => t.type === parse_1.TestType.XPassed),
        error: results.tests.filter((t) => t.type === parse_1.TestType.Error),
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
        ["f", parse_1.TestType.Failed],
        ["E", parse_1.TestType.Error],
        ["s", parse_1.TestType.Skipped],
        ["x", parse_1.TestType.XFailed],
        ["X", parse_1.TestType.XPassed],
        ["p", parse_1.TestType.Passed],
        ["P", parse_1.TestType.Passed],
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
