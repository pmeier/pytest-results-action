import dataclasses
import enum
import xml.etree.ElementTree as ET
from collections import defaultdict
from typing import Optional

from ._gha import gha


class Result(enum.Enum):
    SUCCESS = enum.auto()
    SKIPPED = enum.auto()
    XFAIL = enum.auto()
    FAILURE = enum.auto()
    XPASS = enum.auto()
    ERROR = enum.auto()


@dataclasses.dataclass
class Test:
    name: str
    result: Result
    time: float
    message: Optional[str]


def parse_junit_xml(file):
    if not file.exists():
        gha.error(
            f"File {file} does not exist. "
            f"Make sure you run pytest with the --junit-xml flag."
        )

    tree = ET.parse(file)
    test_suite_node = tree.getroot()[0]

    tests = defaultdict(list)
    for test_node in test_suite_node:
        name = f"{test_node.attrib['classname']}.{test_node.attrib['name']}"
        time = float(test_node.attrib["time"])

        childs = list(iter(test_node))
        child = childs[0] if childs else None
        if child is None:
            result = Result.SUCCESS
            message = None
        else:
            result = Result[child.tag.upper()]
            message = child.text

        tests[result].append(Test(name, result=result, time=time, message=message))

    return tests
