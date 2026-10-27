using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hummi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddLibraryMarks : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "ArtistFollows",
            columns: table => new
            {
                ListenerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ArtistId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                FollowedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ArtistFollows", x => new { x.ListenerId, x.ArtistId });
                table.ForeignKey(
                    name: "FK_ArtistFollows_Artists_ArtistId",
                    column: x => x.ArtistId,
                    principalTable: "Artists",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_ArtistFollows_Listeners_ListenerId",
                    column: x => x.ListenerId,
                    principalTable: "Listeners",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "TrackLikes",
            columns: table => new
            {
                ListenerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                TrackId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                LikedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TrackLikes", x => new { x.ListenerId, x.TrackId });
                table.ForeignKey(
                    name: "FK_TrackLikes_Listeners_ListenerId",
                    column: x => x.ListenerId,
                    principalTable: "Listeners",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_TrackLikes_Tracks_TrackId",
                    column: x => x.TrackId,
                    principalTable: "Tracks",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_ArtistFollows_ArtistId",
            table: "ArtistFollows",
            column: "ArtistId");

        migrationBuilder.CreateIndex(
            name: "IX_TrackLikes_TrackId",
            table: "TrackLikes",
            column: "TrackId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "ArtistFollows");

        migrationBuilder.DropTable(
            name: "TrackLikes");
    }
}
