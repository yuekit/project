import math

import pytest

from exprcalc import (
    DEFAULT_FUNCTIONS,
    EvaluationError,
    evaluate_expression,
    list_available_functions,
)


def test_basic_arithmetic():
    assert evaluate_expression("2 + 2 * 3") == 8


def test_variables_are_supported():
    assert evaluate_expression("length * width", variables={"length": 5, "width": 2}) == 10


def test_boolean_logic():
    assert evaluate_expression("3 > 2 and 1 < 4") is True


def test_math_functions_available():
    result = evaluate_expression("sin(pi / 2)")
    assert pytest.approx(result) == 1.0


def test_common_constants_available():
    result = evaluate_expression("pi + tau + e")
    assert pytest.approx(result) == math.pi + math.tau + math.e


def test_custom_function_can_be_supplied():
    def triple(value: float) -> float:
        return value * 3

    assert evaluate_expression("triple(4)", functions={"triple": triple}) == 12


def test_unknown_variable_raises_error():
    with pytest.raises(EvaluationError):
        evaluate_expression("missing + 1")


def test_invalid_expression_rejected():
    with pytest.raises(EvaluationError):
        evaluate_expression("import os")


def test_list_available_functions_matches_defaults():
    assert set(list_available_functions()) == set(DEFAULT_FUNCTIONS.keys())


def test_cli_listing_functions(capsys):
    from exprcalc.cli import main

    main(["0", "--list-functions"])
    captured = capsys.readouterr()
    assert "sin" in captured.out


def test_cli_prints_result(capsys):
    from exprcalc.cli import main

    main(["1 + 1"])
    captured = capsys.readouterr()
    assert captured.out.strip() == "2"


def test_cli_uses_variables(capsys):
    from exprcalc.cli import main

    main(["a * 2", "-v", "a=5"])
    captured = capsys.readouterr()
    assert captured.out.strip() == "10"


def test_sum_function_handles_iterable():
    assert evaluate_expression("sum([1, 2, 3])") == 6
