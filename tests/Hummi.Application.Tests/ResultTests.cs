using Hummi.Application.Common;

namespace Hummi.Application.Tests;

public sealed class ResultTests
{
    [Fact]
    public void A_value_is_a_success()
    {
        Result<int> result = 7;

        Assert.True(result.IsSuccess);
        Assert.Equal(7, result.Value);
    }

    [Fact]
    public void An_error_is_a_failure()
    {
        Result<int> result = Error.NotFound();

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.Error!.Status);
    }
}
