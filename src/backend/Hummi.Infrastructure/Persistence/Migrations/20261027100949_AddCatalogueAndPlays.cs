using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hummi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddCatalogueAndPlays : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Artists",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Artists", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Tracks",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                ArtistId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                DurationSeconds = table.Column<int>(type: "int", nullable: false),
                CoverUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                AddedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                PlayCount = table.Column<long>(type: "bigint", nullable: false),
                Withdrawn = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Tracks", x => x.Id);
                table.ForeignKey(
                    name: "FK_Tracks_Artists_ArtistId",
                    column: x => x.ArtistId,
                    principalTable: "Artists",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "PlayEvents",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                TrackId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ListenerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                PlayedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PlayEvents", x => x.Id);
                table.ForeignKey(
                    name: "FK_PlayEvents_Tracks_TrackId",
                    column: x => x.TrackId,
                    principalTable: "Tracks",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_PlayEvents_ListenerId_PlayedAt",
            table: "PlayEvents",
            columns: new[] { "ListenerId", "PlayedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_PlayEvents_TrackId",
            table: "PlayEvents",
            column: "TrackId");

        migrationBuilder.CreateIndex(
            name: "IX_Tracks_AddedAt",
            table: "Tracks",
            column: "AddedAt");

        migrationBuilder.CreateIndex(
            name: "IX_Tracks_ArtistId",
            table: "Tracks",
            column: "ArtistId");

        migrationBuilder.CreateIndex(
            name: "IX_Tracks_PlayCount",
            table: "Tracks",
            column: "PlayCount");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "PlayEvents");

        migrationBuilder.DropTable(
            name: "Tracks");

        migrationBuilder.DropTable(
            name: "Artists");
    }
}
