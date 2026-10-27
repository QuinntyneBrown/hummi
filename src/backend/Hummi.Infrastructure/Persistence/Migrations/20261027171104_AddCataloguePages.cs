using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hummi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddCataloguePages : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Tracks_ArtistId",
            table: "Tracks");

        migrationBuilder.AddColumn<Guid>(
            name: "AlbumId",
            table: "Tracks",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "AlbumPosition",
            table: "Tracks",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "Licence",
            table: "Tracks",
            type: "int",
            nullable: false,
            defaultValue: 1);

        migrationBuilder.AddColumn<string>(
            name: "Slug",
            table: "Tracks",
            type: "nvarchar(300)",
            maxLength: 300,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<byte[]>(
            name: "Waveform",
            table: "Tracks",
            type: "varbinary(256)",
            maxLength: 256,
            nullable: false,
            defaultValue: new byte[0]);

        migrationBuilder.AddColumn<string>(
            name: "Description",
            table: "Artists",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "ModelName",
            table: "Artists",
            type: "nvarchar(100)",
            maxLength: 100,
            nullable: false,
            defaultValue: "openmusic-3b");

        migrationBuilder.AddColumn<int>(
            name: "MonthlyListeners",
            table: "Artists",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<string>(
            name: "Slug",
            table: "Artists",
            type: "nvarchar(200)",
            maxLength: 200,
            nullable: false,
            defaultValue: "");

        migrationBuilder.CreateTable(
            name: "Albums",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Slug = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                ArtistId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Year = table.Column<int>(type: "int", nullable: false),
                Published = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Albums", x => x.Id);
                table.ForeignKey(
                    name: "FK_Albums_Artists_ArtistId",
                    column: x => x.ArtistId,
                    principalTable: "Artists",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        // Rows from before slugs existed get their id as a slug, so the unique indexes hold.
        migrationBuilder.Sql("UPDATE Tracks SET Slug = LOWER(CONVERT(nvarchar(36), Id)) WHERE Slug = N''");
        migrationBuilder.Sql("UPDATE Artists SET Slug = LOWER(CONVERT(nvarchar(36), Id)) WHERE Slug = N''");

        migrationBuilder.CreateIndex(
            name: "IX_Tracks_AlbumId_AlbumPosition",
            table: "Tracks",
            columns: new[] { "AlbumId", "AlbumPosition" });

        migrationBuilder.CreateIndex(
            name: "IX_Tracks_ArtistId_PlayCount",
            table: "Tracks",
            columns: new[] { "ArtistId", "PlayCount" });

        migrationBuilder.CreateIndex(
            name: "IX_Tracks_Slug",
            table: "Tracks",
            column: "Slug",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Artists_Slug",
            table: "Artists",
            column: "Slug",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Albums_ArtistId",
            table: "Albums",
            column: "ArtistId");

        migrationBuilder.CreateIndex(
            name: "IX_Albums_Slug",
            table: "Albums",
            column: "Slug",
            unique: true);

        migrationBuilder.AddForeignKey(
            name: "FK_Tracks_Albums_AlbumId",
            table: "Tracks",
            column: "AlbumId",
            principalTable: "Albums",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_Tracks_Albums_AlbumId",
            table: "Tracks");

        migrationBuilder.DropTable(
            name: "Albums");

        migrationBuilder.DropIndex(
            name: "IX_Tracks_AlbumId_AlbumPosition",
            table: "Tracks");

        migrationBuilder.DropIndex(
            name: "IX_Tracks_ArtistId_PlayCount",
            table: "Tracks");

        migrationBuilder.DropIndex(
            name: "IX_Tracks_Slug",
            table: "Tracks");

        migrationBuilder.DropIndex(
            name: "IX_Artists_Slug",
            table: "Artists");

        migrationBuilder.DropColumn(
            name: "AlbumId",
            table: "Tracks");

        migrationBuilder.DropColumn(
            name: "AlbumPosition",
            table: "Tracks");

        migrationBuilder.DropColumn(
            name: "Licence",
            table: "Tracks");

        migrationBuilder.DropColumn(
            name: "Slug",
            table: "Tracks");

        migrationBuilder.DropColumn(
            name: "Waveform",
            table: "Tracks");

        migrationBuilder.DropColumn(
            name: "Description",
            table: "Artists");

        migrationBuilder.DropColumn(
            name: "ModelName",
            table: "Artists");

        migrationBuilder.DropColumn(
            name: "MonthlyListeners",
            table: "Artists");

        migrationBuilder.DropColumn(
            name: "Slug",
            table: "Artists");

        migrationBuilder.CreateIndex(
            name: "IX_Tracks_ArtistId",
            table: "Tracks",
            column: "ArtistId");
    }
}
