export enum TestType {
  Passed = "passed",
  Skipped = "skipped",
  XFailed = "xfailed",
  Failed = "failed",
  XPassed = "xpassed",
  Error = "error",
}

export interface TestResult {
  id: string;
  type: TestType;
  msg?: string;
}

export interface TestResults {
  total_time: number;
  total_tests: number;
  tests: TestResult[];
}

export function extractResults(xmls: any[]): TestResults {
  const results: TestResults = {
    total_time: 0.0,
    total_tests: 0,
    tests: [],
  };

  for (const xml of xmls) {
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
        let type: TestType;
        let msg: string | undefined;

        if ("failure" in result) {
          const failureMsg = result.failure["#text"];
          const parts = failureMsg.split("[XPASS(strict)] ");
          if (parts.length === 2) {
            type = TestType.XPassed;
            msg = parts[1];
          } else {
            type = TestType.Failed;
            msg = failureMsg;
          }
        } else if ("skipped" in result) {
          if (result.skipped["@_type"] === "pytest.xfail") {
            type = TestType.XFailed;
          } else {
            type = TestType.Skipped;
          }
          msg = result.skipped["@_message"];
        } else if ("error" in result) {
          type = TestType.Error;
          msg = result.error["#text"];
        } else {
          type = TestType.Passed;
          msg = undefined;
        }

        results.tests.push({
          id: result["@_classname"] + "." + result["@_name"],
          type,
          msg,
        });
        results.total_tests += 1;
      }
    }
  }

  return results;
}
