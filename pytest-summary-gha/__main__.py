import argparse
import contextlib

import os
import pathlib
import sys
import traceback

from ._gha import gha
from ._junit import parse_junit_xml
from ._summary import make_summary


def main(args):
    tests = parse_junit_xml(args.junit_xml_file)
    report = make_summary(tests)

    with open(args.step_summary_file, "w") as fh:
        fh.write(str(report))


def parse_argv(argv=None):
    parser = argparse.ArgumentParser()

    parser.add_argument("junit_xml_file", type=pathlib.Path)
    parser.add_argument("--step-summary-file", type=pathlib.Path)

    args = parser.parse_args(argv or sys.argv[1:])

    if args.step_summary_file is None:
        try:
            args.step_summary_file = pathlib.Path(os.getenv("GITHUB_STEP_SUMMARY"))
        except KeyError:
            raise RuntimeError from None

    return args


@contextlib.contextmanager
def catch_unhandled_exceptions():
    try:
        yield
    except Exception as error:
        gha.error(
            "An exception was raised in the 'pytest-summary-gha' step. "
            "Please copy the traceback from the logs and report this at "
            "https://github.com/pmeier/pytest-summary-gha/issues/.",
            exit=False,
        )
        with gha.group("Traceback"):
            print("".join(traceback.format_exception(error)).strip())
        sys.exit(1)


if __name__ == "__main__":
    # sys.argv = [sys.argv[0], "--step-summary-file=summary.md", "tests-results.xml"]

    with catch_unhandled_exceptions():
        args = parse_argv()
        main(args)
