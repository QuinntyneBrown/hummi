using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Hummi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddGenres : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "GenreId",
            table: "Tracks",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "Genres",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Slug = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Description = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                Position = table.Column<int>(type: "int", nullable: false),
                Tone = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Genres", x => x.Id);
            });

        migrationBuilder.InsertData(
            table: "Genres",
            columns: new[] { "Id", "Description", "Name", "Position", "Slug", "Tone" },
            values: new object[,]
            {
                { new Guid("6e0f3c1a-0001-4c3e-9a51-1c0de0000001"), "road-march riddims, J’ouvert mornings and fete anthems", "Soca", 1, "soca", 1 },
                { new Guid("6e0f3c1a-0002-4c3e-9a51-1c0de0000002"), "sing-alongs, counting songs and gentle bedtime tunes", "Kids", 2, "kids", 2 },
                { new Guid("6e0f3c1a-0003-4c3e-9a51-1c0de0000003"), "panyard sessions, bomb tunes and kaiso storytelling", "Steelpan & Calypso", 3, "steelpan", 3 },
                { new Guid("6e0f3c1a-0004-4c3e-9a51-1c0de0000004"), "sound-system riddims and late-night selections", "Dancehall", 4, "dancehall", 5 },
                { new Guid("6e0f3c1a-0005-4c3e-9a51-1c0de0000005"), "slow, sunny and made to sit under other things", "Island chill", 5, "island-chill", 4 },
                { new Guid("6e0f3c1a-0006-4c3e-9a51-1c0de0000006"), "cuatro, maracas and Christmas serenades", "Parang", 6, "parang", 6 },
                { new Guid("6e0f3c1a-0007-4c3e-9a51-1c0de0000007"), "dholak grooves and wedding-tent energy", "Chutney", 7, "chutney", 1 },
                { new Guid("6e0f3c1a-0008-4c3e-9a51-1c0de0000008"), "one-drop basslines and Sunday sound systems", "Reggae", 8, "reggae", 4 },
                { new Guid("6e0f3c1a-0009-4c3e-9a51-1c0de0000009"), "French Caribbean grooves for slow dancing", "Zouk", 9, "zouk", 3 },
                { new Guid("6e0f3c1a-0010-4c3e-9a51-1c0de0000010"), "the poetry of the people over a riddim", "Rapso", 10, "rapso", 2 }
            });

        migrationBuilder.CreateIndex(
            name: "IX_Tracks_GenreId_AddedAt",
            table: "Tracks",
            columns: new[] { "GenreId", "AddedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_Tracks_GenreId_PlayCount",
            table: "Tracks",
            columns: new[] { "GenreId", "PlayCount" });

        migrationBuilder.CreateIndex(
            name: "IX_Genres_Slug",
            table: "Genres",
            column: "Slug",
            unique: true);

        migrationBuilder.AddForeignKey(
            name: "FK_Tracks_Genres_GenreId",
            table: "Tracks",
            column: "GenreId",
            principalTable: "Genres",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_Tracks_Genres_GenreId",
            table: "Tracks");

        migrationBuilder.DropTable(
            name: "Genres");

        migrationBuilder.DropIndex(
            name: "IX_Tracks_GenreId_AddedAt",
            table: "Tracks");

        migrationBuilder.DropIndex(
            name: "IX_Tracks_GenreId_PlayCount",
            table: "Tracks");

        migrationBuilder.DropColumn(
            name: "GenreId",
            table: "Tracks");
    }
}
