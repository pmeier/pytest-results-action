const core = require("@actions/core");
const { XMLParser } = require("fast-xml-parser");
const { readFileSync } = require("node:fs");

const junit_xml = core.getInput("junit-xml", { required: true });

function addDetailsWithCodeBlock(summary, label, code) {
  return summary.addDetails(
    label,
    "\n\n" + summary.wrap("pre", summary.wrap("code", code))
  );
}

const main = async () => {
  core.summary.addHeading("Tests");

  const parser = new XMLParser({
    ignoreAttributes: false,
    processEntities: false,
  });
  const results = parser.parse(readFileSync(junit_xml, "utf-8"));

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

  await core.summary.write();
};

main();
