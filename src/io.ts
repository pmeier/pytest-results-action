import { promises as fs } from "fs";
import * as core from "@actions/core";
import * as glob from "@actions/glob";
import { XMLParser } from "fast-xml-parser";

interface TestSuite {
  [key: string]: any;
}

async function collectXmlFiles(path: string): Promise<string[]> {
  const globber = await glob.create(path, {
    implicitDescendants: false,
  });
  const paths = await globber.glob();
  const files: string[] = [];

  for (const file_or_dir of paths) {
    let stats;
    try {
      stats = await fs.stat(file_or_dir);
    } catch (error) {
      core.setFailed(`Action failed with error ${error}`);
      continue;
    }
    if (stats.isFile()) {
      files.push(file_or_dir);
    } else {
      const globber = await glob.create(file_or_dir + "/**/*.xml", {
        implicitDescendants: false,
      });
      const subFiles = await globber.glob();
      files.push(...subFiles);
    }
  }

  return files;
}

export async function parseXmlFiles(path: string): Promise<TestSuite[]> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    processEntities: false,
  });

  const files = await collectXmlFiles(path);
  return Promise.all(
    files.map((file) =>
      fs.readFile(file, "utf-8").then((content) => parser.parse(content))
    )
  );
}
