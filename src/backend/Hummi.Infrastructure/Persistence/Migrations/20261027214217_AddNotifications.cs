using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hummi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddNotifications : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Notifications",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ListenerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Kind = table.Column<int>(type: "int", nullable: false),
                Key = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                ActorName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                ActorLink = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                ItemName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                ItemLink = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                Plays = table.Column<long>(type: "bigint", nullable: true),
                Text = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                ReadAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Notifications", x => x.Id);
                table.ForeignKey(
                    name: "FK_Notifications_Listeners_ListenerId",
                    column: x => x.ListenerId,
                    principalTable: "Listeners",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Notifications_ListenerId_Key",
            table: "Notifications",
            columns: new[] { "ListenerId", "Key" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Notifications_ListenerId_ReadAt",
            table: "Notifications",
            columns: new[] { "ListenerId", "ReadAt" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "Notifications");
    }
}
