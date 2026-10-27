namespace Hummi.Domain.Catalogue;

/// <summary>
/// A named category of the catalogue. Hummi carries a fixed set of ten (<see cref="All"/>); their ids
/// never change, so the database seeds them with the schema. <see cref="Tone"/> picks one of the six
/// design-system cover gradients for the genre's tile.
/// </summary>
public sealed class Genre
{
    private Genre(Guid id, string slug, string name, string description, int position, int tone)
    {
        Id = id;
        Slug = slug;
        Name = name;
        Description = description;
        Position = position;
        Tone = tone;
    }

    public Guid Id { get; private set; }

    /// <summary>The genre's segment of <c>/genres/{slug}</c>.</summary>
    public string Slug { get; private set; }

    public string Name { get; private set; }

    public string Description { get; private set; }

    /// <summary>Order on Browse; the first <see cref="MoodCount"/> also appear as mood chips.</summary>
    public int Position { get; private set; }

    /// <summary>Cover gradient 1 to 6 of the design system.</summary>
    public int Tone { get; private set; }

    /// <summary>How many genres the Moods shelf of Browse offers, in <see cref="Position"/> order.</summary>
    public const int MoodCount = 7;

    /// <summary>The ten genres, as new instances each time so every context can track its own.</summary>
    public static IReadOnlyList<Genre> All() =>
    [
        new(new Guid("6e0f3c1a-0001-4c3e-9a51-1c0de0000001"), "soca", "Soca", "road-march riddims, J’ouvert mornings and fete anthems", 1, 1),
        new(new Guid("6e0f3c1a-0002-4c3e-9a51-1c0de0000002"), "kids", "Kids", "sing-alongs, counting songs and gentle bedtime tunes", 2, 2),
        new(new Guid("6e0f3c1a-0003-4c3e-9a51-1c0de0000003"), "steelpan", "Steelpan & Calypso", "panyard sessions, bomb tunes and kaiso storytelling", 3, 3),
        new(new Guid("6e0f3c1a-0004-4c3e-9a51-1c0de0000004"), "dancehall", "Dancehall", "sound-system riddims and late-night selections", 4, 5),
        new(new Guid("6e0f3c1a-0005-4c3e-9a51-1c0de0000005"), "island-chill", "Island chill", "slow, sunny and made to sit under other things", 5, 4),
        new(new Guid("6e0f3c1a-0006-4c3e-9a51-1c0de0000006"), "parang", "Parang", "cuatro, maracas and Christmas serenades", 6, 6),
        new(new Guid("6e0f3c1a-0007-4c3e-9a51-1c0de0000007"), "chutney", "Chutney", "dholak grooves and wedding-tent energy", 7, 1),
        new(new Guid("6e0f3c1a-0008-4c3e-9a51-1c0de0000008"), "reggae", "Reggae", "one-drop basslines and Sunday sound systems", 8, 4),
        new(new Guid("6e0f3c1a-0009-4c3e-9a51-1c0de0000009"), "zouk", "Zouk", "French Caribbean grooves for slow dancing", 9, 3),
        new(new Guid("6e0f3c1a-0010-4c3e-9a51-1c0de0000010"), "rapso", "Rapso", "the poetry of the people over a riddim", 10, 2),
    ];

}
