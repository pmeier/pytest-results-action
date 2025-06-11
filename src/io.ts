import { promises as fs } from "fs";
import * as core from "@actions/core";
import * as glob from "@actions/glob";
import { XMLParser } from "fast-xml-parser";

interface TestSuite {
  [key: string]: any;
}

export async function* collectXmlFiles(path: string): AsyncGenerator<string> {
  const globber = await glob.create(path, {
    implicitDescendants: false,
  });
  const paths = await globber.glob();

  for (const file_or_dir of paths) {
    let stats;
    try {
      stats = await fs.stat(file_or_dir);
    } catch (error) {
      core.setFailed(`Action failed with error ${error}`);
      continue;
    }
    if (stats.isFile()) {
      yield file_or_dir;
    } else {
      const globber = await glob.create(file_or_dir + "/**/*.xml", {
        implicitDescendants: false,
      });
      const files = await globber.glob();
      for (const file of files) {
        yield file;
      }
    }
  }
}

export async function* parseXmlFiles(path: string): AsyncGenerator<TestSuite> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    processEntities: false,
  });

  for await (const file of collectXmlFiles(path)) {
    yield parser.parse(await fs.readFile(file, "utf-8"));
  }
} 