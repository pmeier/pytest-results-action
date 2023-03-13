const fs = require("fs").promises;

const core = require("@actions/core");
const glob = require("@actions/glob");

const { XMLParser } = require("fast-xml-parser");

const main = async () => {
  const path = core.getInput("path", { required: true });
  const failOnEmpty = core.getBooleanInput("fail-on-empty", {
    required: false,
  });

  const files = await getFiles(path);
  if (files.length == 0 && failOnEmpty) {
    core.setFailed(
      "No JUnit XML file was found. Set `fail-on-empty: false` if that is a valid use case"
    );
  }

  await postResults(files);
};

main();

async function getFiles(path) {
  const globber = await glob.create(path, {
    implicitDescendants: false,
  });
  const paths = await globber.glob();

  var files = [];
  for (const file_or_dir of paths) {
    var stats;
    try {
      stats = await fs.stat(file_or_dir);
    } catch (error) {
      core.setFailed(`Action failed with error ${error}`);
    }
    if (stats.isFile()) {
      files.push(file_or_dir);
    } else {
      const globber = await glob.create(file_or_dir + "/**/*.xml", {
        implicitDescendants: false,
      });
      files.push(...(await globber.glob()));
    }
  }
  return files;
}

async function postResults(files) {
  core.summary.addHeading("Tests");

  const parser = new XMLParser({
    ignoreAttributes: false,
    processEntities: false,
  });
  for (const file of files) {
    const results = parser.parse(await fs.readFile(file, "utf-8"));

    for (const result of results.testsuites.testsuite.testcase) {
      if (Object.hasOwn(result, "failure")) {
        addDetailsWithCodeBlock(
          core.summary,
          core.summary.wrap(
            "code",
            result["@_classname"] + "." + result["@_name"]
          ),
          result.failure["#text"]
        );
      }
    }
  }

  return core.summary.write();
}

function addDetailsWithCodeBlock(summary, label, code) {
  return summary.addDetails(
    label,
    "\n\n" + summary.wrap("pre", summary.wrap("code", code))
  );
}
