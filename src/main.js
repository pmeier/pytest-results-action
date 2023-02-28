const core = require("@actions/core");
const { XMLParser } = require("fast-xml-parser");
const { readFileSync } = require("node:fs");

const junit_xml = core.getInput("junit-xml", { required: true });

function addDetailsWithCodeBlock(summary, label, code, lang) {
  return summary.addDetails(
    label,
    summary.wrap(
      "pre",
      summary.wrap("code", code.trim()),
      Object.assign({}, lang && { lang })
    )
  );
}

const main = async () => {
  core.summary.addHeading("Tests");

  const parser = new XMLParser({ ignoreAttributes: false });
  const results = parser.parse(readFileSync(junit_xml, "utf-8")).testsuites
    .testsuite.testcase;

  for (const result of results) {
    if (Object.hasOwn(result, "failure")) {
      addDetailsWithCodeBlock(
        core.summary,
        core.summary.wrap(
          "code",
          result["@_classname"] + "." + result["@_name"]
        ),
        core.summary.wrap("code", result.failure["#text"])
      );
    }
  }

  await core.summary.write();
};

main();
