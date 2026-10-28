using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hummi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class ImportPixabayCatalogue : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "AudioExtension",
            table: "Tracks",
            type: "nvarchar(8)",
            maxLength: 8,
            nullable: false,
            defaultValue: ".wav");

        migrationBuilder.AddColumn<string>(
            name: "SourceUrl",
            table: "Tracks",
            type: "nvarchar(2048)",
            maxLength: 2048,
            nullable: true);

        migrationBuilder.AlterColumn<string>(
            name: "ModelName",
            table: "Artists",
            type: "nvarchar(100)",
            maxLength: 100,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "nvarchar(100)",
            oldMaxLength: 100);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "AudioExtension",
            table: "Tracks");

        migrationBuilder.DropColumn(
            name: "SourceUrl",
            table: "Tracks");

        migrationBuilder.AlterColumn<string>(
            name: "ModelName",
            table: "Artists",
            type: "nvarchar(100)",
            maxLength: 100,
            nullable: false,
            defaultValue: "",
            oldClrType: typeof(string),
            oldType: "nvarchar(100)",
            oldMaxLength: 100,
            oldNullable: true);
    }
}
