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
exports.parseXmlFiles = parseXmlFiles;
const fs_1 = require("fs");
const core = __importStar(require("@actions/core"));
const glob = __importStar(require("@actions/glob"));
const fast_xml_parser_1 = require("fast-xml-parser");
async function collectXmlFiles(path) {
    const globber = await glob.create(path, {
        implicitDescendants: false,
    });
    const paths = await globber.glob();
    const files = [];
    for (const file_or_dir of paths) {
        let stats;
        try {
            stats = await fs_1.promises.stat(file_or_dir);
        }
        catch (error) {
            core.setFailed(`Action failed with error ${error}`);
            continue;
        }
        if (stats.isFile()) {
            files.push(file_or_dir);
        }
        else {
            const globber = await glob.create(file_or_dir + "/**/*.xml", {
                implicitDescendants: false,
            });
            const subFiles = await globber.glob();
            files.push(...subFiles);
        }
    }
    return files;
}
async function parseXmlFiles(path) {
    const parser = new fast_xml_parser_1.XMLParser({
        ignoreAttributes: false,
        processEntities: false,
    });
    const files = await collectXmlFiles(path);
    return Promise.all(files.map((file) => fs_1.promises.readFile(file, "utf-8").then((content) => parser.parse(content))));
}
