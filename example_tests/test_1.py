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


@pytest.mark.xfail(strict=True)
def test_xfail():
    assert False


@pytest.mark.xfail(strict=True)
def test_xpass():
    assert True
