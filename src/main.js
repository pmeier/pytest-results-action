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

const htmlEntities = {
  nbsp: " ",
  lt: "<",
  gt: ">",
  amp: "&",
  quot: '"',
  apos: "'",
};
const htmlEntityPattern = new RegExp("&([a-z]{2,4});", "g");

function decodeHtmlEntities(text) {
  return text.replace(htmlEntityPattern, function (match, entity) {
    return Object.hasOwn(htmlEntities, entity) ? htmlEntities[entity] : match;
  });
}

const main = async () => {
  core.summary.addHeading("Tests");

  const parser = new XMLParser({ ignoreAttributes: false });
  const results = parser.parse(readFileSync(junit_xml, "utf-8"));

  for (const result of results.testsuites.testsuite.testcase) {
    if (Object.hasOwn(result, "failure")) {
      addDetailsWithCodeBlock(
        core.summary,
        core.summary.wrap(
          "code",
          result["@_classname"] + "." + result["@_name"]
        ),
        core.summary.wrap("code", decodeHtmlEntities(result.failure["#text"]))
      );
    }
  }

  await core.summary.write();
};

main();
