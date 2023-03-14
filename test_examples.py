import pytest


def test_success():
    assert True


def test_failure():
    assert False


@pytest.mark.skip(reason="reason test_skip")
def test_skip():
    assert False


@pytest.mark.xfail(reason="reason test_xfail")
def test_xfail():
    assert False


@pytest.mark.xfail(reason="reason test_xpass")
def test_xpass():
    assert True


@pytest.mark.xfail(strict=True, reason="reason test_xfail_strict")
def test_xfail_strict():
    assert False


@pytest.mark.xfail(strict=True, reason="reason test_xpass_strict")
def test_xpass_strict():
    assert True


@pytest.fixture
def failing_fixture():
    raise Exception("exception test_error")


def test_error(failing_fixture):
    assert True
