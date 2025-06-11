import * as gha from "@actions/core";
import { zip, prettyDuration } from "./utils";
import type { ActionInputs } from "./main";

interface TestResult {
  id: string;
  msg?: string;
}

interface TestResults {
  total_time: number;
  total_tests: number;
  passed: TestResult[];
  failed: TestResult[];
  skipped: TestResult[];
  xfailed: TestResult[];
  xpassed: TestResult[];
  error: TestResult[];
}

const resultTypes = [
  "passed",
  "skipped",
  "xfailed",
  "failed",
  "xpassed",
  "error",
] as const;

type ResultType = (typeof resultTypes)[number];
type ResultArrayKey = Exclude<keyof TestResults, "total_time" | "total_tests">;

const resultTypesWithEmoji = zip(
  [...resultTypes],
  ["green", "yellow", "yellow", "red", "red", "red"].map(
    (color) => `:${color}_circle:`
  )
);

export async function postResults(
  xmls: AsyncGenerator<any>,
  inputs: ActionInputs
): Promise<void> {
  const results = await extractResults(xmls);
  if (results.total_tests === 0) {
    return;
  }

  addResults(results, inputs.title, inputs.summary, inputs.displayOptions);
  await gha.summary.write();
}

async function extractResults(xmls: AsyncGenerator<any>): Promise<TestResults> {
  const results: TestResults = {
    total_time: 0.0,
    total_tests: 0,
    passed: [],
    failed: [],
    skipped: [],
    xfailed: [],
    xpassed: [],
    error: [],
  };

  for await (const xml of xmls) {
    let testSuites = xml.testsuites.testsuite;
    testSuites = testSuites instanceof Array ? testSuites : [testSuites];

    for (const testSuite of testSuites) {
      results.total_time += parseFloat(testSuite["@_time"]);

      let testCases = testSuite.testcase;
      if (!testCases) {
        continue;
      }
      testCases = testCases instanceof Array ? testCases : [testCases];
      for (const result of testCases) {
        let resultTypeArray: TestResult[];
        let msg: string | undefined;

        if ("failure" in result) {
          const failureMsg = result.failure["#text"];
          const parts = failureMsg.split("[XPASS(strict)] ");
          if (parts.length === 2) {
            resultTypeArray = results.xpassed;
            msg = parts[1];
          } else {
            resultTypeArray = results.failed;
            msg = failureMsg;
          }
        } else if ("skipped" in result) {
          if (result.skipped["@_type"] === "pytest.xfail") {
            resultTypeArray = results.xfailed;
          } else {
            resultTypeArray = results.skipped;
          }
          msg = result.skipped["@_message"];
        } else if ("error" in result) {
          resultTypeArray = results.error;
          msg = result.error["#text"];
        } else {
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

function addResults(
  results: TestResults,
  title?: string,
  summary?: boolean,
  displayOptions?: string
): void {
  if (title) {
    gha.summary.addHeading(title);
  }

  if (summary) {
    addSummary(results);
  }

  for (const resultType of getResultTypesFromDisplayOptions(
    displayOptions || ""
  )) {
    const results_for_type = results[resultType];
    if (!results_for_type.length) {
      continue;
    }

    gha.summary.addHeading(resultType, 2);

    for (const result of results_for_type) {
      if (result.msg) {
        addDetailsWithCodeBlock(gha.summary, result.id, result.msg);
      } else {
        gha.summary.addRaw(`\n:heavy_check_mark: ${result.id}`, true);
      }
    }
  }
}

function addSummary(results: TestResults): void {
  gha.summary.addRaw(
    `Ran ${results.total_tests} tests in ${prettyDuration(results.total_time)}`,
    true
  );

  const rows = [["Result", "Amount"]];
  for (const [resultType, emoji] of resultTypesWithEmoji) {
    const abs_amount = results[resultType as ResultArrayKey].length;
    const rel_amount = abs_amount / results.total_tests;
    rows.push([
      `${emoji} ${resultType}`,
      `${abs_amount} (${(rel_amount * 100).toFixed(1)}%)`,
    ]);
  }
  gha.summary.addTable(rows);
}

function getResultTypesFromDisplayOptions(
  displayOptions: string
): ResultType[] {
  // 'N' resets the list of chars passed to the '-r' option of pytest. Thus, we only
  // care about anything after the last occurrence
  const displayChars = displayOptions.split("N").pop() || "";

  console.log(displayChars);

  if (displayChars.toLowerCase().includes("a")) {
    return [...resultTypes];
  }

  const displayTypes = new Set<ResultType>();
  for (const [displayChar, displayType] of [
    ["f", "failed"],
    ["E", "error"],
    ["s", "skipped"],
    ["x", "xfailed"],
    ["X", "xpassed"],
    ["p", "passed"],
    ["P", "passed"],
  ] as const) {
    if (displayOptions.includes(displayChar)) {
      displayTypes.add(displayType);
    }
  }

  return [...displayTypes];
}

function addDetailsWithCodeBlock(
  summary: typeof gha.summary,
  label: string,
  code: string
): void {
  summary.addDetails(label, "\n\n" + code);
}
