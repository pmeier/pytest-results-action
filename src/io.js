const fs = require("fs").promises;

const core = require("@actions/core");
const glob = require("@actions/glob");

const { XMLParser } = require("fast-xml-parser");

module.exports = { parseXmlFiles };

async function* collectXmlFiles(path) {
  const globber = await glob.create(path, {
    implicitDescendants: false,
  });
  const paths = await globber.glob();

  for (const file_or_dir of paths) {
    var stats;
    try {
      stats = await fs.stat(file_or_dir);
    } catch (error) {
      core.setFailed(`Action failed with error ${error}`);
    }
    if (stats.isFile()) {
      yield file_or_dir;
    } else {
      const globber = await glob.create(file_or_dir + "/**/*.xml", {
        implicitDescendants: false,
      });
      for await (const file of globber.glob()) {
        yield file;
      }
    }
  }
}

async function* parseXmlFiles(path) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    processEntities: false,
  });

  for await (const file of collectXmlFiles(path)) {
    yield parser.parse(await fs.readFile(file, "utf-8"));
  }
}
