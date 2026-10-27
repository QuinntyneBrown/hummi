namespace Hummi.Domain.Catalogue;

/// <summary>The three open licences Hummi accepts; every track carries exactly one (L2-012).</summary>
public enum Licence
{
    Cc0 = 1,
    CcBy4 = 2,
    CcBySa4 = 3,
}

public static class LicenceLabels
{
    /// <summary>The licence as the track, album and withdrawn pages name it.</summary>
    public static string Of(Licence licence) => licence switch
    {
        Licence.Cc0 => "CC0 1.0 (public domain)",
        Licence.CcBy4 => "CC BY 4.0",
        Licence.CcBySa4 => "CC BY-SA 4.0",
        _ => throw new ArgumentOutOfRangeException(nameof(licence), licence, "Not a Hummi licence."),
    };
}
