import numpy as np
from sklearn.linear_model import LinearRegression
from api.models.stock import RegressionChannel, ChartDataPoint


def linear_regression_channel(data: list[ChartDataPoint], std_multiplier: float = 2.0) -> RegressionChannel:
    """
    Calculate a linear regression channel over OHLC close prices.
    Returns upper, middle (regression line), and lower channel lines.
    """
    closes = np.array([p.close for p in data], dtype=float)
    x = np.arange(len(closes))

    # Least-squares linear regression
    coeffs = np.polyfit(x, closes, 1)
    poly = np.poly1d(coeffs)
    middle = poly(x)

    # Standard deviation of residuals for channel width
    residuals = closes - middle
    std = float(np.std(residuals))

    upper = (middle + std_multiplier * std).tolist()
    lower = (middle - std_multiplier * std).tolist()
    middle_list = middle.tolist()
    times = [p.time for p in data]

    return RegressionChannel(upper=upper, middle=middle_list, lower=lower, times=times)


def linear_regression_channel_log(
    data: list[ChartDataPoint],
    length: int = 800,
    upper_mult: float = 2.0,
    lower_mult: float = 2.0,
) -> RegressionChannel:
    """
    Calculate a log-scale linear regression channel.

    Regression is performed on log(close) so the channel captures
    percentage-based deviation rather than absolute price deviation.
    The resulting upper/middle/lower lines are exponentiated back to
    price space, giving curved (exponential) channel boundaries.

    Args:
        data: List of ChartDataPoint sorted chronologically.
        length: Number of most-recent bars to include in the regression.
        upper_mult: Standard-deviation multiplier for the upper band.
        lower_mult: Standard-deviation multiplier for the lower band.
    """
    # Use only the most recent `length` bars
    window = data[-length:] if len(data) > length else data

    closes = np.array([p.close for p in window], dtype=float)
    log_closes = np.log(closes)
    X = np.arange(len(log_closes)).reshape(-1, 1)

    # Linear fit in log space using sklearn
    model = LinearRegression()
    model.fit(X, log_closes)
    log_mid = model.predict(X)

    residuals = log_closes - log_mid
    std = float(np.std(residuals))

    # Pearson r between bar index and log(close) — measures trend linearity
    x_flat = X.flatten().astype(float)
    pearson_r = float(np.corrcoef(x_flat, log_closes)[0, 1])

    # Exponentiate back to price space
    middle_arr = np.exp(log_mid)
    upper_arr  = np.exp(log_mid + upper_mult * std)
    lower_arr  = np.exp(log_mid - lower_mult * std)

    times = [p.time for p in window]

    return RegressionChannel(
        upper=upper_arr.tolist(),
        middle=middle_arr.tolist(),
        lower=lower_arr.tolist(),
        times=times,
        pearson_r=round(pearson_r, 4),
    )


def simple_moving_average(data: list[ChartDataPoint], period: int = 20) -> list[float | None]:
    """Calculate SMA over close prices."""
    closes = [p.close for p in data]
    result: list[float | None] = [None] * (period - 1)
    for i in range(period - 1, len(closes)):
        result.append(sum(closes[i - period + 1 : i + 1]) / period)
    return result


def exponential_moving_average(data: list[ChartDataPoint], period: int = 20) -> list[float | None]:
    """Calculate EMA over close prices."""
    closes = [p.close for p in data]
    if len(closes) < period:
        return [None] * len(closes)
    k = 2 / (period + 1)
    result: list[float | None] = [None] * (period - 1)
    ema = sum(closes[:period]) / period
    result.append(ema)
    for price in closes[period:]:
        ema = price * k + ema * (1 - k)
        result.append(ema)
    return result
