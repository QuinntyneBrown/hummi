using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hummi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddAccounts : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Listeners",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                PasswordHash = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                EmailConfirmedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Listeners", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "EmailTokens",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ListenerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Purpose = table.Column<int>(type: "int", nullable: false),
                TokenHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                ExpiresAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                UsedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EmailTokens", x => x.Id);
                table.ForeignKey(
                    name: "FK_EmailTokens_Listeners_ListenerId",
                    column: x => x.ListenerId,
                    principalTable: "Listeners",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "RefreshTokens",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ListenerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                TokenHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                Persistent = table.Column<bool>(type: "bit", nullable: false),
                ExpiresAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                RevokedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                table.ForeignKey(
                    name: "FK_RefreshTokens_Listeners_ListenerId",
                    column: x => x.ListenerId,
                    principalTable: "Listeners",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_EmailTokens_ListenerId",
            table: "EmailTokens",
            column: "ListenerId");

        migrationBuilder.CreateIndex(
            name: "IX_EmailTokens_TokenHash",
            table: "EmailTokens",
            column: "TokenHash",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Listeners_Email",
            table: "Listeners",
            column: "Email",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_RefreshTokens_ListenerId",
            table: "RefreshTokens",
            column: "ListenerId");

        migrationBuilder.CreateIndex(
            name: "IX_RefreshTokens_TokenHash",
            table: "RefreshTokens",
            column: "TokenHash",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "EmailTokens");

        migrationBuilder.DropTable(
            name: "RefreshTokens");

        migrationBuilder.DropTable(
            name: "Listeners");
    }
}
