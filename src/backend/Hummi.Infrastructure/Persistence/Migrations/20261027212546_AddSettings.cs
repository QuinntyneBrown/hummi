using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hummi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddSettings : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "AutoplaySimilar",
            table: "Listeners",
            type: "bit",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<bool>(
            name: "Crossfade",
            table: "Listeners",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "LastDigestAt",
            table: "Listeners",
            type: "datetimeoffset",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "NotifyNewReleases",
            table: "Listeners",
            type: "bit",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<bool>(
            name: "ProductNews",
            table: "Listeners",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<string>(
            name: "Theme",
            table: "Listeners",
            type: "nvarchar(10)",
            maxLength: 10,
            nullable: false,
            defaultValue: "device");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "AutoplaySimilar",
            table: "Listeners");

        migrationBuilder.DropColumn(
            name: "Crossfade",
            table: "Listeners");

        migrationBuilder.DropColumn(
            name: "LastDigestAt",
            table: "Listeners");

        migrationBuilder.DropColumn(
            name: "NotifyNewReleases",
            table: "Listeners");

        migrationBuilder.DropColumn(
            name: "ProductNews",
            table: "Listeners");

        migrationBuilder.DropColumn(
            name: "Theme",
            table: "Listeners");
    }
}
