using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hummi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddAlbumFeature : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Blurb",
            table: "Albums",
            type: "nvarchar(max)",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "Kicker",
            table: "Albums",
            type: "nvarchar(max)",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Blurb",
            table: "Albums");

        migrationBuilder.DropColumn(
            name: "Kicker",
            table: "Albums");
    }
}
