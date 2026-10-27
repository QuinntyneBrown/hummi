using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hummi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddSharing : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "SavedPlaylists",
            columns: table => new
            {
                ListenerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                PlaylistId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                SavedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SavedPlaylists", x => new { x.ListenerId, x.PlaylistId });
                table.ForeignKey(
                    name: "FK_SavedPlaylists_Listeners_ListenerId",
                    column: x => x.ListenerId,
                    principalTable: "Listeners",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_SavedPlaylists_Playlists_PlaylistId",
                    column: x => x.PlaylistId,
                    principalTable: "Playlists",
                    principalColumn: "Id");
            });

        migrationBuilder.CreateTable(
            name: "ShareLinks",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Code = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                TargetType = table.Column<int>(type: "int", nullable: false),
                TargetId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ShareLinks", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_SavedPlaylists_PlaylistId",
            table: "SavedPlaylists",
            column: "PlaylistId");

        migrationBuilder.CreateIndex(
            name: "IX_ShareLinks_Code",
            table: "ShareLinks",
            column: "Code",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_ShareLinks_TargetType_TargetId",
            table: "ShareLinks",
            columns: new[] { "TargetType", "TargetId" },
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "SavedPlaylists");

        migrationBuilder.DropTable(
            name: "ShareLinks");
    }
}
