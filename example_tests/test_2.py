import pytest


def test_success():
    assert True


def test_fail():
    assert False


# def error():
#     raise RuntimeError
#
#
# @pytest.mark.parametrize("error", error())
# def test_error(error):
#     pass


def test_skip():
    pytest.skip()


@pytest.mark.xfail
def test_xfail():
    assert False


@pytest.mark.xfail
def test_xpass():
    print("I should fail!")
    assert True


class TestCase:
    def test_success(self):
        assert True

    def test_failure(self):
        assert False
