const fs = require("fs").promises;

const gha = require("@actions/core");

const { zip, prettyDuration } = require("./utils");

module.exports = { postResults };

// FIXME: refactor
const resultTypes = [
  "passed",
  "skipped",
  "xfailed",
  "failed",
  "xpassed",
  "error",
];
const resultTypesWithEmoji = zip(
  resultTypes,
  ["green", "yellow", "yellow", "red", "red", "red"].map(
    (color) => `:${color}_circle:`
  )
);

async function postResults(xmls, inputs) {
  const results = await extractResults(xmls);
  if (results.total_tests == 0) {
    return;
  }

  addResults(results, inputs.title, inputs.summary, inputs.displayOptions);
  await gha.summary.write();
}

async function extractResults(xmls) {
  const results = {
    total_time: 0.0,
    total_tests: 0,
    // FIXME: incorporate from above
    passed: [],
    failed: [],
    skipped: [],
    xfailed: [],
    xpassed: [],
    error: [],
  };

  for await (const xml of xmls) {
    var testSuites = xml.testsuites.testsuite;
    testSuites = testSuites instanceof Array ? testSuites : [testSuites];

    for (var testSuite of testSuites) {
      results.total_time += parseFloat(testSuite["@_time"]);

      var testCases = testSuite.testcase;
      testCases = testCases instanceof Array ? testCases : [testCases];
      for (const result of testCases) {
        var resultTypeArray;
        var msg;

        if (Object.hasOwn(result, "failure")) {
          var msg = result.failure["#text"];
          const parts = msg.split("[XPASS(strict)] ");
          if (parts.length == 2) {
            resultTypeArray = results.xpassed;
            msg = parts[1];
          } else {
            resultTypeArray = results.failed;
          }
        } else if (Object.hasOwn(result, "skipped")) {
          if (result.skipped["@_type"] == "pytest.xfail") {
            resultTypeArray = results.xfailed;
          } else {
            resultTypeArray = results.skipped;
          }
          msg = result.skipped["@_message"];
        } else if (Object.hasOwn(result, "error")) {
          resultTypeArray = results.error;
          // FIXME: do we need to integrate the message here?
          msg = result.error["#text"];
        } else {
          // This could also be an xpass when strict=False is set. Unfortunately, there is no way to differentiate here
          // See FIXME
          resultTypeArray = results.passed;
          msg = undefined;
        }

        resultTypeArray.push({
          id: result["@_classname"] + "." + result["@_name"],
          msg: msg,
        });
        results.total_tests += 1;
      }
    }
  }

  return results;
}

async function addResults(results, title, summary, displayOptions) {
  gha.summary.addHeading(title);

  if (summary) {
    addSummary(results);
  }

  for (resultType of getResultTypesFromDisplayOptions(displayOptions)) {
    const results_for_type = results[resultType];
    if (!results_for_type.length) {
      continue;
    }

    gha.summary.addHeading(resultType, 2);

    for (const result of results_for_type) {
      if (result.msg) {
        addDetailsWithCodeBlock(
          gha.summary,
          gha.summary.wrap("code", result.id),
          result.msg
        );
      } else {
        gha.summary.addRaw(`\n:heavy_check_mark: ${result.id}`, true);
      }
    }
  }
}

function addSummary(results) {
  gha.summary.addRaw(
    `Ran ${results.total_tests} tests in ${prettyDuration(results.total_time)}`,
    true
  );

  var rows = [["Result", "Amount"]];
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
  const displayChars = displayOptions.split("N").pop();

  console.log(displayChars);

  if (displayChars.toLowerCase().includes("a")) {
    return resultTypes;
  }

  var displayTypes = new Set();
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
  return summary.addDetails(
    label,
    "\n\n" + summary.wrap("pre", summary.wrap("code", code))
  );
}
